// models/Flashcard.js
const pool = require('../config/db');

const Flashcard = {
  async createMany(userId, bookId, topicId, cards) {
    const values = cards.map((c) => [userId, bookId, topicId || null, c.front, c.back]);
    if (!values.length) return;
    await pool.query(
      'INSERT INTO flashcards (user_id, book_id, topic_id, front, back) VALUES ?',
      [values]
    );
  },

  async findByBook(bookId, userId) {
    const [rows] = await pool.query(
      'SELECT * FROM flashcards WHERE book_id = ? AND user_id = ? ORDER BY id ASC',
      [bookId, userId]
    );
    return rows;
  },

  async findByTopic(topicId, userId) {
    const [rows] = await pool.query(
      'SELECT * FROM flashcards WHERE topic_id = ? AND user_id = ? ORDER BY id ASC',
      [topicId, userId]
    );
    return rows;
  },

  async setDifficulty(id, userId, difficulty) {
    await pool.query(
      'UPDATE flashcards SET difficulty = ? WHERE id = ? AND user_id = ?',
      [difficulty, id, userId]
    );
  }
};

module.exports = Flashcard;
