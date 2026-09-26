// models/Book.js
const pool = require('../config/db');

const Book = {
  // Every query is scoped to user_id so a user can never see another user's books.
  async findAllByUser(userId) {
    const [rows] = await pool.query(
      'SELECT * FROM books WHERE user_id = ? ORDER BY title ASC',
      [userId]
    );
    return rows;
  },

  async findById(id, userId) {
    const [rows] = await pool.query('SELECT * FROM books WHERE id = ? AND user_id = ?', [id, userId]);
    return rows[0] || null;
  },

  async create({ userId, title, description, source = 'manual' }) {
    const year = new Date().getFullYear();
    const [result] = await pool.query(
      'INSERT INTO books (user_id, title, description, source, created_year) VALUES (?, ?, ?, ?, ?)',
      [userId, title, description || null, source, year]
    );
    return result.insertId;
  },

  async update(id, userId, { title, description }) {
    await pool.query(
      'UPDATE books SET title = ?, description = ? WHERE id = ? AND user_id = ?',
      [title, description || null, id, userId]
    );
  },

  async delete(id, userId) {
    // ON DELETE CASCADE in schema.sql removes topics, messages, quizzes,
    // flashcards, and revision items tied to this book automatically.
    await pool.query('DELETE FROM books WHERE id = ? AND user_id = ?', [id, userId]);
  },

  async count(userId) {
    const [rows] = await pool.query('SELECT COUNT(*) AS c FROM books WHERE user_id = ?', [userId]);
    return rows[0].c;
  },

  async search(userId, term) {
    const [rows] = await pool.query(
      'SELECT * FROM books WHERE user_id = ? AND (title LIKE ? OR description LIKE ?) ORDER BY title ASC',
      [userId, `%${term}%`, `%${term}%`]
    );
    return rows;
  }
};

module.exports = Book;
