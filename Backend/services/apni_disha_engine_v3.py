#!/usr/bin/env python3
"""
Apni Disha — Final Engine v3
Single-file engine that:
- Builds deterministic Holland-code -> numeric RIASEC vectors (includes Sports careers)
- Detects free-text preferences (e.g., 'cricket') and boosts traits
- Runs adaptive RIASEC Qs + domain-aware MCQs
- Performs aggressive but controlled elimination
- Uses deterministic rule-based explanations (no LLM hallucination)
- Exposes predict_for_profile() and evaluate() utilities

Run: python apni_disha_engine_v3.py
"""

import json
import random
import os
from pathlib import Path
from typing import Dict, List, Tuple

# --------------------
# Config & paths
# --------------------
DATA_DIR = Path(".")
RIASEC_CODES_FILE = DATA_DIR / "riasec_codes_full.json"
CAREERS_FINAL_FILE = DATA_DIR / "careers_master_final.json"
TESTSET_FINAL_FILE = DATA_DIR / "testset_final.json"
QUESTIONS_FILE = DATA_DIR / "questions.json"  # use provided questions.json (180 q)
NUM_RIASEC_QUESTIONS = 8
NUM_MCQ = 5

TRAITS = ["R", "I", "A", "S", "E", "C"]

# domain keywords (sports + others)
DOMAIN_KEYWORDS = {
    "sports": ["cricket", "sports", "athlete", "coach", "training", "gym", "fitness", "match", "ball"],
    # other domains can be added easily: "agri": [...], "tech": [...], etc.
}

# elimination parameters
LOW_THRESHOLD = 0.2     # if user trait <= LOW_THRESHOLD and career trait >= 0.7 -> reject
HIGH_THRESHOLD = 0.8    # if user trait >= HIGH_THRESHOLD and career trait <= 0.3 -> reject

# bootstrap default questions (if questions.json absent, fallback)
DEFAULT_QUESTIONS = {
    "R": [
        "Do you enjoy working with tools, machines, or repairing equipment?",
        "Do outdoor/manual tasks energize you more than desk tasks?"
    ],
    "I": [
        "Do you enjoy research, analysis, and solving complex problems?",
        "Do you like subjects like mathematics, physics, or chemistry?"
    ],
    "A": [
        "Do you enjoy creating art, design, or creative concepts?",
        "Would you rather design a poster than solve a spreadsheet problem?"
    ],
    "S": [
        "Do you enjoy helping others and working in community services?",
        "Would you rather counsel or teach than do laboratory research?"
    ],
    "E": [
        "Do you enjoy leading teams, selling ideas, or persuading others?",
        "Would you prefer to run a business than work under strict supervision?"
    ],
    "C": [
        "Do you enjoy organizing information, schedules, and records?",
        "Would you rather follow well-defined procedures and standards?"
    ]
}

# --------------------
# Utility: Holland-code -> vector generator
# --------------------
def holland_to_vector(code: str) -> Dict[str, float]:
    # baseline 0.10 for all; first=0.90, second=0.60, third=0.30
    vec = {t: 0.10 for t in TRAITS}
    if len(code) >= 1 and code[0] in TRAITS:
        vec[code[0]] = 0.90
    if len(code) >= 2 and code[1] in TRAITS:
        vec[code[1]] = 0.60
    if len(code) >= 3 and code[2] in TRAITS:
        vec[code[2]] = 0.30
    # round to 3 decimals
    vec = {k: round(float(v), 3) for k, v in vec.items()}
    return vec

