import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// Hugging Face API settings
const HF_API_URL = process.env.HF_API_URL || "https://api-inference.huggingface.co/models/deepset/roberta-base-squad2";
const HF_API_KEY = process.env.HF_API_KEY;
const HF_HEADERS = {
  "Authorization": `Bearer ${HF_API_KEY}`,
  "Content-Type": "application/json"
};

// IntaSend settings
const INTASEND_PUBLISHABLE_KEY = process.env.INTASEND_PUBLISHABLE_KEY;
const INTASEND_SECRET_KEY = process.env.INTASEND_SECRET_KEY;

// Routes
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.post('/generate_flashcards', async (req, res) => {
  const { text, n = 5 } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: "No text provided" });
  }

  try {
    // Split text into chunks
    const sentences = text.split(". ");
    const flashcards = [];

    for (let i = 0; i < Math.min(sentences.length, n); i++) {
      const sentence = sentences[i];
      const payload = {
        inputs: {
          question: "What is the main point?",
          context: sentence
        }
      };

      try {
        const response = await fetch(HF_API_URL, {
          method: 'POST',
          headers: HF_HEADERS,
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const output = await response.json();
          const question = `Q${i + 1}: ${sentence.trim().substring(0, 50)}?`;
          const answer = output.answer || "Not found";
          flashcards.push({ question, answer });
        } else {
          flashcards.push({
            question: sentence.trim(),
            answer: "Error from Hugging Face"
          });
        }
      } catch (error) {
        flashcards.push({
          question: sentence.trim(),
          answer: "Error processing request"
        });
      }
    }

    res.json({ flashcards });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/create_checkout', async (req, res) => {
  const {
    amount,
    currency = "KES",
    success_url = `http://localhost:${PORT}/success`,
    cancel_url = `http://localhost:${PORT}/cancel`
  } = req.body;

  try {
    const url = "https://payment.intasend.com/api/v1/checkout/";
    const headers = {
      "Authorization": `Bearer ${INTASEND_SECRET_KEY}`,
      "Content-Type": "application/json"
    };
    const payload = {
      public_key: INTASEND_PUBLISHABLE_KEY,
      amount,
      currency,
      redirect_url: success_url,
      cancel_url
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      res.json(data);
    } else {
      const errorText = await response.text();
      res.status(response.status).json({ error: errorText });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/success', (req, res) => {
  res.send('✅ Payment Successful! Premium unlocked.');
});

app.get('/cancel', (req, res) => {
  res.send('❌ Payment Cancelled. Try again.');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});