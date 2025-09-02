const generateBtn = document.getElementById("generateBtn");
const notesInput = document.getElementById("notesInput");
const status = document.getElementById("status");
const cardsDiv = document.getElementById("cards");
const premiumBtn = document.getElementById("premiumBtn");

// Generate flashcards from pasted notes
generateBtn.addEventListener("click", async () => {
  const text = notesInput.value.trim();
  if (!text) {
    alert("Paste some notes first!");
    return;
  }
  status.textContent = "Generating flashcards...";

  try {
    const res = await fetch("/generate_flashcards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text, n: 5 })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error("Server error: " + errorText);
    }

    const data = await res.json();

    if (data.flashcards) {
      status.textContent = `Generated ${data.flashcards.length} flashcards`;
      renderCards(data.flashcards);
    } else {
      status.textContent = "Error: " + JSON.stringify(data);
    }
  } catch (err) {
    status.textContent = "Failed: " + err.message;
  }
});

// Render flashcards
function renderCards(cards) {
  cardsDiv.innerHTML = "";
  for (const c of cards) {
    const card = document.createElement("div");
    card.className = "card";
    const inner = document.createElement("div"); inner.className = "card-inner";
    const front = document.createElement("div"); front.className = "card-face card-front";
    const back = document.createElement("div"); back.className = "card-face card-back";
    front.innerHTML = "<strong>Q:</strong><br>" + escapeHtml(c.question);
    back.innerHTML = "<strong>A:</strong><br>" + escapeHtml(c.answer);
    inner.appendChild(front); inner.appendChild(back);
    card.appendChild(inner);
    card.addEventListener("click", () => card.classList.toggle("flipped"));
    cardsDiv.appendChild(card);
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Go Premium (payment)
premiumBtn.addEventListener("click", async () => {
  try {
    const res = await fetch("/create_checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: "50.00",
        currency: "KES",
        success_url: window.location.origin + "/success",
        cancel_url: window.location.origin + "/cancel"
      })
    });

    const data = await res.json();

    if (data && data.data && data.data.checkout_url) {
      window.location.href = data.data.checkout_url;
    } else {
      alert("Payment creation failed: " + JSON.stringify(data));
    }
  } catch (err) {
    alert("Error: " + err.message);
  }
});