# --------------------
# Provide a default riasec_codes list that includes sports careers
# This file will be written if missing
# --------------------
DEFAULT_RIASEC_CODES = {
    # core examples + sports (shortened for readability; you can expand)
    "Software Developer": "IRC",
    "Data Analyst": "IRC",
    "Mechanical Engineer": "RIE",
    "Civil Engineer": "RIE",
    "Chartered Accountant": "CEI",
    "Teacher / Lecturer": "SIA",
    "Nurse": "SRC",
    "Physician (Doctor)": "IRS",
    "Agriculture Farmer / Entrepreneur": "RES",
    "Horticulture Specialist": "RES",
    "Soil Scientist": "IRC",
    "Entrepreneur / Startup Founder": "EIS",
    # ---- sports careers added explicitly ----
    "Cricketer / Professional Athlete": "RAE",
    "Sports Coach (Cricket)": "SRE",
    "Strength & Conditioning Coach": "RES",
    "Fitness Trainer / Gym Instructor": "RES",
    "Athlete Trainer": "RES",
    "Sports Physiotherapist": "IRS",
    "Sports Nutritionist": "ISR",
    "Sports Psychologist": "SIA",
    "Sports Analyst": "IRC",
    "Sports Manager": "EIS",
    "Sports Performance Analyst": "IRC",
    "Sports Scout / Talent Manager": "EIS",
    "Sports Event Coordinator": "ESR",
    "Sports Journalist": "ASI",
    "Sports Commentator": "AES",
    "Sports Photographer": "AER",
    "Sports Medicine Doctor": "IRS",
    "Sports Rehabilitation Specialist": "SIR",
    "Stadium / Facility Manager": "CER"
    # (rest of careers from your 200 list should be included in real file)
}

# --------------------
# File preparation (create final career vectors if absent)
# --------------------
def ensure_riasec_and_vectors():
    # if riasec_codes_full.json missing, create it from DEFAULT_RIASEC_CODES
    if not RIASEC_CODES_FILE.exists():
        print("riasec_codes_full.json missing — creating default file (includes sports careers).")
        json.dump(DEFAULT_RIASEC_CODES, open(RIASEC_CODES_FILE, "w", encoding="utf-8"), indent=2)
    # load codes
    codes = json.load(open(RIASEC_CODES_FILE, "r", encoding="utf-8"))
    # generate career vectors
    final = {}
    for career, code in codes.items():
        final[career] = {
            "riasec": holland_to_vector(code),
            "holland_code": code
        }
    # save final careers master
    json.dump(final, open(CAREERS_FINAL_FILE, "w", encoding="utf-8"), indent=2)
    print(f"Saved career vectors to {CAREERS_FINAL_FILE}")
    return final

# --------------------
# Load questions (fallback to DEFAULT_QUESTIONS if not present)
# --------------------
def load_questions():
    if QUESTIONS_FILE.exists():
        try:
            q = json.load(open(QUESTIONS_FILE, "r", encoding="utf-8"))
            # expect structure per trait, else fallback
            if all(t in q for t in TRAITS):
                return q
        except Exception:
            pass
    # fallback build 10 variations each trait
    fallback = {t: [] for t in TRAITS}
    for t in TRAITS:
        base = DEFAULT_QUESTIONS.get(t, [])
        # replicate to get at least 8-12
        i = 0
        while len(fallback[t]) < 12:
            p = base[i % len(base)]
            fallback[t].append(p if i < len(base) else p + " (would you?)")
            i += 1
    return fallback

# --------------------
# Domain detection & user pre-boost
# --------------------
def detect_domain_preference(text: str):
    txt = text.lower() if text else ""
    for domain, keywords in DOMAIN_KEYWORDS.items():
        for k in keywords:
            if k in txt:
                return domain
    return None

def domain_boost_map(domain: str):
    # return additive boost values for traits
    if domain == "sports":
        # sports -> increase Realistic (R) and slight Enterprising (E), possible Social (S)
        return {"R": 0.18, "E": 0.08, "S": 0.05}
    return {t: 0.0 for t in TRAITS}

# --------------------
# Similarity scoring & elimination
# --------------------
def sim_score(user_vec: Dict[str,float], career_vec: Dict[str,float]) -> float:
    # dot product; both vectors in 0..1
    return sum(user_vec[t] * career_vec[t] for t in TRAITS)

def eliminate_careers_by_threshold(careers: List[str], career_map: Dict[str, dict], user_vec: Dict[str,float]):
    survivors = []
    for c in careers:
        vec = career_map[c]["riasec"]
        bad = False
        for t in TRAITS:
            if user_vec[t] <= LOW_THRESHOLD and vec[t] >= 0.7:
                bad = True
                break
            if user_vec[t] >= HIGH_THRESHOLD and vec[t] <= 0.3:
                bad = True
                break
        if not bad:
            survivors.append(c)
    return survivors

