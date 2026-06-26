# test_pose_direct.py  — put this in your project root
from services.pose_engine import run

with open("backend/test.jpg", "rb") as f:
    raw = f.read()

print(f"File size: {len(raw)} bytes")
print(f"First 4 bytes (should be FF D8 FF E0 or FF D8 FF E1): {raw[:4].hex()}")

result = run(raw)
print(f"Result: {result}")