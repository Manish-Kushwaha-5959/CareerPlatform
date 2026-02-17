#!/usr/bin/env python3
"""
Adaptive Career Assessment System (Groq + LLaMA-3.3-70B-Versatile)

Flow:
1) Stage 1: 10 fixed open-ended questions (NO LLM)
2) Stage 2: 6 RIASEC interest questions from questions.json (NO LLM)
3) Stage 3: 5 OCEAN personality questions from ocean_questions.json (NO LLM)
4) Stage 4: Final Career Recommendation using LLM (single call, structured prompt)

Designed for Indian students (class 9–12).
"""

import json
import random
import os
from groq import Groq
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

# ----------------- CONFIG -----------------

MODEL_NAME = "llama-3.3-70b-versatile"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise EnvironmentError("Please set GROQ_API_KEY in your .env file")

CURRENT_DIR = Path(__file__).parent

RIASEC_FILE = CURRENT_DIR / "questions.json"
OCEAN_FILE  = CURRENT_DIR / "ocean_questions.json"

NUM_OPEN_QUESTIONS = 12
NUM_RIASEC = 6
NUM_OCEAN = 5

# Map rating 1–5 to 0–1 contribution
SCORE_MAP = {1: 0.0, 2: 0.25, 3: 0.5, 4: 0.75, 5: 1.0}

# ----------------- CLIENT -----------------

client = Groq(api_key=GROQ_API_KEY)

# ----------------- LOAD QUESTIONS -----------------

# RIASEC questions from JSON
with open(RIASEC_FILE, "r", encoding="utf-8") as f:
    RIASEC_BANK = json.load(f)

RIASEC_TRAITS = ["R", "I", "A", "S", "E", "C"]

# OCEAN questions from JSON
with open(OCEAN_FILE, "r", encoding="utf-8") as f:
    OCEAN_BANK = json.load(f)

OCEAN_TRAITS = ["O", "C", "E", "A", "N"]

# ----------------- FIXED OPEN-ENDED QUESTIONS -----------------
# 10 simple, clear questions for class 9–12 that extract interests + constraints + context.

OPEN_QUESTIONS = [
    "Which school subjects do you enjoy the most, and why?",
    "Are there any subjects you really do not like or find very difficult? Which ones, and why?",
    "What activities do you enjoy outside of school (for example: sports, games, art, music, reading, helping others, technology, etc.)?",
    "Do you prefer working with numbers and data, working with people, creating new ideas/designs, or doing practical hands-on work?",
    "How would you describe yourself: more introverted (quiet, reserved), more extroverted (outgoing, talkative), or somewhere in between?",
    "What kind of work environment do you imagine yourself in: office, classroom, hospital, outdoors, factory/workshop, creative studio, or something else?",
    "Are there any careers that you or your family have already thought about for your future? If yes, what are they?",
    "Does your family have any strong expectations about your future career (for example: government job, business, stable job, high salary, etc.)?",
    "Are there any financial or location limitations you are aware of (for example: need low-cost education, prefer staying in your city, cannot move far away)?",
    "What do you want most from your future career: high income, stability and security, creativity, helping others, fame/recognition, or freedom and flexibility?"
]

# ----------------- STORAGE -----------------

# Open-ended Q&A
open_history = []  # list of {"question": ..., "answer": ...}

# RIASEC
riasec_scores_raw = {t: 0.0 for t in RIASEC_TRAITS}
riasec_counts = {t: 0 for t in RIASEC_TRAITS}
riasec_asked = {t: [] for t in RIASEC_TRAITS}
riasec_history = []  # (trait, question, rating)

# OCEAN
ocean_scores_raw = {t: 0.0 for t in OCEAN_TRAITS}
ocean_counts = {t: 0 for t in OCEAN_TRAITS}
ocean_asked = {t: [] for t in OCEAN_TRAITS}
ocean_history = []  # (trait, question, rating)


# ----------------- UTILITIES -----------------

