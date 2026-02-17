# from flask import Blueprint, request, Response, jsonify
# from twilio.twiml.voice_response import VoiceResponse
# from pathlib import Path
# import json
# import random
# import os
# import re

# import google.generativeai as genai
# from dotenv import load_dotenv

# load_dotenv()

# voice_riasec_bp = Blueprint("voice_riasec_bp", __name__)

# BASE_DIR = Path(__file__).resolve().parent.parent
# QUESTIONS_FILE = BASE_DIR / "services" / "questions.json"
# MODEL_NAME = "gemini-2.5-flash"
# API_ENV_VAR = "GEMINI_API_KEY"

# TRAITS = ["R", "I", "A", "S", "E", "C"]
# SCORE_MAP = {1: 0.0, 2: 0.25, 3: 0.5, 4: 0.75, 5: 1.0}
# STATIC_QUESTIONS_COUNT = 5  # After this → switch to refinement
# REFINEMENT_COUNT = 5

# # Initialize Gemini
# api_key = os.getenv(API_ENV_VAR)
# if api_key:
#     genai.configure(api_key=api_key)
#     model = genai.GenerativeModel(MODEL_NAME)
# else:
#     model = None

# # Load questions
# QUESTION_BANK = {}
# if QUESTIONS_FILE.exists():
#     with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
#         QUESTION_BANK = json.load(f)

# # In-memory session
# CALL_SESSIONS = {}

# # ---------------- HELPER FUNCTIONS ----------------

# def call_gemini(prompt: str) -> str:
#     if not model:
#         raise Exception("Gemini API key not configured")
#     response = model.generate_content(prompt)
#     return getattr(response, "text", str(response))

# def normalize_scores(raw_scores, questions_asked):
#     normalized = {}
#     for t in TRAITS:
#         n = questions_asked.get(t, 0)
#         if n == 0:
#             normalized[t] = 0.5
#         else:
#             normalized[t] = round(raw_scores.get(t, 0) / n, 4)
#     return normalized

# def build_recommendation_prompt(qa_history, normalized_scores):
#     qa_lines = [
#         f"{idx}. Trait={item['trait']} | Q='{item['question']}' | Rating={item['rating']}"
#         for idx, item in enumerate(qa_history, 1)
#     ]
#     qa_block = "\n".join(qa_lines)

#     return f"""
# You are an expert career counselor in India.

# Based on the user's answers, recommend 2–3 best-fitting careers.

# RETURN ONLY VALID JSON, NO MARKDOWN, NO EXTRA TEXT:

# {{
#   "recommendations": [
#     {{
#       "career": "Software Engineer",
#       "reason": "Strong Investigative and Realistic traits show analytical thinking.",
#       "stream": "science",
#       "degrees": [
#         {{
#           "degree": "B.Tech",
#           "specializations": ["Computer Science", "IT", "AI & ML"]
#         }},
#         {{
#           "degree": "B.Sc",
#           "specializations": ["Computer Science", "Data Science"]
#         }}
#       ]
#     }}
#   ]
# }}

# User answers:
# {qa_block}

# RIASEC scores: {json.dumps(normalized_scores, indent=2)}

# Generate 2–3 recommendations now.
# """

# def generate_refinement_statements(answers_so_far):
#     """Ask Gemini to create 5 highly discriminating statements based on previous answers"""
#     if not model or len(answers_so_far) < 5:
#         return [
#             "You enjoy working with computers and technology.",
#             "You like helping and teaching other people.",
#             "You prefer working with your hands on real objects.",
#             "You enjoy creative activities like art or music.",
#             "You want to start your own business one day."
#         ]

#     prompt = f"""
# Based on these RIASEC answers, generate exactly 5 short, powerful statements 
# that will best refine the user's career profile when rated 1–5 (strongly disagree to agree).

# Return ONLY a clean JSON array of 5 strings. No explanation.

# User's recent answers:
# {json.dumps(answers_so_far[-10:], indent=2)}

# Example output:
# ["You enjoy analyzing complex data patterns", "You like leading large teams", "You prefer creative freedom over rules"]
# """

#     try:
#         text = call_gemini(prompt).strip()
#         # Extract JSON array
#         match = re.search(r'\[.*\]', text, re.DOTALL)
#         if match:
#             arr = json.loads(match.group(0))
#             return arr[:5]
#         return json.loads(text)[:5]
#     except Exception as e:
#         print(f"Refinement generation failed: {e}")
#         return [
#             "You enjoy solving technical problems.",
#             "You like working in a team setting.",
#             "You prefer structured environments.",
#             "You enjoy public speaking and leadership.",
#             "You want financial success above all."
#         ]

