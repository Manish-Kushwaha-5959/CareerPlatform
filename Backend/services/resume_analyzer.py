

import os
from dotenv import load_dotenv
from pypdf import PdfReader
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()

class ResumeAnalyzerService:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.3,
            google_api_key=os.getenv("GEMINI_API_KEY")
        )

        self.prompt = ChatPromptTemplate.from_template("""
SYSTEM INSTRUCTION (MANDATORY):
You are a deterministic JSON generation engine.
Your response will be parsed using a strict JSON parser.
If the output is not valid JSON, the response is considered a FAILURE.

ABSOLUTE RULES:
- Output ONLY a single JSON object
- NO markdown
- NO comments
- NO explanations
- NO leading or trailing text
- NO trailing commas
- NO newline text before or after JSON
- Use double quotes ONLY
- Output must be parseable by json.loads()

=====================
INPUT
=====================
Resume Content:
{resume}

Target Career Role:
{career}

=====================
OBJECTIVE
=====================
Deliver a clean, high-impact, non-overwhelming skill gap analysis.
Focus ONLY on major, industry-critical skills relevant to the Indian job market.
Ignore minor or low-impact skills completely.

=====================
ANALYSIS STEPS
=====================

1. Identify the correct career domain.
   Choose exactly ONE:
   - Data & AI
   - Software/IT
   - Core Engineering
   - Cybersecurity
   - Armed Forces (Combat)
   - Armed Forces (Technical)
   - Business/Management
   - Design/Creative
   - Healthcare
   - Others

2. Extract explicit technical skills from the resume.
   Infer ONLY directly related foundational skills.
   Discard irrelevant skills.

3. Define ONLY 8–12 MOST CRITICAL skills required for the role in India.
   Prioritize recruiter-evaluated skills.
   Do NOT create exhaustive lists.

4. Compare HIGH-IMPACT resume skills with required skills.
   Match Percentage Formula:
   (Matched High-Impact Skills / Total Required Critical Skills) × 100
   Round to nearest whole number.
   Be conservative.

5. Identify ONLY the TOP 5–6 CRITICAL missing skills.

6. Generate a structured, realistic improvement roadmap:
   - Phase 1: Foundation (Month 1–2)
   - Phase 2: Core Development (Month 3–4)
   - Phase 3: Advanced Application (Month 5–6)
   - Phase 4: Industry Readiness (Month 7–8)
   Each phase must have 2–4 actionable items.

=====================
OUTPUT FORMAT (STRICT)
=====================

{{
  "career_domain": "",
  "technical_match_percentage": 0,
  "major_strengths": [],
  "major_skill_gaps": [],
  "skill_breakdown": {{
    "core_technical_missing": [],
    "foundational_missing": [],
    "tools_missing": [],
    "soft_skills_needed": []
  }},
  "structured_roadmap": {{
    "phase_1_foundation_month_1_2": [],
    "phase_2_core_development_month_3_4": [],
    "phase_3_advanced_application_month_5_6": [],
    "phase_4_industry_readiness_month_7_8": []
  }}
}}

FINAL CHECK BEFORE RESPONDING:
- Is the output valid JSON?
- Can it be parsed by json.loads()?
If not, DO NOT respond.
""")


        self.chain = self.prompt | self.llm

    def extract_resume_text(self, file_path: str) -> str:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text

    def analyze(self, file_path: str, career: str) -> str:
        resume_text = self.extract_resume_text(file_path)
        response = self.chain.invoke({
            "resume": resume_text,
            "career": career
        })
        return response.content
