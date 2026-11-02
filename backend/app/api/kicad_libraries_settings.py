"""Admin settings for KiCad path libraries.

An administrator declares the libraries behind the path variables boards use
(``${LSF_KICAD_LIB}``); Prism fetches them and binds the variables for every
KiCad process. The stock 3D library, when the environment enables it, is listed
but locked. Database work and the remote check run in a worker thread.
"""

from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.errors import Conflict, Invalid
from app.core.security import AuthenticatedUser, require_admin
from app.services import kicad_libraries, kicad_library_fetch, kicad_library_store as store

router = APIRouter(prefix="/api/settings/kicad-libraries", tags=["settings"])


class LibraryView(BaseModel):
    """A library as the console shows it. ``ready`` is whether it resolves now; ``state`` is the fetch's report."""

    name: str
    variables: list[str]
    git: str
    ref: str
    subdir: str
    path: str
    state: str
    error: str | None = None
    progress: int | None = None
    sizeBytes: int | None = None
    fetchedAt: datetime | None = None
    createdAt: datetime | None = None
    updatedAt: datetime | None = None
    updatedBy: str
    ready: bool
    locked: bool


class LibraryList(BaseModel):
    libraries: list[LibraryView]
    pathLibrariesEnabled: bool


class LibraryCreate(BaseModel):
    name: str
    variables: list[str]
    git: str | None = None
    ref: str = ""
    subdir: str = ""
    path: str | None = None


class LibraryUpdate(BaseModel):
    variables: list[str] | None = None
    ref: str | None = None
    subdir: str | None = None


class RemoteCheck(BaseModel):
    git: str = Field(max_length=2000)
    ref: str = Field("", max_length=200)


class RemoteCheckResult(BaseModel):
    reachable: bool
    error: str | None = None
    defaultBranch: str | None = None
    tags: list[str] = []
    branches: list[str] = []
    refFound: bool | None = None


def _unlocked(name: str) -> None:
    stock = kicad_libraries.preset()
    if stock is not None and stock.name == name:
        raise Conflict(
            f"{name} is set by KICAD_3D_LIBRARY_ENABLED in the server's environment; change it there",
            code="library-locked",
        )


def _queue_fetch(view: dict[str, Any], user: AuthenticatedUser) -> None:
    if view["git"]:
        kicad_library_fetch.request_fetch(view["name"], requested_by=user.email)


@router.get("", response_model=LibraryList, summary="List KiCad path libraries")
async def list_libraries(_user: AuthenticatedUser = Depends(require_admin)) -> dict[str, Any]:
    views = await asyncio.to_thread(store.list_views)
    return {"libraries": views, "pathLibrariesEnabled": bool(settings.PRISM_KICAD_LIBRARY_MOUNT_ROOT.strip())}


@router.post("", response_model=LibraryView, status_code=201, summary="Declare a KiCad path library")
async def create_library(body: LibraryCreate, user: AuthenticatedUser = Depends(require_admin)) -> dict[str, Any]:
    """Declare a library and queue its fetch. A path library must sit under the configured mount root."""

    if body.path and not settings.PRISM_KICAD_LIBRARY_MOUNT_ROOT.strip():
        raise Invalid("Path libraries are off: set PRISM_KICAD_LIBRARY_MOUNT_ROOT on the server")
    fields = body.model_dump()

    def create() -> dict[str, Any]:
        view = store.create(fields, updated_by=user.email)
        _queue_fetch(view, user)
        return view

    return await asyncio.to_thread(create)


@router.post("/check", response_model=RemoteCheckResult, summary="Check that a repository and ref exist")
async def check_remote(body: RemoteCheck, _user: AuthenticatedUser = Depends(require_admin)) -> dict[str, Any]:
    return await asyncio.to_thread(kicad_library_fetch.check_remote, body.git, body.ref)


@router.patch("/{name}", response_model=LibraryView, summary="Change a KiCad path library")
async def update_library(
    name: str, body: LibraryUpdate, user: AuthenticatedUser = Depends(require_admin)
) -> dict[str, Any]:
    """Change the variables, ref or subfolder. A new ref or subfolder fetches again."""

    _unlocked(name)
    changes = body.model_dump(exclude_unset=True, exclude_none=True)

    def update() -> dict[str, Any]:
        source = ("git", "ref", "subdir")
        before = store.get(name)
        view = store.update(name, changes, updated_by=user.email)
        if any(before[key] != view[key] for key in source):
            _queue_fetch(view, user)
        return view

    return await asyncio.to_thread(update)


@router.post("/{name}/fetch", response_model=LibraryView, summary="Fetch a KiCad path library again")
async def fetch_library(name: str, user: AuthenticatedUser = Depends(require_admin)) -> dict[str, Any]:
    """Retry a failed fetch, or refresh a library whose clone was lost."""

    _unlocked(name)

    def refetch() -> dict[str, Any]:
        view = store.get(name)
        if not view["git"]:
            raise Invalid("A path library has nothing to fetch")
        store.record_fetch(name, state="pending", error=None, progress=None)
        kicad_library_fetch.request_fetch(name, requested_by=user.email)
        return store.get(name)

    return await asyncio.to_thread(refetch)


@router.delete("/{name}", status_code=204, response_model=None, summary="Remove a KiCad path library")
async def delete_library(name: str, user: AuthenticatedUser = Depends(require_admin)) -> Response:
    """Forget the library and delete its clone. A path library's folder is left alone."""

    _unlocked(name)

    def delete() -> None:
        view = store.get(name)
        library = kicad_libraries.validate_entry(
            {
                "name": name,
                "variables": view["variables"],
                "git": view["git"] or None,
                "ref": view["ref"],
                "subdir": view["subdir"],
                "path": view["path"] or None,
            }
        )
        store.delete(name)
        kicad_library_fetch.request_removal(library, requested_by=user.email)

    await asyncio.to_thread(delete)
    return Response(status_code=204)
