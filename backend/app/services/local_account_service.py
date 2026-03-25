import base64
import hashlib
import hmac
import json
import os
import re
from datetime import datetime, timezone
from typing import Any

from app.core.config import settings
from app.core.roles import Role, normalize_role

ACCOUNT_STORE_VERSION = "1"
USERNAME_PATTERN = re.compile(r"^[a-z0-9._-]{3,32}$")
PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 128
SCRYPT_N = 2**14
SCRYPT_R = 8
SCRYPT_P = 1
SCRYPT_DKLEN = 64


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _role_store_path() -> str:
    return settings.RESOLVED_LOCAL_ACCOUNT_STORE_PATH


def _ensure_store_directory() -> None:
    os.makedirs(os.path.dirname(_role_store_path()), exist_ok=True)


def _default_store() -> dict[str, Any]:
    return {
        "version": ACCOUNT_STORE_VERSION,
        "updated_at": _now_iso(),
        "updated_by": "system",
        "users": {},
    }


def _load_store() -> dict[str, Any]:
    path = _role_store_path()
    if not os.path.exists(path):
        return _default_store()

    try:
        with open(path, "r", encoding="utf-8") as handle:
            payload = json.load(handle)
        if not isinstance(payload, dict):
            return _default_store()
        users = payload.get("users")
        if not isinstance(users, dict):
            payload["users"] = {}
        return payload
    except (OSError, json.JSONDecodeError):
        return _default_store()


def _save_store(payload: dict[str, Any]) -> None:
    _ensure_store_directory()
    path = _role_store_path()
    tmp_path = f"{path}.tmp"
    with open(tmp_path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, sort_keys=True)
    os.replace(tmp_path, path)


def _normalize_username(username: str) -> str:
    normalized = (username or "").strip().lower()
    if not USERNAME_PATTERN.fullmatch(normalized):
        raise ValueError("Username must be 3-32 characters using letters, numbers, ., _, or -")
    return normalized


def _normalize_display_name(name: str) -> str:
    normalized = (name or "").strip()
    if not normalized:
        raise ValueError("Display name is required")
    return normalized


def _normalize_updated_by(updated_by: str) -> str:
    normalized = (updated_by or "").strip().lower()
    if not normalized:
        raise ValueError("Updated by is required")
    return normalized


def _normalize_password(password: str) -> str:
    normalized = password or ""
    if len(normalized) < PASSWORD_MIN_LENGTH or len(normalized) > PASSWORD_MAX_LENGTH:
        raise ValueError(f"Password must be between {PASSWORD_MIN_LENGTH} and {PASSWORD_MAX_LENGTH} characters")
    return normalized


def _hash_password(password: str) -> str:
    normalized_password = _normalize_password(password)
    salt = os.urandom(16)
    derived_key = hashlib.scrypt(
        normalized_password.encode("utf-8"),
        salt=salt,
        n=SCRYPT_N,
        r=SCRYPT_R,
        p=SCRYPT_P,
        dklen=SCRYPT_DKLEN,
    )
    return "$".join(
        [
            "scrypt",
            str(SCRYPT_N),
            str(SCRYPT_R),
            str(SCRYPT_P),
            base64.urlsafe_b64encode(salt).decode("ascii"),
            base64.urlsafe_b64encode(derived_key).decode("ascii"),
        ]
    )


def _verify_password(password: str, encoded_hash: str) -> bool:
    try:
        algorithm, n, r, p, encoded_salt, encoded_key = encoded_hash.split("$")
        if algorithm != "scrypt":
            return False
        salt = base64.urlsafe_b64decode(encoded_salt.encode("ascii"))
        expected_key = base64.urlsafe_b64decode(encoded_key.encode("ascii"))
        derived_key = hashlib.scrypt(
            _normalize_password(password).encode("utf-8"),
            salt=salt,
            n=int(n),
            r=int(r),
            p=int(p),
            dklen=len(expected_key),
        )
        return hmac.compare_digest(derived_key, expected_key)
    except (ValueError, TypeError):
        return False


def _bootstrap_username() -> str | None:
    if not settings.LOCAL_BOOTSTRAP_ADMIN_USERNAME.strip():
        return None
    return _normalize_username(settings.LOCAL_BOOTSTRAP_ADMIN_USERNAME)


def _ensure_bootstrap_admin_account() -> None:
    bootstrap_username = _bootstrap_username()
    bootstrap_password = settings.LOCAL_BOOTSTRAP_ADMIN_PASSWORD
    if not bootstrap_username or not bootstrap_password:
        return

    payload = _load_store()
    users = payload.setdefault("users", {})
    if bootstrap_username in users:
        return

    now = _now_iso()
    users[bootstrap_username] = {
        "username": bootstrap_username,
        "name": _normalize_display_name(settings.LOCAL_BOOTSTRAP_ADMIN_NAME),
        "password_hash": _hash_password(bootstrap_password),
        "role": "admin",
        "created_at": now,
        "created_by": "system",
        "updated_at": now,
        "updated_by": "system",
    }
    payload["version"] = ACCOUNT_STORE_VERSION
    payload["updated_at"] = now
    payload["updated_by"] = "system"
    _save_store(payload)


def _is_bootstrap_account(username: str) -> bool:
    bootstrap_username = _bootstrap_username()
    return bootstrap_username is not None and username == bootstrap_username


