"""Cloudflare R2 Storage Service - S3-compatible object storage."""
import os
import boto3
from botocore.config import Config
from typing import Optional, BinaryIO
from pathlib import Path

from app.config import get_settings

settings = get_settings()


class R2StorageService:
    """Service for uploading/downloading files to Cloudflare R2."""
    
    def __init__(self):
        self.enabled = bool(
            settings.R2_ACCOUNT_ID and 
            settings.R2_ACCESS_KEY_ID and 
            settings.R2_SECRET_ACCESS_KEY
        )
        
        if self.enabled:
            self.client = boto3.client(
                's3',
                endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
                aws_access_key_id=settings.R2_ACCESS_KEY_ID,
                aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
                config=Config(signature_version='s3v4'),
                region_name='auto'
            )
            self.bucket = settings.R2_BUCKET_NAME or "subtitle-ai-videos"
            print(f"✅ R2 Storage connected to bucket: {self.bucket}")
        else:
            self.client = None
            self.bucket = None
            print("⚠️ R2 Storage not configured - using local storage")
    
    async def upload_file(
        self,
        file_path: str,
        storage_key: str,
        content_type: str = "video/mp4"
    ) -> Optional[str]:
        """Upload a file to R2 and return the public URL."""
        if not self.enabled:
            return None
        
        try:
            with open(file_path, 'rb') as f:
                self.client.upload_fileobj(
                    f,
                    self.bucket,
                    storage_key,
                    ExtraArgs={
                        'ContentType': content_type
                    }
                )
            
            # Return the public URL (if public bucket) or the key
            public_url = f"https://{settings.R2_PUBLIC_DOMAIN}/{storage_key}" if settings.R2_PUBLIC_DOMAIN else storage_key
            print(f"✅ Uploaded to R2: {storage_key}")
            return public_url
            
        except Exception as e:
            print(f"❌ R2 upload error: {e}")
            return None
    
    async def upload_bytes(
        self,
        file_bytes: bytes,
        storage_key: str,
        content_type: str = "video/mp4"
    ) -> Optional[str]:
        """Upload bytes directly to R2."""
        if not self.enabled:
            return None
        
        try:
            from io import BytesIO
            self.client.upload_fileobj(
                BytesIO(file_bytes),
                self.bucket,
                storage_key,
                ExtraArgs={
                    'ContentType': content_type
                }
            )
            
            public_url = f"https://{settings.R2_PUBLIC_DOMAIN}/{storage_key}" if settings.R2_PUBLIC_DOMAIN else storage_key
            print(f"✅ Uploaded to R2: {storage_key}")
            return public_url
            
        except Exception as e:
            print(f"❌ R2 upload error: {e}")
            return None
    
    async def download_file(self, storage_key: str, dest_path: str) -> bool:
        """Download a file from R2."""
        if not self.enabled:
            return False
        
        try:
            self.client.download_file(self.bucket, storage_key, dest_path)
            print(f"✅ Downloaded from R2: {storage_key}")
            return True
        except Exception as e:
            print(f"❌ R2 download error: {e}")
            return False
    
    async def delete_file(self, storage_key: str) -> bool:
        """Delete a file from R2."""
        if not self.enabled:
            return False
        
        try:
            self.client.delete_object(Bucket=self.bucket, Key=storage_key)
            print(f"✅ Deleted from R2: {storage_key}")
            return True
        except Exception as e:
            print(f"❌ R2 delete error: {e}")
            return False
    
    def get_presigned_url(self, storage_key: str, expires_in: int = 3600) -> Optional[str]:
        """Get a presigned URL for temporary access."""
        if not self.enabled:
            return None
        
        try:
            url = self.client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket, 'Key': storage_key},
                ExpiresIn=expires_in
            )
            return url
        except Exception as e:
            print(f"❌ Presigned URL error: {e}")
            return None


# Singleton instance
r2_storage = R2StorageService()
