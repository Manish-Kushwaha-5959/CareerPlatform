# import os
# import json
# import re

# # --------------------------
# # PATHS
# # --------------------------

# BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# DATA_DIR = os.path.join(BASE_DIR, "data")
# AISHE_FILE = os.path.join(DATA_DIR, "aishe_colleges_clean.json")
# OUTPUT_FILE = os.path.join(DATA_DIR, "popular_institutes_filtered.json")

# # --------------------------
# # CONFIGURATION
# # --------------------------

# # Keywords to identify "Popular" colleges
# # You can add more phrases here (e.g., "AIIMS", "IIM", "BITS")
# POPULAR_KEYWORDS = [
#     "Indian Institute of Technology",
#     "National Institute of Technology",
#     "Indian Institute of Information Technology",
#     "Birla Institute of Technology", 
#     "Vellore Institute of Technology",
#     "All India Institute of Medical Sciences"
# ]

# # --------------------------
# # HELPER FUNCTIONS
# # --------------------------

# def normalize(text):
#     if not text: return ""
#     return " ".join(text.lower().split())

# def is_popular(name):
#     """Checks if the college name contains any of the popular keywords."""
#     norm_name = normalize(name)
#     for keyword in POPULAR_KEYWORDS:
#         if normalize(keyword) in norm_name:
#             return True
#     return False

# def format_record(aishe_item):
#     """Formats the AISHE record into the specific JSON structure requested."""
#     return {
#         "aishe_code": aishe_item.get("aishe_code"),
#         "name": aishe_item.get("name"),
#         "state": aishe_item.get("state"),
#         "district": aishe_item.get("district"),
#         "website": aishe_item.get("website"),
#         "year_established": aishe_item.get("year_established"),
#         "location": aishe_item.get("location"),
#         "college_type": aishe_item.get("college_type"),
#         "management": aishe_item.get("management"),
#         "university_aishe_code": aishe_item.get("university_aishe_code"),
#         "university_affiliation": aishe_item.get("university_affiliation"),
#         "university_type": aishe_item.get("university_type"),
#         "verified_source": "https://dashboard.aishe.gov.in", # Source is AISHE DB
        
#         # NIRF Fields (Set to Defaults since we aren't scraping rankings here)
#         "nirf_rank": None,   # We don't know the rank without scraping
#         "nirf_score": None, 
#         "nirf_category": "Engineering/Technical", # Inferred based on keywords
#         "nirf_city": aishe_item.get("district"),  # Fallback to district
#         "nirf_match_score": 1.0 # Exact match because it comes from the DB itself
#     }

# # --------------------------
# # MAIN EXECUTION
# # --------------------------

# def filter_popular_colleges():
#     print(f"📌 Loading AISHE dataset from: {AISHE_FILE}")
    
#     if not os.path.exists(AISHE_FILE):
#         print("❌ AISHE file not found. Please ensure the path is correct.")
#         return

#     with open(AISHE_FILE, "r", encoding="utf-8") as f:
#         aishe_data = json.load(f)

#     popular_colleges = []
    
#     print(f"🔍 Filtering for keywords: {POPULAR_KEYWORDS}")

#     for college in aishe_data:
#         # Check if name exists and matches keywords
#         if college.get("name") and is_popular(college["name"]):
#             formatted_college = format_record(college)
#             popular_colleges.append(formatted_college)

#     # Save to file
#     with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
#         json.dump(popular_colleges, f, indent=4, ensure_ascii=False)

#     print(f"\n✅ Success! Found {len(popular_colleges)} popular institutes.")
#     print(f"💾 Saved to: {OUTPUT_FILE}")

# if __name__ == "__main__":
#     filter_popular_colleges()

import pandas as pd
import json
import os

# --------------------------
# PATHS
# --------------------------
# Get the directory where THIS script is located (Backend/services)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Go UP one level to get the 'Backend' folder
BACKEND_DIR = os.path.dirname(SCRIPT_DIR) 

# Now point to the 'data' folder inside Backend (Backend/data)
DATA_DIR = os.path.join(BACKEND_DIR, "data")

UNIVERSITY_EXCEL = os.path.join(DATA_DIR, "All_uni.xlsx")
EXISTING_COLLEGES_JSON = os.path.join(DATA_DIR, "aishe_colleges_clean.json")
OUTPUT_FILE = os.path.join(DATA_DIR, "aishe_master_merged.json")

def normalize_column_names(df):
    """
    Standardizes column names based on the specific file format provided.
    """
    # 1. Strip whitespace from headers just in case
    df.columns = df.columns.str.strip()
    
    # 2. Exact Mapping based on your file content
    rename_map = {
        "Aishe Code": "aishe_code",
        "Name": "name",
        "State": "state",
        "District": "district",
        "Website": "website",
        "Year Of Establishment": "year_established",
        "Location": "location"
    }
    
    # 3. Rename columns
    df = df.rename(columns=rename_map)
    
    # 4. Define the final list of columns we want in our JSON
    desired_columns = [
        "aishe_code", "name", "state", "district", 
        "website", "year_established", "location", 
        "management", "university_type"
    ]
    
    # 5. Add missing columns (since your file doesn't have Management/Type)
    for col in desired_columns:
        if col not in df.columns:
            df[col] = None  # Will appear as null in JSON
            
    # 6. Add identifier fields
    df["college_type"] = "University / Institute of National Importance"
    df["university_affiliation"] = None 
    df["university_aishe_code"] = None
    
    return df[desired_columns + ["college_type", "university_affiliation", "university_aishe_code"]]

def run_merge():
    print("🚀 Starting Merge Process...")
    print(f"📂 Looking for data in: {DATA_DIR}")
    
    # 1. Load the University Excel
    if os.path.exists(UNIVERSITY_EXCEL):
        print(f"✅ Found Excel: {UNIVERSITY_EXCEL}")
        try:
            # Load Excel
            df_uni = pd.read_excel(UNIVERSITY_EXCEL)
            print(f"   📊 Loaded {len(df_uni)} universities.")
            
            # Clean and normalize
            df_uni = normalize_column_names(df_uni)
            
            # Convert to list of dictionaries
            uni_data = df_uni.to_dict(orient="records")
            
            # Debug: Print first record to check if keys are correct now
            print("\n🔍 Sample Record (First University):")
            print(json.dumps(uni_data[0], indent=2))
            
        except Exception as e:
            print(f"❌ Error reading Excel: {e}")
            uni_data = []
    else:
        print(f"❌ File not found: {UNIVERSITY_EXCEL}")
        return

    # 2. Load the Existing Colleges JSON
    college_data = []
    if os.path.exists(EXISTING_COLLEGES_JSON):
        print(f"\n✅ Found Existing JSON: {EXISTING_COLLEGES_JSON}")
        with open(EXISTING_COLLEGES_JSON, "r", encoding="utf-8") as f:
            college_data = json.load(f)
        print(f"   📊 Loaded {len(college_data)} colleges.")
    else:
        print(f"⚠️ Warning: College JSON not found at {EXISTING_COLLEGES_JSON}")

    # 3. Combine Data
    master_data = uni_data + college_data
    
    # 4. Save Master File
    print(f"\n💾 Saving {len(master_data)} total records to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(master_data, f, indent=4, ensure_ascii=False)
        
    print("\n✅ DONE! 'aishe_master_merged.json' created successfully.")

if __name__ == "__main__":
    run_merge()