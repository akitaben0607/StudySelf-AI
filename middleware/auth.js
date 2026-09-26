// middleware/auth.js

// Blocks unauthenticated access to private routes.
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  req.flash('error', 'Please log in to continue.');
  return res.redirect('/login');
}

// Sends already-logged-in users away from auth pages (login/register).
function redirectIfAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    return res.redirect('/dashboard');
  }
  next();
}

// Makes the current user + flash messages available to every EJS view.
function exposeUserToViews(req, res, next) {
  res.locals.currentUser = req.session
    ? { id: req.session.userId, name: req.session.userName }
    : null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
}

module.exports = { requireAuth, redirectIfAuthenticated, exposeUserToViews };