def call_llm(messages):
    """
    Helper to call Groq LLM and return message text.
    messages: list of {"role": "system"/"user"/"assistant", "content": "..."}
    """
    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=messages,
        temperature=0.4
    )
    # Groq SDK: message is an object with .content
    return response.choices[0].message.content.strip()


def pick_next_question(traits, bank, asked_dict):
    """
    Adaptive selection for RIASEC:
    - choose trait with the fewest questions asked so far
    - randomly pick one unused question from that trait (or reuse if finished)
    """
    counts = {t: len(asked_dict[t]) for t in traits}
    min_count = min(counts.values())
    candidates = [t for t, c in counts.items() if c == min_count]

    trait = random.choice(candidates)
    available = [q for q in bank[trait] if q not in asked_dict[trait]]
    if not available:
        available = bank[trait]

    question = random.choice(available)
    return trait, question


def normalize_scores(raw_scores, counts):
    """
    Convert raw sum scores into 0–1 normalized scores per trait.
    If a trait got 0 questions, set it to 0.5 (neutral).
    """
    norm = {}
    for t, total in raw_scores.items():
        n = counts.get(t, 0)
        if n == 0:
            norm[t] = 0.5
        else:
            norm[t] = round(total / n, 4)
    return norm


# ----------------- STAGE 1: FIXED OPEN-ENDED -----------------

def run_open_stage():
    print("\n=== Stage 1: Open-Ended Questions (10) ===\n")
    print("Answer these questions in your own words. There is no right or wrong answer.\n")

    for i, q in enumerate(OPEN_QUESTIONS, start=1):
        print(f"Q{i}: {q}")
        ans = input("Your answer: ").strip()
        open_history.append({"question": q, "answer": ans})
        print()  # blank line for readability


# ----------------- STAGE 2: RIASEC -----------------

def run_riasec_stage():
    print("\n=== Stage 2: RIASEC Interest Test (6 questions) ===\n")
    print("Rate each question from 1 to 5:")
    print("1 = strongly disagree / not interested at all")
    print("5 = strongly agree / very interested\n")

    for i in range(1, NUM_RIASEC + 1):
        trait, q = pick_next_question(RIASEC_TRAITS, RIASEC_BANK, riasec_asked)
        print(f"Q{i}: ({trait}) {q}")

        while True:
            r = input("Your rating (1–5): ").strip()
            if r.isdigit() and 1 <= int(r) <= 5:
                r = int(r)
                break
            print("Please enter a number between 1 and 5.")

        score = SCORE_MAP[r]
        riasec_scores_raw[trait] += score
        riasec_counts[trait] += 1
        riasec_asked[trait].append(q)
        riasec_history.append((trait, q, r))

        print()


# ----------------- STAGE 3: OCEAN -----------------

def run_ocean_stage():
    print("\n=== Stage 3: Personality Test (Big Five – OCEAN, 5 questions) ===\n")
    print("Again, rate each statement from 1 to 5:")
    print("1 = strongly disagree, 5 = strongly agree\n")

    # We assume OCEAN_FILE has at least one question per trait O, C, E, A, N
    for i, trait in enumerate(OCEAN_TRAITS[:NUM_OCEAN], start=1):
        questions = OCEAN_BANK.get(trait, [])
        if not questions:
            continue

        q = random.choice(questions)
        print(f"Q{i}: ({trait}) {q}")

        while True:
            r = input("Your rating (1–5): ").strip()
            if r.isdigit() and 1 <= int(r) <= 5:
                r = int(r)
                break
            print("Please enter a number between 1 and 5.")

        score = SCORE_MAP[r]
        ocean_scores_raw[trait] += score
        ocean_counts[trait] += 1
        ocean_asked[trait].append(q)
        ocean_history.append((trait, q, r))

        print()


# ----------------- STAGE 4: FINAL CAREER RECOMMENDATION (LLM) -----------------

