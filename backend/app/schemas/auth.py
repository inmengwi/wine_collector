"""Authentication schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    """User registration request."""

    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    name: str = Field(..., min_length=2, max_length=100)
    marketing_agreed: bool = False


class UserLogin(BaseModel):
    """User login request."""

    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """User response model."""

    id: UUID
    email: str
    name: str
    profile_image: str | None = None
    is_verified: bool = False
    birth_year: int | None = None
    language: str | None = None
    nationality: str | None = None
    gender: str | None = None
    wine_preferences: str | None = None
    created_at: datetime
    last_login_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    """Token response model."""

    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int


class TokenPayload(BaseModel):
    """JWT token payload."""

    sub: str
    exp: int
    type: str  # "access" or "refresh"


class RefreshTokenRequest(BaseModel):
    """Refresh token request."""

    refresh_token: str


class PasswordChangeRequest(BaseModel):
    """Password change request."""

    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)


class UserUpdate(BaseModel):
    """User profile update request."""

    name: str | None = Field(None, min_length=2, max_length=100)
    profile_image: str | None = None
    birth_year: int | None = Field(None, ge=1900, le=2025)
    language: str | None = Field(None, max_length=10)
    nationality: str | None = Field(None, max_length=100)
    gender: str | None = Field(None, max_length=20)
    wine_preferences: str | None = Field(None, max_length=500)


class SocialLoginRequest(BaseModel):
    """Social login request."""

    id_token: str | None = None
    access_token: str | None = None
