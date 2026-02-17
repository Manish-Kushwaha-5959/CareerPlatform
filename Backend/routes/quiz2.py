# Backend/routes/quiz2.py
from flask import Blueprint, request, jsonify
from pathlib import Path
import json
import random
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

quiz_bp = Blueprint("quiz2", __name__, url_prefix="/api/quiz")

QUIZ_STATE = {}   # 🔥 In-memory quiz store (no Flask session)

# ---------------- CONFIG ----------------
MODEL_NAME = "llama-3.3-70b-versatile"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise EnvironmentError("GROQ_API_KEY missing in .env")

client = Groq(api_key=GROQ_API_KEY)

CURRENT_DIR = Path(__file__).parent
RIASEC_FILE = CURRENT_DIR / "questions.json"
OCEAN_FILE  = CURRENT_DIR / "ocean_questions.json"

NUM_OPEN = 12      # <- match the 12 OPEN_QUESTIONS you provided
NUM_RIASEC = 5
NUM_OCEAN = 5

SCORE_MAP = {1:0.0, 2:0.25, 3:0.5, 4:0.75, 5:1.0}

# Load question banks
RIASEC_BANK = json.load(open(RIASEC_FILE, "r", encoding="utf-8"))
OCEAN_BANK  = json.load(open(OCEAN_FILE, "r", encoding="utf-8"))

RIASEC_TRAITS = list(RIASEC_BANK.keys())
OCEAN_TRAITS = list(OCEAN_BANK.keys())

OPEN_QUESTIONS = [
    "Which subjects do you enjoy the most, and why?",
    "Are there any subjects you really do not like or find very difficult? Which ones, and why?",
    "What activities do you enjoy outside of school (for example: sports, games, art, music, reading, helping others, exploring technology, etc.)?",
    "How would you describe yourself: more introverted (quiet, reserved), more extroverted (outgoing, talkative), or somewhere in between?",
    "What kind of work environment do you imagine yourself in: office, classroom, hospital, outdoors, factory/workshop, creative studio, or something else?",
    "Are there any careers that you or your family have already thought about for your future? If yes, what are they?",
    "Does your family have any strong expectations about your future career (for example: government job, business, stable job, high salary, etc.)?",
    "Are there any financial or location limitations you are aware of (for example: need low-cost education, prefer staying in your city)?",
    "What do you want most from your future career: high income, stability and security, creativity, helping others, fame/recognition, or freedom and flexibility?",
    "Do you enjoy working with numbers, solving logical problems, or analyzing data? If yes, what kind of number or problem-based work do you enjoy(like solving sudoku in newspapers)?",
    "Do you like creating new ideas, designs, stories, or anything artistic? What kind of creative work interests you?",
    "Do you enjoy doing practical tasks like building, repairing, experimenting, or working with tools and equipment?"
]

def init_state():
    return {
        "stage": "open",
        "open_idx": 0,
        "open_history": [],

        "riasec_raw": {t:0 for t in RIASEC_TRAITS},
        "riasec_cnt": {t:0 for t in RIASEC_TRAITS},
        "riasec_asked": {t:[] for t in RIASEC_TRAITS},

        "ocean_raw": {t:0 for t in OCEAN_TRAITS},
        "ocean_cnt": {t:0 for t in OCEAN_TRAITS},
        "ocean_asked": {t:[] for t in OCEAN_TRAITS},
    }

# ---------------- API ROUTES ----------------

@quiz_bp.post("/start")
def start_quiz():
    sid = os.urandom(12).hex()
    QUIZ_STATE[sid] = init_state()
    return jsonify({"session_id": sid})