# def get_next_question(questions_asked):
#     counts = {t: len(questions_asked.get(t, [])) for t in TRAITS}
#     min_count = min(counts.values())
#     candidate_traits = [t for t, c in counts.items() if c == min_count]
#     chosen_trait = random.choice(candidate_traits)

#     asked = questions_asked.get(chosen_trait, [])
#     available = [q for q in QUESTION_BANK.get(chosen_trait, []) if q not in asked]
#     if not available:
#         available = QUESTION_BANK.get(chosen_trait, [])[:]
#     if not available:
#         return None
#     question = random.choice(available)
#     return chosen_trait, question

# def calculate_quiz_result(answers):
#     if not answers:
#         return "No answers recorded. Please try again."

#     raw_scores = {t: 0.0 for t in TRAITS}
#     questions_count = {t: 0 for t in TRAITS}

#     for ans in answers:
#         trait = ans.get("trait")
#         rating = ans.get("rating")
#         if trait in TRAITS and isinstance(rating, int) and 1 <= rating <= 5:
#             raw_scores[trait] += SCORE_MAP[rating]
#             questions_count[trait] += 1

#     normalized = normalize_scores(raw_scores, questions_count)
#     sorted_traits = sorted(normalized.items(), key=lambda x: x[1], reverse=True)[:3]

#     trait_names = {"R": "Realistic", "I": "Investigative", "A": "Artistic",
#                    "S": "Social", "E": "Enterprising", "C": "Conventional"}
#     top_text = "Your top three traits are: "
#     for t, s in sorted_traits:
#         top_text += f"{trait_names[t]} ({s:.2f}), "

#     recommendations_text = ""
#     if model:
#         try:
#             prompt = build_recommendation_prompt(answers, normalized)
#             text = call_gemini(prompt).strip()
#             try:
#                 result = json.loads(text)
#             except:
#                 start = text.find("{")
#                 end = text.rfind("}")
#                 result = json.loads(text[start:end+1]) if start != -1 and end != -1 else None

#             if result and "recommendations" in result:
#                 recommendations_text = "Here are your personalized career suggestions: "
#                 for i, rec in enumerate(result["recommendations"][:3], 1):
#                     recommendations_text += f"Option {i}: {rec['career']} in {rec['stream']} stream. Reason: {rec['reason']}. "
#                     for deg in rec['degrees'][:2]:
#                         specs = ', '.join(deg['specializations'][:2])
#                         recommendations_text += f"You can pursue {deg['degree']} in {specs}. "
#         except Exception as e:
#             print(f"Final recommendation error: {e}")
#             recommendations_text = "We couldn't generate personalized suggestions right now, but based on your traits, explore related careers on apnidisha.com."

#     else:
#         recommendations_text = "Explore careers matching your top traits on apnidisha.com."

#     return f"{top_text}. {recommendations_text}"

# # ---------------- ROUTES ----------------

# @voice_riasec_bp.route("/start", methods=["POST"])
# def start_call():
#     call_sid = request.form.get("CallSid")
#     CALL_SESSIONS[call_sid] = {
#         "questions_asked": {t: [] for t in TRAITS},
#         "answers": [],
#         "current_question": None,
#         "phase": "static",           # "static" or "refinement"
#         "refinement_questions": [],
#         "refinement_index": 0
#     }

#     resp = VoiceResponse()
#     resp.say("Welcome to Apni Disha career guidance quiz.", language="en-IN")
#     resp.say("Rate each statement from 1 strongly disagree to 5 strongly agree by pressing a key.", language="en-IN")
#     resp.say("Let's begin.", language="en-IN")
#     resp.redirect("/api/question", method="POST")
#     return Response(str(resp), mimetype="text/xml")


# @voice_riasec_bp.route("/question", methods=["POST"])
# def handle_question():
#     call_sid = request.form.get("CallSid")
#     digits = request.form.get("Digits")

#     if call_sid not in CALL_SESSIONS:
#         CALL_SESSIONS[call_sid] = {
#             "questions_asked": {t: [] for t in TRAITS},
#             "answers": [],
#             "current_question": None,
#             "phase": "static",
#             "refinement_questions": [],
#             "refinement_index": 0
#         }

#     session = CALL_SESSIONS[call_sid]
#     resp = VoiceResponse()

#     # Store answer if provided
#     if digits and digits.isdigit():
#         rating = int(digits)
#         if 1 <= rating <= 5 and session["current_question"]:
#             trait, question = session["current_question"]
#             session["answers"].append({"trait": trait, "question": question, "rating": rating})
#             if session["phase"] == "static":
#                 session["questions_asked"][trait].append(question)
#             session["current_question"] = None

