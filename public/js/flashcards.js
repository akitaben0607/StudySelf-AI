// public/js/flashcards.js
(function () {
  const stage = document.querySelector('.flashcard-stage');
  if (!stage) return;

  const total = parseInt(stage.getAttribute('data-total'), 10);
  const flashcard = document.getElementById('flashcard');
  const fronts = document.querySelectorAll('.flashcard-front');
  const backs = document.querySelectorAll('.flashcard-back');
  const progressEl = document.getElementById('fc-progress');
  const prevBtn = document.getElementById('fc-prev');
  const nextBtn = document.getElementById('fc-next');
  const flipBtn = document.getElementById('fc-flip');
  const rateBtns = document.querySelectorAll('.fc-rate-btn');
  const rateConfirm = document.getElementById('rate-confirm');
  const cardIds = window.__FLASHCARD_IDS__ || [];

  let current = 0;
  let flipped = false;

  function render() {
    fronts.forEach((el) => (el.style.display = 'none'));
    backs.forEach((el) => (el.style.display = 'none'));
    flipped = false;
    fronts[current].style.display = 'flex';
    progressEl.textContent = `Card ${current + 1} of ${total}`;
    prevBtn.disabled = current === 0;
    rateConfirm.style.display = 'none';
  }

  flashcard.addEventListener('click', function () {
    flipped = !flipped;
    fronts[current].style.display = flipped ? 'none' : 'flex';
    backs[current].style.display = flipped ? 'flex' : 'none';
  });

  nextBtn.addEventListener('click', function () {
    if (current < total - 1) {
      current++;
      render();
    }
  });

  prevBtn.addEventListener('click', function () {
    if (current > 0) {
      current--;
      render();
    }
  });

  flipBtn.addEventListener('click', function () {
    flashcard.click();
  });

  rateBtns.forEach((btn) => {
    btn.addEventListener('click', async function (e) {
      e.stopPropagation();
      const difficulty = btn.getAttribute('data-difficulty');
      const cardId = cardIds[current];
      if (!cardId) return;
      try {
        await fetch(`/flashcards/${cardId}/rate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ difficulty })
        });
        rateConfirm.textContent = difficulty === 'easy' ? 'Marked as Easy' : 'Marked as Difficult';
        rateConfirm.style.display = 'block';
      } catch (err) {
        // Non-critical — rating failure shouldn't block studying.
      }
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') nextBtn.click();
    if (e.key === 'ArrowLeft') prevBtn.click();
    if (e.key === ' ') { e.preventDefault(); flashcard.click(); }
  });

  render();
})();
