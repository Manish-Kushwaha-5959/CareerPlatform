import json
import os

# -------------------------------
# Your file paths (already updated)
# -------------------------------
COLLEGE_FILE = r"C:\Users\LOQ\Desktop\New folder (3)\ApniDisha\web\Backend\data\nagpur_colleges_nirf_2025.json"
COURSE_FILE = r"C:\Users\LOQ\Desktop\New folder (3)\ApniDisha\web\Backend\data\college_courses_output2.json"
OUTPUT_FILE = r"C:\Users\LOQ\Desktop\New folder (3)\ApniDisha\web\Backend\data\merged_colleges_with_courses.json"

# -------------------------------
# Check files exist
# -------------------------------
for path in [COLLEGE_FILE, COURSE_FILE]:
    if not os.path.exists(path):
        raise FileNotFoundError(f"❌ File not found: {path}")

# -------------------------------
# Load JSON files
# -------------------------------
with open(COLLEGE_FILE, "r", encoding="utf-8") as f:
    colleges = json.load(f)

with open(COURSE_FILE, "r", encoding="utf-8") as f:
    courses = json.load(f)

# -------------------------------
# Map courses by AISHE_code
# -------------------------------
course_map = {}

for item in courses:
    aishe = item.get("AISHE_code") or item.get("aishe_code")
    if aishe:
        course_map[aishe.strip()] = item.get("courses", [])

# -------------------------------
# Merge data using aishe_code
# -------------------------------
merged_output = []

for col in colleges:
    aishe_code = col.get("aishe_code")

    # match by AISHE code
    matched_courses = course_map.get(aishe_code, [])

    merged_college = {
        **col,
        "courses": matched_courses
    }

    merged_output.append(merged_college)

# -------------------------------
# Save final merged JSON
# -------------------------------
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(merged_output, f, indent=4, ensure_ascii=False)

print(f"✅ Merge complete! Output saved to:\n{OUTPUT_FILE}")
