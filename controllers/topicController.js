// controllers/topicController.js
const Book = require('../models/Book');
const Topic = require('../models/Topic');
const Message = require('../models/Message');
const aiService = require('../services/aiService');

exports.create = async (req, res) => {
  const userId = req.session.userId;
  const book = await Book.findById(req.params.bookId, userId);
  if (!book) {
    req.flash('error', 'Book not found.');
    return res.redirect('/dashboard');
  }
  const { title } = req.body;
  if (!title || !title.trim()) {
    req.flash('error', 'Topic title is required.');
    return res.redirect(`/books/${book.id}`);
  }
  await Topic.create({ bookId: book.id, userId, title: title.trim() });
  req.flash('success', `Topic "${title.trim()}" added.`);
  res.redirect(`/books/${book.id}`);
};

exports.rename = async (req, res) => {
  const userId = req.session.userId;
  const topic = await Topic.findById(req.params.id, userId);
  if (!topic) {
    req.flash('error', 'Topic not found.');
    return res.redirect('/dashboard');
  }
  const { title } = req.body;
  if (!title || !title.trim()) {
    req.flash('error', 'Topic title is required.');
    return res.redirect(`/books/${topic.book_id}`);
  }
  await Topic.rename(topic.id, userId, title.trim());
  req.flash('success', 'Topic renamed.');
  res.redirect(`/books/${topic.book_id}`);
};

exports.delete = async (req, res) => {
  const userId = req.session.userId;
  const topic = await Topic.findById(req.params.id, userId);
  if (!topic) {
    req.flash('error', 'Topic not found.');
    return res.redirect('/dashboard');
  }
  await Topic.delete(topic.id, userId);
  req.flash('success', `Topic "${topic.title}" deleted.`);
  res.redirect(`/books/${topic.book_id}`);
};

exports.showTopic = async (req, res) => {
  const userId = req.session.userId;
  const topic = await Topic.findById(req.params.id, userId);
  if (!topic) {
    req.flash('error', 'Topic not found.');
    return res.redirect('/dashboard');
  }
  const book = await Book.findById(topic.book_id, userId);
  const messages = await Message.findAllByTopic(topic.id, userId);
  res.render('topics/show', { title: topic.title, topic, book, messages, aiDemoMode: aiService.DEMO_MODE });
};

// POST /topics/:id/chat  (AJAX from the chat UI)
exports.sendMessage = async (req, res) => {
  const userId = req.session.userId;
  const { message } = req.body;
  const topic = await Topic.findById(req.params.id, userId);
  if (!topic) return res.status(404).json({ error: 'Topic not found.' });
  if (!message || !message.trim()) return res.status(400).json({ error: 'Message cannot be empty.' });

  const book = await Book.findById(topic.book_id, userId);

  try {
    await Message.create({ topicId: topic.id, userId, role: 'user', content: message.trim() });
    const history = await Message.findAllByTopic(topic.id, userId);

    const aiReply = await aiService.chatWithAI({
      bookTitle: book.title,
      topicTitle: topic.title,
      history: history.slice(0, -1),
      question: message.trim()
    });

    await Message.create({ topicId: topic.id, userId, role: 'ai', content: aiReply });
    res.json({ reply: aiReply, demoMode: aiService.DEMO_MODE });
  } catch (err) {
    if (err.message === 'AI_DEMO_MODE') {
      // Shouldn't normally happen since chatWithAI itself returns demo text,
      // but handled defensively.
      return res.status(200).json({ reply: 'Demo mode is active. Add an AI_API_KEY to enable live answers.', demoMode: true });
    }
    console.error('Chat error:', err);
    res.status(502).json({ error: err.message || 'The AI service failed. Please try again.' });
  }
};

// GET /topics/:id/subheadings  (AJAX)
exports.subheadings = async (req, res) => {
  const userId = req.session.userId;
  const topic = await Topic.findById(req.params.id, userId);
  if (!topic) return res.status(404).json({ error: 'Topic not found.' });

  const contentText = await Message.concatContentForTopic(topic.id, userId);
  if (!contentText.trim()) {
    return res.json({ headings: [], empty: true });
  }

  try {
    const headings = await aiService.generateSubheadings({ topicTitle: topic.title, contentText });
    res.json({ headings, empty: false });
  } catch (err) {
    console.error('Subheadings error:', err);
    res.status(502).json({ error: err.message || 'Could not generate subheadings.' });
  }
};