def _entry_to_role(entry: Any) -> Role | None:
    if not isinstance(entry, dict):
        return None
    return normalize_role(entry.get("role"))


def _sanitize_account(username: str, entry: dict[str, Any]) -> dict[str, str]:
    role = _entry_to_role(entry)
    if role is None:
        raise ValueError("Invalid local account role")
    return {
        "username": username,
        "name": str(entry.get("name") or username),
        "role": role,
        "source": "bootstrap" if _is_bootstrap_account(username) else "store",
    }


def list_accounts() -> list[dict[str, str]]:
    _ensure_bootstrap_admin_account()
    payload = _load_store()
    users = payload.get("users") or {}
    accounts: list[dict[str, str]] = []
    for username, value in users.items():
        if not isinstance(value, dict):
            continue
        try:
            accounts.append(_sanitize_account(str(username), value))
        except ValueError:
            continue
    accounts.sort(key=lambda account: account["username"])
    return accounts


def resolve_user_role(username: str) -> Role | None:
    _ensure_bootstrap_admin_account()
    normalized_username = _normalize_username(username)
    payload = _load_store()
    users = payload.get("users") or {}
    return _entry_to_role(users.get(normalized_username))


def authenticate(username: str, password: str) -> dict[str, str]:
    _ensure_bootstrap_admin_account()
    normalized_username = _normalize_username(username)
    payload = _load_store()
    users = payload.get("users") or {}
    entry = users.get(normalized_username)
    if not isinstance(entry, dict):
        raise ValueError("Invalid username or password")

    password_hash = str(entry.get("password_hash") or "")
    if not password_hash or not _verify_password(password, password_hash):
        raise ValueError("Invalid username or password")

    role = _entry_to_role(entry)
    if role is None:
        raise ValueError("Account role is invalid")

    return {
        "username": normalized_username,
        "name": str(entry.get("name") or normalized_username),
        "role": role,
    }


def create_account(username: str, name: str, password: str, role: Role, updated_by: str) -> dict[str, str]:
    _ensure_bootstrap_admin_account()
    normalized_username = _normalize_username(username)
    normalized_name = _normalize_display_name(name)
    normalized_updated_by = _normalize_updated_by(updated_by)
    password_hash = _hash_password(password)

    payload = _load_store()
    users = payload.setdefault("users", {})
    if normalized_username in users:
        raise ValueError("Local account already exists")

    now = _now_iso()
    users[normalized_username] = {
        "username": normalized_username,
        "name": normalized_name,
        "password_hash": password_hash,
        "role": role,
        "created_at": now,
        "created_by": normalized_updated_by,
        "updated_at": now,
        "updated_by": normalized_updated_by,
    }
    payload["version"] = ACCOUNT_STORE_VERSION
    payload["updated_at"] = now
    payload["updated_by"] = normalized_updated_by
    _save_store(payload)

    return _sanitize_account(normalized_username, users[normalized_username])


def update_account(username: str, name: str | None, role: Role | None, updated_by: str) -> dict[str, str]:
    _ensure_bootstrap_admin_account()
    normalized_username = _normalize_username(username)
    normalized_updated_by = _normalize_updated_by(updated_by)

    payload = _load_store()
    users = payload.setdefault("users", {})
    entry = users.get(normalized_username)
    if not isinstance(entry, dict):
        raise ValueError("Local account not found")

    if _is_bootstrap_account(normalized_username) and role not in {None, "admin"}:
        raise ValueError("Cannot change bootstrap admin role")

    if name is not None:
        entry["name"] = _normalize_display_name(name)
    if role is not None:
        entry["role"] = role
    entry["updated_at"] = _now_iso()
    entry["updated_by"] = normalized_updated_by
    payload["updated_at"] = entry["updated_at"]
    payload["updated_by"] = normalized_updated_by
    _save_store(payload)

    return _sanitize_account(normalized_username, entry)


def update_password(username: str, password: str, updated_by: str) -> dict[str, str]:
    _ensure_bootstrap_admin_account()
    normalized_username = _normalize_username(username)
    normalized_updated_by = _normalize_updated_by(updated_by)

    payload = _load_store()
    users = payload.setdefault("users", {})
    entry = users.get(normalized_username)
    if not isinstance(entry, dict):
        raise ValueError("Local account not found")

    entry["password_hash"] = _hash_password(password)
    entry["updated_at"] = _now_iso()
    entry["updated_by"] = normalized_updated_by
    payload["updated_at"] = entry["updated_at"]
    payload["updated_by"] = normalized_updated_by
    _save_store(payload)

    return _sanitize_account(normalized_username, entry)


def delete_account(username: str, updated_by: str) -> bool:
    _ensure_bootstrap_admin_account()
    normalized_username = _normalize_username(username)
    normalized_updated_by = _normalize_updated_by(updated_by)

    if _is_bootstrap_account(normalized_username):
        raise ValueError("Cannot delete bootstrap admin account")

    payload = _load_store()
    users = payload.setdefault("users", {})
    if normalized_username not in users:
        return False

    users.pop(normalized_username, None)
    payload["updated_at"] = _now_iso()
    payload["updated_by"] = normalized_updated_by
    _save_store(payload)
    return True
