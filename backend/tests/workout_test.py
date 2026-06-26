import requests
import json
import sys

BASE_URL  = "http://localhost:8000"

# ── Paste your token from auth test here ─────────────────────────────────────
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNGYwMDc5NC02ZDc5LTQyZjYtOTFhZC01NTk3MTI5MzdlZTciLCJleHAiOjE3ODIzMzE1MjR9.u6eb9fqula1B4mIOeTYTJ0eFUjthN4mg235cPHKM0mk"

CYAN   = "\033[96m"
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
RESET  = "\033[0m"

def print_section(title):
    print(f"\n{CYAN}{'='*55}")
    print(f"  {title}")
    print(f"{'='*55}{RESET}")

def print_pass(msg): print(f"  {GREEN}✓ PASS{RESET} — {msg}")
def print_fail(msg): print(f"  {RED}✗ FAIL{RESET} — {msg}")
def print_info(msg): print(f"  {YELLOW}ℹ{RESET}  {msg}")

def print_response(r):
    print_info(f"Status Code : {r.status_code}")
    try:
        print_info(f"Response    : {json.dumps(r.json(), indent=2)}")
    except:
        print_info(f"Response    : {r.text}")

def auth_headers():
    return {"Authorization": f"Bearer {TOKEN}"}

# ─────────────────────────────────────────────────────────────────────────────
# SESSION TESTS
# ─────────────────────────────────────────────────────────────────────────────

# TEST 1: Create a session (squat)
def test_create_session():
    print_section("TEST 1 — POST /workout/sessions (create squat session)")

    payload = {"exercise": "squat"}
    print_info(f"Payload: {payload}")

    r = requests.post(f"{BASE_URL}/workout/sessions", json=payload, headers=auth_headers(), timeout=10)
    print_response(r)

    session_id = None
    if r.status_code == 201:
        data = r.json()
        session_id = data.get("id")
        if session_id:
            print_pass(f"Session created — id: {session_id}")
        else:
            print_fail("201 returned but no 'id' in response")
            print_info("Keys returned: " + str(list(data.keys())))
    else:
        print_fail(f"Expected 201, got {r.status_code}")

    return session_id

# TEST 2: Create session without auth
def test_create_session_no_auth():
    print_section("TEST 2 — POST /workout/sessions (no token)")

    r = requests.post(f"{BASE_URL}/workout/sessions", json={"exercise": "squat"}, timeout=10)
    print_response(r)

    if r.status_code in (401, 403):
        print_pass(f"Correctly rejected unauthenticated request ({r.status_code})")
    else:
        print_fail(f"Expected 401/403, got {r.status_code}")

# TEST 3: Create session with missing exercise field
def test_create_session_missing_field():
    print_section("TEST 3 — POST /workout/sessions (missing exercise field)")

    r = requests.post(f"{BASE_URL}/workout/sessions", json={}, headers=auth_headers(), timeout=10)
    print_response(r)

    if r.status_code == 422:
        print_pass("Correctly returned 422 for missing exercise field")
    else:
        print_fail(f"Expected 422, got {r.status_code}")

# TEST 4: List sessions
def test_list_sessions():
    print_section("TEST 4 — GET /workout/sessions (list all sessions)")

    r = requests.get(f"{BASE_URL}/workout/sessions", headers=auth_headers(), timeout=10)
    print_response(r)

    if r.status_code == 200:
        data = r.json()
        if isinstance(data, list):
            print_pass(f"Sessions list returned — {len(data)} session(s) found")
        else:
            print_fail("200 returned but response is not a list")
    else:
        print_fail(f"Expected 200, got {r.status_code}")

