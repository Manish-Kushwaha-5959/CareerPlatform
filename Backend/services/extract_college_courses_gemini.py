# import os
# import json
# import time
# from google import genai
# from google.genai import types
# import dotenv
# dotenv.load_dotenv()


# API_KEY = os.getenv("GEMINI_API_KEY")
# MODEL = "gemini-2.5-flash"

# INPUT_FILE = r"C:\Users\LOQ\Desktop\New folder (3)\ApniDisha\web\Backend\data\nagpur_colleges_nirf_2025.json"

# OUTPUT_FILE = "college_courses_output.json"

# if not API_KEY:
#     raise RuntimeError("Set GEMINI_API_KEY environment variable.")

# client = genai.Client(api_key=API_KEY)
# google_search_tool = types.Tool(google_search=types.GoogleSearch())
# config = types.GenerateContentConfig(tools=[google_search_tool])


# # -------------------------------------------------------------
# # Build prompt strictly producing EXACT OUTPUT FORMAT
# # -------------------------------------------------------------
# def build_prompt(college):
#     college_name = college["name"]
#     aishe = college.get("aishe_code", "")
#     website = college.get("website", "")

#     if website and not website.startswith("http"):
#         website = "https://" + website

#     return f"""
# Search ONLY from:
# - site:shiksha.com
# - site:collegedunia.com
# - {website}

# College: {college_name}
# AISHE Code: {aishe}

# Extract EXACT output in this JSON structure:

# {{
#   "college": "{college_name}",
#   "AISHE_code": "{aishe}",
#   "courses": [
#     {{
#       "name": "<Course Name>",
#       "specializations": [ "<spec1>", "<spec2>" ] OR null,
#       "duration": "<duration>" OR null,
#       "eligibility": "<eligibility>" OR null,
#       "tuition_fee": "<fee>" OR null,
#       "annual_fee": "<annual fee>" OR null
#     }}
#   ],
#   "note": "Fees vary by specialization, category, and may include additional development and exam fees."
# }}

# RULES:
# - Return ONLY valid JSON. No markdown, no explanations.
# - Include only verified courses.
# - Use null for missing fields.
# """.strip()


# # -------------------------------------------------------------
# # Extract JSON safely even if model adds some extra text
# # -------------------------------------------------------------
# def extract_json(text):
#     try:
#         return json.loads(text)
#     except:
#         # fallback — capture JSON block
#         start = text.find("{")
#         end = text.rfind("}")
#         if start != -1 and end != -1:
#             return json.loads(text[start:end + 1])
#         raise ValueError("Could not parse JSON response.")


# # -------------------------------------------------------------
# # Process all colleges
# # -------------------------------------------------------------
# def process_colleges():
#     with open(INPUT_FILE, "r", encoding="utf-8") as f:
#         colleges = json.load(f)

#     results = []

#     for i, college in enumerate(colleges, start=1):
#         print(f"\n[{i}/{len(colleges)}] Processing: {college['name']}")

#         prompt = build_prompt(college)

#         try:
#             response = client.models.generate_content(
#                 model=MODEL,
#                 contents=prompt,
#                 config=config
#             )

#             text = response.text
#             data = extract_json(text)

#             results.append(data)

#         except Exception as e:
#             print("Error:", e)
#             results.append({
#                 "college": college["name"],
#                 "AISHE_code": college.get("aishe_code", ""),
#                 "courses": [],
#                 "note": f"FAILED: {str(e)}"
#             })

#         # --- WAIT 2 SECONDS BEFORE NEXT ---
#         time.sleep(2)

#     with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
#         json.dump(results, f, indent=2, ensure_ascii=False)

#     print("\nDone! Output saved to:", OUTPUT_FILE)


# if __name__ == "__main__":
#     process_colleges()

# import os
# import json
# import time
# from google import genai
# from google.genai import types
# import dotenv
# dotenv.load_dotenv()


# API_KEY = os.getenv("GEMINI_API_KEY")
# MODEL = "gemini-2.5-flash"

# INPUT_FILE = r"C:\Users\LOQ\Desktop\New folder (3)\ApniDisha\web\Backend\data\nagpur_colleges_nirf_2025.json"
# OUTPUT_FILE = r"C:\Users\LOQ\Desktop\New folder (3)\ApniDisha\web\Backend\data\college_courses_output2.json"

