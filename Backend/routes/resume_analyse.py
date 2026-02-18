from flask import Blueprint, request, jsonify
import os, tempfile, json
from services.resume_analyzer import ResumeAnalyzerService

resume_analyse_routes = Blueprint("resume_analyse_routes", __name__)
service = ResumeAnalyzerService()

@resume_analyse_routes.post("/analyze")
def analyse_resume():
    temp_path = None  # ensure cleanup
    try:
        # 1️⃣ Validate file
        if "file" not in request.files:
            return jsonify({"error": "Resume file is required"}), 400

        file = request.files["file"]
        career = request.form.get("career")

        if not career:
            return jsonify({"error": "Career role is required"}), 400

        if not file.filename.lower().endswith(".pdf"):
            return jsonify({"error": "Only PDF files allowed"}), 400

        # 2️⃣ Save PDF temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp:
            file.save(temp.name)
            temp_path = temp.name

        # 3️⃣ Run analysis
        raw_result = service.analyze(temp_path, career)

        # 4️⃣ Parse JSON strictly
        parsed_result = json.loads(raw_result)

        # 5️⃣ Return clean JSON (no wrapper unless you want one)
        return jsonify({
            "success": True,
            "data": parsed_result
        })

    except json.JSONDecodeError:
        return jsonify({
            "success": False,
            "error": "LLM returned invalid JSON"
        }), 500

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:
        # 6️⃣ Always clean up temp file
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
    
@resume_analyse_routes.post("/test/resume-analyze")
def test_resume_analyze():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "JSON body required"}), 400

        file_path = data.get("file_path")
        career = data.get("career")

        if not file_path or not career:
            return jsonify({
                "error": "file_path and career are required"
            }), 400

        if not os.path.exists(file_path):
            return jsonify({
                "error": "File does not exist"
            }), 400

        if not file_path.lower().endswith(".pdf"):
            return jsonify({
                "error": "Only PDF files allowed"
            }), 400

        # Run analysis
        raw_result = service.analyze(file_path, career)

        # Convert LLM string → JSON
        parsed_result = json.loads(raw_result)

        return jsonify({
            "success": True,
            "data": parsed_result
        })

    except json.JSONDecodeError:
        return jsonify({
            "success": False,
            "error": "LLM returned invalid JSON"
        }), 500

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
