// controllers/flashcardController.js
const Book = require('../models/Book');
const Topic = require('../models/Topic');
const Message = require('../models/Message');
const Flashcard = require('../models/Flashcard');
const aiService = require('../services/aiService');

// GET /books/:bookId/flashcards -> setup screen (choose topic or whole book)
exports.setup = async (req, res) => {
  const book = await Book.findById(req.params.bookId, req.session.userId);
  if (!book) {
    req.flash('error', 'Book not found.');
    return res.redirect('/dashboard');
  }
  const topics = await Topic.findAllByBook(book.id, req.session.userId);
  res.render('flashcards/setup', { title: 'Flashcards', book, topics });
};

// POST /books/:bookId/flashcards/generate
exports.generate = async (req, res) => {
  const userId = req.session.userId;
  const book = await Book.findById(req.params.bookId, userId);
  if (!book) {
    req.flash('error', 'Book not found.');
    return res.redirect('/dashboard');
  }
  const { topicId, count } = req.body;
  const cardCount = Math.min(30, Math.max(5, parseInt(count, 10) || 10));

  let contentText = '';
  let scopeLabel = book.title;
  if (topicId) {
    const topic = await Topic.findById(topicId, userId);
    if (!topic) {
      req.flash('error', 'Topic not found.');
      return res.redirect(`/books/${book.id}/flashcards`);
    }
    scopeLabel = topic.title;
    contentText = (await Message.concatContentForTopic(topic.id, userId)) || topic.summary || topic.title;
  } else {
    const topics = await Topic.findAllByBook(book.id, userId);
    const parts = [];
    for (const t of topics) {
      const c = await Message.concatContentForTopic(t.id, userId);
      parts.push(`${t.title}: ${c || t.summary || ''}`);
    }
    contentText = parts.join('\n\n') || book.title;
  }

  try {
    const cards = await aiService.generateFlashcards({ scopeLabel, contentText, count: cardCount });
    if (!cards.length) {
      req.flash('error', 'Could not generate flashcards from this content yet. Chat in the topic first.');
      return res.redirect(`/books/${book.id}/flashcards`);
    }
    await Flashcard.createMany(userId, book.id, topicId || null, cards);
    req.flash('success', `${cards.length} flashcards generated.`);
    res.redirect(`/books/${book.id}/flashcards/study`);
  } catch (err) {
    console.error('Flashcard generation error:', err);
    req.flash('error', err.message || 'Flashcard generation failed.');
    res.redirect(`/books/${book.id}/flashcards`);
  }
};

// GET /books/:bookId/flashcards/study
exports.study = async (req, res) => {
  const book = await Book.findById(req.params.bookId, req.session.userId);
  if (!book) {
    req.flash('error', 'Book not found.');
    return res.redirect('/dashboard');
  }
  const cards = await Flashcard.findByBook(book.id, req.session.userId);
  res.render('flashcards/study', { title: 'Flashcards', book, cards });
};

// POST /flashcards/:id/rate  (AJAX)
exports.rate = async (req, res) => {
  const { difficulty } = req.body;
  if (!['easy', 'difficult'].includes(difficulty)) {
    return res.status(400).json({ error: 'Invalid difficulty.' });
  }
  await Flashcard.setDifficulty(req.params.id, req.session.userId, difficulty);
  res.json({ ok: true });
};
