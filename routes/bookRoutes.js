// routes/bookRoutes.js
const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const pdfController = require('../controllers/pdfController');
const studymapController = require('../controllers/studymapController');
const upload = require('../middleware/upload');

router.get('/pdf-upload', pdfController.showUploadForm);
router.post('/pdf-upload', (req, res, next) => {
  upload.single('pdfFile')(req, res, (err) => {
    if (err) {
      req.flash('error', err.message || 'Upload failed.');
      return res.redirect('/books/pdf-upload');
    }
    next();
  });
}, pdfController.upload);

router.get('/new', bookController.showNewForm);
router.post('/', bookController.create);
router.get('/:id', bookController.showBook);
router.get('/:id/edit', bookController.showEditForm);
router.post('/:id/edit', bookController.update);
router.post('/:id/delete', bookController.delete);

router.get('/:bookId/studymap', studymapController.show);

module.exports = router;
