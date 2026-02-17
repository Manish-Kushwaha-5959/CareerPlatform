""" improvements
data recheck """

from flask import Blueprint, request, jsonify
from services.connectDB import connect_db

stream_routes = Blueprint("stream_routes", __name__)

# Degree info mapping
DEGREE_INFO = {
    "BTECH": {
        "name": "B.Tech",
        "level": "Undergraduate",
        "description": "A comprehensive engineering program focusing on technical skills, innovation, and problem-solving in various engineering disciplines.",
        "typical_duration": "4 Years"
    },
    "BARCH": {
        "name": "B.Arch",
        "level": "Undergraduate",
        "description": "Bachelor of Architecture, blending creative design with technical knowledge for building sustainable structures.",
        "typical_duration": "5 Years"
    },
    "MTECH": {
        "name": "M.Tech",
        "level": "Postgraduate",
        "description": "Advanced engineering master's program for specialization and research in cutting-edge technologies.",
        "typical_duration": "2 Years"
    },
    "MSC": {
        "name": "M.Sc",
        "level": "Postgraduate",
        "description": "Master of Science in core sciences, emphasizing research, analysis, and advanced theoretical knowledge.",
        "typical_duration": "2 Years"
    },
    "PHD": {
        "name": "Ph.D",
        "level": "Doctoral",
        "description": "Doctor of Philosophy for in-depth research and expertise in a specialized academic field.",
        "typical_duration": "5 Years"
    },
    "MBA": {
        "name": "MBA",
        "level": "Postgraduate",
        "description": "Master of Business Administration, developing leadership and strategic management skills for business careers.",
        "typical_duration": "2 Years"
    },
    "BBA": {
        "name": "BBA",
        "level": "Undergraduate",
        "description": "Bachelor of Business Administration, foundational business education in management and entrepreneurship.",
        "typical_duration": "3 Years"
    },
    "BCOM": {
        "name": "B.Com",
        "level": "Undergraduate",
        "description": "Bachelor of Commerce, focusing on accounting, finance, and economics for commerce professionals.",
        "typical_duration": "3 Years"
    },
    "BSC": {
        "name": "B.Sc",
        "level": "Undergraduate",
        "description": "Bachelor of Science, building scientific knowledge in biology, physics, chemistry, and more.",
        "typical_duration": "3 Years"
    },
    "BA": {
        "name": "BA",
        "level": "Undergraduate",
        "description": "Bachelor of Arts, exploring humanities, social sciences, and liberal arts for diverse careers.",
        "typical_duration": "3 Years"
    },
    "BDES": {
        "name": "B.Des",
        "level": "Undergraduate",
        "description": "Bachelor of Design, fostering creativity in product, graphic, and industrial design.",
        "typical_duration": "4 Years"
    },
    "BPHARM": {
        "name": "B.Pharm",
        "level": "Undergraduate",
        "description": "Bachelor of Pharmacy, preparing for roles in pharmaceutical sciences and drug development.",
        "typical_duration": "4 Years"
    },
    # Add more as needed
}

def get_degree_details(short_name):
    """Get degree details by short_name, with fuzzy matching fallback."""
    short_upper = short_name.upper().strip()
    info = DEGREE_INFO.get(short_upper)
    if info:
        return info
    
    # Fuzzy fallback: check for partial matches
    for key, val in DEGREE_INFO.items():
        if key in short_upper or short_upper in key:
            return val
    
    return None

@stream_routes.route("/streams", methods=["POST"])
def add_stream():
    db = connect_db()
    data = request.json

    if not data:
        return jsonify({"success": False, "message": "No input data"}), 400

    result = db.Stream.insert_one(data)

    return jsonify({
        "success": True,
        "message": "Stream added successfully",
        "id": str(result.inserted_id)
    }), 201


@stream_routes.route("/streams", methods=["GET"])
def get_streams():
    db = connect_db()
    stream_list = list(db.Stream.find())

    for s in stream_list:
        s["_id"] = str(s["_id"])

    return jsonify(stream_list), 200

# -------------------------------------------------
# GET /streams/degree/<short_name>
# Get degree name and details by short_name
# -------------------------------------------------
@stream_routes.route("/streams/degree/<short_name>", methods=["GET"])
def get_degree_by_short_name(short_name):
    degree_details = get_degree_details(short_name)
    
    if not degree_details:
        return jsonify({
            "success": False,
            "message": f"Degree details not found for short_name: {short_name}"
        }), 404
    
    return jsonify({
        "success": True,
        "data": degree_details,
        "short_name": short_name
    }), 200