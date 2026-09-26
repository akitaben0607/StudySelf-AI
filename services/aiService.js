// services/aiService.js
//
// All AI calls for the whole app go through this one module, so the API
// key stays server-side (never sent to the browser) and swapping providers
// only means editing this file. If AI_API_KEY is not set, every function
// below falls back to clearly-labeled demo content so the rest of the app
// (chat UI, quiz UI, flashcards UI, etc.) can still be built and tested.

require('dotenv').config();

const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_API_BASE_URL = process.env.AI_API_BASE_URL || 'https://api.openai.com/v1';
const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';
const DEMO_MODE = !AI_API_KEY;

/**
 * Low-level call to an OpenAI-compatible /chat/completions endpoint.
 * Returns the raw assistant text. Throws on network/API failure so
 * callers can show a proper error state instead of a fake answer.
 */
async function callChatModel(messages, { json = false, temperature = 0.5 } = {}) {
  if (DEMO_MODE) {
    throw new Error('AI_DEMO_MODE'); // callers catch this and use demo content
  }

  const res = await fetch(`${AI_API_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_API_KEY}`
    },
    body: JSON.stringify({
      model: AI_MODEL,
      temperature,
      messages,
      ...(json ? { response_format: { type: 'json_object' } } : {})
    })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`AI service error (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

function safeJsonParse(text, fallback) {
  try {
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------
// 1. Topic chat — answer a student question inside a Book/Topic context
// ---------------------------------------------------------------------
async function chatWithAI({ bookTitle, topicTitle, history, question }) {
  if (DEMO_MODE) {
    return (
      `[Demo mode — connect an AI_API_KEY in .env for real answers]\n\n` +
      `Here's a starter explanation of "${question}" within ${bookTitle} → ${topicTitle}:\n\n` +
      `${topicTitle} is a concept you're studying as part of ${bookTitle}. In a live AI response, ` +
      `I would explain the core definition, walk through a simple example, and connect it back to ` +
      `related ideas in this topic so you can build a mental model rather than memorize a fact.`
    );
  }

  const systemPrompt =
    `You are StudySelf AI, a focused study tutor. The student is working inside ` +
    `Book "${bookTitle}", Topic "${topicTitle}". Answer clearly, use short paragraphs or ` +
    `bullet points, give examples where useful, and keep the student's context in mind. ` +
    `Do not mention that you are an AI model or discuss unrelated topics.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content })),
    { role: 'user', content: question }
  ];

  try {
    return await callChatModel(messages);
  } catch (err) {
    if (err.message === 'AI_DEMO_MODE') throw err;
    throw new Error('The AI service is currently unavailable. Please try again shortly.');
  }
}

// ---------------------------------------------------------------------
// 2. Show Subheadings — condense a topic's conversation into an outline
// ---------------------------------------------------------------------
async function generateSubheadings({ topicTitle, contentText }) {
  if (DEMO_MODE) {
    return [
      'Introduction',
      'Definition',
      'Key Types / Categories',
      'How It Works',
      'Advantages',
      'Applications',
      'Examples'
    ];
  }

  const prompt =
    `Based on the following study material for the topic "${topicTitle}", produce a concise ` +
    `hierarchical list of major headings and subheadings ONLY (no long explanations). ` +
    `Return JSON: {"headings": ["Introduction", "Definition", ...]}.\n\nMATERIAL:\n${contentText.slice(0, 6000)}`;

  try {
    const text = await callChatModel(
      [
        { role: 'system', content: 'You output only valid JSON, no preamble.' },
        { role: 'user', content: prompt }
      ],
      { json: true }
    );
    const parsed = safeJsonParse(text, { headings: [] });
    return parsed.headings && parsed.headings.length ? parsed.headings : ['No content to summarize yet.'];
  } catch (err) {
    if (err.message === 'AI_DEMO_MODE') throw err;
    throw new Error('Could not generate subheadings right now. Please try again.');
  }
}

// ---------------------------------------------------------------------
// 3. Quiz generation
// ---------------------------------------------------------------------
async function generateQuizQuestions({ scopeLabel, contentText, count }) {
  if (DEMO_MODE) {
    const demo = [];
    for (let i = 1; i <= count; i++) {
      demo.push({
        question: `[Demo] Sample question #${i} about ${scopeLabel}?`,
        options: { A: 'Option A', B: 'Option B', C: 'Option C (correct)', D: 'Option D' },
        correct: 'C'
      });
    }
    return demo;
  }

  const prompt =
    `Create ${count} multiple-choice quiz questions (4 options each, exactly one correct answer) ` +
    `based on this study content about "${scopeLabel}". Vary difficulty. Return JSON: ` +
    `{"questions":[{"question":"...","options":{"A":"...","B":"...","C":"...","D":"..."},"correct":"A"}]}` +
    `\n\nCONTENT:\n${contentText.slice(0, 8000)}`;

  try {
    const text = await callChatModel(
      [
        { role: 'system', content: 'You output only valid JSON, no preamble, no markdown fences.' },
        { role: 'user', content: prompt }
      ],
      { json: true, temperature: 0.7 }
    );
    const parsed = safeJsonParse(text, { questions: [] });
    return parsed.questions.slice(0, count);
  } catch (err) {
    if (err.message === 'AI_DEMO_MODE') throw err;
    throw new Error('Quiz generation failed. Please try again.');
  }
}

