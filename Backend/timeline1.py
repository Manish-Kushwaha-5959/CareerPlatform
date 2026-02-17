# import os
# import io
# import requests
# from dotenv import load_dotenv
# from firecrawl import FirecrawlApp
# import google.generativeai as genai

# # -----------------------------
# #  LOAD .env FILE
# # -----------------------------
# load_dotenv()

# FIRECRAWL_KEY = os.getenv("FIRECRAWL_API_KEY")
# GEMINI_KEY = os.getenv("GEMINI_API_KEY")
# SERPER_KEY = os.getenv("SERPER_API_KEY")

# if not FIRECRAWL_KEY or not GEMINI_KEY or not SERPER_KEY:
#     raise ValueError("❌ Missing API keys in .env")

# genai.configure(api_key=GEMINI_KEY)
# fc = FirecrawlApp(api_key=FIRECRAWL_KEY)


# # ---------------------------------------------------
# # 1️⃣ SEARCH GOOGLE WITH SERPER (HTML FIRST → PDF LATER)
# # ---------------------------------------------------
# def search_google(query):
#     url = "https://google.serper.dev/search"
#     headers = {"X-API-KEY": SERPER_KEY}
#     payload = {"q": query, "gl": "in", "num": 10}

#     data = requests.post(url, json=payload, headers=headers).json()

#     html_link = None
#     pdf_link = None

#     for item in data.get("organic", []):
#         link = item.get("link", "")

#         if "nta.ac.in" in link or "gov.in" in link or "edu.in" in link:
#             if link.endswith(".pdf"):
#                 pdf_link = link
#             else:
#                 html_link = link
#                 break

#     # Prefer HTML; fallback to PDF
#     return html_link or pdf_link


# # ---------------------------------------------------
# # 2️⃣ SCRAPE HTML USING FIRECRAWL v4
# # ---------------------------------------------------
# def scrape_html(url):
#     print(f"🌐 Scraping HTML: {url}")

#     scraped = fc.scrape({
#         "url": url,
#         "formats": ["markdown"]
#     })

#     return scraped.get("markdown", "") or scraped.get("text", "")


# # ---------------------------------------------------
# # 3️⃣ READ PDF BY UPLOADING TO GEMINI (VISION MODEL)
# # ---------------------------------------------------
# def extract_pdf_with_gemini(url):
#     print(f"📄 Downloading PDF for Gemini: {url}")

#     pdf_bytes = requests.get(url).content

#     # Save PDF locally
#     local_pdf_path = "exam_notice.pdf"
#     with open(local_pdf_path, "wb") as f:
#         f.write(pdf_bytes)

#     print("📤 Uploading PDF to Gemini...")

#     # CORRECT upload method for your SDK
#     uploaded = genai.upload_file(path=local_pdf_path)

#     print("🤖 Gemini is reading the PDF...")

#     prompt = """
#     Extract ALL important exam-related dates including:
#     - Application Start & End
#     - Exam Dates
#     - Admit Card Release Date
#     - Correction Window
#     - Result Date
#     - Counselling Dates

#     Return STRICT JSON ONLY:
#     [
#       {"event": "", "date": "", "description": ""}
#     ]
#     """

#     model = genai.GenerativeModel("gemini-2.0-flash")
#     response = model.generate_content([prompt, uploaded])

#     return response.text



# # ---------------------------------------------------
# # 4️⃣ EXTRACT IMPORTANT DATES FROM TEXT (HTML SCRAPE)
# # ---------------------------------------------------
# def extract_dates_from_text(text):
#     model = genai.GenerativeModel("gemini-2.0-flash")

#     prompt = f"""
#     Extract ALL important dates from the text below.

#     Include any:
#     - Registration dates
#     - Exam dates
#     - Correction window
#     - Result dates
#     - Admit card release
#     - Counselling dates
#     - Scholarship deadlines

#     Return ONLY JSON:
#     [
#       {{"event": "", "date": "", "description": ""}}
#     ]

#     TEXT:
#     {text}
#     """

#     response = model.generate_content(prompt)
#     return response.text


# # ---------------------------------------------------
# # 5️⃣ MAIN PIPELINE FUNCTION
# # ---------------------------------------------------
# def get_exam_timeline(exam_name):
#     print(f"\n🔍 Searching exam timeline for: {exam_name}")

#     search_query = f"{exam_name} exam dates official schedule"
#     link = search_google(search_query)

#     print("📌 Best Link Found:", link)

#     if not link:
#         return "❌ No link found"

#     # PDF case
#     if link.lower().endswith(".pdf"):
#         print("➡ PDF detected → Sending to Gemini Vision")
#         return extract_pdf_with_gemini(link)

