"""Authentication service with JWT and password hashing."""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import hashlib
import secrets
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.db_models import User

settings = get_settings()

# JWT settings
SECRET_KEY = settings.JWT_SECRET_KEY or "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24 * 7  # 7 days


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    # Format: salt$hash
    if '$' not in hashed_password:
        return False
    salt, stored_hash = hashed_password.split('$', 1)
    new_hash = hashlib.sha256((salt + plain_password).encode()).hexdigest()
    return new_hash == stored_hash


def get_password_hash(password: str) -> str:
    """Hash a password with salt."""
    salt = secrets.token_hex(16)
    hashed = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}${hashed}"


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


class AuthService:
    """Authentication service for user management."""
    
    def get_user_by_email(self, db: Session, email: str) -> Optional[User]:
        """Get a user by email."""
        return db.query(User).filter(User.email == email).first()
    
    def get_user_by_id(self, db: Session, user_id: str) -> Optional[User]:
        """Get a user by ID."""
        return db.query(User).filter(User.id == user_id).first()
    
    def create_user(
        self, 
        db: Session, 
        email: str, 
        password: Optional[str] = None,
        name: Optional[str] = None,
        image: Optional[str] = None,
        provider: str = "credentials",
        provider_id: Optional[str] = None
    ) -> User:
        """Create a new user."""
        user = User(
            email=email,
            name=name or email.split("@")[0],
            image=image,
            provider=provider,
            provider_id=provider_id,
            password_hash=get_password_hash(password) if password else None
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    
    def authenticate_user(self, db: Session, email: str, password: str) -> Optional[User]:
        """Authenticate a user with email and password."""
        user = self.get_user_by_email(db, email)
        if not user or not user.password_hash:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user
    
    def get_or_create_oauth_user(
        self,
        db: Session,
        email: str,
        name: str,
        image: Optional[str],
        provider: str,
        provider_id: str
    ) -> User:
        """Get or create a user from OAuth provider."""
        user = self.get_user_by_email(db, email)
        
        if user:
            # Update user info if needed
            if user.provider != provider:
                user.provider = provider
                user.provider_id = provider_id
            if name and user.name != name:
                user.name = name
            if image and user.image != image:
                user.image = image
            db.commit()
            db.refresh(user)
            return user
        
        # Create new user
        return self.create_user(
            db=db,
            email=email,
            name=name,
            image=image,
            provider=provider,
            provider_id=provider_id
        )
    
    def create_user_token(self, user: User) -> str:
        """Create a JWT token for a user."""
        return create_access_token(
            data={
                "sub": user.id,
                "email": user.email,
                "name": user.name
            }
        )


# Singleton
auth_service = AuthService()