// ---------------------------------------------------------------------
// 4. Flashcard generation
// ---------------------------------------------------------------------
async function generateFlashcards({ scopeLabel, contentText, count = 10 }) {
  if (DEMO_MODE) {
    const demo = [];
    for (let i = 1; i <= count; i++) {
      demo.push({
        front: `[Demo] Key concept #${i} in ${scopeLabel}`,
        back: `[Demo] Explanation of concept #${i}. Connect an AI_API_KEY for real, content-based cards.`
      });
    }
    return demo;
  }

  const prompt =
    `Create ${count} flashcards from this study content about "${scopeLabel}". Each flashcard: a short ` +
    `question or concept on the front, and a clear answer/explanation on the back. Return JSON: ` +
    `{"cards":[{"front":"...","back":"..."}]}\n\nCONTENT:\n${contentText.slice(0, 8000)}`;

  try {
    const text = await callChatModel(
      [
        { role: 'system', content: 'You output only valid JSON, no preamble.' },
        { role: 'user', content: prompt }
      ],
      { json: true, temperature: 0.6 }
    );
    const parsed = safeJsonParse(text, { cards: [] });
    return parsed.cards.slice(0, count);
  } catch (err) {
    if (err.message === 'AI_DEMO_MODE') throw err;
    throw new Error('Flashcard generation failed. Please try again.');
  }
}

// ---------------------------------------------------------------------
// 5. PDF -> Book: identify topics from extracted PDF text
// ---------------------------------------------------------------------
async function identifyTopicsFromText({ text }) {
  if (DEMO_MODE) {
    return {
      bookTitle: 'Imported Study Material',
      topics: [
        { title: 'Overview', summary: 'Introductory content extracted from the uploaded PDF.' },
        { title: 'Key Concepts', summary: 'Main concepts identified in the document.' },
        { title: 'Details & Examples', summary: 'Supporting details and examples from the document.' }
      ]
    };
  }

  const prompt =
    `Analyze this study document text and (1) suggest a short Book title summarizing the whole ` +
    `document, and (2) split it into 3-8 logical Topics, each with a 1-2 sentence summary. Return JSON: ` +
    `{"bookTitle":"...","topics":[{"title":"...","summary":"..."}]}\n\nTEXT:\n${text.slice(0, 12000)}`;

  try {
    const responseText = await callChatModel(
      [
        { role: 'system', content: 'You output only valid JSON, no preamble.' },
        { role: 'user', content: prompt }
      ],
      { json: true }
    );
    return safeJsonParse(responseText, { bookTitle: 'Imported Study Material', topics: [] });
  } catch (err) {
    if (err.message === 'AI_DEMO_MODE') throw err;
    throw new Error('AI could not analyze this PDF right now. Please try again.');
  }
}

module.exports = {
  DEMO_MODE,
  chatWithAI,
  generateSubheadings,
  generateQuizQuestions,
  generateFlashcards,
  identifyTopicsFromText
};