# --------------------
# Deterministic explanation generator
# --------------------
TRAIT_MEANINGS = {
    "R": "hands-on, physical and practical tasks (outdoor/workshop)",
    "I": "analytical, research, and technical problem solving",
    "A": "creative, artistic and design-oriented activities",
    "S": "social, caring, and people-focused roles",
    "E": "leadership, persuasion, and business-oriented roles",
    "C": "structured, detail-oriented and procedural work"
}

def build_explanation(career: str, user_vec: Dict[str,float], career_vec: Dict[str,float]) -> str:
    # find top user trait and top matching career traits
    top_user_trait = max(user_vec, key=user_vec.get)
    # highlight 2-3 matching reasons
    matches = sorted(TRAITS, key=lambda t: (user_vec[t]*career_vec[t]), reverse=True)[:2]
    reasons = []
    for t in matches:
        reasons.append(TRAIT_MEANINGS[t])
    return f"{career} matches because the user shows strong {top_user_trait}-type interest ({TRAIT_MEANINGS[top_user_trait]}), and the role requires {', '.join(reasons)}."

# --------------------
# MCQ generation (domain-aware)
# --------------------
def generate_mcqs(domain: str, num: int = NUM_MCQ):
    mcqs = []
    if domain == "sports":
        pool = [
            ("Do you enjoy regular structured physical training?", {"A":"Yes, regularly","B":"Occasionally","C":"Prefer irregular activity","D":"Not at all"}),
            ("Would you like to coach or teach sports to others?", {"A":"Yes, professionally","B":"Casually","C":"No","D":"Maybe"}),
            ("Are you comfortable with outdoor weather and travel for matches?", {"A":"Yes","B":"Sometimes","C":"No","D":"Only local"}),
            ("Do you enjoy analyzing performance metrics (speed, accuracy) in sports?", {"A":"Yes","B":"Somewhat","C":"No","D":"Not sure"}),
            ("Would you prefer a physically active job over a desk job?", {"A":"Definitely","B":"Sometimes","C":"No","D":"Depends on pay"})
        ]
        for q,o in pool[:num]:
            mcqs.append({"question": q, "options": o})
    else:
        # generic MCQs focusing on analytical/creative/structured/people dimensions
        pool = [
            ("When working on a project, what kind of environment do you prefer?",
             {"A":"Working alone, focusing on precise details","B":"Collaborating in a creative team","C":"Leading a group to achieve goals","D":"Flexible/independent work"}),
            ("What drives your motivation in a career?",
             {"A":"Accuracy and optimization","B":"Creative impact","C":"Helping people","D":"Building/growing something"}),
            ("How do you approach problem-solving?",
             {"A":"Analytical and methodical","B":"Brainstorming and unconventional ideas","C":"Following standard procedures","D":"Adapting quickly to change"}),
            ("Which outcome is most satisfying?",
             {"A":"Correct results and precision","B":"Recognition for creativity","C":"Making a social impact","D":"Business success and leadership"}),
            ("Do you prefer structured schedules or flexible hours?",
             {"A":"Structured","B":"Flexible","C":"Depends on work","D":"I like autonomy"})
        ]
        for q,o in pool[:num]:
            mcqs.append({"question": q, "options": o})
    return mcqs