# TEST 5: End a session
def test_end_session(session_id):
    print_section("TEST 5 — PATCH /workout/sessions/{id}/end")

    if not session_id:
        print_info("Skipping — no session_id available (session creation failed)")
        return

    payload = {"total_reps": 10, "avg_form_score": 0.85}
    print_info(f"Session ID : {session_id}")
    print_info(f"Payload    : {payload}")

    r = requests.patch(
        f"{BASE_URL}/workout/sessions/{session_id}/end",
        json=payload,
        headers=auth_headers(),
        timeout=10,
    )
    print_response(r)

    if r.status_code == 200:
        data = r.json()
        if data.get("ended_at"):
            print_pass("Session ended — ended_at timestamp present")
        else:
            print_fail("200 returned but ended_at is missing in response")
        if data.get("total_reps") == 10:
            print_pass("total_reps correctly saved as 10")
        else:
            print_fail(f"total_reps mismatch — expected 10, got {data.get('total_reps')}")
        if data.get("avg_form_score") == 0.85:
            print_pass("avg_form_score correctly saved as 0.85")
        else:
            print_fail(f"avg_form_score mismatch — expected 0.85, got {data.get('avg_form_score')}")
    else:
        print_fail(f"Expected 200, got {r.status_code}")

# TEST 6: End a session that doesn't exist
def test_end_nonexistent_session():
    print_section("TEST 6 — PATCH /workout/sessions/{id}/end (fake session id)")

    fake_id = "00000000-0000-0000-0000-000000000000"
    print_info(f"Session ID : {fake_id}")

    r = requests.patch(
        f"{BASE_URL}/workout/sessions/{fake_id}/end",
        json={"total_reps": 5, "avg_form_score": 0.5},
        headers=auth_headers(),
        timeout=10,
    )
    print_response(r)

    if r.status_code == 404:
        print_pass("Correctly returned 404 for non-existent session")
    else:
        print_fail(f"Expected 404, got {r.status_code}")

# ─────────────────────────────────────────────────────────────────────────────
# REPS TESTS
# ─────────────────────────────────────────────────────────────────────────────

# TEST 7: Create a fresh session for rep tests
def test_create_session_for_reps():
    print_section("TEST 7 — POST /workout/sessions (fresh session for rep tests)")

    payload = {"exercise": "pushup"}
    r = requests.post(f"{BASE_URL}/workout/sessions", json=payload, headers=auth_headers(), timeout=10)
    print_response(r)

    session_id = None
    if r.status_code == 201:
        session_id = r.json().get("id")
        print_pass(f"Fresh session created — id: {session_id}")
    else:
        print_fail(f"Expected 201, got {r.status_code}")

    return session_id

# TEST 8: Log a rep
def test_create_rep(session_id):
    print_section("TEST 8 — POST /workout/reps (log a rep)")

    if not session_id:
        print_info("Skipping — no session_id available")
        return None

    payload = {
        "session_id": session_id,
        "rep_number": 1,
        "form_score": 0.9,
        "issues":     [],
    }
    print_info(f"Payload: {payload}")

    r = requests.post(f"{BASE_URL}/workout/reps", json=payload, headers=auth_headers(), timeout=10)
    print_response(r)

    rep_id = None
    if r.status_code == 201:
        data = r.json()
        rep_id = data.get("id")
        if rep_id:
            print_pass(f"Rep logged — id: {rep_id}")
        else:
            print_fail("201 returned but no 'id' in response")
    else:
        print_fail(f"Expected 201, got {r.status_code}")

    return rep_id

# TEST 9: Log a rep with form issues
def test_create_rep_with_issues(session_id):
    print_section("TEST 9 — POST /workout/reps (rep with form issues)")

    if not session_id:
        print_info("Skipping — no session_id available")
        return

    payload = {
        "session_id": session_id,
        "rep_number": 2,
        "form_score": 0.55,
        "issues":     ["knees caving in", "depth too shallow"],
    }
    print_info(f"Payload: {payload}")

    r = requests.post(f"{BASE_URL}/workout/reps", json=payload, headers=auth_headers(), timeout=10)
    print_response(r)

    if r.status_code == 201:
        data = r.json()
        if data.get("issues") == ["knees caving in", "depth too shallow"]:
            print_pass("Rep with issues logged correctly — issues array saved")
        else:
            print_fail(f"Issues mismatch — got: {data.get('issues')}")
    else:
        print_fail(f"Expected 201, got {r.status_code}")

# TEST 10: Log rep to someone else's session (security check)
def test_create_rep_wrong_session():
    print_section("TEST 10 — POST /workout/reps (fake session_id — security check)")

    payload = {
        "session_id": "00000000-0000-0000-0000-000000000000",
        "rep_number": 1,
        "form_score": 0.8,
        "issues":     [],
    }
    print_info(f"Payload: {payload}")
    print_info("Should be rejected — session doesn't belong to this user")

    r = requests.post(f"{BASE_URL}/workout/reps", json=payload, headers=auth_headers(), timeout=10)
    print_response(r)

    if r.status_code == 404:
        print_pass("Correctly returned 404 for session not owned by user")
    else:
        print_fail(f"Expected 404, got {r.status_code}")

