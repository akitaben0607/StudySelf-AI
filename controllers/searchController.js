// controllers/searchController.js
const Book = require('../models/Book');
const Topic = require('../models/Topic');

exports.search = async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) {
    return res.render('search/results', { title: 'Search', q: '', books: [], topics: [] });
  }
  const [books, topics] = await Promise.all([
    Book.search(req.session.userId, q),
    Topic.search(req.session.userId, q)
  ]);
  res.render('search/results', { title: 'Search', q, books, topics });
};