#     # === PHASE 1: Static Questions (15 total) ===
#     if session["phase"] == "static":
#         total_asked = sum(len(session["questions_asked"].get(t, [])) for t in TRAITS)
#         if total_asked >= STATIC_QUESTIONS_COUNT:
#             # Switch to refinement phase
#             session["phase"] = "refinement"
#             session["refinement_questions"] = generate_refinement_statements(session["answers"])
#             session["refinement_index"] = 0
#             resp.say("Great! Now for five final questions to give you the best suggestions.", language="en-IN", voice="man")

#     # === PHASE 2: Refinement Questions (5 Gemini-generated) ===
#     if session["phase"] == "refinement":
#         idx = session["refinement_index"]
#         if idx < REFINEMENT_COUNT:
#             question = session["refinement_questions"][idx]
#             session["current_question"] = ("REFINE", question)

#             gather = resp.gather(num_digits=1, action="/api/question", method="POST", timeout=10)
#             gather.say(f"Refinement question {idx + 1} of {REFINEMENT_COUNT}: {question}", language="en-IN")
#             gather.say("Press 1 to 5 to rate how much you agree.", language="en-IN")
#             resp.redirect("/api/question", method="POST")
#             CALL_SESSIONS[call_sid] = session
#             return Response(str(resp), mimetype="text/xml")
#         else:
#             # All refinement done → final result
#             result = calculate_quiz_result(session["answers"])
#             resp.say("Thank you! Your quiz is complete.", language="en-IN")
#             resp.say(result, language="en-IN")
#             resp.say("Visit apnidisha.com for more details. Goodbye!", language="en-IN")
#             CALL_SESSIONS.pop(call_sid, None)
#             return Response(str(resp), mimetype="text/xml")

#     # === Still in static phase → ask next normal question ===
#     next_q = get_next_question(session["questions_asked"])
#     if not next_q:
#         # Fallback if no questions left
#         result = calculate_quiz_result(session["answers"])
#         resp.say("Quiz complete.", language="en-IN")
#         resp.say(result, language="en-IN")
#         resp.say("Goodbye!", language="en-IN")
#         CALL_SESSIONS.pop(call_sid, None)
#         return Response(str(resp), mimetype="text/xml")

#     trait, question = next_q
#     session["current_question"] = (trait, question)

#     gather = resp.gather(num_digits=1, action="/api/question", method="POST", timeout=10)
#     gather.say(question, language="en-IN")
#     gather.say("Press 1 strongly disagree, 5 strongly agree.", language="en-IN")
#     resp.redirect("/api/question", method="POST")

#     CALL_SESSIONS[call_sid] = session
#     return Response(str(resp), mimetype="text/xml")

# from flask import Blueprint, request, Response
# from twilio.twiml.voice_response import VoiceResponse
# from pathlib import Path
# import json
# import random
# import os
# import re

# from dotenv import load_dotenv
# from langchain_groq import ChatGroq
# from langchain_core.prompts import ChatPromptTemplate
# from langchain_core.output_parsers import StrOutputParser

# load_dotenv()

# voice_riasec_bp = Blueprint("voice_riasec_bp", __name__)

# # ---------------- CONFIG ----------------
# BASE_DIR = Path(__file__).resolve().parent.parent
# QUESTIONS_FILE = BASE_DIR / "services" / "questions.json"

# TRAITS = ["R", "I", "A", "S", "E", "C"]
# SCORE_MAP = {1: 0.0, 2: 0.25, 3: 0.5, 4: 0.75, 5: 1.0}
# STATIC_QUESTIONS_COUNT = 3   # Set to 3 for quick testing, change to 15 later
# REFINEMENT_COUNT = 5

# # ---------------- GROQ + LLAMA3.3-70B ----------------
# GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# if GROQ_API_KEY:
#     llm = ChatGroq(
#         model="llama-3.3-70b-versatile",
#         temperature=0.7,
#         max_tokens=1024,
#         groq_api_key=GROQ_API_KEY
#     )
#     print("Groq + Llama3.3-70B-Versatile loaded successfully!")
# else:
#     llm = None
#     print("GROQ_API_KEY not found! Running in fallback mode.")

# # Load static questions
# QUESTION_BANK = {}
# if QUESTIONS_FILE.exists():
#     with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
#         QUESTION_BANK = json.load(f)

# CALL_SESSIONS = {}

# # ---------------- LANGCHAIN CHAINS (FIXED) ----------------

# # Refinement: Use StrOutputParser + regex (100% reliable)
# refinement_prompt = ChatPromptTemplate.from_template("""
# You are an expert Indian career psychologist.

