from flask import Blueprint, request, jsonify
from services.gemini_service2 import GeminiChatService
import json

mindmap_bp = Blueprint("mindmap", __name__)


SYSTEM_PROMPT = """
You are a RoadmapMarkdownGenerator AI.
Your job is to output ONLY clean Markdown.

RULES:
- Follow the exact Markdown structure shown in the TEMPLATE.
- No extra explanations.
- No code blocks.
- No JSON.
- No talking.
- Output MUST be valid Markdown.
- Generate a COMPREHENSIVE roadmap with at least 5-7 distinct phases/groups.
- Each phase should have at least 1-2 steps.

TEMPLATE:

# {{Career Name}} Roadmap

## {{Phase Name}} ({{Duration}})

### {{Step Title}}

- Bullet point 1
- Bullet point 2
"""

@mindmap_bp.route("/roadmap/", methods=["POST"])
def generate_markdown():
    data = request.get_json()
    user_profile = data.get("user_profile")
    career_choice = data.get("career_choice")
    
    if not user_profile or not career_choice:
        return jsonify({"error": "Missing user profile or career choice"}), 400

    user_prompt = f"""
Generate a Markdown roadmap for the following user.

USER PROFILE:
{json.dumps(user_profile, indent=2)}

CAREER CHOICE:
"{career_choice}"

Follow the TEMPLATE strictly.
"""

    try:
        response = GeminiChatService().generate(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.1
        )

        markdown = response.strip()
        return jsonify({"markdown": markdown}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
