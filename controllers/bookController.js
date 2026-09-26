// controllers/bookController.js
const Book = require('../models/Book');
const Topic = require('../models/Topic');
const Quiz = require('../models/Quiz');
const Revision = require('../models/Revision');

exports.dashboard = async (req, res) => {
  const userId = req.session.userId;
  const books = await Book.findAllByUser(userId);
  const stats = await Quiz.statsForUser(userId);
  const pendingRevision = await Revision.countPending(userId);
  const totalTopics = await Topic.count(userId);

  res.render('books/dashboard', {
    title: 'Dashboard',
    books,
    stats: {
      totalBooks: books.length,
      totalTopics,
      quizzesCompleted: stats.completed,
      avgScore: Number(stats.avg_score).toFixed(1),
      pendingRevision
    }
  });
};

exports.showNewForm = (req, res) => {
  res.render('books/new', { title: 'New Book' });
};

exports.create = async (req, res) => {
  const { title, description } = req.body;
  if (!title || !title.trim()) {
    req.flash('error', 'Book title is required.');
    return res.redirect('/books/new');
  }
  const bookId = await Book.create({ userId: req.session.userId, title: title.trim(), description });
  req.flash('success', `Book "${title.trim()}" created.`);
  res.redirect(`/books/${bookId}`);
};

exports.showBook = async (req, res) => {
  const userId = req.session.userId;
  const book = await Book.findById(req.params.id, userId);
  if (!book) {
    req.flash('error', 'Book not found.');
    return res.redirect('/dashboard');
  }
  const topics = await Topic.findAllByBook(book.id, userId);
  res.render('books/show', { title: book.title, book, topics });
};

exports.showEditForm = async (req, res) => {
  const book = await Book.findById(req.params.id, req.session.userId);
  if (!book) {
    req.flash('error', 'Book not found.');
    return res.redirect('/dashboard');
  }
  res.render('books/edit', { title: 'Edit Book', book });
};

exports.update = async (req, res) => {
  const { title, description } = req.body;
  const book = await Book.findById(req.params.id, req.session.userId);
  if (!book) {
    req.flash('error', 'Book not found.');
    return res.redirect('/dashboard');
  }
  if (!title || !title.trim()) {
    req.flash('error', 'Book title is required.');
    return res.redirect(`/books/${book.id}/edit`);
  }
  await Book.update(book.id, req.session.userId, { title: title.trim(), description });
  req.flash('success', 'Book updated.');
  res.redirect(`/books/${book.id}`);
};

exports.delete = async (req, res) => {
  const book = await Book.findById(req.params.id, req.session.userId);
  if (!book) {
    req.flash('error', 'Book not found.');
    return res.redirect('/dashboard');
  }
  await Book.delete(book.id, req.session.userId); // cascades to topics/messages/quizzes/flashcards/revision
  req.flash('success', `Book "${book.title}" and all its topics were deleted.`);
  res.redirect('/dashboard');
};