# Generate exactly 5 short, powerful statements to refine the user's career interests.
# Make them highly discriminating and personalized.

# User's RIASEC answers so far:
# {answers}

# RULES:
# - Return ONLY a valid JSON array of 5 strings
# - No explanation, no markdown, no code blocks
# - Example: ["You love solving complex algorithms", "You enjoy public speaking in front of thousands"]

# Generate now:
# """)

# refinement_chain = refinement_prompt | llm | StrOutputParser()

# # Final recommendations (same fix)
# recommendation_prompt = ChatPromptTemplate.from_template("""
# You are India's #1 career counselor.

# User completed RIASEC + 5 refinement questions.

# Give 2–3 perfect career suggestions with Indian education paths.

# Return ONLY valid JSON:

# {{
#   "recommendations": [
#     {{
#       "career": "Data Scientist",
#       "reason": "Strong Investigative + Realistic traits with passion for analytics",
#       "stream": "science",
#       "degrees": [
#         {{"degree": "B.Tech", "specializations": ["CSE", "Data Science", "AI"]}},
#         {{"degree": "B.Sc", "specializations": ["Statistics", "Mathematics"]}}
#       ]
#     }}
#   ]
# }}

# User answers:
# {answers}

# RIASEC scores: {scores}

# Generate now.
# """)

# recommendation_chain = recommendation_prompt | llm | StrOutputParser()

# # ---------------- HELPERS ----------------

# def normalize_scores(raw_scores, questions_asked):
#     normalized = {}
#     for t in TRAITS:
#         n = questions_asked.get(t, 0)
#         normalized[t] = 0.5 if n == 0 else round(raw_scores.get(t, 0) / n, 4)
#     return normalized

# def get_next_question(questions_asked):
#     counts = {t: len(questions_asked.get(t, [])) for t in TRAITS}
#     min_count = min(counts.values())
#     candidates = [t for t, c in counts.items() if c == min_count]
#     trait = random.choice(candidates)
#     available = [q for q in QUESTION_BANK.get(trait, []) if q not in questions_asked.get(trait, [])]
#     if not available:
#         available = QUESTION_BANK.get(trait, [])[:]
#     if not available:
#         return None
#     return trait, random.choice(available)

# def generate_refinement_statements(answers_so_far):
#     fallback = [
#         "You enjoy working with computers and technology.",
#         "You love helping and teaching others.",
#         "You prefer hands-on practical work.",
#         "You enjoy creative arts and design.",
#         "You want to start your own business."
#     ]

#     if not llm or len(answers_so_far) < 3:
#         print("Refinement: Using fallback (no LLM or too few answers)")
#         return fallback

#     try:
#         print(f"Generating refinement questions from {len(answers_so_far)} answers...")
#         raw_output = refinement_chain.invoke({
#             "answers": json.dumps(answers_so_far[-12:], indent=2)
#         })

#         print(f"\nRAW GROQ OUTPUT:\n{raw_output}\n{'='*60}")

#         # Extract JSON array with regex (works 100%)
#         match = re.search(r'\[.*\]', raw_output, re.DOTALL)
#         if match:
#             json_str = match.group(0)
#             questions = json.loads(json_str)
#             if isinstance(questions, list) and len(questions) >= 5:
#                 print(f"SUCCESS: Generated {len(questions)} refinement questions!")
#                 return questions[:5]
#             elif isinstance(questions, list):
#                 print(f"Got {len(questions)} questions, padding...")
#                 return questions + fallback[len(questions):5]

#         # Fallback: try line-by-line
#         lines = [l.strip().strip('",') for l in raw_output.split('\n') if l.strip().startswith('"') or "You " in l]
#         if len(lines) >= 5:
#             print(f"Extracted {len(lines)} statements from lines")
#             return lines[:5]

#         raise ValueError("No valid JSON array found")

#     except Exception as e:
#         print(f"Refinement FAILED: {e}")
#         print(f"Raw output was:\n{raw_output}")
#         return fallback

# def get_final_recommendations(answers):
#     if not answers:
#         return "No answers recorded."

#     raw = {t: 0.0 for t in TRAITS}
#     count = {t: 0 for t in TRAITS}
#     for a in answers:
#         if a["trait"] in TRAITS:
#             raw[a["trait"]] += SCORE_MAP.get(a["rating"], 0)
#             count[a["trait"]] += 1
#     scores = normalize_scores(raw, count)
#     top3 = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:3]

#     trait_names = {"R": "Realistic", "I": "Investigative", "A": "Artistic",
#                    "S": "Social", "E": "Enterprising", "C": "Conventional"}
#     top_text = "Your top traits: " + ", ".join(f"{trait_names[t]} ({s:.2f})" for t, s in top3)