@quiz_bp.post("/question")
def get_question():
    body = request.get_json() or {}
    sid = body.get("session_id")

    if sid not in QUIZ_STATE:
        return jsonify({"error": "Invalid session"}), 404

    data = QUIZ_STATE[sid]
    stage = data["stage"]

    # ---------- OPEN ----------
    if stage == "open":
        idx = data["open_idx"]
        if idx >= NUM_OPEN:
            data["stage"] = "riasec"
            return get_question()
        
        return jsonify({
            "stage": stage,
            "question_number": idx+1,
            "total_in_stage": NUM_OPEN,
            "question": OPEN_QUESTIONS[idx],
            "type": "text"
        })

    # ---------- RIASEC ----------
    if stage == "riasec":
        asked = data["riasec_asked"]
        count = sum(len(asked[t]) for t in RIASEC_TRAITS)

        if count >= NUM_RIASEC:
            data["stage"] = "ocean"
            return get_question()

        # Pick trait with least asked
        trait = min(RIASEC_TRAITS, key=lambda t: len(asked[t]))
        options = [q for q in RIASEC_BANK[trait] if q not in asked[trait]]
        q = random.choice(options)

        data["pending"] = (trait, q)

        return jsonify({
            "stage": stage,
            "question_number": count+1,
            "total_in_stage": NUM_RIASEC,
            "trait": trait,
            "question": q,
            "type": "rating"
        })

    # ---------- OCEAN ----------
    if stage == "ocean":
        asked = data["ocean_asked"]
        count = sum(len(v) for v in asked.values())

        if count >= NUM_OCEAN:
            data["stage"] = "done"
            return jsonify({"stage": "done"})

        # rotate through OCEAN traits (safe even if len differs)
        trait = OCEAN_TRAITS[count % len(OCEAN_TRAITS)]
        options = [q for q in OCEAN_BANK.get(trait, []) if q not in asked.get(trait, [])]
        if not options:
            options = OCEAN_BANK.get(trait, [])
        q = random.choice(options) if options else "No question available."

        data["pending"] = (trait, q)

        return jsonify({
            "stage": stage,
            "question_number": count+1,
            "total_in_stage": NUM_OCEAN,
            "trait": trait,
            "question": q,
            "type": "rating"
        })

    return jsonify({"error": "Unknown stage"})


@quiz_bp.post("/answer")
def answer():
    body = request.get_json() or {}
    sid = body.get("session_id")
    answer = body.get("answer")

    if sid not in QUIZ_STATE:
        return jsonify({"error": "Invalid session"}), 404

    data = QUIZ_STATE[sid]
    stage = data["stage"]

    # If already done, return stage done (prevents continuing)
    if stage == "done":
        return jsonify({"stage": "done"})

    # ---------- OPEN ----------
    if stage == "open":
        idx = data["open_idx"]
        # guard in case idx is out of range
        qtext = OPEN_QUESTIONS[idx] if idx < len(OPEN_QUESTIONS) else ""
        data["open_history"].append({
            "question": qtext,
            "answer": answer
        })
        data["open_idx"] += 1
        return get_question()

    # ---------- RIASEC ----------
    if stage == "riasec":
        if "pending" not in data:
            return jsonify({"error": "No pending RIASEC question"}), 400
        trait, q = data.pop("pending")
        try:
            r = int(answer)
        except Exception:
            return jsonify({"error": "Rating must be integer 1-5"}), 400
        if not 1 <= r <= 5:
            return jsonify({"error": "Rating must be integer 1-5"}), 400

        data["riasec_raw"][trait] += SCORE_MAP[r]
        data["riasec_cnt"][trait] += 1
        data["riasec_asked"][trait].append(q)
        return get_question()

    # ---------- OCEAN ----------
    if stage == "ocean":
        if "pending" not in data:
            return jsonify({"error": "No pending OCEAN question"}), 400
        trait, q = data.pop("pending")
        try:
            r = int(answer)
        except Exception:
            return jsonify({"error": "Rating must be integer 1-5"}), 400
        if not 1 <= r <= 5:
            return jsonify({"error": "Rating must be integer 1-5"}), 400

        data["ocean_raw"][trait] += SCORE_MAP[r]
        data["ocean_cnt"][trait] += 1
        data["ocean_asked"][trait].append(q)
        return get_question()

    return jsonify({"error": "Invalid stage"})


