from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.auth import router as auth_router
from routes.ws import router as ws_router          # ← add this
from routes.workout import router as workout_router  # ← add this
from database import engine, Base
from routes.analytics import router as analytics_router
from routes.leaderboard import router as leaderboard_router
from routes.coaching import router as coaching_router
import os

app = FastAPI(title="Gym Coach API")


origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(ws_router)  
# ← add this (no prefix, /ws/pose is defined in the route itself)
app.include_router(workout_router)
app.include_router(analytics_router)
app.include_router(leaderboard_router)
app.include_router(coaching_router)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
async def root():
    return {"status": "Gym Coach API is running"}