#     if not llm:
#         return f"{top_text}. Visit apnidisha.com for suggestions."

#     try:
#         print("Generating final recommendations...")
#         raw_output = recommendation_chain.invoke({
#             "answers": json.dumps(answers, indent=2),
#             "scores": json.dumps(scores, indent=2)
#         })

#         print(f"\nFINAL RECOMMENDATION OUTPUT:\n{raw_output}\n{'='*60}")

#         match = re.search(r'\{.*\}', raw_output, re.DOTALL)
#         if match:
#             result = json.loads(match.group(0))
#             if "recommendations" in result:
#                 text = "Here are your best career matches: "
#                 for i, rec in enumerate(result["recommendations"][:3], 1):
#                     text += f"Option {i}: {rec['career']} in {rec['stream']} stream because {rec['reason']}. "
#                     for deg in rec['degrees'][:2]:
#                         specs = ", ".join(deg['specializations'][:3])
#                         text += f"Pursue {deg['degree']} in {specs}. "
#                 return f"{top_text}. {text}"

#         raise ValueError("No valid recommendations")

#     except Exception as e:
#         print(f"Final recommendation failed: {e}")
#         return f"{top_text}. Explore careers at apnidisha.com"

# # ---------------- ROUTES ----------------

# @voice_riasec_bp.route("/start", methods=["POST"])
# def start_call():
#     sid = request.form.get("CallSid")
#     CALL_SESSIONS[sid] = {
#         "questions_asked": {t: [] for t in TRAITS},
#         "answers": [],
#         "current_question": None,
#         "phase": "static",
#         "refinement_questions": [],
#         "refinement_index": 0
#     }

#     resp = VoiceResponse()
#     resp.say("Welcome to Apni Disha career quiz!", language="en-IN")
#     resp.say("Rate each statement 1 to 5 by pressing a key.", language="en-IN")
#     resp.redirect("/api/question", method="POST")
#     return Response(str(resp), mimetype="text/xml")

# @voice_riasec_bp.route("/question", methods=["POST"])
# def handle_question():
#     sid = request.form.get("CallSid")
#     digits = request.form.get("Digits")

#     if sid not in CALL_SESSIONS:
#         CALL_SESSIONS[sid] = {
#             "questions_asked": {t: [] for t in TRAITS},
#             "answers": [], "current_question": None,
#             "phase": "static", "refinement_questions": [], "refinement_index": 0
#         }

#     s = CALL_SESSIONS[sid]
#     resp = VoiceResponse()

#     # Store answer
#     if digits and digits.isdigit() and 1 <= int(digits) <= 5 and s["current_question"]:
#         trait, q = s["current_question"]
#         s["answers"].append({"trait": trait, "question": q, "rating": int(digits)})
#         if s["phase"] == "static":
#             s["questions_asked"][trait].append(q)
#         s["current_question"] = None

#         if s["phase"] == "refinement":
#             s["refinement_index"] += 1

#     # Phase switch
#     if s["phase"] == "static":
#         total = sum(len(s["questions_asked"].get(t, [])) for t in TRAITS)
#         if total >= STATIC_QUESTIONS_COUNT:
#             s["phase"] = "refinement"
#             print(f"Switching to refinement phase after {total} static questions")
#             s["refinement_questions"] = generate_refinement_statements(s["answers"])
#             s["refinement_index"] = 0
#             resp.say("Amazing! Now just 5 final questions for perfect accuracy.", language="en-IN")

#     # Refinement phase
#     if s["phase"] == "refinement":
#         if s["refinement_index"] < REFINEMENT_COUNT:
#             q = s["refinement_questions"][s["refinement_index"]]
#             s["current_question"] = ("REFINE", q)
#             gather = resp.gather(num_digits=1, action="/api/question", method="POST", timeout=10)
#             gather.say(f"Final question {s['refinement_index']+1} of 5: {q}", language="en-IN")
#             gather.say("Press 1 to 5 to rate how much you agree.", language="en-IN")
#             resp.redirect("/api/question", method="POST")
#             CALL_SESSIONS[sid] = s
#             return Response(str(resp), mimetype="text/xml")
#         else:
#             result = get_final_recommendations(s["answers"])
#             resp.say("Thank you! Your quiz is complete.", language="en-IN")
#             resp.say(result, language="en-IN")
#             resp.say("Visit apnidisha.com • Goodbye!", language="en-IN")
#             CALL_SESSIONS.pop(sid, None)
#             return Response(str(resp), mimetype="text/xml")

