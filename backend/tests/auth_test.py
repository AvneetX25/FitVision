import requests
import json
import sys

BASE_URL = "http://localhost:8000"

# ── Change these if you want a different test user ────────────────────────────
TEST_USERNAME = "gymtester01"
TEST_EMAIL    = "testuser_gymcoach@example.com"
TEST_PASSWORD = "TestPass@1234"

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

# ── TEST 1: Register a new user ───────────────────────────────────────────────
def test_register():
    print_section("TEST 1 — POST /auth/register")

    payload = {
        "username": TEST_USERNAME,
        "email":    TEST_EMAIL,
        "password": TEST_PASSWORD,
    }
    print_info(f"Payload: {payload}")

    try:
        r = requests.post(f"{BASE_URL}/auth/register", json=payload, timeout=10)
    except requests.exceptions.ConnectionError:
        print_fail("Could not connect to localhost:8000. Is FastAPI running?")
        print_info("Also make sure you started uvicorn WITHOUT --reload, or with:")
        print_info("  uvicorn main:app --host 0.0.0.0 --port 8000 --reload-dir app")
        sys.exit(1)

    print_response(r)

    if r.status_code in (200, 201):
        data = r.json()
        token = data.get("access_token") or data.get("token")
        if token:
            print_pass("User registered — JWT returned immediately")
            return token
        else:
            print_fail("201 returned but no access_token in response")
            print_info("Keys returned: " + str(list(data.keys())))
    elif r.status_code in (400, 409):
        print_info("User already exists (400/409). This is fine if you ran the test before.")
        print_info(f"→ Delete the row in Supabase for email={TEST_EMAIL}, OR change TEST_EMAIL/TEST_USERNAME above.")
        print_info("Continuing — will attempt login with existing credentials...")
    else:
        print_fail(f"Unexpected status {r.status_code}")

    return None

# ── TEST 2: Login with correct credentials ────────────────────────────────────
def test_login_success():
    print_section("TEST 2 — POST /auth/login (correct credentials)")

    payload = {"email": TEST_EMAIL, "password": TEST_PASSWORD}
    print_info(f"Payload: {payload}")

    r = requests.post(f"{BASE_URL}/auth/login", json=payload, timeout=10)
    print_response(r)

    token = None
    if r.status_code == 200:
        data = r.json()
        token = data.get("access_token") or data.get("token")
        if token:
            print_pass("Login successful — JWT received")
            print_info(f"Token (first 60 chars): {token[:60]}...")
        else:
            print_fail("Status 200 but no 'access_token' key in response")
            print_info("Keys returned: " + str(list(data.keys())))
    else:
        print_fail(f"Expected 200, got {r.status_code}")

    return token

# ── TEST 3: Login with wrong password ─────────────────────────────────────────
def test_login_wrong_password():
    print_section("TEST 3 — POST /auth/login (wrong password)")

    payload = {"email": TEST_EMAIL, "password": "WrongPassword999"}
    print_info(f"Payload: {payload}")

    r = requests.post(f"{BASE_URL}/auth/login", json=payload, timeout=10)
    print_response(r)

    if r.status_code in (401, 403, 400):
        print_pass(f"Correctly rejected wrong password ({r.status_code})")
    else:
        print_fail(f"Expected 401/403/400 for wrong password, got {r.status_code}")

# ── TEST 4: Login with non-existent email ─────────────────────────────────────
def test_login_nonexistent():
    print_section("TEST 4 — POST /auth/login (non-existent email)")

    payload = {"email": "ghost_user_xyz@nowhere.com", "password": "anything"}
    print_info(f"Payload: {payload}")

    r = requests.post(f"{BASE_URL}/auth/login", json=payload, timeout=10)
    print_response(r)

    if r.status_code in (401, 403, 404, 400):
        print_pass(f"Correctly rejected non-existent user ({r.status_code})")
    else:
        print_fail(f"Expected 4xx for unknown user, got {r.status_code}")

# ── TEST 5: Register duplicate email ──────────────────────────────────────────
def test_register_duplicate():
    print_section("TEST 5 — POST /auth/register (duplicate email)")

    payload = {
        "username": TEST_USERNAME + "_dup",
        "email":    TEST_EMAIL,          # same email, different username
        "password": TEST_PASSWORD,
    }
    print_info(f"Payload: {payload}")
    print_info("Same email, different username — should be rejected.")

    r = requests.post(f"{BASE_URL}/auth/register", json=payload, timeout=10)
    print_response(r)

    if r.status_code in (400, 409):
        print_pass(f"Correctly rejected duplicate email ({r.status_code})")
    else:
        print_fail(f"Expected 400/409 for duplicate email, got {r.status_code}")

