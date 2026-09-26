// controllers/quizController.js
const Book = require('../models/Book');
const Topic = require('../models/Topic');
const Message = require('../models/Message');
const Quiz = require('../models/Quiz');
const Revision = require('../models/Revision');
const aiService = require('../services/aiService');

// GET /books/:bookId/quiz  -> choose "All Topics" vs "Specific Topic"
exports.showScopeChoice = async (req, res) => {
  const book = await Book.findById(req.params.bookId, req.session.userId);
  if (!book) {
    req.flash('error', 'Book not found.');
    return res.redirect('/dashboard');
  }
  const topics = await Topic.findAllByBook(book.id, req.session.userId);
  if (!topics.length) {
    req.flash('error', 'Add at least one Topic before taking a quiz.');
    return res.redirect(`/books/${book.id}`);
  }
  res.render('quiz/scope', { title: 'Take Quiz', book, topics });
};

// GET /books/:bookId/quiz/setup?scope=all|topic&topicId=..  -> choose question count
exports.showSetup = async (req, res) => {
  const book = await Book.findById(req.params.bookId, req.session.userId);
  if (!book) {
    req.flash('error', 'Book not found.');
    return res.redirect('/dashboard');
  }
  const { scope, topicId } = req.query;
  let topic = null;
  if (scope === 'topic') {
    topic = await Topic.findById(topicId, req.session.userId);
    if (!topic) {
      req.flash('error', 'Topic not found.');
      return res.redirect(`/books/${book.id}/quiz`);
    }
  }
  res.render('quiz/setup', { title: 'Take Quiz', book, topic, scope });
};

// POST /books/:bookId/quiz  -> generate and start quiz
exports.generate = async (req, res) => {
  const userId = req.session.userId;
  const book = await Book.findById(req.params.bookId, userId);
  if (!book) {
    req.flash('error', 'Book not found.');
    return res.redirect('/dashboard');
  }
  const { scope, topicId, questionCount } = req.body;
  const count = Math.min(50, Math.max(1, parseInt(questionCount, 10) || 10));

  let topics;
  if (scope === 'topic') {
    const t = await Topic.findById(topicId, userId);
    if (!t) {
      req.flash('error', 'Topic not found.');
      return res.redirect(`/books/${book.id}/quiz`);
    }
    topics = [t];
  } else {
    topics = await Topic.findAllByBook(book.id, userId);
  }

  if (!topics.length) {
    req.flash('error', 'This book has no topics to quiz on yet.');
    return res.redirect(`/books/${book.id}`);
  }

  // Build content per topic and distribute the question count roughly evenly.
  const perTopic = Math.max(1, Math.floor(count / topics.length));
  let remaining = count;
  const generatedQuestions = [];

  try {
    for (let i = 0; i < topics.length; i++) {
      const t = topics[i];
      const isLast = i === topics.length - 1;
      const need = isLast ? remaining : Math.min(perTopic, remaining);
      if (need <= 0) break;

      const contentText = (await Message.concatContentForTopic(t.id, userId)) || `${t.title}: ${t.summary || ''}`;
      const qs = await aiService.generateQuizQuestions({ scopeLabel: t.title, contentText, count: need });
      qs.forEach((q) => generatedQuestions.push({ ...q, topicId: t.id }));
      remaining -= need;
    }
  } catch (err) {
    console.error('Quiz generation error:', err);
    req.flash('error', err.message || 'Quiz generation failed. Please try again.');
    return res.redirect(`/books/${book.id}/quiz`);
  }

  if (!generatedQuestions.length) {
    req.flash('error', 'Could not generate any questions. Try again after adding more topic content.');
    return res.redirect(`/books/${book.id}/quiz`);
  }

  const quizId = await Quiz.create({
    userId,
    bookId: book.id,
    topicId: scope === 'topic' ? topicId : null,
    questionCount: generatedQuestions.length
  });
  await Quiz.addQuestions(quizId, generatedQuestions);

  res.redirect(`/quiz/${quizId}/take`);
};

// GET /quiz/:id/take
exports.take = async (req, res) => {
  const userId = req.session.userId;
  const quiz = await Quiz.findById(req.params.id, userId);
  if (!quiz) {
    req.flash('error', 'Quiz not found.');
    return res.redirect('/dashboard');
  }
  const book = await Book.findById(quiz.book_id, userId);
  const questions = await Quiz.getQuestions(quiz.id);
  res.render('quiz/take', { title: 'Quiz', quiz, book, questions });
};

// POST /quiz/:id/submit
exports.submit = async (req, res) => {
  const userId = req.session.userId;
  const quiz = await Quiz.findById(req.params.id, userId);
  if (!quiz) {
    req.flash('error', 'Quiz not found.');
    return res.redirect('/dashboard');
  }
  const questions = await Quiz.getQuestions(quiz.id);
  const answers = req.body.answers || {}; // { [questionId]: 'A' }

  let score = 0;
  const answerRecords = questions.map((q) => {
    const selected = answers[q.id];
    const isCorrect = selected === q.correct_option;
    if (isCorrect) score++;
    return { questionId: q.id, topicId: q.topic_id, selected, isCorrect };
  });

  const total = questions.length;
  const percentage = total > 0 ? Number(((score / total) * 100).toFixed(2)) : 0;

  const attemptId = await Quiz.recordAttempt({ quizId: quiz.id, userId, score, total, percentage });
  await Quiz.recordAnswers(attemptId, answerRecords);

  // --- Weakness detection + revision queue update (rule-based) ---
  const topicAccuracy = await Quiz.topicAccuracy(userId);
  for (const t of topicAccuracy) {
    if (t.total_count < 2) continue; // not enough data to call it a weakness
    let priority = null;
    let reason = null;
    if (t.accuracy < 50) {
      priority = 'high';
      reason = `Scoring ${t.accuracy.toFixed(0)}% on ${t.topic_title} across ${t.total_count} questions.`;
    } else if (t.accuracy < 75) {
      priority = 'medium';
      reason = `Scoring ${t.accuracy.toFixed(0)}% on ${t.topic_title} — a bit more practice will help.`;
    }
    if (priority) {
      await Revision.upsert({
        userId,
        topicId: t.topic_id,
        bookId: t.book_id,
        priority,
        reason,
        accuracy: t.accuracy
      });
    }
  }

  res.redirect(`/quiz/result/${attemptId}`);
};

// GET /quiz/result/:attemptId
exports.result = async (req, res) => {
  const userId = req.session.userId;
  const attempt = await Quiz.getAttempt(req.params.attemptId, userId);
  if (!attempt) {
    req.flash('error', 'Result not found.');
    return res.redirect('/dashboard');
  }
  const answers = await Quiz.getAnswersForAttempt(attempt.id);

  // Group incorrect answers by topic for a quick weakness summary on this page.
  const weakByTopic = {};
  answers.forEach((a) => {
    if (!a.is_correct && a.topic_title) {
      weakByTopic[a.topic_title] = (weakByTopic[a.topic_title] || 0) + 1;
    }
  });

  res.render('quiz/result', { title: 'Quiz Result', attempt, answers, weakByTopic });
};

// GET /quiz/history
exports.history = async (req, res) => {
  const attempts = await Quiz.historyForUser(req.session.userId);
  res.render('quiz/history', { title: 'Quiz History', attempts });
};
