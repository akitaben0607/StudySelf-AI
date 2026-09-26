// models/Document.js
const pool = require('../config/db');

const Document = {
  async create({ userId, originalFilename, fileSize }) {
    const [result] = await pool.query(
      'INSERT INTO uploaded_documents (user_id, original_filename, file_size, status) VALUES (?, ?, ?, "processing")',
      [userId, originalFilename, fileSize]
    );
    return result.insertId;
  },

  async markCompleted(id, bookId, pageCount) {
    await pool.query(
      'UPDATE uploaded_documents SET status = "completed", book_id = ?, page_count = ? WHERE id = ?',
      [bookId, pageCount, id]
    );
  },

  async markFailed(id, errorMessage) {
    await pool.query(
      'UPDATE uploaded_documents SET status = "failed", error_message = ? WHERE id = ?',
      [errorMessage.slice(0, 490), id]
    );
  }
};

module.exports = Document;
