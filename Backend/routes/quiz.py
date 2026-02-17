# Backend/routes/quiz.py

from flask import Blueprint, request, jsonify
import json
import random
import os
import re
from pathlib import Path
from langchain_groq import ChatGroq
from dotenv import load_dotenv

load_dotenv()

quiz_routes = Blueprint("quiz_routes", __name__)

BASE_DIR = Path(__file__).resolve().parent.parent
QUESTIONS_FILE = BASE_DIR / "services" / "questions.json"
MODEL_NAME = "llama-3.3-70b-versatile"
API_ENV_VAR = "GROQ_API_KEY"

TRAITS = ["R", "I", "A", "S", "E", "C"]
SCORE_MAP = {1: 0.0, 2: 0.25, 3: 0.5, 4: 0.75, 5: 1.0}

# ------------------ GROQ MODEL SETUP (FIXED) ------------------
api_key = os.getenv(API_ENV_VAR)
if api_key:
    model = ChatGroq(
        groq_api_key=api_key,
        model_name=MODEL_NAME,
        temperature=0.2,
        model_kwargs={"response_format": {"type": "json_object"}}  # Forces valid JSON
    )
else:
    model = None

# Load questions
QUESTION_BANK = {}
if QUESTIONS_FILE.exists():
    with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
        QUESTION_BANK = json.load(f)


# ------------------ HELPER FUNCTIONS ------------------

def call_groq(prompt: str) -> str:
    """Call Groq LLM and return clean string content"""
    if not model:
        raise Exception("GROQ_API_KEY not configured")
    response = model.invoke(prompt)
    return response.content.strip() if hasattr(response, "content") else str(response)


def normalize_scores(raw_scores, questions_asked):
    normalized = {}
    for t in TRAITS:
        n = questions_asked.get(t, 0)
        normalized[t] = round(raw_scores.get(t, 0) / n, 4) if n > 0 else 0.5
    return normalized


def extract_json(text: str):
    """Robust JSON extraction even if wrapped in markdown"""
    text = text.strip()
    try:
        return json.loads(text)
    except:
        pass
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except:
            pass
    raise ValueError("No valid JSON found in response")


def build_recommendation_prompt(qa_history, normalized_scores, user_profile=None):
    sorted_traits = sorted(normalized_scores.items(), key=lambda x: x[1], reverse=True)
    primary_trait = sorted_traits[0][0]
    secondary_trait = sorted_traits[1][0]
    holland_code = f"{primary_trait}{secondary_trait}"

    qa_lines = [
        f"{idx}. Trait={item['trait']} | Q='{item['question']}' | Rating={item['rating']}"
        for idx, item in enumerate(qa_history, 1)
    ]
    qa_block = "\n".join(qa_lines)

    default_profile = {"class": "10"}
    profile = user_profile or default_profile
    student_class = profile.get("class", "10")

    return f"""You are a strict JSON generator for an Indian career counseling app. 
You output ONLY valid JSON. No explanations, no markdown, no extra text.

STUDENT PROFILE:
- Class: {student_class}
- Holland Code: {holland_code}
- RIASEC Scores: {json.dumps(normalized_scores)}

Q&A HISTORY:
{qa_block}

Recommend 2–3 distinct careers suitable for Indian students (Class 9–12).
Follow Indian education paths (JEE, NEET, CLAT, CUET, NATA, CA, etc.).
Avoid careers if student gave rating 1–2 on related tasks.

Output exactly this JSON format:
{{
  "recommendations": [
    {{
      "career": "Software Engineer",
      "reason": "High Investigative + Realistic traits match problem-solving and building systems. Student enjoyed coding-related questions.",
      "stream": "science",
      "degrees": [
        {{
          "degree": "B.Tech",
          "specializations": ["Computer Science", "Information Technology", "AI & ML"]
        }},
        {{
          "degree": "B.Sc",
          "specializations": ["Computer Science", "Data Science"]
        }}
      ]
    }}
  ]
}}
Generate 2–3 recommendations now.
"""


# ------------------ ROUTES ------------------

@quiz_routes.route("/quiz/questions", methods=["GET"])
def get_questions():
    if not QUESTION_BANK:
        return jsonify({"success": False, "message": "Questions not loaded"}), 500
    return jsonify({"success": True, "questions": QUESTION_BANK, "traits": TRAITS}), 200


@quiz_routes.route("/quiz/next-question", methods=["POST"])
def get_next_question():
    data = request.get_json() or {}
    questions_asked = data.get("questions_asked", {t: [] for t in TRAITS})

    counts = {t: len(questions_asked.get(t, [])) for t in TRAITS}
    min_count = min(counts.values())
    candidate_traits = [t for t, c in counts.items() if c == min_count]
    chosen_trait = random.choice(candidate_traits)

    asked = questions_asked.get(chosen_trait, [])
    available = [q for q in QUESTION_BANK.get(chosen_trait, []) if q not in asked]
    if not available:
        available = QUESTION_BANK.get(chosen_trait, [])

    if not available:
        return jsonify({"success": False, "message": "No questions left"}), 400

    question = random.choice(available)
    return jsonify({"success": True, "trait": chosen_trait, "question": question}), 200