#     # Static phase
#     next_q = get_next_question(s["questions_asked"])
#     if not next_q:
#         result = get_final_recommendations(s["answers"])
#         resp.say("Quiz complete!", language="en-IN")
#         resp.say(result, language="en-IN")
#         CALL_SESSIONS.pop(sid, None)
#         return Response(str(resp), mimetype="text/xml")

#     trait, q = next_q
#     s["current_question"] = (trait, q)
#     gather = resp.gather(num_digits=1, action="/api/question", method="POST", timeout=10)
#     gather.say(q, language="en-IN")
#     gather.say("Press 1 strongly disagree, 5 strongly agree.", language="en-IN")
#     resp.redirect("/api/question", method="POST")
#     CALL_SESSIONS[sid] = s
#     return Response(str(resp), mimetype="text/xml")

from flask import Blueprint, request, Response
from twilio.twiml.voice_response import VoiceResponse
from pathlib import Path
import json
import random
import os
import re

from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

load_dotenv()

voice_riasec_bp = Blueprint("voice_riasec_bp", __name__)

# ---------------- CONFIG ----------------
BASE_DIR = Path(__file__).resolve().parent.parent
QUESTIONS_FILE = BASE_DIR / "services" / "questions.json"

TRAITS = ["R", "I", "A", "S", "E", "C"]
SCORE_MAP = {1: 0.0, 2: 0.25, 3: 0.5, 4: 0.75, 5: 1.0}
STATIC_QUESTIONS_COUNT = 3   # Change to 15 for full quiz
REFINEMENT_COUNT = 5

# ---------------- GROQ + LLAMA3.3-70B ----------------
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if GROQ_API_KEY:
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0.7,
        max_tokens=1024,
        groq_api_key=GROQ_API_KEY
    )
    print("Groq + Llama3.3-70B-Versatile loaded successfully!")
else:
    llm = None
    print("GROQ_API_KEY not found! Running in fallback mode.")

# Load static questions
QUESTION_BANK = {}
if QUESTIONS_FILE.exists():
    with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
        QUESTION_BANK = json.load(f)

CALL_SESSIONS = {}

# ---------------- LANGCHAIN CHAINS ----------------
refinement_prompt = ChatPromptTemplate.from_template("""
You are an expert Indian career psychologist.

Generate exactly 5 short, powerful statements to refine the user's career interests.
Make them highly discriminating and personalized.

User's RIASEC answers so far:
{answers}

RULES:
- Return ONLY a valid JSON array of 5 strings
- No explanation, no markdown, no code blocks
- Example: ["You love solving complex algorithms", "You enjoy public speaking in front of thousands"]

Generate now:
""")

refinement_chain = refinement_prompt | llm | StrOutputParser()

recommendation_prompt = ChatPromptTemplate.from_template("""
You are India's #1 career counselor.

User completed RIASEC + 5 refinement questions.

Give 2–3 perfect career suggestions with Indian education paths.
The model’s primary objective is to generate real, verifiable careers based on psychometric traits, academic interests, or user preferences. All outputs must be limited to authentic, established professions recognized in standard career databases (e.g. O*NET, NCDA, NCS, India’s National Career Service, U.S. Department of Labor, etc.).

RULES:
No fabricated careers. Reject or replace any career title not found in standard databases or professional classifications.

Use canonical career names (e.g., “Mechanical Engineer”, not “Automotive Engineer Specialist” unless it’s a recognized specialization).

Explanation constraint: Each "reason" must derive strictly from valid trait-to-career mappings (Holland RIASEC, MBTI, or psychometric models) — do not overgeneralize or reuse vague templates.

Stream assignment (science, commerce, arts, vocational) must align with standard educational pathways in real-world curricula.

Degree suggestions must correspond to recognized undergraduate or diploma-level programs offered by accredited universities or boards.

Do not reuse phrasing or produce repetitive reasons across careers.

Do not include fantasy, fictional, speculative, or future roles (e.g., “AI Surgeon”, “Space Tourism Officer”).

Validate all output careers against at least one real-world occupational group (engineering, health, social work, law, business, art, etc.).

If the input traits do not strongly match any specific profession, output general career clusters (e.g., “Engineering”, “Healthcare”, “Arts and Design”) rather than invented job titles.
Return ONLY valid JSON:

{{
  "recommendations": [
    {{
      "career": "Data Scientist",
      "reason": "Strong Investigative + Realistic traits with passion for analytics",
      "stream": "science",
      "degrees": [
        {{"degree": "B.Tech", "specializations": ["CSE", "Data Science", "AI"]}},
        {{"degree": "B.Sc", "specializations": ["Statistics", "Mathematics"]}}
      ]
    }}
  ]
}}

User answers:
{answers}

RIASEC scores: {scores}

Generate now.
""")

