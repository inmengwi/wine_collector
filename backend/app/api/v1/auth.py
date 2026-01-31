"""Authentication API endpoints."""

from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.auth import (
    UserCreate,
    UserLogin,
    UserResponse,
    TokenResponse,
    RefreshTokenRequest,
    PasswordChangeRequest,
    UserUpdate,
)
from app.schemas.common import ResponseModel
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/register", response_model=ResponseModel[UserResponse], status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: DbSession):
    """Register a new user."""
    service = AuthService(db)
    user = await service.create_user(user_data)
    return ResponseModel(
        data=UserResponse.model_validate(user),
        message="Registration successful. Please verify your email.",
    )


@router.post("/login", response_model=ResponseModel[dict])
async def login(credentials: UserLogin, db: DbSession):
    """Login and get access token."""
    service = AuthService(db)
    user = await service.authenticate_user(credentials.email, credentials.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    tokens = await service.create_tokens(user)
    await service.update_last_login(user)

    return ResponseModel(
        data={
            **tokens,
            "user": UserResponse.model_validate(user),
        }
    )


@router.post("/refresh", response_model=ResponseModel[TokenResponse])
async def refresh_token(request: RefreshTokenRequest, db: DbSession):
    """Refresh access token."""
    service = AuthService(db)
    tokens = await service.refresh_tokens(request.refresh_token)

    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    return ResponseModel(data=TokenResponse(**tokens))


@router.post("/logout", response_model=ResponseModel[None])
async def logout(current_user: CurrentUser, db: DbSession):
    """Logout and invalidate tokens."""
    service = AuthService(db)
    await service.revoke_user_tokens(current_user.id)
    return ResponseModel(message="Logged out successfully")


@router.get("/me", response_model=ResponseModel[UserResponse])
async def get_me(current_user: CurrentUser):
    """Get current user information."""
    return ResponseModel(data=UserResponse.model_validate(current_user))


@router.patch("/me", response_model=ResponseModel[UserResponse])
async def update_me(update_data: UserUpdate, current_user: CurrentUser, db: DbSession):
    """Update current user profile."""
    service = AuthService(db)
    user = await service.update_user(current_user, update_data)
    return ResponseModel(
        data=UserResponse.model_validate(user),
        message="Profile updated successfully",
    )


@router.post("/password", response_model=ResponseModel[None])
async def change_password(
    request: PasswordChangeRequest,
    current_user: CurrentUser,
    db: DbSession,
):
    """Change user password."""
    service = AuthService(db)
    success = await service.change_password(
        current_user,
        request.current_password,
        request.new_password,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    return ResponseModel(message="Password changed successfully")
