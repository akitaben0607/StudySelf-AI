// app.js
// StudySelf AI — An Intelligent Personal Knowledge Workspace
require('dotenv').config();

const express = require('express');
const path = require('path');
const flash = require('connect-flash');

const buildSessionMiddleware = require('./config/session');
const { requireAuth, exposeUserToViews } = require('./middleware/auth');

const homeController = require('./controllers/homeController');
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const topicRoutes = require('./routes/topicRoutes');
const quizRoutes = require('./routes/quizRoutes');
const flashcardRoutes = require('./routes/flashcardRoutes');
const miscRoutes = require('./routes/miscRoutes');

const app = express();

// ---------- View engine ----------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ---------- Core middleware ----------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(buildSessionMiddleware());
app.use(flash());
app.use(exposeUserToViews);

// Makes the user's book list + pending revision count available to the
// sidebar on every authenticated page, without every controller repeating it.
app.use(async (req, res, next) => {
  if (!req.session || !req.session.userId) return next();
  try {
    const Book = require('./models/Book');
    const Revision = require('./models/Revision');
    res.locals.sidebarBooks = await Book.findAllByUser(req.session.userId);
    res.locals.sidebarPendingRevision = await Revision.countPending(req.session.userId);
  } catch (err) {
    res.locals.sidebarBooks = [];
    res.locals.sidebarPendingRevision = 0;
  }
  next();
});

// ---------- Public routes ----------
app.get('/', homeController.home);
app.use('/', authRoutes);

// ---------- Protected routes ----------
app.get('/dashboard', requireAuth, require('./controllers/bookController').dashboard);

// Nested routers (must be mounted before the flatter /books router)
app.use('/books/:bookId/topics', requireAuth, topicRoutes.nested);
app.use('/books/:bookId/quiz', requireAuth, quizRoutes.nested);
app.use('/books/:bookId/flashcards', requireAuth, flashcardRoutes.nested);

app.use('/books', requireAuth, bookRoutes);
app.use('/topics', requireAuth, topicRoutes.router);
app.use('/quiz', requireAuth, quizRoutes.router);
app.use('/flashcards', requireAuth, flashcardRoutes.router);
app.use('/', requireAuth, miscRoutes);

// ---------- 404 ----------
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

// ---------- Error handler ----------
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  req.flash && req.flash('error', 'Something went wrong. Please try again.');
  res.status(500).render('500', { title: 'Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`StudySelf AI running at http://localhost:${PORT}`);
});
