# routes/voice_quiz_routes.py

from flask import Blueprint, request, Response
from twilio.twiml.voice_response import VoiceResponse
from twilio.rest import Client

from config.twilio_config import (
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER,
)

voice_quiz_bp = Blueprint("voice_quiz_bp", __name__)

# Twilio client (only needed if you later do outbound calls; not required for webhooks)
client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

# ------------------------------
# SIMPLE DEMO QUIZ QUESTIONS
# You can replace this with your real quiz/RIASEC logic later.
# ------------------------------
QUESTIONS = [
    "Question 1. Do you enjoy solving logical problems? Press 1 for yes, 2 for no.",
    "Question 2. Do you like working with people? Press 1 for yes, 2 for no.",
    "Question 3. Do you prefer practical hands-on work? Press 1 for yes, 2 for no.",
]

# In-memory storage: CallSid -> list of answers
# Good enough for development (single backend process).
CALL_SESSIONS = {}


def calculate_quiz_result(answers: list[int]) -> str:
    """
    This is where you integrate your real quiz result logic.

    'answers' is a list of ints like [1, 2, 1, ...] from the call.
    Replace this with your existing RIASEC / AI-based scoring.

    For now, we just return a very simple text.
    """
    yes_count = sum(1 for a in answers if a == 1)
    no_count = sum(1 for a in answers if a == 2)

    if yes_count > no_count:
        return (
            "Based on your answers, you seem to enjoy analytical and people oriented tasks. "
            "You may be a good fit for careers like engineering, data science, or management."
        )
    else:
        return (
            "Based on your answers, you may prefer more practical or support oriented roles. "
            "Careers like technician, operations, or applied vocational fields might fit you."
        )


# ---------------------------------------------------------
# 1) ENTRY POINT: Twilio hits this when the call starts
#    (you will configure this URL in Twilio console)
# ---------------------------------------------------------
@voice_quiz_bp.route("/start", methods=["POST"])
def start_call():
    call_sid = request.form.get("CallSid")

    # Start a new session for this call
    CALL_SESSIONS[call_sid] = []

    resp = VoiceResponse()
    resp.say("Welcome to the Apni Disha career quiz.", language="en-IN")
    resp.say("You will answer a few questions by pressing 1 for yes, or 2 for no.", language="en-IN")

    # Redirect to first question (index 0)
    resp.redirect("/api/voice/question?index=0", method="POST")

    return Response(str(resp), mimetype="text/xml")


# ---------------------------------------------------------
# 2) QUESTION HANDLER: Twilio posts here after every answer
# ---------------------------------------------------------
@voice_quiz_bp.route("/question", methods=["POST"])
def handle_question():
    # Which question index are we on?
    index = int(request.args.get("index", 0))
    call_sid = request.form.get("CallSid")
    digits = request.form.get("Digits")  # user's pressed key from previous step

    # Retrieve or init answers list
    answers = CALL_SESSIONS.get(call_sid, [])

    # If user just answered the previous question, store it
    if digits and digits.isdigit():
        answers.append(int(digits))
        CALL_SESSIONS[call_sid] = answers

    resp = VoiceResponse()

    # If there are more questions left
    if index < len(QUESTIONS):
        # Ask next question and wait for 1 digit
        gather = resp.gather(
            num_digits=1,
            action=f"/api/voice/question?index={index + 1}",
            method="POST",
        )
        gather.say(QUESTIONS[index], language="en-IN")

        return Response(str(resp), mimetype="text/xml")

    # No more questions: calculate result
    result_text = calculate_quiz_result(answers)

    resp.say("Thank you. Your quiz is complete.", language="en-IN")
    resp.say(result_text, language="en-IN")
    resp.say("Goodbye from Apni Disha.", language="en-IN")

    # Clean up session
    CALL_SESSIONS.pop(call_sid, None)

    return Response(str(resp), mimetype="text/xml")
