# backend/services/llm_service.py

from groq import AsyncGroq
from config import settings

client = AsyncGroq(api_key=settings.GROQ_API_KEY)

SYSTEM_PROMPT = (
    "You are an energetic, motivating gym coach AI. "
    "Respond with a single short sentence only — no punctuation beyond a period, "
    "no quotes, no emojis, no extra lines. Keep it under 15 words."
)

MODEL_FAST = "llama-3.1-8b-instant"       # replaces llama3-8b-8192
MODEL_SMART = "llama-3.3-70b-versatile"   # replaces llama3-70b-8192


async def generate_session_start() -> str:
    try:
        response = await client.chat.completions.create(
            model=MODEL_FAST,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": (
                    "Generate an energetic one-liner to kick off a workout session. "
                    "Be hype, direct, and motivating."
                )},
            ],
            max_tokens=40,
            temperature=0.9,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"LLM start error: {e}")
        return "Come on, let's get to work!"


"""async def generate_session_end(reps: int, form_score: float) -> str:
    score_pct = round(form_score * 100)
    try:
        response = await client.chat.completions.create(
            model=MODEL_FAST,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": (
                    f"The user just finished a workout: {reps} reps with {score_pct}% form score. "
                    f"Give them one closing motivational line that references their performance."
                )},
            ],
            max_tokens=50,
            temperature=0.7,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"LLM end error: {e}")
        return f"Great work. {reps} reps done. See you next session!"""


async def stream_post_set_coaching(exercise: str, reps: int, avg_form_score: float, issues: list):
    issues_text = ", ".join(issues) if issues else "none"
    prompt = (
        f"You are a gym coach. The user completed {reps} {exercise} reps "
        f"with avg form score {avg_form_score:.0%}. Issues detected: {issues_text}. "
        f"Give specific, actionable coaching in 1-2 sentences. Be direct , encouraging and concise."
        f"Conclude with giving them one closing motivational line that references their performance."
    )

    stream = await client.chat.completions.create(
        model=MODEL_SMART,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=150,
        stream=True,
    )
    return stream