@quiz_bp.post("/result")
def final_result():
    body = request.get_json() or {}
    sid = body.get("session_id")

    if sid not in QUIZ_STATE:
        return jsonify({"error": "Invalid session"}), 404

    data = QUIZ_STATE[sid]

    if data["stage"] != "done":
        return jsonify({"error": "Quiz not finished"}), 400

    return jsonify({
        "status": "ok",
        "open": data["open_history"],
        "riasec": data["riasec_raw"],
        "ocean": data["ocean_raw"]
    })


# ----------------- LLM RECOMMEND ROUTE (uses your exact original prompt) -----------------
import re
# (keep other imports already present in the file)

def _extract_json_from_text(text: str) -> str:
    """
    Try to strip markdown fences / surrounding text and return the most-likely JSON substring.
    Returns the cleaned substring (or original text if nothing found).
    """
    if not text:
        return text

    # 1) remove common code-fence markers
    # remove ```json or ```lang or ``` alone
    text = re.sub(r"```(?:\w+)?", "", text)
    # remove any remaining single backticks
    text = text.replace("`", "")
    text = text.strip()

    # 2) find first JSON-like start (either { or [)
    first_brace = text.find("{")
    first_bracket = text.find("[")
    starts = [i for i in (first_brace, first_bracket) if i != -1]
    if not starts:
        return text  # no JSON-like token found, return original cleaned text

    start = min(starts)
    # pick matching closing bracket
    if text[start] == "{":
        end = text.rfind("}")
    else:
        end = text.rfind("]")

    if end == -1 or end < start:
        return text

    candidate = text[start:end+1].strip()
    return candidate

@quiz_bp.post("/recommend")
def recommend():
    body = request.get_json() or {}
    sid = body.get("session_id")

    if sid not in QUIZ_STATE:
        return jsonify({"error": "Invalid session"}), 404

    data = QUIZ_STATE[sid]

    if data["stage"] != "done":
        return jsonify({"error": "Quiz not finished"}), 400

    # normalise helper (same as before)
    def normalize(raw, cnt):
        out = {}
        for t, total in raw.items():
            n = cnt.get(t, 0)
            out[t] = 0.5 if n == 0 else round(total / n, 4)
        return out

    riasec_norm = normalize(data["riasec_raw"], data["riasec_cnt"])
    ocean_norm  = normalize(data["ocean_raw"], data["ocean_cnt"])

    open_text   = json.dumps(data["open_history"], indent=2, ensure_ascii=False)
    riasec_text = json.dumps(riasec_norm, indent=2, ensure_ascii=False)
    ocean_text  = json.dumps(ocean_norm, indent=2, ensure_ascii=False)

    # ------------------------ EXACT PROMPT (your original prompt) ------------------------
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
    # -------------------------------------------------------------------------------

    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an Indian career counselor AI assistant. "
                        "You MUST strictly follow the user's instructions and output clean JSON when asked."
                    )
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.4,
        )

        raw = response.choices[0].message.content
        if isinstance(raw, dict) and "content" in raw:
            # some SDKs wrap the message differently
            raw = raw["content"]
        raw = raw.strip()

        # Extract/clean JSON substring
        candidate = _extract_json_from_text(raw)

        # Try parsing
        try:
            parsed = json.loads(candidate)
            return jsonify(parsed)
        except Exception as parse_exc:
            # fallback: try parsing the whole cleaned text (without trying to extract)
            try:
                parsed = json.loads(raw)
                return jsonify(parsed)
            except Exception:
                return jsonify({
                    "error": "LLM call failed",
                    "details": str(parse_exc),
                    "raw_response": raw,
                    "cleaned_candidate": candidate
                }), 500

    except Exception as e:
        return jsonify({"error": "LLM request failed", "details": str(e)}), 500
