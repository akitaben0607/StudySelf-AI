// models/Topic.js
const pool = require('../config/db');

const Topic = {
  async findAllByBook(bookId, userId) {
    const [rows] = await pool.query(
      'SELECT * FROM topics WHERE book_id = ? AND user_id = ? ORDER BY title ASC',
      [bookId, userId]
    );
    return rows;
  },

  async findById(id, userId) {
    const [rows] = await pool.query('SELECT * FROM topics WHERE id = ? AND user_id = ?', [id, userId]);
    return rows[0] || null;
  },

  async create({ bookId, userId, title, summary }) {
    const [result] = await pool.query(
      'INSERT INTO topics (book_id, user_id, title, summary) VALUES (?, ?, ?, ?)',
      [bookId, userId, title, summary || null]
    );
    return result.insertId;
  },

  async rename(id, userId, title) {
    await pool.query('UPDATE topics SET title = ? WHERE id = ? AND user_id = ?', [title, id, userId]);
  },

  async delete(id, userId) {
    await pool.query('DELETE FROM topics WHERE id = ? AND user_id = ?', [id, userId]);
  },

  async count(userId) {
    const [rows] = await pool.query('SELECT COUNT(*) AS c FROM topics WHERE user_id = ?', [userId]);
    return rows[0].c;
  },

  async countForBook(bookId, userId) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS c FROM topics WHERE book_id = ? AND user_id = ?',
      [bookId, userId]
    );
    return rows[0].c;
  },

  async search(userId, term) {
    const [rows] = await pool.query(
      `SELECT t.*, b.title AS book_title FROM topics t
       JOIN books b ON b.id = t.book_id
       WHERE t.user_id = ? AND (t.title LIKE ? OR t.summary LIKE ?)
       ORDER BY t.title ASC`,
      [userId, `%${term}%`, `%${term}%`]
    );
    return rows;
  }
};

module.exports = Topic;
