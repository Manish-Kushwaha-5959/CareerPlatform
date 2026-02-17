#!/usr/bin/env python3
"""
Interactive tester for your quiz2 Flask routes.

Usage:
    python test_quiz.py                 # uses default http://127.0.0.1:8080
    python test_quiz.py --url <baseurl> # e.g. http://localhost:8080
"""

import requests
import argparse
import json
import sys
from pprint import pprint

DEFAULT_BASE = "http://127.0.0.1:8080"

def post_json(url, payload):
    try:
        r = requests.post(url, json=payload, timeout=30)
        r.raise_for_status()
        return r.json()
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Request failed: {e}")
        try:
            print("Response body:", r.text)
        except Exception:
            pass
        sys.exit(1)
    except ValueError:
        print("[ERROR] Response was not valid JSON:")
        print(r.text)
        sys.exit(1)

def start_session(base):
    url = f"{base}/api/quiz/start"
    print(f"-> Starting quiz (POST {url})")
    res = post_json(url, {})
    sid = res.get("session_id") or res.get("sessionId")
    if not sid:
        print("Start failed, response:")
        pprint(res)
        sys.exit(1)
    print(f"Session started: {sid}\n")
    return sid

def get_question(base, sid):
    url = f"{base}/api/quiz/question"
    return post_json(url, {"session_id": sid})

def submit_answer(base, sid, answer):
    url = f"{base}/api/quiz/answer"
    return post_json(url, {"session_id": sid, "answer": answer})

def get_result(base, sid):
    url = f"{base}/api/quiz/result"
    return post_json(url, {"session_id": sid})

def recommend(base, sid):
    url = f"{base}/api/quiz/recommend"
    return post_json(url, {"session_id": sid})

def ask_text(prompt):
    try:
        return input(prompt).strip()
    except (KeyboardInterrupt, EOFError):
        print("\nAborted by user.")
        sys.exit(0)

def ask_rating(prompt):
    while True:
        ans = ask_text(prompt + " (1-5): ")
        if ans.isdigit():
            val = int(ans)
            if 1 <= val <= 5:
                return val
        print("Please enter an integer between 1 and 5.")

def run_interactive(base):
    sid = start_session(base)

    # Get first question
    q = get_question(base, sid)

    # Loop until stage == done
    while True:
        # If server returned an error
        if "error" in q:
            print("[ERROR] Server returned:", q)
            sys.exit(1)

        stage = q.get("stage")
        if stage == "done":
            print("\n✅ Quiz finished on server.\n")
            break

        q_text = q.get("question")
        q_num = q.get("question_number")
        total = q.get("total_in_stage")
        q_type = q.get("type", "text")

        print("=" * 60)
        print(f"Stage: {stage}")
        if q.get("trait"):
            print(f"Trait: {q['trait']}")
        if q_num and total:
            print(f"Question {q_num} / {total}")
        print()
        print(f"{q_text}")
        print()

        # Get input from user
        if q_type == "text":
            ans = ask_text("Your answer: ")
        elif q_type == "rating":
            ans = ask_rating("Your rating")
        else:
            # fallback
            ans = ask_text("Answer: ")

        # Submit and get next question in response
        q = submit_answer(base, sid, ans)

    # (Optional) fetch raw result
    print("Fetching raw result (/result)...")
    try:
        res = get_result(base, sid)
        print("Raw result (server-side):")
        pprint(res)
    except SystemExit:
        # handled earlier; continue to recommend
        pass

    print("\nCalling LLM recommendation (/recommend)... This may take a while.")
    rec = recommend(base, sid)
    print("\n=== LLM Recommendation Output ===")
    # try pretty printing JSON if it's JSON
    try:
        pprint(rec)
    except Exception:
        print(rec)

    # If the LLM returned raw text instead of parsed JSON, show it
    if isinstance(rec, dict) and rec.get("error"):
        print("\nLLM error or non-JSON output. raw_response (if any):")
        print(rec.get("raw_response") or rec.get("raw") or "")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", "-u", default=DEFAULT_BASE, help="Base URL of backend (default http://127.0.0.1:8080)")
    args = parser.parse_args()

    try:
        import requests
    except ImportError:
        print("This script requires the 'requests' package. Install with:\n  pip install requests")
        sys.exit(1)

    run_interactive(args.url)