def ask_for_recommendations():
    """
    Uses the LLM ONLY to generate final recommendations.
    We pass:
    - open_history (raw text Q&A)
    - normalized RIASEC scores
    - normalized OCEAN scores

    LLM:
    - Classifies into top 2–3 Indian career categories
    - Recommends up to 5 careers
    - Includes confidence, stream, degrees, specializations, advice
    - Returns strict JSON
    """

    # Normalize scores to 0–1
    riasec_norm = normalize_scores(riasec_scores_raw, riasec_counts)
    ocean_norm = normalize_scores(ocean_scores_raw, ocean_counts)

    open_text = json.dumps(open_history, indent=2, ensure_ascii=False)
    riasec_text = json.dumps(riasec_norm, indent=2, ensure_ascii=False)
    ocean_text = json.dumps(ocean_norm, indent=2, ensure_ascii=False)

    # Build prompt using string concatenation (no .format, no f-strings with braces)
    prompt = ""
    prompt += "You are an expert Indian career counselor with 20+ years of experience guiding students from class 9–12.\n\n"
    prompt += "Your task is to provide highly accurate, practical, India-specific career recommendations using the structured student profile provided below.\n\n"
    prompt += "==========================\n"
    prompt += "STUDENT RAW DATA\n"
    prompt += "==========================\n\n"
    prompt += "1) OPEN-ENDED RESPONSES:\n"
    prompt += open_text + "\n\n"
    prompt += "2) RIASEC SCORES (0–1), measuring interest:\n"
    prompt += riasec_text + "\n\n"
    prompt += "3) OCEAN PERSONALITY SCORES (0–1):\n"
    prompt += ocean_text + "\n\n"

    prompt += "==========================\n"
    prompt += "YOUR ANALYSIS PROCESS\n"
    prompt += "==========================\n\n"
    prompt += "FIRST, analyze the student's:\n"
    prompt += "- Interests (RIASEC)\n"
    prompt += "- Personality tendencies (OCEAN)\n"
    prompt += "- Natural strengths & weaknesses\n"
    prompt += "- Subject preferences\n"
    prompt += "- Constraints (financial, location, family expectations)\n"
    prompt += "- Work style (structured, creative, risk-taking, introverted/extroverted)\n"
    prompt += "- Practical exposure and clarity\n"
    prompt += "- Aspirations and motivating factors\n\n"
    prompt += "Do NOT assume the student is fully clear. They may be confused. You must interpret the signals logically.\n\n"

    prompt += "==========================\n"
    prompt += "STEP 1 — CLASSIFY INTO INDIAN CAREER CATEGORIES\n"
    prompt += "==========================\n\n"
    prompt += "Classify the student into the TOP 2–3 categories from this list:\n\n"
    prompt += "1. Professional (Engineering, Medicine, Law, CA, Psychology, Research, Teaching)\n"
    prompt += "2. Corporate & Business (Management, Marketing, HR, Finance, Analytics, Banking)\n"
    prompt += "3. Government & Civil Services (UPSC, SSC, Railways, Defence Officer, PSU)\n"
    prompt += "4. Skilled Trades / Technical Labour (ITI, technician, mechanic, electrician, manufacturing)\n"
    prompt += "5. Creative, Media & Design (Graphic design, film, writing, animation, UI/UX)\n"
    prompt += "6. Entrepreneurship / Freelancing / Startup\n"
    prompt += "7. Sports, Fitness, Armed Forces\n"
    prompt += "8. Social Impact & Service (NGO, counseling, development sector)\n\n"
    prompt += "Pick categories based on evidence from the student profile. Provide a 1–2 line explanation for each selected category.\n\n"

    prompt += "==========================\n"
    prompt += "STEP 2 — SELECT UP TO 5 CAREERS THAT FIT THESE CATEGORIES\n"
    prompt += "==========================\n\n"
    prompt += "From the identified categories, choose the BEST 3–5 specific careers that are:\n"
    prompt += "- Realistic in India\n"
    prompt += "- Suitable for a class 9–12 student to plan for\n"
    prompt += "- Aligned with the student's interests, personality, and constraints\n"
    prompt += "- NOT all from the same category (ensure diversity when possible)\n\n"

    prompt += "==========================\n"
    prompt += "STEP 3 — OUTPUT STRUCTURE (STRICT JSON)\n"
    prompt += "==========================\n\n"
    prompt += "Return ONLY JSON in the EXACT format below:\n\n"
    prompt += "{\n"
    prompt += "  \"categories\": [\n"
    prompt += "    {\n"
    prompt += "      \"name\": \"\",\n"
    prompt += "      \"reason\": \"\"\n"
    prompt += "    }\n"
    prompt += "  ],\n"
    prompt += "  \"recommendations\": [\n"
    prompt += "    {\n"
    prompt += "      \"career\": \"\",\n"
    prompt += "      \"category\": \"\",\n"
    prompt += "      \"confidence\": 0,\n"
    prompt += "      \"reason\": \"\",\n"
    prompt += "      \"stream\": \"\",\n"
    prompt += "      \"degrees\": [\n"
    prompt += "        {\n"
    prompt += "          \"degree\": \"\",\n"
    prompt += "          \"specializations\": [\"\", \"\", \"\"]\n"
    prompt += "        }\n"
    prompt += "      ],\n"
    prompt += "      \"career_type\": \"\",\n"
    prompt += "      \"advice\": \"\"\n"
    prompt += "    }\n"
    prompt += "  ]\n"
    prompt += "}\n\n"

    prompt += "DEFINITIONS:\n"
    prompt += "- \"career_type\": job | profession | government | creative | vocational | entrepreneurial | sports\n"
    prompt += "- \"confidence\": 0–100 (how strongly the student's profile matches this career)\n"
    prompt += "- \"stream\": science | commerce | arts | open | mixed\n\n"

    prompt += "IMPORTANT RULES:\n"
    prompt += "- BE STRICTLY JSON ONLY. Do not include any text outside the JSON.\n"
    prompt += "- Recommendations must be practical for Indian context.\n"
    prompt += "- Degrees & specializations must be real options available in India.\n"
    prompt += "- If the student seems confused or undecided, still choose logically consistent careers.\n"
    prompt += "- Confidence scores must be meaningful, not random.\n"
    prompt += "- Avoid recommending only IT/corporate roles unless the profile strongly supports it.\n\n"
    prompt += "NOW RETURN THE FINAL JSON OUTPUT ONLY.\n"

    messages = [
        {
            "role": "system",
            "content": (
                "You are an Indian career counselor AI assistant. "
                "You MUST strictly follow the user's instructions and output clean JSON when asked."
            )
        },
        {
            "role": "user",
            "content": prompt
        }
    ]

    return call_llm(messages)


# ----------------- MAIN -----------------

def main():
    print("=== Adaptive Career Assessment System ===")

    # Stage 1: Open-ended
    run_open_stage()

    # Stage 2: RIASEC
    run_riasec_stage()

    # Stage 3: OCEAN
    run_ocean_stage()

    # Show normalized scores (for debugging/understanding)
    riasec_norm = normalize_scores(riasec_scores_raw, riasec_counts)
    ocean_norm = normalize_scores(ocean_scores_raw, ocean_counts)

    print("\n--- Normalized RIASEC Scores (0–1) ---")
    for t in RIASEC_TRAITS:
        print(f"{t}: {riasec_norm[t]}")
    print("\n--- Normalized OCEAN Scores (0–1) ---")
    for t in OCEAN_TRAITS:
        print(f"{t}: {ocean_norm[t]}")

    # Stage 4: LLM recommendation
    print("\n=== Final Career Recommendations (from LLM) ===\n")
    output = ask_for_recommendations()
    print(output)


if __name__ == "__main__":
    main()
