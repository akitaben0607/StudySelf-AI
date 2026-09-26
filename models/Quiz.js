// models/Quiz.js
const pool = require('../config/db');

const Quiz = {
  async create({ userId, bookId, topicId, questionCount }) {
    const [result] = await pool.query(
      'INSERT INTO quizzes (user_id, book_id, topic_id, question_count) VALUES (?, ?, ?, ?)',
      [userId, bookId, topicId || null, questionCount]
    );
    return result.insertId;
  },

  async findById(id, userId) {
    const [rows] = await pool.query('SELECT * FROM quizzes WHERE id = ? AND user_id = ?', [id, userId]);
    return rows[0] || null;
  },

  async addQuestions(quizId, questions) {
    // questions: [{ question, options:{A,B,C,D}, correct, topicId }]
    const values = questions.map((q) => [
      quizId,
      q.topicId || null,
      q.question,
      q.options.A,
      q.options.B,
      q.options.C,
      q.options.D,
      q.correct
    ]);
    if (!values.length) return;
    await pool.query(
      `INSERT INTO quiz_questions
       (quiz_id, topic_id, question, option_a, option_b, option_c, option_d, correct_option)
       VALUES ?`,
      [values]
    );
  },

  async getQuestions(quizId) {
    const [rows] = await pool.query('SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY id ASC', [quizId]);
    return rows;
  },

  async recordAttempt({ quizId, userId, score, total, percentage }) {
    const [result] = await pool.query(
      'INSERT INTO quiz_attempts (quiz_id, user_id, score, total, percentage) VALUES (?, ?, ?, ?, ?)',
      [quizId, userId, score, total, percentage]
    );
    return result.insertId;
  },

  async recordAnswers(attemptId, answers) {
    // answers: [{ questionId, topicId, selected, isCorrect }]
    const values = answers.map((a) => [attemptId, a.questionId, a.topicId || null, a.selected || null, a.isCorrect ? 1 : 0]);
    if (!values.length) return;
    await pool.query(
      'INSERT INTO quiz_answers (attempt_id, question_id, topic_id, selected_option, is_correct) VALUES ?',
      [values]
    );
  },

  async getAttempt(attemptId, userId) {
    const [rows] = await pool.query(
      'SELECT * FROM quiz_attempts WHERE id = ? AND user_id = ?',
      [attemptId, userId]
    );
    return rows[0] || null;
  },

  async getAnswersForAttempt(attemptId) {
    const [rows] = await pool.query(
      `SELECT qa.*, qq.question, qq.option_a, qq.option_b, qq.option_c, qq.option_d,
              qq.correct_option, t.title AS topic_title
       FROM quiz_answers qa
       JOIN quiz_questions qq ON qq.id = qa.question_id
       LEFT JOIN topics t ON t.id = qa.topic_id
       WHERE qa.attempt_id = ?`,
      [attemptId]
    );
    return rows;
  },

  async historyForUser(userId, limit = 20) {
    const [rows] = await pool.query(
      `SELECT qa.*, q.book_id, q.topic_id, b.title AS book_title, t.title AS topic_title
       FROM quiz_attempts qa
       JOIN quizzes q ON q.id = qa.quiz_id
       JOIN books b ON b.id = q.book_id
       LEFT JOIN topics t ON t.id = q.topic_id
       WHERE qa.user_id = ?
       ORDER BY qa.created_at DESC
       LIMIT ?`,
      [userId, limit]
    );
    return rows;
  },

  async statsForUser(userId) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS completed, COALESCE(AVG(percentage),0) AS avg_score FROM quiz_attempts WHERE user_id = ?',
      [userId]
    );
    return rows[0];
  },

  // Per-topic accuracy across all of a user's quiz answers — powers the
  // weakness detector and revision queue.
  async topicAccuracy(userId) {
    const [rows] = await pool.query(
      `SELECT qans.topic_id, t.title AS topic_title, t.book_id,
              SUM(qans.is_correct) AS correct_count,
              COUNT(*) AS total_count
       FROM quiz_answers qans
       JOIN quiz_attempts att ON att.id = qans.attempt_id
       JOIN topics t ON t.id = qans.topic_id
       WHERE att.user_id = ? AND qans.topic_id IS NOT NULL
       GROUP BY qans.topic_id, t.title, t.book_id`,
      [userId]
    );
    return rows.map((r) => ({
      ...r,
      accuracy: r.total_count > 0 ? (r.correct_count / r.total_count) * 100 : 0
    }));
  }
};

module.exports = Quiz;
