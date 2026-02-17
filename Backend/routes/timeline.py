from flask import Blueprint, request, jsonify
from services.connectDB import connect_db

timeline_routes = Blueprint("timeline_routes", __name__)


@timeline_routes.route("/timeline", methods=["GET"])
def get_timeline():
    db = connect_db()
    short_name_query = request.args.get("short_name")

    # Fetch the only document
    data = db.timeline.find_one()

    if not data:
        return jsonify([]), 200

    exams = data.get("upcoming_entrance_exams_2026", [])

    # If filtering by short_name
    if short_name_query:
        short_name_query = short_name_query.lower()
        exams = [
            exam for exam in exams
            if any(sn.lower() == short_name_query for sn in exam.get("short_name", []))
        ]

    return jsonify(exams), 200
