// controllers/revisionController.js
const Revision = require('../models/Revision');

exports.list = async (req, res) => {
  const items = await Revision.listForUser(req.session.userId);
  const grouped = { high: [], medium: [], low: [] };
  items.forEach((i) => {
    if (i.status === 'pending') grouped[i.priority].push(i);
  });
  const revisedRecently = items.filter((i) => i.status === 'revised').slice(0, 10);
  res.render('revision/index', { title: 'Revision Queue', grouped, revisedRecently, isEmpty: items.every((i) => i.status !== 'pending') });
};

exports.markRevised = async (req, res) => {
  await Revision.markRevised(req.params.id, req.session.userId);
  req.flash('success', 'Marked as revised. Great work!');
  res.redirect('/revision');
};
