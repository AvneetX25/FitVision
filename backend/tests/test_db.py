# backend/tests/test_db.py — add this debug version
import requests

BASE  = "http://localhost:8000"

headers = {
    "Content-Type": "application/json",
}

# Step 0 — Get a fresh token first
r = requests.post(
    f"{BASE}/auth/login",
    json={"email": "user@example.com", "password": "string"},
    headers=headers,
)
print("Login status:", r.status_code)
print("Login response:", r.text)   # .text never crashes, shows raw response

if r.status_code != 200:
    print("Login failed — fix this first")
    exit()

TOKEN = r.json()["access_token"]
headers["Authorization"] = f"Bearer {TOKEN}"

# Step 1 — Create session
r = requests.post(
    f"{BASE}/workout/sessions",
    json={"exercise": "squat"},
    headers=headers,
)
print("\nSession status:", r.status_code)
print("Session response:", r.text)

if r.status_code != 201:
    print("Session creation failed — check error above")
    exit()

session_id = r.json()["id"]

# Step 2 — Save a rep
r = requests.post(
    f"{BASE}/workout/reps",
    json={
        "session_id":  session_id,
        "rep_number":  1,
        "form_score":  0.85,
        "issues":      ["depth"],
    },
    headers=headers,
)
print("\nRep status:", r.status_code)
print("Rep response:", r.text)