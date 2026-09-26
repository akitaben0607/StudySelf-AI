// controllers/studymapController.js
const Book = require('../models/Book');
const Topic = require('../models/Topic');

// GET /books/:bookId/studymap
// Renders a center node (the Book) connected to each of its real Topics.
// This is a live representation, not a static image — it's rebuilt from
// the current Topics every time the page loads.
exports.show = async (req, res) => {
  const userId = req.session.userId;
  const book = await Book.findById(req.params.bookId, userId);
  if (!book) {
    req.flash('error', 'Book not found.');
    return res.redirect('/dashboard');
  }
  const topics = await Topic.findAllByBook(book.id, userId);
  res.render('studymap/show', { title: 'Study Map', book, topics });
};
