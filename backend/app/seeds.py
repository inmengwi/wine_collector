"""Database seed script for initial data."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.tag import Tag, TagType
from app.services.auth_service import pwd_context


async def seed_test_user(db: AsyncSession) -> None:
    """Create test user if not exists."""
    test_email = "test@example.com"
    test_password = "password!"

    # Check if test user exists
    result = await db.execute(
        select(User).where(User.email == test_email)
    )
    existing_user = result.scalar_one_or_none()

    if existing_user:
        print(f"Test user already exists: {test_email}")
        return

    # Create test user with proper password hashing
    user = User(
        email=test_email,
        password_hash=pwd_context.hash(test_password),
        name="테스트 사용자",
        is_verified=True,
        is_active=True,
    )
    db.add(user)
    await db.flush()

    # Create default tags for test user
    default_tags = [
        Tag(user_id=user.id, name="메인 셀러", type=TagType.CELLAR.value, color="#8B5CF6", sort_order=1),
        Tag(user_id=user.id, name="보조 셀러", type=TagType.CELLAR.value, color="#6366F1", sort_order=2),
        Tag(user_id=user.id, name="와인냉장고", type=TagType.LOCATION.value, color="#10B981", sort_order=1),
        Tag(user_id=user.id, name="특별 보관", type=TagType.CUSTOM.value, color="#EC4899", sort_order=10),
    ]
    db.add_all(default_tags)

    await db.commit()
    print(f"Test user created: {test_email} / password!")


async def run_seeds(db: AsyncSession) -> None:
    """Run all seed functions."""
    await seed_test_user(db)
