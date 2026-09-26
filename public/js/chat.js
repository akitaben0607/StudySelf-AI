// public/js/chat.js
(function () {
  const chatWindow = document.getElementById('chat-window');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send-btn');
  const subheadingsBtn = document.getElementById('subheadings-btn');

  if (!chatWindow || !chatForm) return;

  const topicId = chatWindow.getAttribute('data-topic-id');

  function scrollToBottom() {
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function appendMessage(role, text) {
    const wrap = document.createElement('div');
    wrap.className = `chat-msg chat-msg-${role}`;
    wrap.innerHTML = `
      <span class="chat-msg-role">${role === 'user' ? 'You' : 'StudySelf AI'}</span>
      <div class="chat-msg-bubble"></div>
    `;
    wrap.querySelector('.chat-msg-bubble').textContent = text;
    // Remove empty-state placeholder if present
    const empty = chatWindow.querySelector('.chat-empty');
    if (empty) empty.remove();
    chatWindow.appendChild(wrap);
    scrollToBottom();
    return wrap;
  }

  function appendLoading() {
    const wrap = document.createElement('div');
    wrap.className = 'chat-msg chat-msg-ai chat-msg-loading';
    wrap.innerHTML = `<span class="chat-msg-role">StudySelf AI</span><div class="chat-msg-bubble">Thinking…</div>`;
    chatWindow.appendChild(wrap);
    scrollToBottom();
    return wrap;
  }

  chatForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;

    appendMessage('user', message);
    chatInput.value = '';
    sendBtn.disabled = true;
    chatInput.disabled = true;
    const loadingEl = appendLoading();

    try {
      const res = await fetch(`/topics/${topicId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const data = await res.json();
      loadingEl.remove();

      if (!res.ok) {
        appendMessage('ai', `⚠ ${data.error || 'The AI service failed. Please try again.'}`);
      } else {
        appendMessage('ai', data.reply);
      }
    } catch (err) {
      loadingEl.remove();
      appendMessage('ai', '⚠ Network error. Please check your connection and try again.');
    } finally {
      sendBtn.disabled = false;
      chatInput.disabled = false;
      chatInput.focus();
    }
  });

  chatInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatForm.requestSubmit();
    }
  });

  // ---- Show Subheadings ----
  if (subheadingsBtn) {
    subheadingsBtn.addEventListener('click', async function () {
      const modal = document.getElementById('subheadings-modal');
      const content = document.getElementById('subheadings-content');
      modal.classList.add('open');
      content.innerHTML = '<p class="muted">Analyzing this topic…</p>';

      try {
        const res = await fetch(`/topics/${topicId}/subheadings`);
        const data = await res.json();
        if (!res.ok) {
          content.innerHTML = `<p class="muted">⚠ ${data.error || 'Could not generate subheadings.'}</p>`;
          return;
        }
        if (data.empty) {
          content.innerHTML = '<p class="muted">Chat about this topic first — subheadings are generated from your conversation.</p>';
          return;
        }
        const items = data.headings.map((h) => `<li>${h}</li>`).join('');
        content.innerHTML = `<ol>${items}</ol>`;
      } catch (err) {
        content.innerHTML = '<p class="muted">⚠ Network error. Please try again.</p>';
      }
    });
  }
})();