#     # HTML case
#     print("➡ HTML detected → Scraping with Firecrawl")
#     html_text = scrape_html(link)

#     if len(html_text.strip()) < 30:
#         print("⚠ Empty HTML scrape! Falling back to PDF search...")
#         return "❌ No usable HTML content"

#     print("📄 HTML Content Extracted → Sending to Gemini...")
#     return extract_dates_from_text(html_text)


# # ---------------------------------------------------
# # RUN THE PIPELINE
# # ---------------------------------------------------
# if __name__ == "__main__":
#     result = get_exam_timeline("CET 2025")
#     print("\n📅 FINAL TIMELINE JSON:\n", result)
import os
from dotenv import load_dotenv
import google.generativeai as genai
from datetime import datetime

# --------------------------------------
# LOAD API KEY
# --------------------------------------
load_dotenv()
GEMINI_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_KEY:
    raise ValueError("❌ Missing GEMINI_API_KEY in .env")

genai.configure(api_key=GEMINI_KEY)
model = genai.GenerativeModel("gemini-2.0-flash")


# --------------------------------------
# COURSE → EXAM MAPPING
# --------------------------------------
COURSE_EXAMS = {
    "btech": [
        "JEE Main", "JEE Advanced", "MHT CET", "BITSAT", "VITEEE",
        "COMEDK UGET", "WBJEE", "SRMJEEE", "KIITEE", "AMUEEE",
        "AP EAMCET", "TS EAMCET"
    ],

    "barch": ["NATA", "JEE Main Paper 2A", "MAH B.Arch CET", "COMEDK Architecture"],

    "bdes": ["UCEED", "NID DAT", "NIFT Entrance Exam", "MITID DAT", "Pearl Academy Entrance Exam"],

    "bed": [
        "MAH B.Ed CET", "UP B.Ed JEE", "RIE CEE",
        "DU B.Ed Entrance", "Bihar B.Ed CET", "Haryana B.Ed Entrance"
    ],

    "mbbs": ["NEET UG"],

    "law": ["CLAT", "AILET", "MH CET Law", "LSAT India"],

    "mba": ["CAT", "XAT", "CMAT", "MAT", "SNAP", "NMAT", "MAH MBA CET"],

    "mca": ["NIMCET", "MAH MCA CET", "TANCET MCA", "CUET PG"],

    "mtech": ["GATE", "TS PGECET", "AP PGECET", "TANCET"],

    "mdes": ["CEED", "NID DAT PG", "MITID DAT"]
}


# --------------------------------------
# EXAM TIMELINE FETCHER USING GEMINI
# --------------------------------------
def get_exam_timeline(exam_name):
    current_year = datetime.now().year

    prompt = f"""
You are an expert AI system that extracts **real-time and future exam timelines**.

Exam: {exam_name}

🎯 IMPORTANT RULES:
- Always extract dates for the **upcoming exam cycle**.
- If the exam for {current_year} is OVER → return dates for {current_year + 1}.
- NEVER return dates from **2024 or earlier**.
- If official dates exist → return them.
- If not announced → return EXPECTED dates based on trusted sources:
  - Shiksha
  - CollegeDunia
  - Times of India
  - Allen
  - Aakash Institute

🎯 ALWAYS INCLUDE:
- Registration start date
- Registration end date
- Application correction window
- Admit card release date
- Exam dates (stream-wise if applicable)
- Result date
- Counselling/start of admission process

🎯 OUTPUT FORMAT:
Return STRICT JSON ONLY:

[
  {{
    "exam": "{exam_name}",
    "year": "<year>",
    "event": "",
    "date": "",
    "description": ""
  }}
]

Make sure <year> is the upcoming exam cycle (never past).
"""
    response = model.generate_content(prompt)
    return response.text


# --------------------------------------
# COURSE TIMELINE FETCHER
# --------------------------------------
def get_course_timeline(course_name):
    key = course_name.lower()

    if key not in COURSE_EXAMS:
        return f"❌ Course not found: {course_name}"

    exams = COURSE_EXAMS[key]
    final_output = {}

    print(f"\n🔍 Fetching real-time timeline for COURSE: {course_name.upper()}\n")

    for exam in exams:
        print(f"📘 Getting NEXT exam cycle for: {exam}")
        timeline_json = get_exam_timeline(exam)
        final_output[exam] = timeline_json
        print(f"✅ Done: {exam}\n")

    return final_output


# --------------------------------------
# RUN THE PIPELINE
# --------------------------------------
if __name__ == "__main__":
    course = "btech"   # Try: barch, bdes, bed, mba, mtech, etc.
    result = get_course_timeline(course)

    print("\n📅 FINAL COURSE TIMELINE JSON:\n")
    for exam, timeline in result.items():
        print(f"\n=== {exam} ===\n{timeline}")
