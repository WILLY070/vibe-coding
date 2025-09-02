document.addEventListener('DOMContentLoaded', function() {
    const textInput = document.getElementById('textInput');
    const cardCount = document.getElementById('cardCount');
    const generateBtn = document.getElementById('generateBtn');
    const flashcardsSection = document.getElementById('flashcardsSection');
    const flashcardsContainer = document.getElementById('flashcardsContainer');
    const loading = document.getElementById('loading');
    const upgradeBtn = document.getElementById('upgradeBtn');

    generateBtn.addEventListener('click', generateFlashcards);
    upgradeBtn.addEventListener('click', handleUpgrade);

    async function generateFlashcards() {
        const text = textInput.value.trim();
        const n = parseInt(cardCount.value);

        if (!text) {
            alert('Please enter some text to generate flashcards.');
            return;
        }

        loading.style.display = 'block';
        flashcardsSection.style.display = 'none';

        try {
            const response = await fetch('/generate_flashcards', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text, n })
            });

            const data = await response.json();

            if (response.ok) {
                displayFlashcards(data.flashcards);
            } else {
                throw new Error(data.error || 'Failed to generate flashcards');
            }
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            loading.style.display = 'none';
        }
    }

    function displayFlashcards(flashcards) {
        flashcardsContainer.innerHTML = '';
        
        flashcards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'flashcard';
            cardElement.innerHTML = `
                <h3>${card.question}</h3>
                <p style="display: none;">${card.answer}</p>
                <small style="opacity: 0.7;">Click to reveal answer</small>
            `;

            cardElement.addEventListener('click', function() {
                const question = this.querySelector('h3');
                const answer = this.querySelector('p');
                const hint = this.querySelector('small');

                if (this.classList.contains('flipped')) {
                    // Show question
                    question.style.display = 'block';
                    answer.style.display = 'none';
                    hint.textContent = 'Click to reveal answer';
                    this.classList.remove('flipped');
                } else {
                    // Show answer
                    question.style.display = 'none';
                    answer.style.display = 'block';
                    hint.textContent = 'Click to show question';
                    this.classList.add('flipped');
                }
            });

            flashcardsContainer.appendChild(cardElement);
        });

        flashcardsSection.style.display = 'block';
    }

    async function handleUpgrade() {
        try {
            const response = await fetch('/create_checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: 999, // $9.99 in cents
                    currency: 'USD',
                    success_url: window.location.origin + '/success',
                    cancel_url: window.location.origin + '/cancel'
                })
            });

            const data = await response.json();

            if (response.ok && data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error || 'Failed to create checkout');
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }
});