# TEST 11: Get reps for a session
def test_get_session_reps(session_id):
    print_section("TEST 11 — GET /workout/sessions/{id}/reps")

    if not session_id:
        print_info("Skipping — no session_id available")
        return

    print_info(f"Session ID: {session_id}")

    r = requests.get(
        f"{BASE_URL}/workout/sessions/{session_id}/reps",
        headers=auth_headers(),
        timeout=10,
    )
    print_response(r)

    if r.status_code == 200:
        data = r.json()
        if isinstance(data, list):
            print_pass(f"Reps list returned — {len(data)} rep(s) found")
            if len(data) >= 2:
                print_pass("Both reps logged in TEST 8 and TEST 9 are present")
            else:
                print_fail(f"Expected at least 2 reps, got {len(data)}")
        else:
            print_fail("200 returned but response is not a list")
    else:
        print_fail(f"Expected 200, got {r.status_code}")

# ─────────────────────────────────────────────────────────────────────────────
# VOICE / LLM TESTS
# ─────────────────────────────────────────────────────────────────────────────

# TEST 12: Voice start line (calls Groq)
def test_voice_start():
    print_section("TEST 12 — GET /workout/voice/start (Groq session start line)")
    print_info("This calls Groq API — may take 2-5 seconds...")

    r = requests.get(f"{BASE_URL}/workout/voice/start", headers=auth_headers(), timeout=30)
    print_response(r)

    if r.status_code == 200:
        data = r.json()
        line = data.get("line")
        if line and len(line) > 5:
            print_pass(f"Voice start line received: \"{line}\"")
        else:
            print_fail(f"200 returned but 'line' is empty or missing — got: {line}")
    else:
        print_fail(f"Expected 200, got {r.status_code}")

# TEST 13: Voice end line (calls Groq)
def test_voice_end():
    print_section("TEST 13 — POST /workout/voice/end (Groq session end coaching)")
    print_info("This calls Groq API — may take 2-5 seconds...")

    payload = {"total_reps": 10, "avg_form_score": 0.78}
    print_info(f"Payload: {payload}")

    r = requests.post(f"{BASE_URL}/workout/voice/end", json=payload, headers=auth_headers(), timeout=30)
    print_response(r)

    if r.status_code == 200:
        data = r.json()
        line = data.get("line")
        if line and len(line) > 5:
            print_pass(f"Voice end line received: \"{line}\"")
        else:
            print_fail(f"200 returned but 'line' is empty or missing — got: {line}")
    else:
        print_fail(f"Expected 200, got {r.status_code}")

# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":

    if TOKEN == "PASTE_YOUR_JWT_TOKEN_HERE":
        print(f"\n{RED}  ERROR: You forgot to paste your JWT token at the top of this script!{RESET}")
        print(f"  Open test_workout.py and replace PASTE_YOUR_JWT_TOKEN_HERE with your token.\n")
        sys.exit(1)

    print(f"\n{CYAN}  GYM COACH — WORKOUT ROUTE TEST SUITE{RESET}")
    print(f"  Base URL : {BASE_URL}")

    # Session flow
    session_id_1 = test_create_session()
    test_create_session_no_auth()
    test_create_session_missing_field()
    test_list_sessions()
    test_end_session(session_id_1)
    test_end_nonexistent_session()

    # Rep flow (fresh open session)
    session_id_2 = test_create_session_for_reps()
    test_create_rep(session_id_2)
    test_create_rep_with_issues(session_id_2)
    test_create_rep_wrong_session()
    test_get_session_reps(session_id_2)

    # Groq voice lines
    test_voice_start()
    test_voice_end()

    print_section("DONE")
    print_info("Check your Supabase dashboard to verify rows in workout_sessions and reps tables.")
    print_info(f"session_id used for rep tests: {session_id_2}")
    print_info("Save this session_id — you may need it for coaching/analytics route tests.")