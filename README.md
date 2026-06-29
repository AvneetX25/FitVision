# 🏋️ FitVision: AI-Powered Real-Time Gym Coach

> A production-grade workout tracking app that counts reps, scores form, and coaches you in real time using computer vision and large language models.

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=flat&logo=postgresql&logoColor=white)](https://supabase.com)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-0.10-FF6F00?style=flat&logo=google&logoColor=white)](https://mediapipe.dev)
[![Groq](https://img.shields.io/badge/Groq-Llama3-F55036?style=flat)](https://groq.com)

---

🔗 **[Try it live →](https://fit-vision-ai.vercel.app/)**


---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Vercel CDN)                     │
│                                                                 │
│  React + Vite + TailwindCSS                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Camera  │  │ Skeleton │  │   Rep    │  │  Post-Set     │  │
│  │  Feed    │→ │ Overlay  │  │ Counter  │  │  AI Coaching  │  │
│  │          │  │(Canvas)  │  │+ Form    │  │  (streaming)  │  │
│  └──────────┘  └──────────┘  │  Score   │  └───────────────┘  │
│       │                      └──────────┘         ↑           │
│       │ JPEG frames                                │           │
│       │ @ 5fps (WebSocket)          SSE stream     │           │
└───────┼────────────────────────────────────────────┼───────────┘
        │                                            │
        ▼                                            │
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Render — Singapore)                  │
│                                                                 │
│  FastAPI + Python 3.11                                          │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  WebSocket /ws/pose                                       │ │
│  │  ┌─────────────┐   ┌──────────────┐   ┌───────────────┐  │ │
│  │  │  MediaPipe  │→  │ State Machine│→  │  Form Scorer  │  │ │
│  │  │  (Thread    │   │ IDLE→START   │   │  + Voice Cue  │  │ │
│  │  │  Executor)  │   │ →DOWN→IDLE   │   │  Builder      │  │ │
│  │  └─────────────┘   └──────────────┘   └───────────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  REST API                                                       │
│  /auth  /workout  /analytics  /leaderboard  /coaching          │
│                     │                            │             │
└─────────────────────┼────────────────────────────┼─────────────┘
                      │                            │
                      ▼                            ▼
          ┌───────────────────┐        ┌───────────────────┐
          │ Supabase Postgres │        │    Groq API        │
          │                   │        │  Llama 3 (70B)    │
          │ • users           │        │  Post-set coaching │
          │ • workout_sessions│        │  streamed via SSE  │
          │ • reps            │        └───────────────────┘
          │ • leaderboard view│
          └───────────────────┘
```

**Key architectural decisions:**
- **MediaPipe runs server-side** in a `ThreadPoolExecutor` — keeps async loop unblocked, zero browser WASM overhead
- **Voice delivery via Web Speech API** — zero latency, zero cost, no TTS API needed
- **Frame gate pattern** — frontend waits for server response before sending next frame, eliminating queue buildup
- **DB writes non-blocking** — rep rows written via `asyncio.create_task`, response sent immediately
- **Render Singapore region** — chosen specifically to minimize round-trip from India (~120ms vs ~500ms Oregon)

---

## ✅ Features

- [x] **Real-time rep counting** — squat, push-up, bicep curl via MediaPipe pose landmarks
- [x] **Form scoring** — per-rep 0–100 score based on depth, knee alignment, symmetry, speed
- [x] **Voice coaching** — spoken cues after each rep via browser Web Speech API ("Rep 4. Perfect form.")
- [x] **Post-set AI coaching** — Groq Llama 3 analyzes your set and streams personalized feedback
- [x] **Skeleton overlay** — 33-point pose skeleton drawn on canvas overlay in real time
- [x] **JWT authentication** — register/login with bcrypt password hashing
- [x] **Session tracking** — every workout session and rep written to Supabase PostgreSQL
- [x] **Analytics dashboard** — 4 charts: reps over time, form score trend, exercise breakdown, personal bests
- [x] **Leaderboard** — top 10 users with auto-refresh every 60 seconds, current user highlighted
- [x] **Exercise selector** — switch between squat / push-up / bicep curl before session

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TailwindCSS |
| Backend | FastAPI, Python 3.11, Uvicorn |
| Database | PostgreSQL via Supabase |
| Computer Vision | MediaPipe 0.10, OpenCV |
| Real-time | WebSockets (native FastAPI) |
| AI Coaching | Groq API — Llama 3 70B |
| Auth | JWT (python-jose), bcrypt (passlib) |
| ORM | SQLAlchemy async + asyncpg |
| Deployment | Render (backend), Vercel (frontend) |

---

## 📊 Performance Metrics

| Metric | Value |
|--------|-------|
| WebSocket round-trip (India → Singapore) | ~120ms |
| MediaPipe inference time | ~50ms |
| Total frame-to-screen latency | ~180ms |
| Rep counting accuracy | ~94% on 50-rep test set |
| Frame rate | 5fps (optimized — reps don't need more) |
| DB write blocking on rep | 0ms (background task) |

**Optimization journey:** Started at 685–835ms with constant skeleton freezing (Render Oregon + 10fps + no frame gate). Ended at ~180ms with zero queue buildup after: region change to Singapore, frame gate pattern, 10fps → 5fps, and async DB writes.

---


## 🌐 Deployment

| Service | Platform | Notes |
|---------|----------|-------|
| Backend | [Render](https://render.com) | Singapore region for lowest India latency |
| Frontend | [Vercel](https://vercel.com) | Auto-deploys on push to main |
| Database | [Supabase](https://supabase.com) | Free tier, no setup needed |

---

## 📁 Project Structure

```
ai_gym/
├── backend/
│   ├── models/          # SQLAlchemy ORM models
│   ├── routes/          # FastAPI routers (auth, ws, workout, analytics, coaching)
│   ├── services/
│   │   ├── pose_engine.py    # MediaPipe + state machines + form scoring
│   │   ├── auth_service.py   # JWT + bcrypt
│   │   └── llm_service.py    # Groq streaming
│   ├── schemas/         # Pydantic request/response schemas
│   ├── database.py      # Async SQLAlchemy engine
│   ├── main.py          # FastAPI app + CORS
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── pages/       # Workout, Dashboard, Analytics, Leaderboard, Auth
    │   ├── components/  # RepCounter, FormScoreMeter, VoiceCoach, CoachCard
    │   ├── context/     # AppContext (global state)
    │   ├── store/       # workoutStore (useReducer actions)
    │   ├── services/    # api.js (axios instance)
    │   └── utils/       # speech.js (Web Speech API singleton)
    ├── vite.config.js
    └── package.json
```

---

## 🧠 How It Works

1. **Camera frame** captured at 5fps as JPEG blob
2. **Frame gate** ensures only one frame is in-flight at a time — no queue buildup
3. **MediaPipe** detects 33 body landmarks in a thread executor (non-blocking)
4. **State machine** transitions `IDLE → START → DOWN → IDLE` to count reps
5. **Form scorer** applies 4 rules per rep (depth, knee alignment, symmetry, speed)
6. **Voice cue** string returned in WebSocket JSON — browser speaks it via `SpeechSynthesis`
7. **Rep row** written to Supabase asynchronously (doesn't block the response)
8. On **End Set** → Groq Llama 3 streams a personalized coaching paragraph token by token

