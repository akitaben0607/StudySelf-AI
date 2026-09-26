// models/Message.js
const pool = require('../config/db');

const Message = {
  async findAllByTopic(topicId, userId) {
    const [rows] = await pool.query(
      'SELECT * FROM messages WHERE topic_id = ? AND user_id = ? ORDER BY created_at ASC, id ASC',
      [topicId, userId]
    );
    return rows;
  },

  async create({ topicId, userId, role, content }) {
    const [result] = await pool.query(
      'INSERT INTO messages (topic_id, user_id, role, content) VALUES (?, ?, ?, ?)',
      [topicId, userId, role, content]
    );
    return result.insertId;
  },

  async concatContentForTopic(topicId, userId) {
    const rows = await this.findAllByTopic(topicId, userId);
    return rows.map((m) => `${m.role === 'user' ? 'Q' : 'A'}: ${m.content}`).join('\n');
  }
};

module.exports = Message;
