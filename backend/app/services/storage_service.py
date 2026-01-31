"""Storage service for file uploads."""

import uuid
from pathlib import Path

import boto3
from botocore.config import Config

from app.config import settings


class StorageService:
    """Service for file storage using S3-compatible storage (Cloudflare R2)."""

    def __init__(self):
        self.client = None
        self._init_client()

    def _init_client(self):
        """Initialize S3 client for R2."""
        if not settings.r2_access_key_id:
            return

        self.client = boto3.client(
            "s3",
            endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
            aws_access_key_id=settings.r2_access_key_id,
            aws_secret_access_key=settings.r2_secret_access_key,
            config=Config(signature_version="s3v4"),
            region_name="auto",
        )

    async def upload_scan_image(
        self,
        content: bytes,
        scan_id: str,
        filename: str,
    ) -> str:
        """Upload a scan image and return its URL."""
        if not self.client:
            # Return mock URL for development
            return f"https://storage.winecollector.app/scans/{scan_id}.jpg"

        # Determine content type
        ext = Path(filename).suffix.lower()
        content_types = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
        }
        content_type = content_types.get(ext, "image/jpeg")

        # Generate key
        key = f"scans/{scan_id}{ext or '.jpg'}"

        # Upload to R2
        self.client.put_object(
            Bucket=settings.r2_bucket_name,
            Key=key,
            Body=content,
            ContentType=content_type,
        )

        # Return public URL
        return f"{settings.r2_public_url}/{key}"

    async def upload_profile_image(
        self,
        content: bytes,
        user_id: str,
        filename: str,
    ) -> str:
        """Upload a profile image and return its URL."""
        if not self.client:
            return f"https://storage.winecollector.app/profiles/{user_id}.jpg"

        ext = Path(filename).suffix.lower() or ".jpg"
        content_type = "image/jpeg" if ext in [".jpg", ".jpeg"] else "image/png"

        key = f"profiles/{user_id}{ext}"

        self.client.put_object(
            Bucket=settings.r2_bucket_name,
            Key=key,
            Body=content,
            ContentType=content_type,
        )

        return f"{settings.r2_public_url}/{key}"

    async def delete_file(self, url: str) -> bool:
        """Delete a file by URL."""
        if not self.client:
            return True

        try:
            # Extract key from URL
            key = url.replace(f"{settings.r2_public_url}/", "")

            self.client.delete_object(
                Bucket=settings.r2_bucket_name,
                Key=key,
            )
            return True

        except Exception:
            return False

    def generate_presigned_url(self, key: str, expires_in: int = 3600) -> str:
        """Generate a presigned URL for direct upload."""
        if not self.client:
            return f"https://storage.winecollector.app/{key}"

        return self.client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.r2_bucket_name,
                "Key": key,
            },
            ExpiresIn=expires_in,
        )
