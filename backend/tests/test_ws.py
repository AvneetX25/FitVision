# test_ws.py — save in backend/
import asyncio, json, websockets

TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlYWI4YzQ3OC1kMDFmLTRlNTUtOTUzOC0yZWNkM2NkOTFjYTUiLCJleHAiOjE3ODAyMjkxNjl9.0ESyid-4O-fK2kgSbTHFQmtf4DxMd991x6uLYhHvdss"

async def test():
    uri = f"ws://localhost:8000/ws/pose?token={TOKEN}"
    frame = open("test_real.jpg", "rb").read()
    print(f"Sending {len(frame)} bytes, magic={frame[:4].hex()}")
    
    async with websockets.connect(uri) as ws:
        await ws.send(frame)          # true binary WebSocket frame
        resp = await ws.recv()
        result = json.loads(resp)
        print(f"detected: {result['detected']}")
        if result['detected']:
            print(f"landmarks: {len(result['landmarks'])}")
            print(f"form_score: {result['form_score']}")
        else:
            print(f"raw: {result}")

asyncio.run(test())