// controllers/pdfController.js
const fs = require('fs');
const pdfParse = require('pdf-parse');
const Book = require('../models/Book');
const Topic = require('../models/Topic');
const Document = require('../models/Document');
const aiService = require('../services/aiService');

exports.showUploadForm = (req, res) => {
  res.render('books/pdf-upload', { title: 'PDF → Book' });
};

exports.upload = async (req, res) => {
  const userId = req.session.userId;

  if (!req.file) {
    req.flash('error', 'Please choose a PDF file to upload.');
    return res.redirect('/books/pdf-upload');
  }

  const docId = await Document.create({
    userId,
    originalFilename: req.file.originalname,
    fileSize: req.file.size
  });

  try {
    const buffer = fs.readFileSync(req.file.path);
    const parsed = await pdfParse(buffer);
    const text = (parsed.text || '').trim();

    if (!text || text.length < 50) {
      await Document.markFailed(docId, 'No readable text found in this PDF (it may be a scanned image).');
      req.flash('error', 'Could not extract text from that PDF. Try a text-based PDF instead of a scanned image.');
      return res.redirect('/books/pdf-upload');
    }

    const analysis = await aiService.identifyTopicsFromText({ text });
    const bookTitle = (analysis.bookTitle || req.file.originalname.replace(/\.pdf$/i, '')).slice(0, 150);

    const bookId = await Book.create({
      userId,
      title: bookTitle,
      description: 'Imported from PDF upload.',
      source: 'pdf'
    });

    const topics = analysis.topics && analysis.topics.length
      ? analysis.topics
      : [{ title: 'Imported Content', summary: 'Full extracted text from the uploaded PDF.' }];

    for (const t of topics) {
      await Topic.create({ bookId, userId, title: t.title.slice(0, 150), summary: (t.summary || '').slice(0, 2000) });
    }

    await Document.markCompleted(docId, bookId, parsed.numpages || null);

    req.flash('success', `Book "${bookTitle}" created from your PDF with ${topics.length} topics.`);
    res.redirect(`/books/${bookId}`);
  } catch (err) {
    console.error('PDF processing error:', err);
    await Document.markFailed(docId, err.message || 'Unknown processing error.');
    req.flash('error', err.message || 'Could not process this PDF. Please try again.');
    res.redirect('/books/pdf-upload');
  } finally {
    fs.unlink(req.file.path, () => {});
  }
};
