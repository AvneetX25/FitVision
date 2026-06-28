import asyncio
import json
from concurrent.futures import ThreadPoolExecutor
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from database import get_db
from models.rep import Rep
from models.sessions import Session
from services.pose_engine import PoseEngine

router = APIRouter()
executor = ThreadPoolExecutor(max_workers=4)


async def save_rep(
    db:         AsyncSession,
    session_id: str,
    rep_number: int,
    form_score: float,
    violations: list[str],
):
    """Insert one rep row. Called only when rep_just_completed is True."""
    rep = Rep(
        session_id  = session_id,
        rep_number  = rep_number,
        form_score  = form_score,
        issues      = violations or [],
        recorded_at = datetime.utcnow(),
    )
    db.add(rep)
    await db.commit()

                
@router.websocket("/ws/pose")
async def pose_websocket(
    websocket:  WebSocket,
    exercise:   str = Query(default="squat"),
    session_id: str = Query(default=None),
    db:         AsyncSession = Depends(get_db),
):
    await websocket.accept()
    engine = PoseEngine(exercise=exercise)

    try:
        while True:
            try:
                # ── Timeout: if no frame arrives in 30s, close cleanly ──────
                frame_bytes = await asyncio.wait_for(
                    websocket.receive_bytes(),
                    timeout=30.0
                )
            except asyncio.TimeoutError:
                print(f"WebSocket timeout — no frames for 30s (session: {session_id})")
                break

            loop   = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                executor, engine.process_frame, frame_bytes
            )
            # Send response FIRST — don't wait for DB
            await websocket.send_json(result)
            
            
           # Fire DB write in background — non-blocking
            if result.get("rep_just_completed") and session_id:
                    asyncio.create_task( save_rep(
                        db         = db,
                        session_id = session_id,
                        rep_number = result["rep_count"],
                        form_score = result["form_score"] if result["form_score"] is not None else 1.0,
                        violations = result.get("violations", []),
                    ))
                

    except WebSocketDisconnect:
        print(f"Client disconnected (exercise: {exercise}, session: {session_id})")
    finally:
        engine.pose.close()
        
# Current flow on rep completion:
# inference → DB write (50-100ms) → send response

# Fixed flow:
# inference → send response immediately → DB write in background

