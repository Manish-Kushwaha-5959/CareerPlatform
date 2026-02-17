from flask import Blueprint, request, jsonify
from services.connectDB import connect_db
import json
import os

content_routes = Blueprint("content_routes", __name__)


# ---------------------------------------------------------
# ADD CONTENT (existing)
# ---------------------------------------------------------
@content_routes.route("/content", methods=["POST"])
def add_content():
    db = connect_db()
    data = request.json

    if not data:
        return jsonify({"success": False, "message": "No input data"}), 400

    result = db.Content.insert_one(data)

    return jsonify({
        "success": True,
        "message": "Content added successfully",
        "id": str(result.inserted_id)
    }), 201


# ---------------------------------------------------------
# GET ALL CONTENT (existing)
# ---------------------------------------------------------
@content_routes.route("/content/all", methods=["GET"])
def get_content():
    db = connect_db()
    content_list = list(db.Content.find())

    for c in content_list:
        c["_id"] = str(c["_id"])

    return jsonify(content_list), 200

# ---------------------------------------------------------
# GET CONTENT BY ID (existing)
# ---------------------------------------------------------

@content_routes.route("/content/<string:id>", methods=["GET"])
def get_content_by_id(id):
    db = connect_db()
    content = db.Content.find_one({"_id": id})

    if content:
        content["_id"] = str(content["_id"])
        return jsonify(content), 200
    else:
        return jsonify({"success": False, "message": "Content not found"}), 404 

    

# ---------------------------------------------------------
# NEW ROUTE: GET CONTENT BY STREAMS ARRAY
# ---------------------------------------------------------
@content_routes.route("/content/streams", methods=["POST"])
def get_content_by_streams():
    db = connect_db()
    data = request.get_json()
    print("Received data for streams:", data)

    # Validate input
    if not data or "recs" not in data:
        return jsonify({"success": False, "message": "Field 'recs' (array of streams) is required"}), 400

    recs = data.get("recs", [])

    if not isinstance(recs, list):
        return jsonify({"success": False, "message": "'recs' must be an array of strings"}), 400

    if len(recs) == 0:
        print("bhadwe, kuch nahi manga")
        return jsonify([]), 200  # nothing requested → nothing returned

    # --- helper: generic normalizer for all degree/stream names ---
    def normalize_label(value):
        if value is None:
            print("Warning: normalize_label received None value")
            return None
        if not isinstance(value, str):
            value = str(value)

        # lowercase
        value = value.lower()

        # remove all non-alphanumeric chars (., spaces, -, _, etc.)
        # "B.Tech" -> "btech"; "B Tech" -> "btech"; "B-Tech" -> "btech"
        value = "".join(ch for ch in value if ch.isalnum())

        return value

    # Pre-normalize requested streams: ["BSc","BCom","BBA","BCA","B.Tech"] → {"bsc","bcom","bba","bca","btech"}
    normalized_recs = {normalize_label(r) for r in recs if r is not None}
    print("Normalized recs:", normalized_recs)

    # Fetch ALL content from DB (no filter in Mongo)
    contents_cursor = db.Content.find({})

    contents = []
    for c in contents_cursor:
        title_raw = c.get("title", "") or ""
        tags_raw = c.get("tags", []) or []

        # Normalize title and tags
        normalized_title = normalize_label(title_raw)
        normalized_tags = [normalize_label(t) for t in tags_raw if t is not None]

        print(f"\nDoc _id={c.get('_id')}")
        print("  title:", title_raw)
        print("  tags:", tags_raw)
        print("  normalized_title:", normalized_title)
        print("  normalized_tags:", normalized_tags)

        matched = False
        for rec_norm in normalized_recs:
            if rec_norm is None:
                continue

            # 1) rec appears in title (e.g., "btech" in "btechcsefulldetails...") 
            if rec_norm in normalized_title:
                matched = True
                print(f"  -> matched by title using rec={rec_norm!r}")
                break

            # 2) rec matches any tag (exact or substring both ways)
            for tag_norm in normalized_tags:
                if tag_norm is None:
                    continue

                if (
                    tag_norm == rec_norm
                    or tag_norm.startswith(rec_norm)
                    or rec_norm.startswith(tag_norm)
                    or rec_norm in tag_norm
                    or tag_norm in rec_norm
                ):
                    matched = True
                    print(f"  -> matched by tag {tag_norm!r} using rec={rec_norm!r}")
                    break

            if matched:
                break

        if not matched:
            print("  -> no match, skipping")
            continue

        # Make _id JSON-serializable
        if "_id" in c:
            c["_id"] = str(c["_id"])

        # --- Normalize rating ---
        rating = c.get("rating")
        if isinstance(rating, dict) and "$numberDouble" in rating:
            try:
                c["rating"] = float(rating["$numberDouble"])
            except (ValueError, TypeError):
                c["rating"] = None
        elif isinstance(rating, (int, float, str)):
            try:
                c["rating"] = float(rating)
            except (ValueError, TypeError):
                pass  # leave as is if it fails

        # --- Normalize downloads ---
        downloads = c.get("downloads")
        if isinstance(downloads, dict) and "$numberInt" in downloads:
            try:
                c["downloads"] = int(downloads["$numberInt"])
            except (ValueError, TypeError):
                c["downloads"] = None
        elif isinstance(downloads, (int, float, str)):
            try:
                c["downloads"] = int(downloads)
            except (ValueError, TypeError):
                pass

        contents.append(c)
        print("  ✅ included in response")

    print(f"\nTotal matched contents: {len(contents)}")
    return jsonify(contents), 200
