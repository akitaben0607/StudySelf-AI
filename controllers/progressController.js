// controllers/progressController.js
const Book = require('../models/Book');
const Topic = require('../models/Topic');
const Quiz = require('../models/Quiz');
const Revision = require('../models/Revision');

exports.show = async (req, res) => {
  const userId = req.session.userId;

  const [totalBooks, totalTopics, quizStats, topicAccuracy, pendingRevision, recentAttempts] = await Promise.all([
    Book.count(userId),
    Topic.count(userId),
    Quiz.statsForUser(userId),
    Quiz.topicAccuracy(userId),
    Revision.countPending(userId),
    Quiz.historyForUser(userId, 5)
  ]);

  const withEnoughData = topicAccuracy.filter((t) => t.total_count >= 2);
  const strongTopics = withEnoughData.filter((t) => t.accuracy >= 75).sort((a, b) => b.accuracy - a.accuracy).slice(0, 5);
  const weakTopics = withEnoughData.filter((t) => t.accuracy < 75).sort((a, b) => a.accuracy - b.accuracy).slice(0, 5);

  res.render('progress/index', {
    title: 'Progress Dashboard',
    totalBooks,
    totalTopics,
    quizzesCompleted: quizStats.completed,
    avgScore: Number(quizStats.avg_score).toFixed(1),
    pendingRevision,
    strongTopics,
    weakTopics,
    recentAttempts,
    hasQuizData: quizStats.completed > 0
  });
};