recommendation_chain = recommendation_prompt | llm | StrOutputParser()

# ---------------- HELPERS ----------------
def normalize_scores(raw_scores, questions_asked):
    normalized = {}
    for t in TRAITS:
        n = questions_asked.get(t, 0)
        normalized[t] = 0.5 if n == 0 else round(raw_scores.get(t, 0) / n, 4)
    return normalized

def get_next_question(questions_asked):
    counts = {t: len(questions_asked.get(t, [])) for t in TRAITS}
    min_count = min(counts.values())
    candidates = [t for t, c in counts.items() if c == min_count]
    trait = random.choice(candidates)
    available = [q for q in QUESTION_BANK.get(trait, []) if q not in questions_asked.get(trait, [])]
    if not available:
        available = QUESTION_BANK.get(trait, [])[:]
    if not available:
        return None
    return trait, random.choice(available)

def generate_refinement_statements(answers_so_far):
    fallback = [
        "You enjoy working with computers and technology.",
        "You love helping and teaching others.",
        "You prefer hands-on practical work.",
        "You enjoy creative arts and design.",
        "You want to start your own business."
    ]

    if not llm or len(answers_so_far) < 3:
        print("Refinement: Using fallback")
        return fallback

    try:
        print(f"Generating refinement questions from {len(answers_so_far)} answers...")
        raw_output = refinement_chain.invoke({
            "answers": json.dumps(answers_so_far[-12:], indent=2)
        })
        print(f"\nRAW GROQ OUTPUT:\n{raw_output}\n{'='*60}")

        match = re.search(r'\[.*\]', raw_output, re.DOTALL)
        if match:
            questions = json.loads(match.group(0))
            if isinstance(questions, list):
                print(f"SUCCESS: Generated {len(questions)} refinement questions!")
                return questions[:5] if len(questions) >= 5 else questions + fallback[len(questions):5]

        lines = [l.strip().strip('",') for l in raw_output.split('\n') if l.strip().startswith('"') or "You " in l]
        if len(lines) >= 5:
            return lines[:5]

        raise ValueError("No valid statements")

    except Exception as e:
        print(f"Refinement FAILED: {e}")
        return fallback

def get_final_recommendations(answers):
    if not answers:
        return "No answers recorded."

    raw = {t: 0.0 for t in TRAITS}
    count = {t: 0 for t in TRAITS}
    for a in answers:
        if a["trait"] in TRAITS:
            raw[a["trait"]] += SCORE_MAP.get(a["rating"], 0)
            count[a["trait"]] += 1
    scores = normalize_scores(raw, count)
    top3 = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:3]

    trait_names = {"R": "Realistic", "I": "Investigative", "A": "Artistic",
                   "S": "Social", "E": "Enterprising", "C": "Conventional"}
    top_text = "Your top traits: " + ", ".join(f"{trait_names[t]} ({s:.2f})" for t, s in top3)

    if not llm:
        return f"{top_text}. Visit apnidisha.com for suggestions."

    try:
        raw_output = recommendation_chain.invoke({
            "answers": json.dumps(answers, indent=2),
            "scores": json.dumps(scores, indent=2)
        })
        match = re.search(r'\{.*\}', raw_output, re.DOTALL)
        if match:
            result = json.loads(match.group(0))
            if "recommendations" in result:
                text = "Here are your best career matches: "
                for i, rec in enumerate(result["recommendations"][:3], 1):
                    text += f"Option {i}: {rec['career']} in {rec['stream']} stream because {rec['reason']}. "
                    for deg in rec['degrees'][:2]:
                        specs = ", ".join(deg['specializations'][:3])
                        text += f"Pursue {deg['degree']} in {specs}. "
                return f"{top_text}. {text}"
        raise ValueError("Invalid response")
    except Exception as e:
        print(f"Final recommendation failed: {e}")
        return f"{top_text}. Explore careers at apnidisha.com"

# ---------------- ROUTES ----------------

@voice_riasec_bp.route("/start", methods=["POST"])
def start_call():
    sid = request.form.get("CallSid")
    CALL_SESSIONS[sid] = {
        "questions_asked": {t: [] for t in TRAITS},
        "answers": [],
        "current_question": None,
        "phase": "static",
        "refinement_questions": [],
        "refinement_index": 0
    }

    resp = VoiceResponse()
    resp.say("Welcome to Apni Disha career quiz!", language="en-IN")
    resp.say("Rate each statement from 1 strongly disagree to 5 strongly agree.", language="en-IN")
    resp.say("To repeat the question, press 9.", language="en-IN")
    resp.redirect("/api/question", method="POST")
    return Response(str(resp), mimetype="text/xml")

