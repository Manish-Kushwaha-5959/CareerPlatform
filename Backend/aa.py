import json
import requests
import re
import time
from pathlib import Path

# ================= PATHS =================
INPUT_FILE  = r"C:\Users\LOQ\Desktop\New folder (3)\ApniDisha\web\Backend\data\cleaned_colleges_final_v31.json"
OUTPUT_FILE = r"C:\Users\LOQ\Desktop\New folder (3)\ApniDisha\web\Backend\data\cleaned_colleges_final_v31.json"

# ================= CONFIG =================
SERPER_API_KEY = "c5c404d6702351846360e839ab97920f52b96daf"  # Your working key

REQUEST_DELAY = 1.8  # Be respectful to the API
MAX_COLLEGES_TO_PROCESS = 40  # You can increase if needed

# ================================================

def load_colleges():
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_colleges(colleges):
    Path(OUTPUT_FILE).parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(colleges, f, indent=2, ensure_ascii=False)
    print(f"\nAll done! Nagpur colleges updated → {OUTPUT_FILE}")

def safe_nirf_rank(value):
    if value is None or str(value).strip() == "" or str(value) == "null":
        return 999999
    if isinstance(value, int):
        return value
    if isinstance(value, str):
        cleaned = value.strip()
        if cleaned.isdigit():
            return int(cleaned)
    return 999999

def extract_review_count(text):
    if not text or str(text).strip() in ["", "null"]:
        return 0
    match = re.search(r'(\d+)', str(text).replace(',', ''))
    return int(match.group()) if match else 0

def get_nagpur_top_colleges(colleges):
    # Step 1: Filter only Nagpur colleges
    nagpur_colleges = []
    for c in colleges:
        city = str(c.get("city", "")).strip().lower()
        location = str(c.get("location", "")).strip().lower()
        name = str(c.get("name", "")).lower()
        
        if ("nagpur" in city or "nagpur" in location or "nagpur" in name):
            nagpur_colleges.append(c)

    print(f"Found {len(nagpur_colleges)} colleges in Nagpur")

    # Step 2: Sort by NIRF rank (best first)
    with_nirf = [c for c in nagpur_colleges if c.get("nirf_rank") is not None]
    with_nirf.sort(key=lambda x: safe_nirf_rank(x["nirf_rank"]))

    # Step 3: Sort by reviews (most popular first)
    by_reviews = sorted(nagpur_colleges, key=lambda x: extract_review_count(x.get("reviews_count")), reverse=True)

    # Step 4: Combine: NIRF first → then high-review ones
    seen = set()
    selected = []
    
    # First add all NIRF-ranked Nagpur colleges
    for c in with_nirf:
        name = c["name"]
        if name not in seen:
            seen.add(name)
            selected.append(c)

    # Then add top-reviewed ones (skip if already added)
    for c in by_reviews:
        name = c["name"]
        if name not in seen and len(selected) < MAX_COLLEGES_TO_PROCESS:
            seen.add(name)
            selected.append(c)

    return selected[:MAX_COLLEGES_TO_PROCESS]

def search_campus_image(college_name, state="Maharashtra"):
    queries = [
        f'"{college_name}" Nagpur campus photo',
        f'"{college_name}" official campus building',
        f'"{college_name}" campus site:ac.in OR site:edu.in',
        f'"{college_name}" main building Nagpur',
        f'"{college_name}" campus aerial view'
    ]

    headers = {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json"
    }

    for query in queries:
        try:
            payload = json.dumps({"q": query, "gl": "in", "num": 15})
            response = requests.post("https://google.serper.dev/images", headers=headers, data=payload, timeout=20)
            
            if response.status_code != 200:
                continue

            data = response.json()
            for img in data.get("images", []):
                url = img.get("imageUrl", "")
                title = (img.get("title") or "").lower()
                source = (img.get("source") or "").lower()

                # Best: Official college website
                if any(dom in source for dom in ["ac.in", "edu.in", "vnit.ac.in", "rtmnu.org", "dypvp.edu.in"]):
                    if url.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                        return url

                # Good keywords
                if any(kw in title for kw in ["campus", "building", "nagpur", "vnit", "rit", "ycc", "gate", "aerial"]):
                    if not any(bad in url.lower() for bad in ["logo", "icon", "vector", "placeholder", "cartoon", "banner"]):
                        if url.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                            return url

            time.sleep(REQUEST_DELAY)
        except Exception as e:
            print(f"   Query error: {e}")
            continue

    return None

# ================= MAIN =================
def main():
    print("Loading all India colleges data...")
    colleges = load_colleges()
    print(f"Total colleges in file: {len(colleges)}")

    nagpur_top = get_nagpur_top_colleges(colleges)
    print(f"\nSelected {len(nagpur_top)} popular Nagpur colleges for image update:\n")

    for i, college in enumerate(nagpur_top, 1):
        name = college["name"]
        city = college.get("city", "Nagpur")
        nirf = college.get("nirf_rank", "—")
        reviews = college.get("reviews_count", "—")
        
        print(f"{i:2}. {name[:70]:70} | NIRF: {str(nirf):>6} | Reviews: {reviews}")

        # Skip if already has image
        if college.get("image_url") and college["image_url"] not in [None, "", "null"]:
            print("   Already has image → Skipping")
            continue

        print("   Searching campus image...", end=" ")
        img_url = search_campus_image(name)

        if img_url:
            college["image_url"] = img_url
            print("Found!")
        else:
            college["image_url"] = None
            print("Not found")

        time.sleep(REQUEST_DELAY)

    save_colleges(colleges)
    print(f"\nSuccessfully added real campus images to top Nagpur colleges!")

if __name__ == "__main__":
    main()