// public/js/app.js
// Shared interactions used across the app: modal open/close and
// confirmation dialogs before destructive actions.

document.addEventListener('click', function (e) {
  const opener = e.target.closest('[data-open-modal]');
  if (opener) {
    const modal = document.getElementById(opener.getAttribute('data-open-modal'));
    if (modal) modal.classList.add('open');
    return;
  }
  const closer = e.target.closest('[data-close-modal]');
  if (closer) {
    const modal = closer.closest('.modal');
    if (modal) modal.classList.remove('open');
    return;
  }
  // Click outside modal-card closes it
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('open');
  }
});

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.open').forEach((m) => m.classList.remove('open'));
  }
});

// Confirm before destructive form submissions (delete Book, delete Topic, submit Quiz, etc.)
document.addEventListener('submit', function (e) {
  const form = e.target;
  if (form.hasAttribute('data-confirm') || (form.matches('.confirm-delete'))) {
    const message = form.getAttribute('data-confirm') || 'Are you sure? This cannot be undone.';
    if (!window.confirm(message)) {
      e.preventDefault();
    }
  }
});

// Also support data-confirm on individual buttons (e.g. quiz submit button)
document.addEventListener('click', function (e) {
  const btn = e.target.closest('button[data-confirm]');
  if (btn && btn.type === 'submit') {
    const message = btn.getAttribute('data-confirm');
    if (!window.confirm(message)) {
      e.preventDefault();
    }
  }
});
