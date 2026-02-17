# upload_timeline.py

import json
from services.connectDB import connect_db

# Path to your JSON file
JSON_FILE_PATH = r"C:\Users\LOQ\Desktop\New folder (3)\ApniDisha\web\Backend\data\time.json"
COLLECTION_NAME = "timeline"

def upload_timeline_data():
    # Connect to DB
    db = connect_db()
    if db is None:
        print("Failed to connect to database. Exiting.")
        return

    collection = db[COLLECTION_NAME]

    try:
        with open(JSON_FILE_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Handle different JSON structures
        if isinstance(data, list):
            # If it's a list of documents → bulk insert
            result = collection.insert_many(data)
            print(f"Inserted {len(result.inserted_ids)} documents into '{COLLECTION_NAME}'")
        elif isinstance(data, dict):
            # If it's a single document
            result = collection.insert_one(data)
            print(f"Inserted 1 document with _id: {result.inserted_id}")
        else:
            print("Unsupported JSON structure. Must be object or array.")

    except FileNotFoundError:
        print(f"File '{JSON_FILE_PATH}' not found!")
    except json.JSONDecodeError as e:
        print(f"Invalid JSON in file: {e}")
    except Exception as e:
        print(f"Error during insert: {e}")

if __name__ == "__main__":
    upload_timeline_data()