# --------------------
# Interactive flow + predict_for_profile wrapper
# --------------------
def run_interactive():
    print("=== Apni Disha: Engine v3 ===")
    print(f"Adaptive {NUM_RIASEC_QUESTIONS} RIASEC questions, domain-aware MCQs, deterministic explanations.")
    print()
    # prepare dataset (vectors)
    career_map = ensure_riasec_and_vectors()
    career_list = list(career_map.keys())

    # questions load
    qbank = load_questions()

    # pre-input: user free-text preference
    raw_pref = input("Do you already have a career in mind or family profession? (type or Enter to skip):\n> ").strip()
    detected_domain = detect_domain_preference(raw_pref)
    if detected_domain:
        print(f"Detected domain preference: {detected_domain.upper()}")
        pre_boost = domain_boost_map(detected_domain)
    else:
        pre_boost = {t:0.0 for t in TRAITS}

    # RIASEC questioning
    user_raw_scores = {t: 0.0 for t in TRAITS}
    counts = {t: 0 for t in TRAITS}
    asked = 0
    while asked < NUM_RIASEC_QUESTIONS:
        # choose trait with fewest asked
        min_count = min(counts.values())
        candidates = [t for t,c in counts.items() if c == min_count]
        trait = random.choice(candidates)
        question = random.choice(qbank.get(trait, DEFAULT_QUESTIONS[trait]))
        print(f"\nQuestion {asked+1}/{NUM_RIASEC_QUESTIONS} [{trait}]")
        print(" ", question)
        while True:
            ans = input("Your rating (1-5): ").strip()
            if ans.isdigit() and 1 <= int(ans) <= 5:
                rating = int(ans)
                break
            print("Please enter an integer 1..5.")
        # convert rating to contribution (0..1)
        contrib = {1:0.0, 2:0.25, 3:0.5, 4:0.75, 5:1.0}[rating]
        user_raw_scores[trait] += contrib
        counts[trait] += 1
        asked += 1

        # compute intermediate normalized user vec
        user_vec = {}
        for t in TRAITS:
            if counts[t] == 0:
                user_vec[t] = 0.5
            else:
                user_vec[t] = round(user_raw_scores[t] / counts[t], 3)
        # apply pre-boost (domain)
        for t in TRAITS:
            user_vec[t] = max(0.0, min(1.0, round(user_vec[t] + pre_boost.get(t, 0.0), 3)))

        # elimination step
        remaining = eliminate_careers_by_threshold(career_list, career_map, user_vec)
        career_list = remaining
        print(f"  → {len(career_list)} careers remaining in consideration")

    # Stage 1 done
    print("\n--- Stage 1 RIASEC complete ---")
    # final normalized user vector
    user_vec = {}
    for t in TRAITS:
        user_vec[t] = round((user_raw_scores[t] / counts[t]) if counts[t] > 0 else 0.5, 3)
        user_vec[t] = round(max(0.0, min(1.0, user_vec[t] + pre_boost.get(t, 0.0))), 3)

    print("\nGenerating MCQs (domain-aware)...")
    mcqs = generate_mcqs(detected_domain, NUM_MCQ)
    # Ask MCQs
    for i, mcq in enumerate(mcqs, start=1):
        print(f"\nMCQ {i}: {mcq['question']}")
        for opt_key, opt_text in mcq["options"].items():
            print(f"  {opt_key}. {opt_text}")
        while True:
            choice = input("Choice (A/B/C/D): ").strip().upper()
            if choice in ("A","B","C","D"):
                break
            print("Choose A/B/C/D.")
        # simple mapping from choices to small nudges
        if detected_domain == "sports":
            # A->strong sports alignment, B->moderate, C->weak, D->neutral
            if choice == "A":
                user_vec["R"] = min(1.0, user_vec["R"] + 0.07)
            elif choice == "B":
                user_vec["R"] = min(1.0, user_vec["R"] + 0.03)
            elif choice == "C":
                user_vec["R"] = max(0.0, user_vec["R"] - 0.03)
        else:
            # generic mapping: A analytical, B creative, C structured, D flexible
            if choice == "A":
                user_vec["I"] = min(1.0, user_vec["I"] + 0.05)
                user_vec["C"] = min(1.0, user_vec["C"] + 0.03)
            elif choice == "B":
                user_vec["A"] = min(1.0, user_vec["A"] + 0.06)
            elif choice == "C":
                user_vec["C"] = min(1.0, user_vec["C"] + 0.05)
            elif choice == "D":
                user_vec["E"] = min(1.0, user_vec["E"] + 0.04)

        # re-run elimination after each MCQ
        career_list = eliminate_careers_by_threshold(career_list, career_map, user_vec)
        print(f"  → {len(career_list)} careers remaining after MCQ")

    # Final ranking by similarity from remaining careers
    scored = []
    for c in career_list:
        sc = sim_score(user_vec, career_map[c]["riasec"])
        scored.append((c, round(sc,6)))
    scored.sort(key=lambda x: x[1], reverse=True)
    top_k = scored[:10]

    # Build deterministic recommendations (top 3)
    recs = []
    for career_name, score in top_k[:3]:
        recs.append({
            "career": career_name,
            "confidence": round(min(0.98, 0.3 + score), 3),  # simple mapping to confidence
            "reason": build_explanation(career_name, user_vec, career_map[career_name]["riasec"]),
            "stream": "science" if career_map[career_name]["riasec"]["I"] >= 0.6 or career_map[career_name]["riasec"]["R"] >= 0.7 else "other",
            "approx_score": score
        })

    # Print result
    print("\n=== FINAL RECOMMENDATIONS ===")
    for i,r in enumerate(recs, start=1):
        print(f"\n{i}. {r['career']} (confidence {r['confidence']})")
        print("   Reason:", r['reason'])
        print("   Score:", r['approx_score'])

    # Return object for programmatic use
    return {
        "user_vec": user_vec,
        "top_scored": top_k,
        "recommendations": recs
    }