# ── TEST 6: Register duplicate username ───────────────────────────────────────
def test_register_duplicate_username():
    print_section("TEST 6 — POST /auth/register (duplicate username)")

    payload = {
        "username": TEST_USERNAME,           # same username, different email
        "email":    "different_" + TEST_EMAIL,
        "password": TEST_PASSWORD,
    }
    print_info(f"Payload: {payload}")
    print_info("Same username, different email — should be rejected.")

    r = requests.post(f"{BASE_URL}/auth/register", json=payload, timeout=10)
    print_response(r)

    if r.status_code in (400, 409):
        print_pass(f"Correctly rejected duplicate username ({r.status_code})")
    else:
        print_fail(f"Expected 400/409 for duplicate username, got {r.status_code}")

# ── TEST 7: Register with missing fields ──────────────────────────────────────
def test_register_missing_fields():
    print_section("TEST 7 — POST /auth/register (missing password)")

    payload = {"email": "incomplete@example.com"}
    print_info(f"Payload: {payload}")

    r = requests.post(f"{BASE_URL}/auth/register", json=payload, timeout=10)
    print_response(r)

    if r.status_code == 422:
        print_pass("Correctly returned 422 Unprocessable Entity for missing fields")
    elif r.status_code == 400:
        print_pass("Correctly returned 400 Bad Request for missing fields")
    else:
        print_fail(f"Expected 422/400 for missing field, got {r.status_code}")

# ── TEST 8: GET /auth/me with valid token ─────────────────────────────────────
def test_me_valid_token(token):
    print_section("TEST 8 — GET /auth/me (valid token)")

    if not token:
        print_info("Skipping — no token available (login failed earlier)")
        return

    headers = {"Authorization": f"Bearer {token}"}
    print_info(f"Header: Authorization: Bearer {token[:40]}...")

    r = requests.get(f"{BASE_URL}/auth/me", headers=headers, timeout=10)
    print_response(r)

    if r.status_code == 200:
        data = r.json()
        if data.get("email") == TEST_EMAIL:
            print_pass(f"Correct user returned — email matches: {data['email']}")
        else:
            print_fail(f"Email mismatch — expected {TEST_EMAIL}, got {data.get('email')}")
        if data.get("username"):
            print_pass(f"Username present: {data['username']}")
    else:
        print_fail(f"Expected 200, got {r.status_code}")

# ── TEST 9: GET /auth/me with no token ────────────────────────────────────────
def test_me_no_token():
    print_section("TEST 9 — GET /auth/me (no token)")

    r = requests.get(f"{BASE_URL}/auth/me", timeout=10)
    print_response(r)

    if r.status_code in (401, 403):
        print_pass(f"Correctly rejected unauthenticated request ({r.status_code})")
    else:
        print_fail(f"Expected 401/403 for missing token, got {r.status_code}")

# ── TEST 10: GET /auth/me with fake token ─────────────────────────────────────
def test_me_fake_token():
    print_section("TEST 10 — GET /auth/me (fake/tampered token)")

    headers = {"Authorization": "Bearer this.is.a.fake.jwt.token"}
    r = requests.get(f"{BASE_URL}/auth/me", headers=headers, timeout=10)
    print_response(r)

    if r.status_code in (401, 403, 422):
        print_pass(f"Correctly rejected fake token ({r.status_code})")
    else:
        print_fail(f"Expected 401/403/422 for fake token, got {r.status_code}")

# ── MAIN ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print(f"\n{CYAN}  GYM COACH — AUTH ROUTE TEST SUITE  (v2){RESET}")
    print(f"  Base URL  : {BASE_URL}")
    print(f"  Test user : {TEST_USERNAME} / {TEST_EMAIL}")
    print(f"\n{YELLOW}  ⚠  Make sure uvicorn is running WITHOUT --reload")
    print(f"     or use:  uvicorn main:app --port 8000 --reload-dir app{RESET}")

    register_token = test_register()
    token = test_login_success() or register_token
    test_login_wrong_password()
    test_login_nonexistent()
    test_register_duplicate()
    test_register_duplicate_username()
    test_register_missing_fields()
    test_me_valid_token(token)
    test_me_no_token()
    test_me_fake_token()

    print_section("SUMMARY")
    if token:
        print_pass("Auth route is working. JWT obtained.")
        print(f"\n  {YELLOW}► TOKEN FOR OTHER TESTS:{RESET}")
        print(f"  {token}\n")
        print(f"  {YELLOW}► USER ID (from JWT payload — check /auth/me response above){RESET}\n")
    else:
        print_fail("Could not obtain JWT. Fix auth before testing other routes.")