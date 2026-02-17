from flask import Blueprint, request, jsonify
from services.connectDB import connect_db
import json
import os

content_routes = Blueprint("content_routes", __name__)

# ---------------------------------------------------------
# Route: Upload Colleges + Courses JSON → Course Collection
# ---------------------------------------------------------
@content_routes.route("/content/upload-courses", methods=["POST"])
def upload_courses_json():
    db = connect_db()

    # Path to your JSON file
    JSON_PATH = r"C:\Users\LOQ\Desktop\New folder (3)\ApniDisha\web\Backend\data\college_courses_output2.json"

    # Check file exists
    if not os.path.exists(JSON_PATH):
        return jsonify({"success": False, "message": "JSON file not found"}), 404

    # Load JSON
    try:
        with open(JSON_PATH, "r", encoding="utf-8") as f:
            colleges = json.load(f)
    except Exception as e:
        return jsonify({"success": False, "message": f"Invalid JSON format: {e}"}), 400

    # Ensure index for faster upsert + duplicate protection
    db.Course.create_index("AISHE_code", unique=True)

    inserted = 0
    updated = 0

    for college in colleges:
        aishe = college.get("AISHE_code")

        # skip if AISHE code missing
        if not aishe:
            continue

        # UPSERT into Course collection
        result = db.Course.update_one(
            {"AISHE_code": aishe},
            {"$set": college},
            upsert=True
        )

        if result.upserted_id:
            inserted += 1
        else:
            updated += 1

    return jsonify({
        "success": True,
        "message": "Courses uploaded into Course collection successfully.",
        "inserted": inserted,
        "updated": updated
    }), 201
