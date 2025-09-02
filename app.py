import os
import requests
from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv
from flask_cors import CORS

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Hugging Face API settings
HF_API_URL = os.getenv("HF_API_URL", "https://api-inference.huggingface.co/models/deepset/roberta-base-squad2")
HF_API_KEY = os.getenv("HF_API_KEY")
HF_HEADERS = {"Authorization": f"Bearer {HF_API_KEY}"}

# IntaSend settings
INTASEND_PUBLISHABLE_KEY = os.getenv("INTASEND_PUBLISHABLE_KEY")
INTASEND_SECRET_KEY = os.getenv("INTASEND_SECRET_KEY")

# -------------------------------
# ROUTES
# -------------------------------

@app.route("/")
def index():
    return render_template("index.html")  # Make sure you have templates/index.html


@app.route("/generate_flashcards", methods=["POST"])
def generate_flashcards():
    data = request.get_json()
    text = data.get("text", "")
    n = int(data.get("n", 5))

    if not text.strip():
        return jsonify({"error": "No text provided"}), 400

    try:
        # Split text into chunks
        sentences = text.split(". ")
        flashcards = []

        for i, sentence in enumerate(sentences[:n]):
            q_payload = {"inputs": {"question": "What is the main point?", "context": sentence}}
            r = requests.post(HF_API_URL, headers=HF_HEADERS, json=q_payload)

            if r.status_code == 200:
                output = r.json()
                question = f"Q{i+1}: {sentence.strip()[:50]}?"
                answer = output.get("answer", "Not found")
                flashcards.append({"question": question, "answer": answer})
            else:
                flashcards.append({"question": sentence.strip(), "answer": "Error from Hugging Face"})

        return jsonify({"flashcards": flashcards})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/create_checkout", methods=["POST"])
def create_checkout():
    data = request.get_json()
    amount = data.get("amount")
    currency = data.get("currency", "KES")
    success_url = data.get("success_url", "http://127.0.0.1:5000/success")
    cancel_url = data.get("cancel_url", "http://127.0.0.1:5000/cancel")

    try:
        url = "https://payment.intasend.com/api/v1/checkout/"
        headers = {
            "Authorization": f"Bearer {INTASEND_SECRET_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "public_key": INTASEND_PUBLISHABLE_KEY,
            "amount": amount,
            "currency": currency,
            "redirect_url": success_url,
            "cancel_url": cancel_url
        }
        res = requests.post(url, headers=headers, json=payload)

        if res.status_code == 200:
            return jsonify(res.json())
        else:
            return jsonify({"error": res.text}), res.status_code

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/success")
def success():
    return "✅ Payment Successful! Premium unlocked."


@app.route("/cancel")
def cancel():
    return "❌ Payment Cancelled. Try again."


if __name__ == "__main__":
    app.run(debug=True)




