"""
Diff API Routes (Native)
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from app.api._helpers import get_project_for_role_or_404
from app.core.security import AuthenticatedUser, require_designer, require_viewer
from app.services import diff_service
from app.services import sch_diff_service
from app.services import pcb_diff_service

router = APIRouter(dependencies=[Depends(require_viewer)])

class DiffRequest(BaseModel):
    commit1: str
    commit2: str

@router.post("/{project_id}/diff", dependencies=[Depends(require_designer)])
async def start_diff(
    project_id: str,
    request: DiffRequest,
    user: AuthenticatedUser = Depends(require_viewer),
):
    """Start a visual diff job."""
    get_project_for_role_or_404(project_id, user.role)
    try:
        job_id = diff_service.start_diff_job(project_id, request.commit1, request.commit2)
        return {"job_id": job_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{project_id}/diff/{job_id}/status")
async def get_status(project_id: str, job_id: str, user: AuthenticatedUser = Depends(require_viewer)):
    get_project_for_role_or_404(project_id, user.role)
    status = diff_service.get_job_status(job_id)
    if not status:
        raise HTTPException(status_code=404, detail="Job not found")
    return status

@router.get("/{project_id}/diff/{job_id}/manifest")
async def get_manifest(project_id: str, job_id: str, user: AuthenticatedUser = Depends(require_viewer)):
    get_project_for_role_or_404(project_id, user.role)
    manifest = diff_service.get_manifest(job_id)
    if not manifest:
        raise HTTPException(status_code=404, detail="Manifest not found or job not complete")
    return manifest

@router.get("/{project_id}/diff/{job_id}/assets/{path:path}")
async def get_asset(project_id: str, job_id: str, path: str, user: AuthenticatedUser = Depends(require_viewer)):
    get_project_for_role_or_404(project_id, user.role)
    file_path = diff_service.get_asset_path(job_id, path)
    if not file_path:
        raise HTTPException(status_code=404, detail="Asset not found")
    return FileResponse(file_path)

@router.delete("/{project_id}/diff/{job_id}", dependencies=[Depends(require_designer)])
async def delete_job(project_id: str, job_id: str, user: AuthenticatedUser = Depends(require_viewer)):
    """Explicitly clean up a job."""
    get_project_for_role_or_404(project_id, user.role)
    diff_service.delete_job(job_id)
    return {"status": "deleted"}


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
