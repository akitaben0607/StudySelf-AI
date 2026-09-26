// models/Revision.js
const pool = require('../config/db');

const Revision = {
  // Upsert a revision item for a topic based on latest computed accuracy.
  async upsert({ userId, topicId, bookId, priority, reason, accuracy }) {
    await pool.query(
      `INSERT INTO revision_queue (user_id, topic_id, book_id, priority, reason, accuracy, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')
       ON DUPLICATE KEY UPDATE
         priority = VALUES(priority),
         reason = VALUES(reason),
         accuracy = VALUES(accuracy),
         status = 'pending',
         revised_at = NULL`,
      [userId, topicId, bookId, priority, reason, accuracy]
    );
  },

  async listForUser(userId) {
    const [rows] = await pool.query(
      `SELECT rq.*, t.title AS topic_title, b.title AS book_title
       FROM revision_queue rq
       JOIN topics t ON t.id = rq.topic_id
       JOIN books b ON b.id = rq.book_id
       WHERE rq.user_id = ?
       ORDER BY FIELD(rq.priority, 'high','medium','low'), rq.updated_at DESC`,
      [userId]
    );
    return rows;
  },

  async markRevised(id, userId) {
    await pool.query(
      "UPDATE revision_queue SET status = 'revised', revised_at = NOW() WHERE id = ? AND user_id = ?",
      [id, userId]
    );
  },

  async countPending(userId) {
    const [rows] = await pool.query(
      "SELECT COUNT(*) AS c FROM revision_queue WHERE user_id = ? AND status = 'pending'",
      [userId]
    );
    return rows[0].c;
  }
};

module.exports = Revision;
