# coaching.py
import asyncio
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from schemas.workout import PostSetRequest
from services.auth_service import get_current_user
from services.llm_service import stream_post_set_coaching

router = APIRouter(prefix="/coaching", tags=["coaching"])

@router.post("/post-set")
async def post_set_coaching(
    data: PostSetRequest,
    user_id: str = Depends(get_current_user),
):
    async def generate():
        stream = await stream_post_set_coaching(
            exercise=data.exercise,
            reps=data.reps,
            avg_form_score=data.avg_form_score,
            issues=data.issues,
        )
        async for chunk in stream:
            text = chunk.choices[0].delta.content or ""
            if text:
                yield f"data: {text}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")