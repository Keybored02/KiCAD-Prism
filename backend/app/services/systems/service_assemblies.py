"""Assembly instances, system nets, hierarchy, scene and instance edits (CONTRACTS_P2 §5, §8)."""

from __future__ import annotations

from typing import Any, Mapping, Optional, Sequence

from app.services.systems import (
    child_drift, exports as exports_module, exposure, hierarchy, modules, redaction, sources, system_nets, validation,
    scene as scene_module, visibility,
)
from app.services.systems.bundles import BundleUnreadable
from app.services.systems.interface_extractor import EXTRACTOR_VERSION
from app.services.systems.placement import harness_checks, harness_route, poses as poses_module
from app.services.systems.store import Conflict, Forbidden, Invalid, NotFound, SystemStore
from app.services.systems.service_base import Caller, Result, logger, _FULL_SHA, _ACTIVE_JOB_STATES, _BUNDLE_BUILDERS


class AssembliesMixin:
    # ------------------------------------------------------------------
    # Assembly and module instances (CONTRACTS_P2 §5)

    def _mate_pair_findings(self, links: Sequence[Mapping[str, Any]], harness_rows: Sequence[Mapping[str, Any]],
                            interfaces: Mapping[str, dict]) -> list[dict]:
        """SYS-V18 (CONTRACTS_P2 §18): a b2b pair, or a harness end's part and its board connector,
        whose two catalog parts are both known and not related by mates-with. Unknown parts: not evaluated."""

        def connector(instance_id: Optional[str], port: Optional[Mapping[str, Any]]) -> Optional[dict]:
            interface = interfaces.get(instance_id) if instance_id else None
            return exposure.component_by_key(interface, port["portKey"]) if interface and port else None

        b2b = [(link, [connector(link[f"{e}_instance_id"], link[f"{e}_port"]) for e in ("a", "b")])
               for link in links if link.get("type") == "b2b"]
        ends = [(harness, end, connector(end["mates_instance_id"], end["mates_port"]))
                for harness in harness_rows for end in harness["ends"]
                if end["catalog_component_id"] and end["mates_instance_id"]]
        mpns = [c["mpn"] for _link, pair in b2b for c in pair if c and c.get("mpn")] + \
               [c["mpn"] for _h, _e, c in ends if c and c.get("mpn")]
        if not mpns:
            return []
        try:
            catalog = self._catalog()
            parts = catalog.parts_by_mpn(mpns)

            def part(component: Optional[Mapping[str, Any]]) -> Optional[str]:
                if not component or not component.get("mpn"):
                    return None
                return (parts.get(component["mpn"].strip().lower()) or {}).get("componentId")

            known = {p for _link, pair in b2b for p in map(part, pair) if p} | \
                    {p for _h, e, c in ends for p in (part(c), e["catalog_component_id"]) if p}
            pairs = catalog.mate_pairs(sorted(known))
        except Exception:  # the catalog is a separate service; findings wait for it
            logger.exception("Could not read catalog mates for SYS-V18")
            return []

        def related(x: str, y: str) -> bool:
            return (min(x, y), max(x, y)) in pairs

        out = []
        for link, pair in b2b:
            ids = [part(c) for c in pair]
            if all(ids) and ids[0] != ids[1] and not related(*ids):
                out.append(validation.make_finding("SYS-V18", link_id=link["id"],
                                                   detail={"partA": ids[0], "partB": ids[1]}))
        for harness, end, component in ends:
            board_part = part(component)
            if board_part and not related(board_part, end["catalog_component_id"]):
                out.append(validation.make_finding(
                    "SYS-V18", instance_id=end["mates_instance_id"], reference=(end["mates_port"] or {}).get("reference"),
                    detail={"harnessId": harness["id"], "endId": end["id"], "part": end["catalog_component_id"],
                            "connectorPart": board_part}))
        return out

    def end_suggestions(self, caller: Caller, system_id: str, harness_id: str, end_id: str) -> dict:
        """``GET …/harnesses/{hid}/ends/{eid}/suggestions`` (§18): the mated connector's part and its known
        partners. Nothing is assigned."""
        with self._tx() as store:
            self._system(store, system_id, caller)
            harness = self._visible_harness(store, system_id, harness_id, caller)
            end = next((e for e in harness["ends"] if e["id"] == end_id), None)
            if end is None:
                raise NotFound("Harness end not found")
            component = self._end_components(store, harness).get(end_id)
        mpn = (component or {}).get("mpn")
        if not mpn:
            return {"endId": end_id, "connectorMpn": None, "connectorPart": None, "suggestions": []}
        try:
            catalog = self._catalog()
            board_part = catalog.parts_by_mpn([mpn]).get(mpn.strip().lower())
            suggestions = catalog.list_mates_with(board_part["componentId"]) if board_part else []
        except Exception:
            logger.exception("Could not read catalog mates for a harness end")
            board_part, suggestions = None, []
        return {"endId": end_id, "connectorMpn": mpn, "connectorPart": board_part, "suggestions": suggestions}

    def _catalog_revision(self, revision_id: str) -> Optional[dict]:
        try:
            return self._catalog().system_revision(revision_id)
        except Exception:  # the catalog is a separate service; documents must still render
            logger.exception("Could not read catalog revision %s", revision_id)
            return None

    def _module_interface(self, revision_id: str) -> Optional[dict]:
        """A module revision's connectors as an interface artifact (§5.6): its units, the connector
        parts placed on it today (§3.6) and its model. Placements or a model the catalog can't give
        leave the ports without geometry (they link but can't mate)."""
        revision = self._catalog_revision(revision_id)
        if revision is None:
            return None
        catalog = self._catalog()
        try:
            connectors = catalog.module_connectors(revision["componentId"])
        except Exception:  # the catalog is a separate service; the ports still link
            logger.exception("Could not read the connectors of module %s", revision["componentId"])
            connectors = None
        try:
            found = next((m for m in catalog.list_models(revision["componentId"]) if m["glb"]), None)
        except Exception:
            logger.debug("No model for module %s", revision["componentId"], exc_info=True)
            found = None
        model = None if found is None else {
            "glbKey": found["glb"]["key"], "boundsMm": found["glb"]["bounds"],
            "alignment": {k: found["alignment"][k] for k in ("offsetMm", "rotationDeg", "scale")}}
        return modules.as_interface(revision.get("interface"), connectors, model)

    def _child_interface(self, revision_id: str) -> Optional[dict]:
        """reconcile.ChildLoader: a catalog revision's exports as an interface artifact."""
        revision = self._catalog_revision(revision_id)
        return exports_module.as_interface(revision.get("interface")) if revision else None

    def advance_child(
        self, actor: str, system_id: str, instance_id: str, revision_id: str, *, auto_kind: str,
        expected_version: Optional[int] = None,
    ) -> dict:
        """Evaluate one catalog revision for one assembly instance and apply §7.2.

        Shared by the release trigger (``child_auto_advanced``) and a manual
        rebase (``child_rebased``). Outcomes: ``at_revision``, ``auto_advanced``,
        ``review_opened``, ``review_current`` or ``advance_blocked`` (§5.3
        limits; reported as SYS-V15); for the release trigger also
        ``not_following`` and ``superseded`` (a newer release exists: nothing changes).
        """

        revision = self._catalog_revision(revision_id)
        if revision is None:
            raise NotFound("Catalog revision not found")
        with self._tx() as store:
            instance = store.get_instance(system_id, instance_id)
            if instance.get("kind") not in ("assembly", "module"):
                raise Invalid("only assembly and module instances take catalog revisions")
            if revision["componentId"] != instance["catalog_component_id"]:
                raise Invalid("the revision belongs to another component")
            if instance["catalog_revision_id"] == revision_id:
                return {"outcome": "at_revision", "reviewId": None}
            open_review = store.open_source_review(instance_id)
            if open_review and open_review["to_commit"] == revision_id:
                return {"outcome": "review_current", "reviewId": open_review["id"]}
            # A revision that would break the hierarchy limits is never advanced to (§5.3).
            candidate = {**instance, "catalog_revision_id": revision_id}
            others = [i for i in store.list_instances(system_id, kinds=SystemStore.ALL_KINDS) if i["id"] != instance_id]
            try:
                hierarchy.resolve(system_id, others + [candidate], self._child_loader(store))
            except hierarchy.HierarchyError as error:
                store.record_source_check(instance_id, tip_commit=None, checked_commit=None,
                                          outcome="advance_blocked")
                logger.info("Not advancing %s to %s: %s", instance_id, revision_id, error)
                return {"outcome": "advance_blocked", "reviewId": None, "reason": error.code}
        with self._tx() as store:
            if auto_kind == "child_auto_advanced":
                # A release job runs after its listing and may arrive late: under the lock (held to
                # commit), apply it only while the instance still follows and this is still the newest
                # release. A manual rebase ("child_rebased") may choose any revision.
                with store.mutation(system_id, expected_version=expected_version, actor=actor, bump=False):
                    current = store.get_instance(system_id, instance_id)
                    fresh = self._catalog_revision(revision_id) or revision
                    if current.get("follow") != "latest_released":
                        return {"outcome": "not_following", "reviewId": None}
                    if fresh.get("latestReleasedRevisionId") != revision_id:
                        return {"outcome": "superseded", "reviewId": None}
            with store.mutation(system_id, expected_version=expected_version, actor=actor) as change:
                current = store.get_instance(system_id, instance_id)
                # A module's revision compares as its connectors (§5.6), an assembly's as its exports (§7).
                candidate = self._module_interface(revision_id) if current.get("kind") == "module" else None
                outcome, review_id = child_drift.apply_child_evaluation(store, change, current, revision,
                                                                        auto_kind=auto_kind, candidate=candidate)
            store.record_source_check(instance_id, tip_commit=None, checked_commit=None, outcome=outcome)
        return {"outcome": outcome, "reviewId": review_id, "version": change.version}

    def rebase_child(self, caller: Caller, system_id: str, version: int, instance_id: str,
                     revision_id: str) -> Result:
        """``POST …/rebase`` with ``revisionId`` for an assembly instance (§7.1)."""
        with self._tx() as store:
            self._system(store, system_id, caller)
            self._open_instance(store, system_id, instance_id, caller)
        body = self.advance_child(caller.actor, system_id, instance_id, revision_id, auto_kind="child_rebased",
                                  expected_version=version)
        if body["outcome"] == "at_revision":
            raise Conflict("the instance already pins this revision")
        if body["outcome"] == "advance_blocked":
            raise Invalid(f"{body.get('reason')}: the revision would break the hierarchy limits")
        with self._tx() as store:
            row = store.get_instance(system_id, instance_id)
            now = store.get_system(system_id)["version"]
        return Result({"outcome": body["outcome"], "reviewId": body["reviewId"], "instance": self._instance_row(row)},
                      system_id, int(now))

    def _catalog_refs(self, store: SystemStore, system_id: str) -> dict[str, dict]:
        """Pinned catalog revision per assembly/module instance, for the manifest."""
        refs = {}
        for instance in store.list_instances(system_id, kinds=("assembly", "module")):
            revision = self._catalog_revision(instance["catalog_revision_id"])
            if revision is None:
                raise Conflict(f"the catalog revision of {instance['label']} cannot be read; try again")
            refs[instance["id"]] = revision
        return refs

    def _catalog_instance_doc(self, instance: Mapping[str, Any]) -> dict:
        """An assembly/module instance as the document shows it: an assembly's exports, a module's
        connectors (§5.6), are its ports."""
        revision = self._catalog_revision(instance["catalog_revision_id"])
        if instance["kind"] == "module":
            units = (self._module_interface(instance["catalog_revision_id"]) or {}).get("components") or [] \
                if revision else []
            exports = [{"id": c["portKey"], "name": c["reference"], "libId": None, "footprint": c.get("footprint"),
                        "reference": c.get("mpn"), "pinCount": len(c["pins"])} for c in units]
        else:
            exports = ((revision or {}).get("interface") or {}).get("exports") or []
        latest = (revision or {}).get("latestReleasedRevisionId")
        return {
            "id": instance["id"], "label": instance["label"], "kind": instance["kind"], "restricted": False,
            "projectId": None, "projectName": (revision or {}).get("name"), "projectDeleted": False,
            "baselineCommit": None, "trackedRef": None, "pinned": instance["follow"] == "pinned",
            "resolution": "resolved" if revision else "unresolved", "tipCommit": None, "tipCheckedAt": None,
            "updateAvailable": bool(latest) and latest != instance["catalog_revision_id"],
            "interface": {"status": "ready" if revision else "failed", "digest": None, "hasPcb": None,
                          "jobId": None, "errorCode": None if revision else "catalog_revision_unavailable"},
            "ports": [{
                "portKey": entry.get("id"), "memberKeys": [entry.get("id")], "reference": entry.get("name"),
                "libId": entry.get("libId"), "footprint": entry.get("footprint"), "value": entry.get("reference"),
                "dnp": False, "candidate": True, "candidateReason": "module" if instance["kind"] == "module" else "export",
                "override": None, "exposed": True,
                "pinCount": int(entry.get("pinCount") or 0),
            } for entry in exports],
            "catalog": {
                "componentId": instance["catalog_component_id"], "revisionId": instance["catalog_revision_id"],
                "follow": instance["follow"], "version": (revision or {}).get("version"),
                "releaseStatus": (revision or {}).get("releaseStatus"), "identity": (revision or {}).get("identity"),
                "latestReleasedRevisionId": latest,
                "systemId": ((revision or {}).get("sourceRef") or {}).get("systemId"),
                "snapshotName": ((revision or {}).get("sourceRef") or {}).get("snapshotName"),
                "openReviewCount": int(((revision or {}).get("sourceRef") or {}).get("openReviewCount") or 0),
            },
        }

    def _child_loader(self, store: SystemStore):
        """hierarchy.Loader: catalog revision -> the snapshot it was published from."""

        def load(revision_id: str) -> Optional[hierarchy.ChildSystem]:
            revision = self._catalog_revision(revision_id)
            source = (revision or {}).get("sourceRef") or {}
            if source.get("kind") != "system_snapshot":
                return None
            try:
                row = store.get_snapshot(source["systemId"], source["snapshotId"])
            except (NotFound, KeyError):
                return None
            manifest = row.get("manifest")
            if not manifest:
                return None
            return hierarchy.ChildSystem(source["systemId"], source["snapshotId"], manifest["system"]["name"],
                                         manifest["instances"], manifest.get("exports") or [],
                                         manifest.get("links") or [], manifest.get("harnesses") or [],
                                         (manifest.get("placement") or {}).get("poses") or [],
                                         manifest.get("mating") or [],
                                         (manifest.get("placement") or {}).get("drivingMates") or [])

        return load

    def _tree(self, store: SystemStore, system_id: str, extra: Sequence[Mapping[str, Any]] = ()) -> hierarchy.Tree:
        instances = list(store.list_instances(system_id, kinds=SystemStore.ALL_KINDS)) + list(extra)
        try:
            return hierarchy.resolve(system_id, instances, self._child_loader(store))
        except hierarchy.HierarchyError as error:
            raise Invalid(str(error)) from None

    # ------------------------------------------------------------------
    # System nets (CONTRACTS_P2 §8)

    def _net_groups(self, caller: Caller, system_id: str) -> tuple[list[dict], dict]:
        """Every system net of the tree, redacted for the reader, plus the occurrence index."""
        import hashlib

        occurrences = {o["path"]: o for o in self.hierarchy(caller, system_id)["occurrences"]}
        with self._tx() as store:
            self._system(store, system_id, caller)
            root = self._net_level(store, system_id)
        visible = {path for path, o in occurrences.items() if not o["restricted"]}

        def shown(path: Optional[str]) -> bool:
            return path in visible

        def side(point: dict) -> dict:
            # An unmated harness end has no board: nothing to hide, and no path to show.
            path = point["occurrence"]
            return {**point, "displayPath": occurrences[path]["displayPath"] if path else None}

        out = []
        for group in system_nets.build(root):
            members = [({"occurrence": m["occurrence"], "displayPath": occurrences[m["occurrence"]]["displayPath"],
                         "net": m["net"], "redacted": False} if shown(m["occurrence"])
                        else {"occurrence": None, "displayPath": None, "net": None, "redacted": True})
                       for m in group.members]
            hops = []
            for hop in group.hops:
                if not all(hop[s]["occurrence"] is None or shown(hop[s]["occurrence"]) for s in ("from", "to")):
                    continue
                hops.append({**hop, "from": side(hop["from"]), "to": side(hop["to"])})
            if not any(not m["redacted"] for m in members):
                continue  # nothing of it is visible to this reader
            aliases = sorted({system_nets.leaf(m["net"]) for m in members if m["net"] and not system_nets.is_auto(m["net"])})
            out.append({
                "groupId": hashlib.sha1(group.group_id.encode()).hexdigest()[:16],
                "name": aliases[0] if aliases else next((m["net"] for m in members if m["net"]), "unconnected"),
                "aliases": aliases, "pinCount": group.pin_count, "large": group.pin_count > system_nets.LARGE_GROUP_PINS,
                "members": members, "hops": hops,
            })
        return out, occurrences

    def _net_level(self, store: SystemStore, system_id: str, tree: Optional[hierarchy.Tree] = None) -> system_nets.Level:
        """The root level of the connectivity walk: links, exports and harnesses, with every resolved child."""
        instances = store.list_instances(system_id, kinds=SystemStore.ALL_KINDS)
        root = system_nets.Level(
            prefix="", kinds={i["id"]: i["kind"] for i in instances}, labels={i["id"]: i["label"] for i in instances},
            links=store.list_links(system_id), harnesses=store.list_harnesses(system_id),
            exports=[{"id": e["id"], "target": ({"instanceId": e["target_instance_id"], "portKey": e["target_port"]["portKey"],
                                                 "port": e["target_port"]} if e["target_port"]
                                                else {"instanceId": e["target_instance_id"], "exportId": e["target_export_id"]})}
                     for e in store.list_exports(system_id)],
        )
        system_nets.attach_children(root, tree or self._tree(store, system_id))
        return root

    def nets(self, caller: Caller, system_id: str, *, search: str = "", occurrence: Optional[str] = None,
             net: Optional[str] = None, members: bool = False, limit: int = 50, offset: int = 0) -> dict:
        """``GET …/nets``: system nets matching ``search`` (any alias), optionally touching one board occurrence.

        ``net`` (with ``occurrence``) keeps only the group holding exactly that board net (SB2-32).
        ``members`` adds each group's visible board nets, ``{occurrence, net}`` (SB2-33's search).
        """
        if net is not None and not occurrence:
            raise Invalid("net needs occurrence")
        groups, _occurrences = self._net_groups(caller, system_id)
        needle = search.strip().casefold()
        found = []
        for group in groups:
            if needle and not any(needle in alias.casefold() for alias in group["aliases"]) and not any(
                    needle in (m["net"] or "").casefold() for m in group["members"]):
                continue
            if occurrence and not any(m["occurrence"] == occurrence and (net is None or m["net"] == net)
                                      for m in group["members"]):
                continue
            summary = {k: group[k] for k in ("groupId", "name", "aliases", "pinCount", "large")} \
                | {"boards": len({m["occurrence"] for m in group["members"] if m["occurrence"]})}
            if members:
                summary["members"] = [{"occurrence": m["occurrence"], "net": m["net"]} for m in group["members"]
                                      if m["occurrence"] and m["net"]]
            found.append(summary)
        found.sort(key=lambda g: (g["name"].casefold(), g["groupId"]))
        return {"systemId": system_id, "groups": found[offset:offset + limit], "total": len(found), "offset": offset}

    def net(self, caller: Caller, system_id: str, group_id: str) -> dict:
        """``GET …/nets/{groupId}``: one system net with its members and hops."""
        groups, _occurrences = self._net_groups(caller, system_id)
        found = next((g for g in groups if g["groupId"] == group_id), None)
        if found is None:
            raise NotFound("System net not found")
        return found

    def add_catalog_instance(
        self, caller: Caller, system_id: str, version: int, *, kind: str, label: str, component_id: str,
        revision_id: Optional[str], follow: str,
    ) -> Result:
        """Add an assembly (or, M6, module) instance pinning one catalog revision (§5.1)."""

        from app.core.roles import CATALOG_BROWSE_ROLES

        if caller.role not in CATALOG_BROWSE_ROLES:
            raise Forbidden("adding a catalog item needs catalog read access")
        catalog = self._catalog()
        revision = (catalog.system_revision(revision_id) if revision_id
                    else catalog.released_system_revision(component_id))
        if revision is None:
            raise Conflict("no_released_revision: the component has no released revision; pick one explicitly")
        if revision["componentId"] != component_id:
            raise Invalid("revisionId does not belong to componentId")
        if revision["kind"] != kind:
            raise Invalid(f"component is a {revision['kind']}, not a {kind}")
        if not revision["active"]:
            raise Conflict("the component has been retired")
        with self._tx() as store:
            self._system(store, system_id, caller)
            with store.mutation(system_id, expected_version=version, actor=caller.actor) as change:
                row = store.add_catalog_instance(change, kind=kind, label=label, component_id=component_id,
                                                 revision_id=revision["revisionId"], follow=follow)
                self._tree(store, system_id)  # refuses a cycle or a limit before anything commits
        return Result(self._instance_row(row), system_id, change.version)

    def hierarchy(self, caller: Caller, system_id: str) -> dict:
        """``GET …/hierarchy`` (§11): every occurrence, redacted for the reader (§5.4)."""

        with self._tx() as store:
            self._system(store, system_id, caller)
            tree = self._tree(store, system_id)
            projects = {o.project_id for o in tree.boards if o.project_id}
            access = visibility.project_access(store.conn, projects, caller.role)
            hidden_systems = {o.child_system_id for o in tree.occurrences
                              if o.child_system_id and not visibility.visible_systems(
                                  store.conn, caller.role, system_id=o.child_system_id)}
        out = []
        hidden_prefixes: list[str] = []
        for occurrence in tree.occurrences:
            if any(occurrence.path.startswith(prefix + "/") for prefix in hidden_prefixes):
                continue  # inside a child system the reader cannot see (S7)
            entry = occurrence.as_dict()
            entry["restricted"] = False
            if occurrence.kind == "board" and not access.get(occurrence.project_id, {}).get("visible", False):
                entry.update(restricted=True, projectId=None, baselineCommit=None)
            if occurrence.child_system_id in hidden_systems:
                entry.update(restricted=True, childSystemId=None, childSnapshotId=None)
                hidden_prefixes.append(occurrence.path)
            out.append(entry)
        return {"systemId": system_id, "occurrences": out,
                "boardCount": sum(1 for o in tree.occurrences if o.kind == "board")}

    def scene(self, caller: Caller, system_id: str) -> dict:
        """``GET …/scene`` (§20): every occurrence placed, with the board bundles to draw them.

        A visible board whose bundle is missing gets a build queued when the reader
        may generate bundles (designer or admin, as on the board's 3D tab).
        """

        shown = {o["path"]: o for o in self.hierarchy(caller, system_id)["occurrences"]}
        with self._tx() as store:
            version = int(self._system(store, system_id, caller)["version"])
            tree = self._tree(store, system_id)
            level = self._net_level(store, system_id, tree)
            harnesses = system_nets.harness_layout(level)
            placement, interfaces = self._placement(store, system_id, tree, level)
            interface_of, component_of = self._occurrence_lookups(store, interfaces)
            scene_module.harness_connectors(harnesses, tree.occurrences, level, component_of)
            self._attach_housings(harnesses)
        for (project_id, commit), found in interfaces.items():
            if found is None:  # not extracted yet, or by an older extractor: the bounds come with it
                self._enqueue_quietly(project_id, commit, caller)
        assets: dict[tuple[str, str], dict] = {}

        def asset(occurrence: hierarchy.Occurrence) -> dict:
            key = (occurrence.project_id, occurrence.baseline_commit)
            if key not in assets:
                assets[key] = self._scene_asset(caller, *key)
            return assets[key]

        built = scene_module.build(system_id, version, tree.occurrences, shown, interface_of, asset,
                                   placement=placement)
        built["harnesses"] = scene_module.redact_harnesses(harnesses, shown)
        root = placement["results"].get("")
        built["placement"] = {k: root[k] for k in ("roots", "mismatches", "unusable", "ignoredOverrides")} \
            if root else None
        return built

    def _attach_housings(self, harnesses: Sequence[dict]) -> None:
        """Give each harness end with a part its model (§18.2, SB2-47): ``housing {glbKey, boundsMm,
        alignment}`` from the part's first STEP model with a converted GLB, else null. A catalog that
        can't be read leaves every end without one: housings then draw as proxy boxes."""
        models: dict[str, Optional[dict]] = {}
        for harness in harnesses:
            for end in harness["ends"]:
                part = end.get("part")
                if not part:
                    end["housing"] = None
                    continue
                if part not in models:
                    try:
                        found = next((m for m in self._catalog().list_models(part) if m["glb"]), None)
                    except Exception:  # the catalog is optional here: no model, a proxy box
                        logger.debug("No housing model for part %s", part, exc_info=True)
                        found = None
                    models[part] = None if found is None else {
                        "glbKey": found["glb"]["key"], "boundsMm": found["glb"]["bounds"],
                        "alignment": {k: found["alignment"][k] for k in ("offsetMm", "rotationDeg", "scale")}}
                end["housing"] = models[part]

    def _harness_checks(self, store: SystemStore, system_id: str, harness_rows: Sequence[Mapping[str, Any]],
                        placed: Optional[tuple] = None) -> dict:
        """The root level's harnesses routed where the System 3D view draws them (§17.10), by harness
        ID: ``{lengths, collisions, tightBends}``; a harness with fewer than two posed ends is left out.
        Collisions are checked against every board of the tree that has an outline. ``placed`` is
        ``(tree, level, placement, extents)`` when the caller already solved them (SB2-93)."""
        if not harness_rows:
            return {}
        if placed is None:
            tree = self._tree(store, system_id)
            level = self._net_level(store, system_id, tree)
            placed = (tree, level, *self._placement(store, system_id, tree, level))
        tree, level, placement, extents = placed
        harnesses = [h for h in system_nets.harness_layout(level) if not h["level"]]
        scene_module.harness_connectors(harnesses, tree.occurrences, level,
                                        self._occurrence_lookups(store, extents)[1])
        self._attach_housings(harnesses)
        matrices = {path: poses_module.matrix(pose)
                    for path, pose in scene_module.world_poses(tree.occurrences, placement["placed"]).items()}
        boards = [{"id": o.path, "matrix": matrices[o.path], **placement["local"][o.path]}
                  for o in tree.occurrences if o.kind == "board" and placement["local"].get(o.path)]
        allowance = {row["id"]: row["service_allowance_pct"] for row in harness_rows}
        out = {}
        for harness in harnesses:
            routed = harness_route.route(harness, matrices.get)
            if routed is None:
                continue
            out[harness["id"]] = {
                "lengths": harness_checks.lengths(routed, allowance.get(harness["id"])),
                "collisions": harness_checks.collisions(routed, boards),
                "tightBends": [{"segmentId": c["segmentId"], "radiusMm": c["tightBend"]["radiusMm"],
                                "minRadiusMm": c["minRadiusAllowedMm"], "atMm": c["tightBend"]["atMm"]}
                               for c in routed["curves"] if c["tightBend"] and c["diameterMm"] > 0],
            }
        return out

    def _placement(self, store: SystemStore, system_id: str, tree: Optional[hierarchy.Tree] = None,
                   level: Optional[system_nets.Level] = None) -> tuple[dict, dict]:
        """Every occurrence placed with its mates solved (§14.9), and the board extents used.

        Reads only each board's outline and thickness and the mated connectors, never a
        whole artifact (megabytes per board).
        """
        tree = tree or self._tree(store, system_id)
        level = level or self._net_level(store, system_id, tree)
        # Modules mate like boards (§5.6): their stored frames count too.
        level.mating = store.mating_of([i["id"] for i in store.list_instances(system_id, kinds=("board", "module"))])
        level.driving = store.list_driving_mates(system_id)
        extents = {(o.project_id, o.baseline_commit): store.get_interface_extent(o.project_id, o.baseline_commit,
                                                                                 EXTRACTOR_VERSION)
                   for o in tree.boards if o.project_id and o.baseline_commit}
        interface_of, component_of = self._occurrence_lookups(store, extents)
        placement = scene_module.place_tree(tree.occurrences, interface_of, store.list_poses(system_id), level,
                                            component_of)
        return placement, extents

    def _occurrence_lookups(self, store: SystemStore, extents: Mapping[tuple, Optional[dict]]):
        """``(interface_of, component_of)`` for an occurrence: a board's extent and one connector read from
        its artifact (never the whole artifact), a module's interface (§5.6), cached per call."""
        modules_read: dict[str, Optional[dict]] = {}
        components: dict[tuple[str, str, str], Optional[dict]] = {}

        def module(occurrence: hierarchy.Occurrence) -> Optional[dict]:
            if occurrence.revision_id not in modules_read:
                modules_read[occurrence.revision_id] = self._module_interface(occurrence.revision_id)
            return modules_read[occurrence.revision_id]

        def interface_of(occurrence: hierarchy.Occurrence) -> Optional[dict]:
            if occurrence.kind == "module":
                return module(occurrence) if occurrence.revision_id else None
            return extents.get((occurrence.project_id, occurrence.baseline_commit))

        def component_of(occurrence: hierarchy.Occurrence, port_key: str) -> Optional[dict]:
            if occurrence.kind == "module":
                return modules.component(module(occurrence), port_key) if occurrence.revision_id else None
            if not occurrence.project_id or not occurrence.baseline_commit:
                return None
            key = (occurrence.project_id, occurrence.baseline_commit, port_key)
            if key not in components:
                components[key] = store.get_interface_component(*key[:2], EXTRACTOR_VERSION, port_key)
            return components[key]

        return interface_of, component_of

    def _scene_asset(self, caller: Caller, project_id: str, commit: str) -> dict:
        entry = {"assetId": scene_module.asset_id(project_id, commit), "projectId": project_id, "commit": commit,
                 "status": "missing", "bundleUrl": None, "sourceRevisionKey": None, "generatorBuild": None,
                 "jobId": None, "error": None, "bundleToBoard": None}
        project = self._load_project(project_id)
        if project is None:
            return {**entry, "status": "failed"}
        try:
            status = self._bundles.status(project, commit)
        except Exception:
            logger.exception("Could not read the 3D bundle status of %s@%s", project_id, commit)
            return {**entry, "status": "failed"}
        if status.get("available"):
            try:
                mid_plane = self._bundles.mid_plane_mm(project_id, status)
            except BundleUnreadable:
                # SB2-91: a status that says ready over files that are gone would show "generating" forever.
                return {**entry, "status": "failed", "generatorBuild": status.get("build_fingerprint"),
                        "error": "The 3D files of this revision are missing or unreadable on this server. "
                                 "Regenerate it from the board's 3D tab."}
            entry.update(status="ready" if status.get("status") == "ready" else "building",
                         bundleUrl=status.get("bundle_url"), sourceRevisionKey=status.get("sourceRevisionKey"),
                         generatorBuild=status.get("build_fingerprint"),
                         bundleToBoard=scene_module.bundle_to_board(mid_plane))
            return entry
        try:
            last = self._bundles.last_build(project_id, commit)
        except Exception:
            logger.exception("Could not read the 3D bundle jobs of %s@%s", project_id, commit)
            last = None
        if last and last["status"] in _ACTIVE_JOB_STATES:
            return {**entry, "status": "building", "jobId": last["jobId"]}
        if last and last["status"] in ("failed", "cancelled"):
            # Never re-queued by a read: a retry is a deliberate Regenerate on the board's 3D tab.
            return {**entry, "status": "failed", "jobId": last["jobId"], "error": last["error"]}
        if last and last["status"] == "completed":
            # The job finished but its bundle is not readable here: pruned, invalidated, or built
            # by a different generator build than this server's. Asking again would return the
            # same completed job, and the board would read as "building" forever.
            logger.warning("3D bundle job %s for %s@%s completed but no bundle is available",
                           last["jobId"], project_id, commit)
            return {**entry, "status": "failed", "jobId": last["jobId"],
                    "error": "The 3D build finished but its bundle is not available on this server. "
                             "Regenerate it from the board's 3D tab."}
        if caller.role in _BUNDLE_BUILDERS:
            try:
                entry.update(status="building", jobId=self._bundles.build(project_id, commit, requested_by=caller.email))
            except Exception:
                logger.exception("Could not queue a 3D bundle for %s@%s", project_id, commit)
        return entry

    def update_instance(
        self, caller: Caller, system_id: str, version: int, instance_id: str,
        fields: Mapping[str, Any],
    ) -> Result:
        with self._tx() as store:
            kind = self._open_instance(store, system_id, instance_id, caller).get("kind", "board")
        if kind != "board":
            if {"trackedRef", "pinned"} & set(fields):
                raise Invalid("assembly and module instances follow catalog revisions; use follow")
            with self._tx() as store:
                self._system(store, system_id, caller)
                with store.mutation(system_id, expected_version=version, actor=caller.actor) as change:
                    row = store.update_instance(change, instance_id, label=fields.get("label"))
                    if fields.get("follow") is not None:
                        store.set_follow(change, instance_id, fields["follow"])
                        row = store.get_instance(system_id, instance_id)
            return Result(self._instance_row(row), system_id, change.version)
        if fields.get("follow") is not None:
            raise Invalid("a board follows its tracked branch, not catalog revisions")
        tracked_ref = fields.get("trackedRef", ...)
        if tracked_ref not in (..., None):
            with self._tx() as store:
                self._system(store, system_id, caller)
                instance = self._open_instance(store, system_id, instance_id, caller)
                project = self._require_project(store, instance["project_id"], caller)
            try:
                if sources.resolve_tracked_ref(project, tracked_ref) is None:
                    raise Invalid("trackedRef does not exist in the project repository")
            except sources.SourceError as error:
                raise Invalid(str(error)) from None
        with self._tx() as store:
            self._system(store, system_id, caller)
            with store.mutation(system_id, expected_version=version, actor=caller.actor) as change:
                before = self._open_instance(store, system_id, instance_id, caller)
                row = store.update_instance(
                    change, instance_id, label=fields.get("label"), pinned=fields.get("pinned"),
                    tracked_ref=tracked_ref,
                )
        resumed = before["pinned"] and not row["pinned"]
        if row["tracked_ref"] and (resumed or row["tracked_ref"] != before["tracked_ref"]):
            # Evaluate the branch now rather than at the next fetch.
            try:
                self._enqueue_check(instance_id, row["project_id"], requested_by=caller.email)
            except Exception:
                logger.exception("Could not enqueue a source check for instance %s", instance_id)
        return Result(self._instance_row(row), system_id, change.version)

    def remove_instance(
        self, caller: Caller, system_id: str, version: int, instance_id: str, *, cascade: bool
    ) -> Result:
        with self._tx() as store:
            self._system(store, system_id, caller)
            with store.mutation(system_id, expected_version=version, actor=caller.actor) as change:
                self._open_instance(store, system_id, instance_id, caller, allow_deleted=True)
                if cascade:
                    self._require_open_links(store, system_id, caller, instance_id=instance_id)
                store.remove_instance(change, instance_id, cascade_links=cascade)
        return Result(None, system_id, change.version)

    def _require_open_links(
        self, store: SystemStore, system_id: str, caller: Caller, *, instance_id: str
    ) -> None:
        """Cascading must not delete a link whose other end the caller cannot see."""

        instances = {i["id"]: i for i in store.list_instances(system_id, kinds=SystemStore.ALL_KINDS)}
        access = self._access(store, list(instances.values()), caller)
        for link in store.list_links(system_id):
            if instance_id not in (link["a_instance_id"], link["b_instance_id"]):
                continue
            for other in (link["a_instance_id"], link["b_instance_id"]):
                if other == instance_id or instances[other]["kind"] != "board":
                    continue
                if not access[instances[other]["project_id"]]["visible"]:
                    raise NotFound("Link not found")

    def interface(
        self, caller: Caller, system_id: str, instance_id: str, commit: Optional[str]
    ) -> tuple[str, dict]:
        """``("ready", body)`` or ``("queued", job)`` (§8.1 ``202``)."""

        with self._tx() as store:
            self._system(store, system_id, caller)
            instance = self._open_instance(store, system_id, instance_id, caller)
            if instance.get("kind", "board") != "board":
                if commit is not None:
                    raise Invalid("a subsystem has no commits; it pins a catalog revision")
                body = dict(self._interface(store, instance))
                # An export whose board inside the child is hidden keeps its pads, not their nets (P2 §5.4).
                hidden = redaction.hidden_ports(self._restricted_instances(store, system_id, caller))
                body["components"] = [
                    {**c, "override": None, "exposed": True,
                     **({"pins": [{**pin, "nets": None, "powerNet": None} for pin in c.get("pins") or []],
                         "export": None, "redacted": True} if (instance_id, c["portKey"]) in hidden else {})}
                    for c in body["components"]
                ]
                return "ready", {**body, "instanceId": instance_id, "atBaseline": True}
            target = instance["baseline_commit"]
            if commit is not None:
                target = commit.strip().lower()
                if not _FULL_SHA.match(target):
                    raise Invalid("commit must be a full 40-character SHA")
            found = store.get_interface(instance["project_id"], target, EXTRACTOR_VERSION)
            overrides = store.list_overrides(instance_id)
        if found is not None:
            ports = {p["portKey"]: p for p in exposure.resolve_ports(found, overrides)}
            body = dict(found)
            body["components"] = [
                {**component, "override": ports[component["portKey"]]["override"],
                 "exposed": ports[component["portKey"]]["exposed"]}
                for component in found.get("components") or []
            ]
            body["instanceId"] = instance_id
            body["atBaseline"] = target == instance["baseline_commit"]
            return "ready", body
        if target != instance["baseline_commit"]:
            project = self._load_project(instance["project_id"])
            try:
                exists = project is not None and sources.resolve_commit(project, target) == target
            except sources.SourceError:
                exists = False
            if not exists:
                raise NotFound("Commit not found")
        job = self._enqueue(instance["project_id"], target, requested_by=caller.email)
        return "queued", {"job_id": str(job["job_id"]), "status": job["status"]}

    def check_now(self, caller: Caller, system_id: str, instance_id: str) -> dict:
        """``POST …/check`` (§8.1): queue detection for one instance now."""

        with self._tx() as store:
            self._system(store, system_id, caller)
            instance = self._open_instance(store, system_id, instance_id, caller)
        if not instance["tracked_ref"]:
            raise Conflict("instance does not track a branch")
        job = self._enqueue_check(instance_id, instance["project_id"], requested_by=caller.email)
        return {"job_id": str(job["job_id"]), "status": job["status"]}

    def set_override(
        self, caller: Caller, system_id: str, version: int, instance_id: str, port_key: str,
        state: Optional[str],
    ) -> Result:
        with self._tx() as store:
            self._system(store, system_id, caller)
            with store.mutation(system_id, expected_version=version, actor=caller.actor) as change:
                instance = self._open_instance(store, system_id, instance_id, caller)
                if instance.get("kind", "board") != "board":
                    raise Invalid("a subsystem's exports are always ports; hide or promote them in the child system")
                interface = self._interface(store, instance)
                component = next(
                    (c for c in interface.get("components") or [] if c["portKey"] == port_key), None
                )
                if component is None:
                    raise Invalid("portKey is not a component of this board at its baseline")
                if state == "promoted" and not exposure.is_annotated(component["reference"]):
                    raise Invalid("an unannotated component cannot be promoted")
                store.set_override(change, instance_id, port_key, state)
                summary = exposure.port_summary(component, state)
        return Result(summary, system_id, change.version)
