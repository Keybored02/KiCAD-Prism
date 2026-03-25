"""
Authentication API endpoints.

Handles Google OAuth login and session management.
"""

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field
from app.core.config import settings
from app.core.roles import Role
from app.core.security import AuthenticatedUser, get_current_user, guest_user
from app.core.session import clear_session_cookie, create_session_token, set_session_cookie
from app.services.google_auth_service import ResolvedSessionUser, authenticate_google_oauth_code
from app.services import local_account_service

router = APIRouter()


class LoginRequest(BaseModel):
    """Request body for Google auth code exchange."""
    code: str = Field(min_length=1)
    redirectUri: str = Field(min_length=1)


class LocalLoginRequest(BaseModel):
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)


class UserSession(BaseModel):
    """User session data returned after successful login."""
    email: str
    name: str
    picture: str = ""
    role: Role


class AuthConfig(BaseModel):
    """Authentication configuration exposed to frontend."""
    auth_enabled: bool
    auth_provider: str
    dev_mode: bool
    google_client_id: str
    workspace_name: str


def _build_user_session(user: ResolvedSessionUser | AuthenticatedUser) -> UserSession:
    return UserSession(
        email=user.email,
        name=user.name,
        picture=user.picture,
        role=user.role,
    )


def _guest_user_session() -> UserSession:
    return _build_user_session(guest_user())


def _require_session_secret() -> None:
    if settings.AUTH_ENABLED and not settings.SESSION_SECRET:
        raise HTTPException(status_code=500, detail="SESSION_SECRET is not configured")


def _create_user_session(response: Response, user: ResolvedSessionUser | AuthenticatedUser) -> UserSession:
    token = create_session_token(
        email=user.email,
        name=user.name,
        picture=user.picture,
        role=user.role,
    )
    set_session_cookie(response, token)
    return _build_user_session(user)


@router.get("/config", response_model=AuthConfig)
async def get_auth_config():
    """
    Get authentication configuration for the frontend.
    
    This allows the frontend to know whether to show the login page
    or go directly to the gallery.
    """
    return AuthConfig(
        auth_enabled=settings.AUTH_ENABLED,
        auth_provider=settings.AUTH_PROVIDER,
        dev_mode=settings.DEV_MODE,
        google_client_id=settings.GOOGLE_CLIENT_ID,
        workspace_name=settings.WORKSPACE_NAME,
    )


@router.post("/login", response_model=UserSession)
async def login(request: LoginRequest, response: Response):
    """
    Authenticate user with Google OAuth authorization code.
    
    Exchanges the code with Google, checks domain restrictions, and returns user session data.
    """
    # If auth is disabled, this endpoint shouldn't normally be called,
    # but handle gracefully just in case
    if not settings.AUTH_ENABLED:
        return _guest_user_session()

    if settings.AUTH_PROVIDER != "google":
        raise HTTPException(status_code=400, detail="Google login is not enabled")

    _require_session_secret()
    session_user = authenticate_google_oauth_code(code=request.code, redirect_uri=request.redirectUri)
    return _create_user_session(response, session_user)


@router.post("/login/local", response_model=UserSession)
async def local_login(request: LocalLoginRequest, response: Response):
    if not settings.AUTH_ENABLED:
        return _guest_user_session()

    if settings.AUTH_PROVIDER != "local":
        raise HTTPException(status_code=400, detail="Local login is not enabled")

    _require_session_secret()
    try:
        account = local_account_service.authenticate(request.username, request.password)
    except ValueError as error:
        raise HTTPException(status_code=401, detail=str(error))

    session_user = AuthenticatedUser(
        email=account["username"],
        name=account["name"],
        picture="",
        role=account["role"],  # type: ignore[arg-type]
    )
    return _create_user_session(response, session_user)


@router.get("/me", response_model=UserSession)
async def get_current_session_user(user: AuthenticatedUser = Depends(get_current_user)):
    return _build_user_session(user)


@router.post("/logout")
async def logout(response: Response):
    clear_session_cookie(response)
    return {"success": True}
