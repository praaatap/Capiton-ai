# SubtitleAI - Chat-Based Video Editor

A full-stack video editing application with AI-powered subtitle generation. Upload videos, generate accurate English subtitles automatically, and export videos with burned-in captions.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Backend Documentation](#backend-documentation)
5. [Frontend Documentation](#frontend-documentation)
6. [API Reference](#api-reference)
7. [Database Schema](#database-schema)
8. [Authentication Flow](#authentication-flow)
9. [Subtitle Generation Workflow](#subtitle-generation-workflow)
10. [Video Export Pipeline](#video-export-pipeline)
11. [Environment Variables](#environment-variables)
12. [Installation Guide](#installation-guide)
13. [Deployment Guide](#deployment-guide)

---

## Architecture Overview

```
+------------------+     HTTP/REST      +------------------+
|                  | <----------------> |                  |
|   Next.js        |                    |   FastAPI        |
|   Frontend       |                    |   Backend        |
|   (Port 3000)    |                    |   (Port 8000)    |
|                  |                    |                  |
+------------------+                    +------------------+
        |                                       |
        |                                       |
   NextAuth.js                          +-------+-------+
   (Session)                            |       |       |
                                        v       v       v
                                   +------+ +------+ +------+
                                   |Postgres| |Redis | |Groq  |
                                   |  DB   | |Cache | | API  |
                                   +------+ +------+ +------+
                                        |
                                        v
                                   +----------+
                                   |Cloudflare|
                                   |    R2    |
                                   | Storage  |
                                   +----------+
```

### Data Flow

1. User authenticates via Frontend (NextAuth.js)
2. Frontend sends JWT token with each API request
3. Backend validates token and processes request
4. Video files are stored locally or in Cloudflare R2
5. Subtitles are generated using Groq Whisper API
6. Results are cached in Redis for performance
7. User data is persisted in PostgreSQL

---

## Technology Stack

### Backend
- Python 3.11+
- FastAPI (Web Framework)
- SQLAlchemy (ORM)
- PostgreSQL (Primary Database)
- Redis (Caching Layer)
- Groq API (Whisper for transcription, LLaMA for chat)
- MoviePy (Video Processing)
- Pillow (Image/Text Rendering)
- FFmpeg (Audio/Video Conversion)
- boto3 (Cloudflare R2 Storage)

### Frontend
- Next.js 16 (React Framework)
- TypeScript
- NextAuth.js (Authentication)
- Tailwind CSS (Styling)
- Lucide React (Icons)

---

## Project Structure

```
agent-project/
|
+-- backend/
|   +-- app/
|   |   +-- api/
|   |   |   +-- routes/
|   |   |       +-- auth.py         # Authentication endpoints
|   |   |       +-- video.py        # Video upload/stream/export
|   |   |       +-- subtitle.py     # Subtitle generation
|   |   |       +-- chat.py         # AI chat interface
|   |   |
|   |   +-- models/
|   |   |   +-- db_models.py        # SQLAlchemy models
|   |   |   +-- video.py            # Pydantic schemas
|   |   |   +-- chat.py             # Chat schemas
|   |   |
|   |   +-- services/
|   |   |   +-- auth_service.py     # JWT + password hashing
|   |   |   +-- subtitle_service.py # Whisper transcription
|   |   |   +-- video_service.py    # FFmpeg processing
|   |   |   +-- llm_service.py      # LLM chat integration
|   |   |   +-- cache_service.py    # Redis caching
|   |   |   +-- r2_storage.py       # Cloudflare R2
|   |   |
|   |   +-- config.py               # Environment configuration
|   |   +-- database.py             # SQLAlchemy setup
|   |   +-- main.py                 # FastAPI application
|   |
|   +-- uploads/                    # Uploaded video files
|   +-- exports/                    # Exported video files
|   +-- temp/                       # Temporary processing files
|   +-- .env                        # Environment variables
|   +-- requirements.txt            # Python dependencies
|
+-- frontend/
|   +-- src/
|   |   +-- app/
|   |   |   +-- api/
|   |   |   |   +-- auth/
|   |   |   |       +-- [...nextauth]/
|   |   |   |           +-- route.ts    # NextAuth configuration
|   |   |   |
|   |   |   +-- page.tsx                # Landing page
|   |   |   +-- login/
|   |   |   |   +-- page.tsx            # Login/Register page
|   |   |   +-- dashboard/
|   |   |   |   +-- page.tsx            # Video dashboard
|   |   |   +-- editor/
|   |   |       +-- [id]/
|   |   |           +-- page.tsx        # Video editor
|   |   |
|   |   +-- components/
|   |   |   +-- shared.tsx              # Shared UI components
|   |   |   +-- AuthProvider.tsx        # Session provider
|   |   |
|   |   +-- lib/
|   |   |   +-- api.ts                  # API client
|   |   |
|   |   +-- types/
|   |       +-- next-auth.d.ts          # Type definitions
|   |
|   +-- .env.local                      # Environment variables
|   +-- package.json                    # Node dependencies
|   +-- tailwind.config.ts              # Tailwind configuration
```

---

## Backend Documentation

### Application Entry Point

File: `backend/app/main.py`

The FastAPI application initializes with:
1. Database table creation on startup
2. Redis connection establishment
3. CORS middleware for frontend communication
4. Static file serving for uploads/exports
5. Router registration for all API endpoints

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()                    # Create database tables
    await cache_service.connect() # Connect to Redis
    yield
    await cache_service.disconnect()
```

### Configuration Management

File: `backend/app/config.py`

All configuration is loaded from environment variables using Pydantic Settings:

```python
class Settings(BaseSettings):
    GROQ_API_KEY: str           # Required for AI features
    DATABASE_URL: str           # PostgreSQL connection string
    JWT_SECRET_KEY: str         # Token signing key
    R2_ACCOUNT_ID: str          # Cloudflare storage
    REDIS_URL: str              # Cache connection
```

### Database Layer

File: `backend/app/database.py`

SQLAlchemy configuration with support for:
- SQLite (local development)
- PostgreSQL (production)
- Automatic `postgres://` to `postgresql://` URL conversion

```python
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
```

### Services

#### Authentication Service
File: `backend/app/services/auth_service.py`

- Password hashing using SHA256 with salt
- JWT token generation and validation
- User creation and authentication

```python
def get_password_hash(password: str) -> str:
    salt = secrets.token_hex(16)
    hashed = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}${hashed}"
```

#### Subtitle Service
File: `backend/app/services/subtitle_service.py`

Workflow:
1. Extract audio from video using FFmpeg
2. Send audio to Groq Whisper API (English only)
3. Parse response segments with timestamps
4. Create SubtitleSegment objects
5. Clean up temporary audio file

```python
response = client.audio.transcriptions.create(
    model="whisper-large-v3",
    file=audio_file,
    response_format="verbose_json",
    language="en"
)
```

#### Video Service
File: `backend/app/services/video_service.py`

Capabilities:
- Extract video metadata using FFprobe
- Generate video thumbnails
- Burn subtitles into video using MoviePy
- Handle portrait and landscape video orientations
- Render text with proper wrapping and styling

#### LLM Service
File: `backend/app/services/llm_service.py`

Processes natural language commands for video editing:
- Subtitle styling changes
- Translation requests
- Timing adjustments

---

## Frontend Documentation

### Authentication

File: `frontend/src/app/api/auth/[...nextauth]/route.ts`

NextAuth.js configured with credentials provider:

```typescript
CredentialsProvider({
    async authorize(credentials) {
        const res = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
            }),
        });
        return data.user;
    }
})
```

### Pages

#### Landing Page (`/`)
- Marketing content
- Call-to-action buttons
- Navigation to login/dashboard

#### Login Page (`/login`)
- Email/password form
- Toggle between login and registration
- Form validation
- Error display
- Redirect to dashboard on success

#### Dashboard Page (`/dashboard`)
- Protected route (requires authentication)
- Display user's video projects
- Upload new videos
- Delete existing videos
- Navigate to video editor

#### Editor Page (`/editor/[id]`)
- Video player with subtitle overlay
- Chat interface for AI commands
- Subtitle list with editing
- Generate/translate subtitle buttons
- Export video with burned subtitles

### API Client

File: `frontend/src/lib/api.ts`

Centralized API communication:

```typescript
export const api = {
    uploadVideo: (file: File) => {...},
    getVideo: (id: string) => {...},
    listVideos: () => {...},
    deleteVideo: (id: string) => {...},
    generateSubtitles: (videoId: string) => {...},
    translateSubtitles: (videoId: string, language: string) => {...},
    exportVideo: (videoId: string) => {...},
    sendChatMessage: (videoId: string, message: string) => {...},
}
```

---

## API Reference

### Authentication Endpoints

#### POST /api/auth/register
Create a new user account.

Request:
```json
{
    "email": "user@example.com",
    "password": "securepassword",
    "name": "John Doe"
}
```

Response:
```json
{
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
        "id": "uuid",
        "email": "user@example.com",
        "name": "John Doe",
        "provider": "credentials"
    }
}
```

#### POST /api/auth/login
Authenticate existing user.

Request:
```json
{
    "email": "user@example.com",
    "password": "securepassword"
}
```

Response: Same as register

#### GET /api/auth/me
Get current authenticated user (requires Bearer token).

### Video Endpoints

#### POST /api/video/upload
Upload a video file.

Request: `multipart/form-data` with `file` field

Response:
```json
{
    "id": "video-uuid",
    "filename": "uploaded_video.mp4",
    "duration": 120.5,
    "width": 1920,
    "height": 1080,
    "status": "uploaded"
}
```

#### GET /api/video/{id}
Get video details with subtitles.

#### GET /api/video/list
List all videos (optionally filtered by user).

#### GET /api/video/{id}/stream
Stream video content for playback.

#### DELETE /api/video/{id}
Delete video and associated files.

### Subtitle Endpoints

#### POST /api/subtitle/generate/{video_id}
Generate English subtitles for video.

Response:
```json
{
    "subtitles": [
        {
            "start_time": 0.0,
            "end_time": 2.5,
            "text": "Hello and welcome"
        }
    ]
}
```

#### POST /api/subtitle/translate/{video_id}
Translate subtitles to specified language.

Request:
```json
{
    "target_language": "Spanish"
}
```

### Export Endpoints

#### POST /api/video/{id}/export
Export video with burned-in subtitles.

Response:
```json
{
    "export_path": "/exports/video_exported.mp4",
    "download_url": "http://localhost:8000/exports/video_exported.mp4"
}
```

### Chat Endpoints

#### POST /api/chat/{video_id}
Send chat message for video editing commands.

Request:
```json
{
    "message": "Make the subtitles yellow"
}
```

---

## Database Schema

### Users Table

| Column        | Type         | Constraints              |
|---------------|--------------|--------------------------|
| id            | VARCHAR(36)  | PRIMARY KEY              |
| email         | VARCHAR(255) | UNIQUE, NOT NULL, INDEX  |
| name          | VARCHAR(255) | NULLABLE                 |
| image         | VARCHAR(500) | NULLABLE                 |
| provider      | VARCHAR(50)  | DEFAULT 'credentials'    |
| provider_id   | VARCHAR(255) | NULLABLE                 |
| password_hash | VARCHAR(255) | NULLABLE                 |
| created_at    | TIMESTAMP    | DEFAULT NOW()            |
| updated_at    | TIMESTAMP    | ON UPDATE NOW()          |

### Videos Table

| Column            | Type         | Constraints              |
|-------------------|--------------|--------------------------|
| id                | VARCHAR(36)  | PRIMARY KEY              |
| user_id           | VARCHAR(36)  | FOREIGN KEY, INDEX       |
| filename          | VARCHAR(255) | NOT NULL                 |
| original_filename | VARCHAR(255) | NOT NULL                 |
| storage_key       | VARCHAR(500) | NULLABLE (R2 path)       |
| file_size         | INTEGER      | DEFAULT 0                |
| duration          | FLOAT        | DEFAULT 0                |
| width             | INTEGER      | DEFAULT 0                |
| height            | INTEGER      | DEFAULT 0                |
| fps               | FLOAT        | DEFAULT 0                |
| codec             | VARCHAR(50)  | NULLABLE                 |
| status            | VARCHAR(50)  | DEFAULT 'uploaded'       |
| exported_path     | VARCHAR(500) | NULLABLE                 |
| subtitles         | JSON         | NULLABLE                 |
| created_at        | TIMESTAMP    | DEFAULT NOW()            |
| updated_at        | TIMESTAMP    | ON UPDATE NOW()          |

### Chat Messages Table

| Column     | Type         | Constraints              |
|------------|--------------|--------------------------|
| id         | VARCHAR(36)  | PRIMARY KEY              |
| video_id   | VARCHAR(36)  | FOREIGN KEY, INDEX       |
| role       | VARCHAR(20)  | NOT NULL (user/assistant)|
| content    | TEXT         | NOT NULL                 |
| created_at | TIMESTAMP    | DEFAULT NOW()            |

---

## Authentication Flow

### Registration Flow

```
1. User submits registration form
   |
   v
2. Frontend POST /api/auth/register
   |
   v
3. Backend validates email uniqueness
   |
   v
4. Backend hashes password with salt
   |
   v
5. Backend creates User record in database
   |
   v
6. Backend generates JWT token
   |
   v
7. Frontend receives token + user data
   |
   v
8. Frontend calls NextAuth signIn()
   |
   v
9. Session established, redirect to dashboard
```

### Login Flow

```
1. User submits login form
   |
   v
2. NextAuth credentials provider triggered
   |
   v
3. NextAuth calls backend POST /api/auth/login
   |
   v
4. Backend verifies password against hash
   |
   v
5. Backend returns JWT token + user data
   |
   v
6. NextAuth stores token in session
   |
   v
7. User redirected to dashboard
```

### Protected Route Access

```
1. User navigates to protected page
   |
   v
2. Page component calls useSession()
   |
   v
3. If status === 'unauthenticated'
   |   |
   |   v
   |   Redirect to /login
   |
4. If status === 'authenticated'
   |
   v
5. Render page content
   |
   v
6. API calls include accessToken from session
```

---

## Subtitle Generation Workflow

```
1. User clicks "Generate Subtitles" button
   |
   v
2. Frontend POST /api/subtitle/generate/{video_id}
   |
   v
3. Backend locates video file
   |
   v
4. FFmpeg extracts audio track
   |
   Command: ffmpeg -i video.mp4 -vn -acodec libmp3lame audio.mp3
   |
   v
5. Audio sent to Groq Whisper API
   |
   Model: whisper-large-v3
   Language: en (English only)
   Format: verbose_json (includes timestamps)
   |
   v
6. API returns transcription with segments
   |
   Each segment: {start, end, text}
   |
   v
7. Backend creates SubtitleSegment objects
   |
   v
8. Subtitles saved to video record in database
   |
   v
9. Temporary audio file deleted
   |
   v
10. Response sent to frontend
    |
    v
11. Frontend updates subtitle list display
```

---

## Video Export Pipeline

```
1. User clicks "Export" button
   |
   v
2. Frontend POST /api/video/{id}/export
   |
   v
3. Backend loads video with MoviePy
   |
   v
4. For each subtitle segment:
   |
   a. Create text frame with Pillow
   |  - Calculate font size based on video dimensions
   |  - Wrap text to fit within frame width
   |  - Draw semi-transparent background
   |  - Render text with outline for readability
   |
   b. Create TextClip with subtitle
   |
   c. Composite onto video at correct timestamp
   |
   v
5. Write final video with audio
   |
   Codec: libx264
   Audio: aac
   |
   v
6. Save to exports directory
   |
   v
7. Return download URL to frontend
   |
   v
8. Frontend triggers file download
```

---

## Environment Variables

### Backend (.env)

```bash
# API Keys
GROQ_API_KEY=gsk_xxxxxxxxxxxx     # Required for AI features

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Authentication
JWT_SECRET_KEY=random-32-char-string

# Cloudflare R2 Storage (optional)
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=subtitle-ai-videos
R2_PUBLIC_DOMAIN=cdn.yourdomain.com

# Redis Cache
REDIS_URL=redis://localhost:6379
```

### Frontend (.env.local)

```bash
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=random-32-char-string

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Installation Guide

### Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher
- PostgreSQL database
- Redis server
- FFmpeg installed and in PATH

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with required variables
cp env.example.txt .env

# Edit .env with your values
# Required: GROQ_API_KEY, DATABASE_URL, JWT_SECRET_KEY

# Run database migrations (automatic on first start)
# Start development server
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp env.example.txt .env.local

# Edit .env.local with your values
# Required: NEXTAUTH_URL, NEXTAUTH_SECRET

# Start development server
npm run dev
```

### Verify Installation

1. Backend health check: http://localhost:8000/health
2. Frontend: http://localhost:3000
3. API documentation: http://localhost:8000/docs

---

## Deployment Guide

### Production Considerations

1. Use PostgreSQL for database (not SQLite)
2. Use Redis for caching (not in-memory)
3. Configure Cloudflare R2 for video storage
4. Set secure JWT_SECRET_KEY and NEXTAUTH_SECRET
5. Enable HTTPS for all endpoints
6. Configure CORS for production domain

### Recommended Hosting

| Component | Recommended Service     |
|-----------|-------------------------|
| Frontend  | Vercel, Netlify         |
| Backend   | Railway, Render, VPS    |
| Database  | Neon, Supabase, RDS     |
| Redis     | Upstash, Redis Cloud    |
| Storage   | Cloudflare R2, S3       |

### Environment Variables for Production

Update all URLs and secrets:
- Change localhost URLs to production domains
- Generate new random secrets for JWT and NextAuth
- Use environment-specific database credentials
- Configure R2 storage with production bucket

---

## License

This project is provided as-is for educational purposes.

---

## Support

For issues and feature requests, please create an issue in the repository.
