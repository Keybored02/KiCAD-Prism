"""Access shared by the supply endpoints that both writers and approvers use."""

from __future__ import annotations

from fastapi import Depends, HTTPException

from app.core.roles import SUPPLY_APPROVE_ROLES, SUPPLY_WRITE_ROLES
from app.core.security import AuthenticatedUser, require_supply_reader


async def require_supply_editor(user: AuthenticatedUser = Depends(require_supply_reader)) -> AuthenticatedUser:
    """Whoever may propose supply decisions: the people who write supply data and the people who approve it."""

    if user.role not in SUPPLY_WRITE_ROLES | SUPPLY_APPROVE_ROLES:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return user
