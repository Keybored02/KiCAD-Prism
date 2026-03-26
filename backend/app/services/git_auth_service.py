import os
from pathlib import Path
from typing import Optional, Tuple
from urllib.parse import urlparse

from git import Repo

from app.core.config import settings

SSH_KEY_TYPES = ("id_ed25519", "id_rsa")
SSH_ENABLED_HTTPS_HOSTS = {"github.com", "gitlab.com"}


def has_ssh_key() -> bool:
    """Check whether a default SSH private key exists."""
    ssh_dir = Path.home() / ".ssh"
    return any((ssh_dir / key_type).exists() for key_type in SSH_KEY_TYPES)


def build_git_env() -> dict[str, str]:
    """Return the Git environment used by clone/fetch/pull operations."""
    env = os.environ.copy()
    env["GIT_TERMINAL_PROMPT"] = "0"
    # Trust On First Use (TOFU) for SSH-host key registration.
    env["GIT_SSH_COMMAND"] = "ssh -o StrictHostKeyChecking=accept-new"
    return env


def normalize_remote_url_for_auth(repo_url: str) -> Tuple[str, bool]:
    """
    Convert supported HTTPS remotes to SSH when an SSH key is available.

    This keeps copy-pasted browser URLs working for private repos without
    requiring the user to manually reformat them as git@host:path.git.
    """
    if not repo_url or not has_ssh_key():
        return repo_url, False

    parsed = urlparse(repo_url)
    hostname = (parsed.hostname or "").lower()

    if parsed.scheme != "https" or hostname not in SSH_ENABLED_HTTPS_HOSTS:
        return repo_url, False

    # Prefer GitHub token auth when it is explicitly configured.
    if hostname == "github.com" and settings.GITHUB_TOKEN:
        return repo_url, False

    path = parsed.path.lstrip("/")
    if not path or "/" not in path:
        return repo_url, False

    if not path.endswith(".git"):
        path = f"{path}.git"

    return f"git@{hostname}:{path}", True


def ensure_remote_uses_authenticated_url(repo: Repo, remote_name: str = "origin") -> Tuple[Optional[str], bool]:
    """
    Rewrite a repo's remote in-place when SSH should be used for auth.

    Returns the active remote URL and whether it was changed.
    """
    remote = repo.remote(remote_name)
    try:
        current_url = remote.url
    except AttributeError:
        current_url = next(iter(remote.urls), None)

    if not current_url:
        return current_url, False

    normalized_url, changed = normalize_remote_url_for_auth(current_url)
    if changed and normalized_url:
        remote.set_url(normalized_url)
        return normalized_url, True

    return current_url, False
