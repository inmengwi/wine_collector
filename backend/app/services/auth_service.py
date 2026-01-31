"""Authentication service."""

from datetime import datetime, timedelta, timezone
from uuid import UUID
import hashlib

from jose import jwt
from passlib.context import CryptContext
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.user import User, RefreshToken
from app.models.tag import Tag, TagType
from app.schemas.auth import UserCreate, UserUpdate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Authentication service for user management and JWT tokens."""

    def __init__(self, db: AsyncSession):
        self.db = db

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        return pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        """Hash a password."""
        return pwd_context.hash(password)

    def _hash_token(self, token: str) -> str:
        """Hash a token for storage."""
        return hashlib.sha256(token.encode()).hexdigest()

    async def get_user_by_email(self, email: str) -> User | None:
        """Get user by email."""
        result = await self.db.execute(
            select(User).where(
                User.email == email.lower(),
                User.deleted_at.is_(None),
            )
        )
        return result.scalar_one_or_none()

    async def create_user(self, user_data: UserCreate) -> User:
        """Create a new user."""
        # Check if email exists
        existing = await self.get_user_by_email(user_data.email)
        if existing:
            raise ValueError("Email already registered")

        # Create user
        user = User(
            email=user_data.email.lower(),
            password_hash=self.get_password_hash(user_data.password),
            name=user_data.name,
            is_verified=False,  # Would need email verification in production
        )
        self.db.add(user)
        await self.db.flush()

        # Create default tags for new user
        await self._create_default_tags(user.id)

        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def _create_default_tags(self, user_id: UUID) -> None:
        """Create default tags for a new user."""
        default_tags = [
            Tag(user_id=user_id, name="메인 셀러", type=TagType.CELLAR.value, color="#8B5CF6", sort_order=1),
            Tag(user_id=user_id, name="보조 셀러", type=TagType.CELLAR.value, color="#6366F1", sort_order=2),
            Tag(user_id=user_id, name="특별 보관", type=TagType.CUSTOM.value, color="#EC4899", sort_order=10),
        ]
        self.db.add_all(default_tags)

    async def authenticate_user(self, email: str, password: str) -> User | None:
        """Authenticate user with email and password."""
        user = await self.get_user_by_email(email)

        if not user:
            return None

        if not self.verify_password(password, user.password_hash):
            return None

        if not user.is_active:
            return None

        return user

    def create_access_token(self, user_id: UUID) -> str:
        """Create JWT access token."""
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.access_token_expire_minutes
        )
        to_encode = {
            "sub": str(user_id),
            "exp": expire,
            "type": "access",
        }
        return jwt.encode(
            to_encode,
            settings.jwt_secret_key,
            algorithm=settings.jwt_algorithm,
        )

    def create_refresh_token(self, user_id: UUID) -> str:
        """Create JWT refresh token."""
        expire = datetime.now(timezone.utc) + timedelta(
            days=settings.refresh_token_expire_days
        )
        to_encode = {
            "sub": str(user_id),
            "exp": expire,
            "type": "refresh",
        }
        return jwt.encode(
            to_encode,
            settings.jwt_secret_key,
            algorithm=settings.jwt_algorithm,
        )

    async def create_tokens(self, user: User) -> dict:
        """Create access and refresh tokens."""
        access_token = self.create_access_token(user.id)
        refresh_token = self.create_refresh_token(user.id)

        # Store refresh token hash
        refresh_token_obj = RefreshToken(
            user_id=user.id,
            token_hash=self._hash_token(refresh_token),
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days),
        )
        self.db.add(refresh_token_obj)
        await self.db.commit()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "Bearer",
            "expires_in": settings.access_token_expire_minutes * 60,
        }

    async def refresh_tokens(self, refresh_token: str) -> dict | None:
        """Refresh access token using refresh token."""
        try:
            payload = jwt.decode(
                refresh_token,
                settings.jwt_secret_key,
                algorithms=[settings.jwt_algorithm],
            )
            if payload.get("type") != "refresh":
                return None

            user_id = UUID(payload["sub"])
        except Exception:
            return None

        # Verify token exists and not revoked
        token_hash = self._hash_token(refresh_token)
        result = await self.db.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked_at.is_(None),
                RefreshToken.expires_at > datetime.now(timezone.utc),
            )
        )
        token_obj = result.scalar_one_or_none()

        if not token_obj:
            return None

        # Get user
        result = await self.db.execute(
            select(User).where(
                User.id == user_id,
                User.deleted_at.is_(None),
                User.is_active.is_(True),
            )
        )
        user = result.scalar_one_or_none()

        if not user:
            return None

        # Revoke old refresh token
        token_obj.revoked_at = datetime.now(timezone.utc)

        # Create new tokens
        return await self.create_tokens(user)

    async def revoke_user_tokens(self, user_id: UUID) -> None:
        """Revoke all refresh tokens for a user."""
        await self.db.execute(
            update(RefreshToken)
            .where(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked_at.is_(None),
            )
            .values(revoked_at=datetime.now(timezone.utc))
        )
        await self.db.commit()

    async def update_last_login(self, user: User) -> None:
        """Update user's last login timestamp."""
        user.last_login_at = datetime.now(timezone.utc)
        await self.db.commit()

    async def update_user(self, user: User, update_data: UserUpdate) -> User:
        """Update user profile."""
        update_dict = update_data.model_dump(exclude_unset=True)

        for field, value in update_dict.items():
            setattr(user, field, value)

        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def change_password(
        self,
        user: User,
        current_password: str,
        new_password: str,
    ) -> bool:
        """Change user password."""
        if not self.verify_password(current_password, user.password_hash):
            return False

        user.password_hash = self.get_password_hash(new_password)

        # Revoke all refresh tokens
        await self.revoke_user_tokens(user.id)

        await self.db.commit()
        return True
