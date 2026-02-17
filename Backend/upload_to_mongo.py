# upload_to_mongodb.py

import json
from pathlib import Path
from services.connectDB import connect_db 

# ================= CONFIG =================
JSON_FILE_PATH = r"C:\Users\LOQ\Desktop\New folder (3)\ApniDisha\web\Backend\data\cleaned_colleges_final_v31.json"
COLLECTION_NAME = "College"

# ==========================================

def load_json_data(file_path):
    if not Path(file_path).exists():
        print(f"File not found: {file_path}")
        return None
    
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(f"Loaded {len(data)} colleges from JSON")
    return data

def upload_to_mongodb():
    # Connect to DB
    db = connect_db()
    if db is None:
        print("Cannot proceed without DB connection")
        return

    collection = db[COLLECTION_NAME]

    # Load data
    colleges = load_json_data(JSON_FILE_PATH)
    if not colleges:
        return

    # Upsert logic using aishe_code as unique key
    updated = 0
    inserted = 0
    skipped = 0

    for college in colleges:
        aishe_code = college.get("aishe_code")
        if not aishe_code:
            print(f"Skipping college without aishe_code: {college.get('name')}")
            skipped += 1
            continue

        # This will update if exists, insert if not
        result = collection.replace_one(
            {"aishe_code": aishe_code},   # filter: find by aishe_code
            college,                      # replacement: full document
            upsert=True                   # create if doesn't exist
        )

        if result.matched_count > 0:
            if result.modified_count > 0:
                updated += 1
            # else: document was same, no changes
        else:
            inserted += 1

        # Optional: print progress every 50 colleges
        if (updated + inserted + skipped) % 50 == 0:
            print(f"Processed {updated + inserted + skipped} colleges...")

    # Final summary
    print("\nUpload Complete!")
    print(f"Inserted: {inserted}")
    print(f"Updated: {updated}")
    print(f"Skipped (no aishe_code): {skipped}")
    print(f"Total in collection now: {collection.count_documents({})}")

if __name__ == "__main__":
    upload_to_mongodb()