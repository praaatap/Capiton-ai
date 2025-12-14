# Chat-Based Video Editor

A full-stack video editing application with AI-powered subtitle generation and chat-based editing. Built with **FastAPI**, **Next.js**, **LangGraph**, and **Redis**.

![Demo](docs/demo.gif)

## 🚀 Features

- **Video Upload**: Support for MP4, MOV, AVI, MKV, WebM formats
- **AI Subtitle Generation**: Automatic transcription using OpenAI Whisper
- **Chat-Based Editing**: Edit subtitles using natural language prompts
- **Style Customization**: Font size, color, position, bold/italic via chat
- **Silence Detection & Trimming**: Auto-remove silent portions
- **Video Export**: Burn subtitles directly into video using FFmpeg
- **Real-time Preview**: See subtitle changes instantly
- **LangGraph Orchestration**: AI workflow management
- **Redis Caching**: Fast data storage (with in-memory fallback)

## 📋 Requirements

- Python 3.11+
- Node.js 18+
- FFmpeg (automatically downloaded via `imageio-ffmpeg`)
- **Groq API Key** (FREE! Get at https://console.groq.com) - Recommended
- OpenAI API Key (optional alternative)
- Redis (optional - uses in-memory cache if unavailable)

## 🆓 Free API Setup (Groq)

1. Go to https://console.groq.com
2. Sign up for free
3. Create an API key
4. Add to `backend/.env`:
   ```
   GROQ_API_KEY=gsk_your_key_here
   ```

This gives you **FREE access** to:
- Llama 3.1 70B for chat-based editing
- Whisper Large v3 for transcription


## 🛠️ Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd agent-project
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Additional dependencies
pip install imageio-ffmpeg python-multipart

# Create .env file
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY if you have one

# Start the backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the frontend
npm run dev
```

### 4. Open the App

Visit [http://localhost:3000](http://localhost:3000)

## 📂 Project Structure

```
agent-project/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── config.py            # Configuration settings
│   │   ├── api/routes/
│   │   │   ├── video.py         # Video upload/export endpoints
│   │   │   ├── subtitle.py      # Subtitle generation endpoints
│   │   │   └── chat.py          # Chat editing endpoints
│   │   ├── services/
│   │   │   ├── video_service.py     # Video processing (FFmpeg)
│   │   │   ├── subtitle_service.py  # Whisper transcription
│   │   │   ├── llm_service.py       # LangGraph orchestration
│   │   │   └── cache_service.py     # Redis/in-memory cache
│   │   └── models/
│   │       ├── video.py         # Video data models
│   │       ├── subtitle.py      # Subtitle models
│   │       └── chat.py          # Chat message models
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # Landing page & dashboard
│   │   │   └── editor/[id]/page.tsx  # Video editor
│   │   └── lib/
│   │       └── api.ts           # Backend API client
│   ├── package.json
│   └── next.config.ts
└── README.md
```

## 🎯 API Endpoints

### Video Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/video/upload` | Upload video file |
| GET | `/api/video/{id}` | Get video metadata |
| GET | `/api/video/{id}/stream` | Stream video |
| POST | `/api/video/{id}/export` | Export with subtitles |
| POST | `/api/video/{id}/trim-silence` | Remove silent parts |

### Subtitle Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/subtitle/generate/{video_id}` | Generate subtitles |
| GET | `/api/subtitle/{video_id}` | Get current subtitles |
| PUT | `/api/subtitle/{video_id}/style` | Update styles |

### Chat Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat/{video_id}` | Send edit command |
| GET | `/api/chat/{video_id}/history` | Get chat history |

## 💬 Chat Commands Examples

The AI understands natural language commands like:

```
"Make the first subtitle 15px"
"Change second subtitle to 20px font size"
"Make all subtitles red"
"Bold the first subtitle"
"Move subtitles to top"
"Make first clip yellow and second clip green"
```

## 🎬 Demo Workflow

1. **Upload Video**: Click "New Project" and select a video file
2. **Generate Subtitles**: Click "Generate Subtitles with AI" button
3. **Chat to Edit**: Use the chat interface to modify subtitle styles
   - Example: "first subtitle 15 font size, second subtitle 20 font size"
4. **Trim Silence**: Click "Trim Silence" to remove pauses
5. **Export**: Click "Export Video" to burn subtitles into video

## 🔧 Configuration

### Environment Variables (Backend)

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for Whisper & GPT | None (demo mode) |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `WHISPER_MODEL` | Whisper model size | `base` |
| `DEBUG` | Enable debug mode | `true` |

### Demo Mode

If no `OPENAI_API_KEY` is set:
- Subtitle generation creates sample subtitles
- Chat uses pattern matching instead of GPT

## 🐳 Docker (Optional)

```bash
# Start Redis
docker-compose up -d redis
```

## 📝 Tech Stack

- **Backend**: FastAPI, Python 3.11+
- **LLM**: LangGraph, LangChain, OpenAI GPT-4o-mini
- **Transcription**: OpenAI Whisper
- **Video Processing**: FFmpeg, MoviePy
- **Caching**: Redis (with in-memory fallback)
- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4

## 🙏 Acknowledgments

Built for the internship assignment demonstrating:
- Full-stack development with FastAPI + Next.js
- AI integration with LangGraph orchestration
- Video processing with FFmpeg
- Redis caching for performance

---

**Note**: This project works in demo mode without API keys. For full functionality, add your OpenAI API key to the `.env` file.
