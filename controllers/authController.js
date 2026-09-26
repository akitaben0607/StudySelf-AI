// controllers/authController.js
const bcrypt = require('bcrypt');
const User = require('../models/User');

const SALT_ROUNDS = 12;

exports.showRegister = (req, res) => {
  res.render('auth/register', { title: 'Create Account', formData: {} });
};

exports.register = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  const formData = { name, email };

  if (!name || !email || !password || !confirmPassword) {
    req.flash('error', 'All fields are required.');
    return res.render('auth/register', { title: 'Create Account', formData });
  }
  if (password.length < 6) {
    req.flash('error', 'Password must be at least 6 characters.');
    return res.render('auth/register', { title: 'Create Account', formData });
  }
  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not match.');
    return res.render('auth/register', { title: 'Create Account', formData });
  }

  try {
    const existing = await User.findByEmail(email.toLowerCase().trim());
    if (existing) {
      req.flash('error', 'An account with that email already exists.');
      return res.render('auth/register', { title: 'Create Account', formData });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), passwordHash });

    req.session.userId = userId;
    req.session.userName = name.trim();
    req.flash('success', `Welcome to StudySelf AI, ${name.trim()}!`);
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Register error:', err);
    req.flash('error', 'Something went wrong creating your account. Please try again.');
    res.render('auth/register', { title: 'Create Account', formData });
  }
};

exports.showLogin = (req, res) => {
  res.render('auth/login', { title: 'Log In', formData: {} });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    req.flash('error', 'Email and password are required.');
    return res.render('auth/login', { title: 'Log In', formData: { email } });
  }

  try {
    const user = await User.findByEmail(email.toLowerCase().trim());
    if (!user) {
      req.flash('error', 'Incorrect email or password.');
      return res.render('auth/login', { title: 'Log In', formData: { email } });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      req.flash('error', 'Incorrect email or password.');
      return res.render('auth/login', { title: 'Log In', formData: { email } });
    }

    req.session.userId = user.id;
    req.session.userName = user.name;
    req.flash('success', `Welcome back, ${user.name}!`);
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Login error:', err);
    req.flash('error', 'Something went wrong logging in. Please try again.');
    res.render('auth/login', { title: 'Log In', formData: { email } });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('studyself_sid');
    res.redirect('/login');
  });
};
