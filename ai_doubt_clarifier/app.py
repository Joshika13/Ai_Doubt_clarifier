"""
AI Doubt Clarifier - Flask Backend
Integrates with Google Gemini API to provide student-friendly explanations.
"""

import os
import json
import random
from datetime import datetime
from flask import Flask, render_template, request, jsonify, session
from groq import Groq

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "ai-doubt-clarifier-secret-key-2024")

GROQ_API_KEY = ""

client = Groq(api_key=GROQ_API_KEY)

# ── Session helpers ───────────────────────────────────────────────────────────
def get_session_stats():
    """Return or initialise in-session statistics."""
    if "stats" not in session:
        session["stats"] = {
            "total_doubts": 0,
            "subjects": {},
            "recent_topics": [],
        }
    return session["stats"]


def update_stats(subject: str, topic: str):
    stats = get_session_stats()
    stats["total_doubts"] += 1
    stats["subjects"][subject] = stats["subjects"].get(subject, 0) + 1
    stats["recent_topics"].insert(0, topic)
    stats["recent_topics"] = stats["recent_topics"][:10]
    session["stats"] = stats
    session.modified = True


# ── Prompt builders ───────────────────────────────────────────────────────────
EXPLAIN_PROMPT = """
You are an expert educational AI tutor. Explain the following topic or doubt in a student-friendly way.

Topic/Question: {question}

Respond ONLY with a valid JSON object (no markdown, no code fences) in this exact structure:
{{
  "subject": "detected subject (e.g. Physics, Math, Chemistry, Biology, History, etc.)",
  "explanation": {{
    "definition": "A clear, concise definition in 1-2 sentences.",
    "simple_explanation": "Explain as if talking to a curious 15-year-old. Use simple words and short sentences.",
    "real_life_example": "A vivid, relatable real-life example that makes the concept click.",
    "key_points": ["Point 1", "Point 2", "Point 3", "Point 4"]
  }},
  "confidence_score": <integer between 75 and 99>,
  "summary": "One-sentence TL;DR of the answer."
}}
"""

QUIZ_PROMPT = """
Create exactly 3 multiple-choice quiz questions based on this explanation:

Topic: {topic}
Explanation summary: {summary}

Respond ONLY with a valid JSON array (no markdown, no code fences):
[
  {{
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "Brief reason why this is correct."
  }},
  ...
]
The "correct" field is the zero-based index of the correct option.
"""


def call_groq(prompt: str) -> str:
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
    )

    return response.choices[0].message.content.strip()

def clean_json(raw: str) -> str:
    """Strip accidental markdown fences from model output."""
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[-1]
        if raw.endswith("```"):
            raw = raw.rsplit("```", 1)[0]
    return raw.strip()


# ── Routes ────────────────────────────────────────────────────────────────────
@app.route("/")
def home():
    return render_template("index.html")


@app.route("/ask")
def ask():
    return render_template("ask.html")


@app.route("/dashboard")
def dashboard():
    stats = get_session_stats()
    return render_template("dashboard.html", stats=stats)


@app.route("/api/explain", methods=["POST"])
def explain():
    """Generate a structured explanation for a student's question."""
    data = request.get_json(silent=True) or {}
    question = (data.get("question") or "").strip()

    if not question:
        return jsonify({"error": "Question cannot be empty."}), 400
    if len(question) > 1000:
        return jsonify({"error": "Question too long (max 1000 characters)."}), 400

    try:
        raw = call_groq(EXPLAIN_PROMPT.format(question=question))
        result = json.loads(clean_json(raw))
        update_stats(result.get("subject", "General"), question[:80])
        return jsonify({"success": True, "data": result})
    except json.JSONDecodeError:
        return jsonify({"error": "AI returned unexpected format. Please try again."}), 500
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/quiz", methods=["POST"])
def quiz():
    """Generate 3 MCQs from a previous explanation."""
    data = request.get_json(silent=True) or {}
    topic = (data.get("topic") or "").strip()
    summary = (data.get("summary") or "").strip()

    if not topic:
        return jsonify({"error": "Topic is required."}), 400

    try:
        raw = call_groq(QUIZ_PROMPT.format(topic=topic, summary=summary))
        questions = json.loads(clean_json(raw))
        return jsonify({"success": True, "questions": questions})
    except json.JSONDecodeError:
        return jsonify({"error": "Could not generate quiz. Please try again."}), 500
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/stats")
def stats():
    """Return current session statistics as JSON."""
    return jsonify(get_session_stats())


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, port=5000)