# if not API_KEY:
#     raise RuntimeError("Set GEMINI_API_KEY environment variable.")

# client = genai.Client(api_key=API_KEY)
# google_search_tool = types.Tool(google_search=types.GoogleSearch())
# config = types.GenerateContentConfig(tools=[google_search_tool])


# # -------------------------------------------------------------
# # Build prompt strictly producing EXACT OUTPUT FORMAT
# # -------------------------------------------------------------
# def build_prompt(college):
#     college_name = college["name"]
#     aishe = college.get("aishe_code", "")
#     website = college.get("website", "")

#     if website and not website.startswith("http"):
#         website = "https://" + website

#     return f"""
# Search ONLY from:
# - site:shiksha.com
# - site:collegedunia.com
# - {website}

# College: {college_name}
# AISHE Code: {aishe}

# Extract EXACT output in this JSON structure:

# {{
#   "college": "{college_name}",
#   "AISHE_code": "{aishe}",
#   "courses": [
#     {{
#       "name": "<Course Name>",
#       "specializations": [ "<spec1>", "<spec2>" ] OR null,
#       "duration": "<duration>" OR null,
#       "eligibility": "<eligibility>" OR null,
#       "tuition_fee": "<fee>" OR null,
#       "annual_fee": "<annual fee>" OR null
#     }}
#   ],
#   "note": "Fees vary by specialization, category, and may include additional development and exam fees."
# }}

# RULES:
# - Return ONLY valid JSON. No markdown, no explanations.
# - Include only verified courses.
# - Use null for missing fields.
# """.strip()


# # -------------------------------------------------------------
# # Extract JSON safely even if model adds extra text
# # -------------------------------------------------------------
# def extract_json(text):
#     try:
#         return json.loads(text)
#     except:
#         start = text.find("{")
#         end = text.rfind("}")
#         if start != -1 and end != -1:
#             return json.loads(text[start:end + 1])
#         raise ValueError("Could not parse JSON response.")


# # -------------------------------------------------------------
# # Load existing results (if output file already exists)
# # -------------------------------------------------------------
# def load_existing_output():
#     if os.path.exists(OUTPUT_FILE):
#         with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
#             try:
#                 return json.load(f)
#             except:
#                 return []
#     return []


# # -------------------------------------------------------------
# # Save current results to output file
# # -------------------------------------------------------------
# def save_output(data):
#     with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
#         json.dump(data, f, indent=2, ensure_ascii=False)


# # -------------------------------------------------------------
# # Process all colleges one-by-one and append output incrementally
# # -------------------------------------------------------------
# def process_colleges():
#     with open(INPUT_FILE, "r", encoding="utf-8") as f:
#         colleges = json.load(f)

#     # Load previous results so we can resume
#     results = load_existing_output()

#     # Get set of already processed colleges (avoid duplicates)
#     processed_names = {entry["college"] for entry in results}

#     for i, college in enumerate(colleges, start=1):
#         if college["name"] in processed_names:
#             print(f"\n[{i}/{len(colleges)}] Skipping (already processed): {college['name']}")
#             continue

#         print(f"\n[{i}/{len(colleges)}] Processing: {college['name']}")
#         prompt = build_prompt(college)

#         try:
#             response = client.models.generate_content(
#                 model=MODEL,
#                 contents=prompt,
#                 config=config
#             )

#             text = response.text
#             data = extract_json(text)

#         except Exception as e:
#             print("Error:", e)
#             data = {
#                 "college": college["name"],
#                 "AISHE_code": college.get("aishe_code", ""),
#                 "courses": [],
#                 "note": f"FAILED: {str(e)}"
#             }

#         # Append to results
#         results.append(data)

#         # ---------------------------------------------------------
#         # Save after EVERY college (so progress is never lost)
#         # ---------------------------------------------------------
#         save_output(results)
#         print(f"Saved {college['name']} to {OUTPUT_FILE}")

#         # Wait 2 seconds before next college
#         time.sleep(2)

#     print("\nAll colleges processed! Final output saved.")


# if __name__ == "__main__":
#     process_colleges()




import os
import json
import time
from google import genai
from google.genai import types
import dotenv
dotenv.load_dotenv()


