import os
import json
import pandas as pd
from datetime import datetime, UTC

# Build absolute paths relative to Backend/
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

AISHE_PATH = os.path.join(DATA_DIR, "aishe_colleges.xlsx")  # your file
OUTPUT_RAW = os.path.join(DATA_DIR, "aishe_colleges_raw.json")
OUTPUT_CLEAN = os.path.join(DATA_DIR, "aishe_colleges_clean.json")

AISHE_SOURCE_URL = "https://dashboard.aishe.gov.in"  # official verified source


def collect_aishe_raw(input_file=AISHE_PATH, output_file=OUTPUT_RAW):
    """
    Step 1: Load AISHE Excel -> use correct header row.
    """
    if not os.path.exists(input_file):
        raise FileNotFoundError(f"AISHE Excel file not found: {input_file}")

    print(f"📄 Reading AISHE Excel: {input_file}")

    # Use row 3 as header (index 2)
    df = pd.read_excel(input_file, header=2)

    # Convert to list of dicts
    records = df.to_dict(orient="records")

    raw_payload = {
        "verified_source": AISHE_SOURCE_URL,
        "downloaded_at": datetime.now(UTC).isoformat(),
        "row_count": len(records),
        "data": records
    }

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(raw_payload, f, indent=4, ensure_ascii=False)

    print(f"📦 Raw AISHE JSON saved to: {output_file}")
    return raw_payload


def clean_aishe(records, output_file=OUTPUT_CLEAN):

    cleaned = []

    for rec in records:

        cleaned.append({
            "aishe_code": rec.get("Aishe Code"),
            "name": rec.get("Name"),
            "state": rec.get("State"),
            "district": rec.get("District"),
            "website": rec.get("Website"),
            "year_established": rec.get("Year Of Establishment"),
            "location": rec.get("Location"),  # Urban / Rural
            "college_type": rec.get("College Type"),  
            "management": rec.get("Manegement"),  
            "university_aishe_code": rec.get("University Aishe Code"),
            "university_affiliation": rec.get("University Name"),
            "university_type": rec.get("University Type"),  # Central / State / Private
            "verified_source": AISHE_SOURCE_URL
        })

    # Save clean JSON
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(cleaned, f, indent=4, ensure_ascii=False)

    print(f"✨ Clean AISHE JSON saved to: {output_file}")
    return cleaned



def run_aishe_ingestion():
    raw_payload = collect_aishe_raw()
    clean_records = clean_aishe(raw_payload["data"])
    print("🎉 AISHE extraction + cleaning completed.")
    return clean_records


if __name__ == "__main__":
    run_aishe_ingestion()