# --------------------
# Predict wrapper (for evaluation and programmatic use)
# --------------------
def predict_for_profile(user_riasec: Dict[str,float], domain: str = None, top_k: int = 10):
    career_map = ensure_riasec_and_vectors()
    career_list = list(career_map.keys())
    # apply domain boost if set
    pre_boost = domain_boost_map(domain) if domain else {t:0.0 for t in TRAITS}
    user_vec = {t: round(max(0.0, min(1.0, user_riasec.get(t, 0.5) + pre_boost.get(t,0.0))), 3) for t in TRAITS}
    # eliminate
    career_list = eliminate_careers_by_threshold(career_list, career_map, user_vec)
    # score and return top_k
    scored = [(c, round(sim_score(user_vec, career_map[c]["riasec"]),6)) for c in career_list]
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[:top_k]

# --------------------
# Evaluation helper
# --------------------
def generate_testset_final():
    career_map = ensure_riasec_and_vectors()
    test = []
    uid = 1
    for career, data in career_map.items():
        base = data["riasec"]
        noisy = {t: round(max(0, min(1, base[t] + random.uniform(-0.05, 0.05))), 3) for t in TRAITS}
        test.append({"user_id": uid, "riasec": noisy, "true_top_careers": [career]})
        uid += 1
    json.dump(test, open(TESTSET_FINAL_FILE, "w", encoding="utf-8"), indent=2)
    print(f"Saved {len(test)} profiles to {TESTSET_FINAL_FILE}")
    return test

def evaluate_testset(file: Path = TESTSET_FINAL_FILE):
    if not file.exists():
        generate_testset_final()
    testset = json.load(open(file, "r", encoding="utf-8"))
    career_map = ensure_riasec_and_vectors()
    top1 = top3 = top5 = 0
    for user in testset:
        true = user["true_top_careers"][0]
        preds = predict_for_profile(user["riasec"], domain=None, top_k=10)
        pred_list = [p[0] for p in preds]
        if pred_list and pred_list[0] == true:
            top1 += 1
        if true in pred_list[:3]:
            top3 += 1
        if true in pred_list[:5]:
            top5 += 1
    total = len(testset)
    report = {
        "total": total,
        "top1": round(top1/total, 4),
        "top3": round(top3/total, 4),
        "top5": round(top5/total, 4)
    }
    print("Evaluation report:", report)
    return report

# --------------------
# CLI entry
# --------------------
if __name__ == "__main__":
    # quick checks and interactive run
    ensure_riasec_and_vectors()
    print("\nReady. Choose an action:")
    print("1) Run interactive recommendation")
    print("2) Run evaluation on generated testset")
    print("3) Generate testset only")
    print("4) Quick predict-from-riasec example")
    choice = input("> ").strip()
    if choice == "1":
        run_interactive()
    elif choice == "2":
        evaluate_testset()
    elif choice == "3":
        generate_testset_final()
    else:
        # demo predict
        demo = {"R":0.9,"I":0.2,"A":0.05,"S":0.4,"E":0.1,"C":0.3}
        print("Demo predict for vector:", demo)
        print(predict_for_profile(demo, domain="sports"))