@voice_riasec_bp.route("/question", methods=["POST"])
def handle_question():
    sid = request.form.get("CallSid")
    digits = request.form.get("Digits", "").strip()

    if sid not in CALL_SESSIONS:
        CALL_SESSIONS[sid] = {
            "questions_asked": {t: [] for t in TRAITS},
            "answers": [], "current_question": None,
            "phase": "static", "refinement_questions": [], "refinement_index": 0
        }

    s = CALL_SESSIONS[sid]
    resp = VoiceResponse()

    # Handle special keys
    if digits == "9":
        if s["current_question"]:
            trait, q = s["current_question"]
            resp.say("Repeating the question.", language="en-IN")
            gather = resp.gather(num_digits=1, action="/api/question", method="POST", timeout=15)
            gather.say(q, language="en-IN")
            gather.say("Press 1 to 5 to rate, or 9 to repeat again.", language="en-IN")
            resp.redirect("/api/question", method="POST")
            return Response(str(resp), mimetype="text/xml")
        else:
            resp.say("No question to repeat. Continuing.", language="en-IN")

    # Invalid input (not 1-5 and not 9)
    if digits and digits not in ["1","2","3","4","5","9"]:
        resp.say("Invalid input. Please press 1 to 5 to answer, or 9 to repeat the question.", language="en-IN")
        # Repeat current question
        if s["current_question"]:
            trait, q = s["current_question"]
            gather = resp.gather(num_digits=1, action="/api/question", method="POST", timeout=15)
            gather.say(q, language="en-IN")
            gather.say("Press 1 to 5 to rate.", language="en-IN")
            resp.redirect("/api/question", method="POST")
            return Response(str(resp), mimetype="text/xml")

    # Store valid answer (1–5)
    if digits in ["1","2","3","4","5"] and s["current_question"]:
        rating = int(digits)
        trait, q = s["current_question"]
        s["answers"].append({"trait": trait, "question": q, "rating": rating})
        if s["phase"] == "static":
            s["questions_asked"][trait].append(q)
        s["current_question"] = None

        if s["phase"] == "refinement":
            s["refinement_index"] += 1

    # Phase: Static → Refinement
    if s["phase"] == "static":
        total = sum(len(s["questions_asked"].get(t, [])) for t in TRAITS)
        if total >= STATIC_QUESTIONS_COUNT:
            s["phase"] = "refinement"
            print(f"Switching to refinement phase after {total} static questions")
            s["refinement_questions"] = generate_refinement_statements(s["answers"])
            s["refinement_index"] = 0
            resp.say("Great! Now 5 final personalized questions for the best accuracy.", language="en-IN")

    # Refinement phase
    if s["phase"] == "refinement":
        if s["refinement_index"] < REFINEMENT_COUNT:
            q = s["refinement_questions"][s["refinement_index"]]
            s["current_question"] = ("REFINE", q)
            gather = resp.gather(num_digits=1, action="/api/question", method="POST", timeout=15)
            gather.say(f"Question {s['refinement_index']+1} of 5: {q}", language="en-IN")
            gather.say("Press 1 to 5 to rate how much you agree, or 9 to repeat.", language="en-IN")
            resp.redirect("/api/question", method="POST")
            CALL_SESSIONS[sid] = s
            return Response(str(resp), mimetype="text/xml")
        else:
            result = get_final_recommendations(s["answers"])
            resp.say("Thank you! Your quiz is complete.", language="en-IN")
            resp.say(result, language="en-IN")
            resp.say("Visit apnidisha.com for more. Goodbye!", language="en-IN")
            CALL_SESSIONS.pop(sid, None)
            return Response(str(resp), mimetype="text/xml")

    # Static phase: next question
    next_q = get_next_question(s["questions_asked"])
    if not next_q:
        result = get_final_recommendations(s["answers"])
        resp.say("Quiz complete!", language="en-IN")
        resp.say(result, language="en-IN")
        CALL_SESSIONS.pop(sid, None)
        return Response(str(resp), mimetype="text/xml")

    trait, q = next_q
    s["current_question"] = (trait, q)
    gather = resp.gather(num_digits=1, action="/api/question", method="POST", timeout=15)
    gather.say(q, language="en-IN")
    gather.say("Press 1 strongly disagree, 5 strongly agree, or 9 to repeat.", language="en-IN")
    resp.redirect("/api/question", method="POST")
    CALL_SESSIONS[sid] = s
    return Response(str(resp), mimetype="text/xml")