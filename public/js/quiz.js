// public/js/quiz.js
(function () {
  const questions = document.querySelectorAll('.quiz-question');
  const prevBtn = document.getElementById('quiz-prev-btn');
  const nextBtn = document.getElementById('quiz-next-btn');
  const submitBtn = document.getElementById('quiz-submit-btn');
  const progressFill = document.getElementById('quiz-progress-fill');
  const progressLabel = document.getElementById('quiz-progress-label');

  if (!questions.length) return;

  let current = 0;
  const total = questions.length;

  function render() {
    questions.forEach((q, i) => {
      q.style.display = i === current ? '' : 'none';
    });
    prevBtn.disabled = current === 0;
    const isLast = current === total - 1;
    nextBtn.style.display = isLast ? 'none' : '';
    submitBtn.style.display = isLast ? '' : 'none';
    progressFill.style.width = `${((current + 1) / total) * 100}%`;
    progressLabel.textContent = `Question ${current + 1} of ${total}`;
  }

  function currentAnswered() {
    return !!questions[current].querySelector('input:checked');
  }

  nextBtn.addEventListener('click', function () {
    if (!currentAnswered()) {
      window.alert('Please select an answer before moving on.');
      return;
    }
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

  // Prevent accidental submission: block submit if the last question isn't answered.
  document.getElementById('quiz-form').addEventListener('submit', function (e) {
    if (!currentAnswered()) {
      e.preventDefault();
      window.alert('Please answer the last question before submitting.');
    }
  });

  render();
})();
