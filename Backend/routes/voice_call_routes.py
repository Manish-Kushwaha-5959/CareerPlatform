from flask import Blueprint, request, jsonify
from twilio.rest import Client
from config.twilio_config import TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER

call_bp = Blueprint("call_bp", __name__)

client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

@call_bp.post("/trigger-call")
def trigger_call():
    user_number = request.json.get("phone")

    # FIXED: Correct URL to /api/start (update ngrok subdomain as needed)
    public_url = " https://slangier-scottie-unsorely.ngrok-free.dev/api/start"

    if not user_number:
        return jsonify({"error": "Missing 'phone' in request body"}), 400

    try:
        call = client.calls.create(
            to=user_number,
            from_=TWILIO_PHONE_NUMBER,
            url=public_url  
        )
        return jsonify({"status": "call placed", "call_sid": call.sid})
    except Exception as e:
        return jsonify({"error": str(e)}), 500