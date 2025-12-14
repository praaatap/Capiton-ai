---
description: Implementation plan for Chat-based Video Editor with FastAPI, Next.js, LangGraph, and Redis
---

# Chat-Based Video Editor - Implementation Plan

## Project Architecture

### Backend (FastAPI)
```
backend/
├── app/
│   ├── main.py                 # FastAPI application entry
│   ├── config.py               # Configuration settings
│   ├── api/
│   │   ├── routes/
│   │   │   ├── video.py        # Video upload/export endpoints
│   │   │   ├── chat.py         # Chat interaction endpoints
│   │   │   └── subtitle.py     # Subtitle management endpoints
│   ├── services/
│   │   ├── video_service.py    # Video processing logic
│   │   ├── subtitle_service.py # Subtitle generation (Whisper)
│   │   ├── llm_service.py      # LangGraph orchestration
│   │   └── cache_service.py    # Redis caching
│   ├── models/
│   │   ├── video.py            # Video data models
│   │   ├── subtitle.py         # Subtitle data models
│   │   └── chat.py             # Chat message models
│   └── utils/
│       ├── ffmpeg_utils.py     # FFmpeg operations
│       └── whisper_utils.py    # Whisper transcription
```

### Frontend (Next.js)
```
frontend/
├── app/
│   ├── page.tsx                # Home/Upload page
│   ├── editor/[id]/page.tsx    # Video editor with chat
│   └── layout.tsx              # Root layout
├── components/
│   ├── VideoUploader.tsx       # Upload component
│   ├── VideoPlayer.tsx         # Video preview with subtitles
│   ├── ChatInterface.tsx       # Chat-based editing
│   ├── SubtitlePreview.tsx     # Subtitle overlay preview
│   └── ExportButton.tsx        # Export functionality
├── lib/
│   ├── api.ts                  # API client
│   └── types.ts                # TypeScript types
└── styles/
    └── globals.css             # Global styles
```

## Key Features

1. **Video Upload**: Support for common video formats
2. **Speech-to-Text**: Using OpenAI Whisper for transcription
3. **Subtitle Generation**: Auto-generate subtitles from audio
4. **Chat-Based Editing**: Use LangGraph to process natural language commands
5. **Style Customization**: Font family, size, color, position
6. **Silence Detection**: Auto-trim silent portions
7. **Video Export**: Burn subtitles using FFmpeg

## Technology Stack

- **Backend**: FastAPI, Python 3.11+
- **LLM Orchestration**: LangGraph
- **Caching**: Redis
- **Video Processing**: FFmpeg, MoviePy
- **Speech-to-Text**: OpenAI Whisper
- **Frontend**: Next.js 14, React 18
- **Styling**: CSS with modern design

## API Endpoints

### Video
- `POST /api/video/upload` - Upload video file
- `GET /api/video/{id}` - Get video metadata
- `GET /api/video/{id}/stream` - Stream video
- `POST /api/video/{id}/export` - Export with burned subtitles

### Subtitles
- `POST /api/subtitle/generate/{video_id}` - Generate subtitles
- `GET /api/subtitle/{video_id}` - Get current subtitles
- `PUT /api/subtitle/{video_id}` - Update subtitle styles

### Chat
- `POST /api/chat/{video_id}` - Send chat message for editing
- `GET /api/chat/{video_id}/history` - Get chat history

### Silence Trimming
- `POST /api/video/{id}/trim-silence` - Auto-trim silences

## Setup Instructions

1. Install Python dependencies: `pip install -r requirements.txt`
2. Install Node dependencies: `npm install` (in frontend/)
3. Start Redis: `docker-compose up redis`
4. Start backend: `uvicorn app.main:app --reload`
5. Start frontend: `npm run dev`

## Environment Variables

```env
# Backend
OPENAI_API_KEY=your_openai_api_key
REDIS_URL=redis://localhost:6379
UPLOAD_DIR=./uploads
EXPORT_DIR=./exports

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```
