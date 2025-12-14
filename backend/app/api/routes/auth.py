"""Authentication API routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.database import get_db
from app.services.auth_service import auth_service, decode_token
from app.models.db_models import User

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)


# Request/Response Models
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    email: str
    name: str
    image: Optional[str] = None
    google_id: str


class AuthResponse(BaseModel):
    token: str
    user: dict


class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]
    image: Optional[str]
    provider: str


# Dependency to get current user
async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get current authenticated user from JWT token."""
    if not credentials:
        return None
    
    token = credentials.credentials
    payload = decode_token(token)
    
    if not payload:
        return None
    
    user_id = payload.get("sub")
    if not user_id:
        return None
    
    user = auth_service.get_user_by_id(db, user_id)
    return user


async def require_auth(
    user: Optional[User] = Depends(get_current_user)
) -> User:
    """Require authenticated user."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    return user


# Routes
@router.post("/register", response_model=AuthResponse)
async def register(
    request: RegisterRequest,
    db: Session = Depends(get_db)
):
    """Register a new user with email and password."""
    # Check if user exists
    existing = auth_service.get_user_by_email(db, request.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user = auth_service.create_user(
        db=db,
        email=request.email,
        password=request.password,
        name=request.name
    )
    
    # Create token
    token = auth_service.create_user_token(user)
    
    return AuthResponse(
        token=token,
        user={
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "image": user.image,
            "provider": user.provider
        }
    )


@router.post("/login", response_model=AuthResponse)
async def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    """Login with email and password."""
    user = auth_service.authenticate_user(db, request.email, request.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    token = auth_service.create_user_token(user)
    
    return AuthResponse(
        token=token,
        user={
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "image": user.image,
            "provider": user.provider
        }
    )


@router.post("/google", response_model=AuthResponse)
async def google_auth(
    request: GoogleAuthRequest,
    db: Session = Depends(get_db)
):
    """Authenticate with Google OAuth."""
    user = auth_service.get_or_create_oauth_user(
        db=db,
        email=request.email,
        name=request.name,
        image=request.image,
        provider="google",
        provider_id=request.google_id
    )
    
    token = auth_service.create_user_token(user)
    
    return AuthResponse(
        token=token,
        user={
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "image": user.image,
            "provider": user.provider
        }
    )


@router.get("/me", response_model=UserResponse)
async def get_me(
    user: User = Depends(require_auth)
):
    """Get current user info."""
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        image=user.image,
        provider=user.provider
    )


@router.post("/logout")
async def logout():
    """Logout (client should delete token)."""
    return {"message": "Logged out successfully"}