@quiz_routes.route("/quiz/calculate-scores", methods=["POST"])
def calculate_scores():
    data = request.get_json() or {}
    answers = data.get("answers", [])

    raw_scores = {t: 0.0 for t in TRAITS}
    questions_count = {t: 0 for t in TRAITS}

    for ans in answers:
        trait = ans.get("trait")
        rating = ans.get("rating")
        if trait in TRAITS and isinstance(rating, (int, float)) and 1 <= rating <= 5:
            raw_scores[trait] += SCORE_MAP.get(rating, 0)
            questions_count[trait] += 1

    normalized = normalize_scores(raw_scores, questions_count)
    sorted_traits = sorted(normalized.items(), key=lambda x: x[1], reverse=True)[:3]
    top_traits = [{"trait": t, "score": s} for t, s in sorted_traits]

    return jsonify({
        "success": True,
        "normalized_scores": normalized,
        "top_traits": top_traits
    }), 200


@quiz_routes.route("/quiz/generate-mcq", methods=["POST"])
def generate_mcq():
    data = request.get_json() or {}
    qa_history = data.get("qa_history", [])
    num_questions = data.get("num_questions", 5)

    if not qa_history:
        return jsonify({"success": False, "message": "No Q&A history"}), 400
    if not model:
        return jsonify({"success": False, "message": "GROQ API not configured"}), 500

    qa_block = "\n".join([
        f"{i+1}. [{item['trait']}] Q: {item['question']} → Rating: {item['rating']}"
        for i, item in enumerate(qa_history)
    ])

    prompt = f"""You are an expert career counselor for Indian students (Class 9–12).
Generate exactly {num_questions} relatable MCQ questions to refine career interests.

Rules:
- Simple, school-life scenarios
- 4 options (A, B, C, D)
- No correct answers included
- Indian context (CBSE, JEE, competitions, etc.)

Previous answers:
{qa_block}

Return ONLY this JSON:
{{
  "questions": [
    {{
      "question": "What do you enjoy most in science class?",
      "options": {{"A": "Doing experiments", "B": "Drawing diagrams", "C": "Presenting to class", "D": "Solving math problems"}}
    }}
  ]
}}
"""

    try:
        raw = call_groq(prompt)
        result = extract_json(raw)
        questions = result.get("questions", [])

        return jsonify({"success": True, "questions": questions}), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "Failed to generate MCQs",
            "error": str(e),
            "raw": raw[:500] if 'raw' in locals() else ""
        }), 500


@quiz_routes.route("/quiz/recommendations", methods=["POST"])
def get_recommendations():
    data = request.get_json() or {}
    qa_history = data.get("qa_history", [])
    normalized_scores = data.get("normalized_scores")

    if not qa_history:
        return jsonify({"success": False, "message": "No history"}), 400
    if not model:
        return jsonify({"success": False, "message": "GROQ not configured"}), 500

    if not normalized_scores:
        # Recalculate if not sent
        raw = {t: 0.0 for t in TRAITS}
        count = {t: 0 for t in TRAITS}
        for a in qa_history:
            if a.get("trait") in TRAITS and 1 <= a.get("rating", 0) <= 5:
                raw[a["trait"]] += SCORE_MAP.get(a["rating"], 0)
                count[a["trait"]] += 1
        normalized_scores = normalize_scores(raw, count)

    try:
        prompt = build_recommendation_prompt(qa_history, normalized_scores)
        raw = call_groq(prompt)
        result = extract_json(raw)
        recommendations = result.get("recommendations", [])

        return jsonify({
            "success": True,
            "recommendations": recommendations,
            "normalized_scores": normalized_scores
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "Failed to generate recommendations",
            "raw_response": raw[:1000] if 'raw' in locals() else ""
        }), 500


@quiz_routes.route("/quiz/submit", methods=["POST"])
def submit_quiz():
    data = request.get_json() or {}
    answers = data.get("answers", [])

    if not answers:
        return jsonify({"success": False, "message": "No answers"}), 400

    raw_scores = {t: 0.0 for t in TRAITS}
    count = {t: 0 for t in TRAITS}
    for a in answers:
        t = a.get("trait")
        r = a.get("rating")
        if t in TRAITS and isinstance(r, int) and 1 <= r <= 5:
            raw_scores[t] += SCORE_MAP[r]
            count[t] += 1

    normalized = normalize_scores(raw_scores, count)
    top = sorted(normalized.items(), key=lambda x: x[1], reverse=True)[:3]
    top_traits = [{"trait": t, "score": s} for t, s in top]

    recommendations = []
    if model and len(answers) >= 6:
        try:
            prompt = build_recommendation_prompt(answers, normalized)
            raw = call_groq(prompt)
            result = extract_json(raw)
            recommendations = result.get("recommendations", [])
        except:
            pass  # Silent fail — still return scores

    return jsonify({
        "success": True,
        "normalized_scores": normalized,
        "top_traits": top_traits,
        "recommendations": recommendations
    }), 200