API_KEY = os.getenv("GEMINI_API_KEY")
MODEL = "gemini-2.5-flash"

INPUT_FILE = r"C:\Users\LOQ\Desktop\New folder (3)\ApniDisha\web\Backend\data\nagpur_colleges_nirf_2025.json"
OUTPUT_FILE = r"C:\Users\LOQ\Desktop\New folder (3)\ApniDisha\web\Backend\data\college_courses_output2.json"

# >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
# START FROM THIS INDEX (CHANGE WHEN RESUMING)
START_INDEX = 198
# >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

if not API_KEY:
    raise RuntimeError("Set GEMINI_API_KEY environment variable.")

client = genai.Client(api_key=API_KEY)
google_search_tool = types.Tool(google_search=types.GoogleSearch())
config = types.GenerateContentConfig(tools=[google_search_tool])


# -------------------------------------------------------------
# Build prompt strictly producing EXACT OUTPUT FORMAT
# -------------------------------------------------------------
def build_prompt(college):
    college_name = college["name"]
    aishe = college.get("aishe_code", "")
    website = college.get("website", "")

    if website and not website.startswith("http"):
        website = "https://" + website

    return f"""
Search ONLY from:
- site:shiksha.com
- site:collegedunia.com
- {website}

College: {college_name}
AISHE Code: {aishe}

Extract EXACT output in this JSON structure:

{{
  "college": "{college_name}",
  "AISHE_code": "{aishe}",
  "courses": [
    {{
      "name": "<Course Name>",
      "specializations": [ "<spec1>", "<spec2>" ] OR null,
      "duration": "<duration>" OR null,
      "eligibility": "<eligibility>" OR null,
      "tuition_fee": "<fee>" OR null,
      "annual_fee": "<annual fee>" OR null
    }}
  ],
  "note": "Fees vary by specialization, category, and may include additional development and exam fees."
}}

RULES:
- Return ONLY valid JSON. No markdown, no explanations.
- Include only verified courses.
- Use null for missing fields.
""".strip()


# -------------------------------------------------------------
# Extract JSON safely even if model adds extra text
# -------------------------------------------------------------
def extract_json(text):
    try:
        return json.loads(text)
    except:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            return json.loads(text[start:end + 1])
        raise ValueError("Could not parse JSON response.")


# -------------------------------------------------------------
# Load existing results (if output file already exists)
# -------------------------------------------------------------
def load_existing_output():
    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            try:
                return json.load(f)
            except:
                return []
    return []


# -------------------------------------------------------------
# Save current results to output file
# -------------------------------------------------------------
def save_output(data):
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


# -------------------------------------------------------------
# Process all colleges one-by-one and append output incrementally
# -------------------------------------------------------------
def process_colleges():
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        colleges = json.load(f)

    results = load_existing_output()

    processed_names = {entry["college"] for entry in results}

    for i, college in enumerate(colleges, start=1):

        # -------------------------------------------------------------
        # SKIP UNTIL WE REACH START_INDEX
        # -------------------------------------------------------------
        if i < START_INDEX:
            print(f"[{i}/{len(colleges)}] Skipping (before START_INDEX): {college['name']}")
            continue

        # -------------------------------------------------------------
        # SKIP ALREADY PROCESSED COLLEGES
        # -------------------------------------------------------------
        if college["name"] in processed_names:
            print(f"[{i}/{len(colleges)}] Skipping (already processed): {college['name']}")
            continue

        print(f"\n[{i}/{len(colleges)}] Processing: {college['name']}")

        prompt = build_prompt(college)

        try:
            response = client.models.generate_content(
                model=MODEL,
                contents=prompt,
                config=config
            )

            text = response.text
            data = extract_json(text)

        except Exception as e:
            print("Error:", e)

            # Important: Even on error we save a FAILURE entry
            data = {
                "college": college["name"],
                "AISHE_code": college.get("aishe_code", ""),
                "courses": [],
                "note": f"FAILED: {str(e)}"
            }

        # Add to results
        results.append(data)

        # Save immediately (so no data is lost)
        save_output(results)
        print(f"Saved {college['name']} to {OUTPUT_FILE}")

        time.sleep(2)

    print("\nAll colleges processed! Final output saved.")


if __name__ == "__main__":
    process_colleges()
