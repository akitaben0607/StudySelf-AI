// public/js/voice.js
// Voice Study Mode: User speaks -> Web Speech API transcribes it into the
// chat input -> normal chat flow sends it -> the AI's reply is read aloud
// with speech synthesis. Falls back gracefully if the browser doesn't
// support the required APIs, and never blocks the regular text chat.
(function () {
  const voiceBtn = document.getElementById('voice-mode-btn');
  const chatInput = document.getElementById('chat-input');
  const chatForm = document.getElementById('chat-form');
  if (!voiceBtn || !chatInput) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const synth = window.speechSynthesis;

  if (!SpeechRecognition) {
    voiceBtn.addEventListener('click', function () {
      window.alert('Voice Study Mode is not supported in this browser. Try Chrome or Edge, or use the text chat instead.');
    });
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  let listening = false;

  recognition.addEventListener('start', function () {
    listening = true;
    voiceBtn.textContent = '🎙 Listening…';
    voiceBtn.classList.add('btn-primary');
  });

  recognition.addEventListener('end', function () {
    listening = false;
    voiceBtn.textContent = '🎙 Voice Mode';
    voiceBtn.classList.remove('btn-primary');
  });

  recognition.addEventListener('error', function () {
    listening = false;
    voiceBtn.textContent = '🎙 Voice Mode';
    voiceBtn.classList.remove('btn-primary');
  });

  recognition.addEventListener('result', function (e) {
    const transcript = e.results[0][0].transcript;
    chatInput.value = transcript;
    chatForm.requestSubmit();
  });

  voiceBtn.addEventListener('click', function () {
    if (listening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  });

  // Speak the AI's replies aloud when Voice Mode produced the question.
  // Hooks into the chat window's mutation so it works for any new AI bubble.
  if (synth) {
    const chatWindow = document.getElementById('chat-window');
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (node) {
          if (node.nodeType === 1 && node.classList.contains('chat-msg-ai') && !node.classList.contains('chat-msg-loading')) {
            const text = node.querySelector('.chat-msg-bubble')?.textContent;
            if (text && wasLastInputFromVoice) {
              const utterance = new SpeechSynthesisUtterance(text);
              synth.speak(utterance);
            }
            wasLastInputFromVoice = false;
          }
        });
      });
    });
    if (chatWindow) observer.observe(chatWindow, { childList: true });
  }

  let wasLastInputFromVoice = false;
  recognition.addEventListener('result', function () {
    wasLastInputFromVoice = true;
  });
})();
