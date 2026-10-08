"""Shared pieces of the System Builder service: caller, result, defaults and plumbing.

The service is one class (``service.SystemService``) assembled from mixins by area;
this module holds what every area uses.
"""

from __future__ import annotations

import logging
import re
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Callable, ContextManager, Iterator, Mapping, Optional, Sequence

from app.core.roles import Role
from app.services.systems import exports as exports_module, visibility
from app.services.systems.bundles import BundleSource
from app.services.systems.interface_extractor import EXTRACTOR_VERSION
from app.services.systems.jobs import (
    enqueue_extraction,
    workspace_connection,
)
from app.services.systems.store import Conflict, NotFound, SystemStore

# One logger name for the whole service, whichever area module logs.
logger = logging.getLogger("app.services.systems.service")

MAX_LAYOUT_ENTRIES = 1000
_FULL_SHA = re.compile(r"^[0-9a-f]{40}$")
_ACTIVE_JOB_STATES = frozenset({"queued", "running", "retry_wait", "cancel_requested"})
_BUNDLE_BUILDERS = frozenset({"admin", "designer"})  # who may queue a board's 3D bundle (as on its 3D tab)


@dataclass(frozen=True)
class Caller:
    role: Role
    email: str

    @property
    def actor(self) -> str:
        return f"user:{self.email or 'anonymous'}"


@dataclass(frozen=True)
class Result:
    """A payload plus the system version after the call (for the ETag)."""

    body: Any
    system_id: str
    version: int

    @property
    def etag(self) -> str:
        return visibility.etag(self.system_id, self.version)


def _mating_summary(record: Optional[Mapping[str, Any]]) -> Optional[dict]:
    return None if record is None else {k: record[k] for k in ("mode", "axis", "quarterTurns")}


def _iso(value: Any) -> Any:
    return value.isoformat() if isinstance(value, datetime) else value


def _default_project_loader(project_id: str) -> Any:
    # Role-blind by design: every caller authorizes the project first, through
    # ``visibility.project_access`` (``_require_project``/``_open_instance``).
    from app.services.project_service import _workspace_row_to_project
    from app.services.workspace_service import workspace

    row = workspace.get_project_by_id(project_id)
    return _workspace_row_to_project(row) if row else None


def _default_catalog() -> Any:
    """The catalog's modules, assemblies and "mates with" (``catalog/system_items_facade.py``)."""
    from app.services.component_catalog_service import catalog_service

    return catalog_service.system_items


def _default_enqueue_check(instance_id: str, project_id: str, *, requested_by: str) -> Mapping[str, Any]:
    from app.services.systems.detection import enqueue_instance_check

    return enqueue_instance_check(instance_id, project_id, requested_by=requested_by)


class ServiceCore:
    def __init__(
        self,
        *,
        connect: Callable[[], ContextManager[Any]] = workspace_connection,
        project_loader: Callable[[str], Any] = _default_project_loader,
        enqueue: Callable[..., Mapping[str, Any]] = enqueue_extraction,
        enqueue_check: Callable[..., Mapping[str, Any]] | None = None,
        catalog: Callable[[], Any] = _default_catalog,
        bundles: Any = None,
    ) -> None:
        self._catalog = catalog
        self._bundles = bundles or BundleSource()
        self._connect = connect
        self._load_project = project_loader
        self._enqueue = enqueue
        self._enqueue_check = enqueue_check or _default_enqueue_check

    # ------------------------------------------------------------------
    # Plumbing

    @contextmanager
    def _tx(self) -> Iterator[SystemStore]:
        with self._connect() as conn:
            try:
                yield SystemStore(conn)
                conn.commit()
            except BaseException:
                conn.rollback()
                raise

    def _system(self, store: SystemStore, system_id: str, caller: Caller) -> dict:
        found = visibility.visible_systems(store.conn, caller.role, system_id=system_id)
        if not found:
            raise NotFound("System not found")
        return found[0]

    def _access(self, store: SystemStore, instances: Sequence[dict], caller: Caller) -> dict[str, dict]:
        # Assembly and module instances have no project: they are the parent's own (P2 §5.4).
        return visibility.project_access(store.conn, [i["project_id"] for i in instances if i.get("project_id")],
                                         caller.role)

    def _open_instance(
        self, store: SystemStore, system_id: str, instance_id: str, caller: Caller,
        *, allow_deleted: bool = False,
    ) -> dict:
        """An instance the caller may change; restricted ones are 404 (§8.2).

        ``allow_deleted`` admits an instance restricted only because its project
        was deleted: removing it reveals nothing.
        """

        try:
            instance = store.get_instance(system_id, instance_id)
        except NotFound:
            raise NotFound("Instance not found") from None
        if instance.get("kind", "board") != "board":
            return instance  # the parent's own instance; what it pins is redacted on read, not here
        access = self._access(store, [instance], caller)[instance["project_id"]]
        if not access["visible"] and not (allow_deleted and access["deleted"]):
            raise NotFound("Instance not found")
        return instance

    def _instance_interface(self, store: SystemStore, instance: Mapping[str, Any]) -> Optional[dict]:
        """A board's interface at its baseline, an assembly's exports as one (P2 §6.1), or a module's
        connectors as one (P2 §5.6)."""
        if instance.get("kind", "board") == "board":
            return store.get_interface(instance["project_id"], instance["baseline_commit"], EXTRACTOR_VERSION)
        if instance.get("kind") == "module":
            return self._module_interface(instance["catalog_revision_id"])
        revision = self._catalog_revision(instance["catalog_revision_id"])
        return exports_module.as_interface((revision or {}).get("interface")) if revision else None

    def _interface(self, store: SystemStore, instance: dict) -> dict:
        found = self._instance_interface(store, instance)
        if found is None:
            if instance.get("kind", "board") != "board":
                raise Conflict(f"the {'module' if instance.get('kind') == 'module' else 'subsystem'}'s catalog revision "
                               "cannot be read; try again")
            raise Conflict("interface_not_ready: the board interface at this baseline is still being extracted")
        return found

    def _require_project(self, store: SystemStore, project_id: str, caller: Caller) -> Any:
        access = visibility.project_access(store.conn, [project_id], caller.role).get(project_id)
        project = self._load_project(project_id) if access and access["visible"] else None
        if project is None:
            raise NotFound("Project not found")
        return project

    def _enqueue_quietly(self, project_id: str, commit: str, caller: Caller) -> Optional[dict]:
        try:
            return dict(self._enqueue(project_id, commit, requested_by=caller.email))
        except Exception:  # extraction is re-requested by the next read
            logger.exception("Could not enqueue interface extraction for %s@%s", project_id, commit)
            return None
