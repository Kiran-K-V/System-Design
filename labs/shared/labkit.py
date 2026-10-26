"""Helpers shared by every lab's watch.py and check.py."""
import base64
import hashlib
import hmac
import json
import os
import secrets
import time

import psycopg

# Public on purpose: the completion code marks progress on the site. It is not a credential.
CODE_KEY = b"uptime-labs-honor-v1"

GREEN, RED, DIM, BOLD, RESET = "\033[32m", "\033[31m", "\033[2m", "\033[1m", "\033[0m"


def db():
    return psycopg.connect(os.environ["DATABASE_URL"], autocommit=True)


def completion_code(lab_id):
    """UPT-<lab>-<4 char nonce><6 char MAC>. The site checks the MAC with the same key."""
    nonce = base64.b32encode(secrets.token_bytes(5)).decode()[:4]
    mac = hmac.new(CODE_KEY, f"{lab_id}:{nonce}".encode(), hashlib.sha256).digest()
    return f"UPT-{lab_id}-{nonce}{base64.b32encode(mac).decode()[:6]}"


def wait_for_k6_summary(path, started_at, timeout=180):
    deadline = time.time() + timeout
    while time.time() < deadline:
        if os.path.exists(path) and os.path.getmtime(path) > started_at:
            time.sleep(0.5)  # let k6 finish writing
            with open(path) as f:
                return json.load(f)
        time.sleep(1)
    raise SystemExit(f"{RED}No load test result after {timeout}s. Is k6 running?{RESET}")


def report(lab_id, results):
    """results: list of (name, passed, detail). Prints a table and the code on a full pass."""
    print()
    for name, passed, detail in results:
        mark = f"{GREEN}PASS{RESET}" if passed else f"{RED}FAIL{RESET}"
        print(f"  {mark}  {name:<28} {DIM}{detail}{RESET}")
    print()
    if all(p for _, p, _ in results):
        print(f"  {BOLD}{GREEN}Lab passed.{RESET} Paste this code on the lab page:\n")
        print(f"      {BOLD}{completion_code(lab_id)}{RESET}\n")
        return 0
    print(f"  {RED}Not yet.{RESET} Run `./lab hint` or read the lab page for a hint.\n")
    return 1
