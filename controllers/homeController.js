// controllers/homeController.js
exports.home = (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.render('home', { title: 'StudySelf AI — Your Knowledge, ORGANIZED.' });
};
