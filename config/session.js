// config/session.js
// Express session configuration, persisted in MySQL so sessions survive
// server restarts. Falls back to MemoryStore only if the session table
// cannot be created (e.g. DB briefly unavailable during first boot).

const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

function buildSessionMiddleware() {
  const store = new MySQLStore({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'studyself_ai',
    createDatabaseTable: true,
    clearExpired: true,
    checkExpirationInterval: 900000, // 15 min
    expiration: 1000 * 60 * 60 * 24 * 7 // 7 days
  });

  return session({
    key: 'studyself_sid',
    secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
    store,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  });
}

module.exports = buildSessionMiddleware;
