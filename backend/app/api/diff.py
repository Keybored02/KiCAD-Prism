"""
Diff API Routes
"""

from fastapi import APIRouter, Depends, HTTPException
from app.api._helpers import get_project_for_role_or_404
from app.core.security import AuthenticatedUser, require_viewer
from app.services import sch_diff_service
from app.services import pcb_diff_service

router = APIRouter(dependencies=[Depends(require_viewer)])


@router.get("/{project_id}/schematic-diff")
async def get_schematic_diff(
    project_id: str,
    commit1: str,
    commit2: str = None,
    user: AuthenticatedUser = Depends(require_viewer),
):
    """
    Return interactive schematic diff data between two commits.
    If commit2 is omitted, diffs commit1 against its parent.
    Includes both file contents (for ecad-viewer) and a structured change list.
    """
    get_project_for_role_or_404(project_id, user.role)

    # Resolve parent commit when commit2 is not provided
    if commit2 is None:
        from pathlib import Path
        from app.services.project_service import get_registered_projects
        projects = get_registered_projects()
        project = next((p for p in projects if p.id == project_id), None)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        try:
            from git import Repo
            repo_root = sch_diff_service._git_root(Path(project.path))
            repo = Repo(str(repo_root))
            commit_obj = repo.commit(commit1)
            if not commit_obj.parents:
                raise HTTPException(status_code=400, detail="Commit has no parent to diff against")
            commit2 = commit_obj.parents[0].hexsha
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Git error: {str(e)}")

    result = sch_diff_service.get_schematic_diff(project_id, commit1, commit2)
    if result is None:
        raise HTTPException(status_code=404, detail="Schematic not found for this project/commits")
    return result


def _resolve_parent_commit(project_id: str, commit1: str) -> str:
    """Resolve the parent commit hash, raising HTTPException on failure."""
    from pathlib import Path
    from app.services.project_service import get_registered_projects
    projects = get_registered_projects()
    project = next((p for p in projects if p.id == project_id), None)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    try:
        from git import Repo
        repo_root = sch_diff_service._git_root(Path(project.path))
        repo = Repo(str(repo_root))
        commit_obj = repo.commit(commit1)
        if not commit_obj.parents:
            raise HTTPException(status_code=400, detail="Commit has no parent to diff against")
        return commit_obj.parents[0].hexsha
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Git error: {str(e)}")


@router.get("/{project_id}/pcb-diff")
async def get_pcb_diff(
    project_id: str,
    commit1: str,
    commit2: str = None,
    user: AuthenticatedUser = Depends(require_viewer),
):
    """
    Return interactive PCB diff data between two commits.
    If commit2 is omitted, diffs commit1 against its parent.
    """
    get_project_for_role_or_404(project_id, user.role)
    if commit2 is None:
        commit2 = _resolve_parent_commit(project_id, commit1)
    result = pcb_diff_service.get_pcb_diff(project_id, commit1, commit2)
    if result is None:
        raise HTTPException(status_code=404, detail="PCB not found for this project/commits")
    return result
