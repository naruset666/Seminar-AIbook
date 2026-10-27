const fs = require('fs/promises');
const path = require('path');
const Document = require('../models/document.model');
const Annotation = require('../models/annotation.model');
const { sanitizeStrokes, AnnotationValidationError } = require('../services/annotations');
const { storageDir } = require('../config/env');

// multer stores files under storageDir; the DB keeps the path relative to it.
const toRelative = (absolutePath) => path.relative(storageDir, absolutePath);
const toAbsolute = (storedPath) => path.join(storageDir, storedPath);

// Multer decodes multipart filenames as latin1; restore UTF-8 (Thai names).
const decodeName = (name) => Buffer.from(name, 'latin1').toString('utf8');

async function list(req, res) {
  res.json({ documents: await Document.listByUser(req.userId) });
}

// The browser derives the MIME type from the file name, so also check the
// real file signature: every PDF starts with "%PDF-".
async function isPdfFile(filePath) {
  const handle = await fs.open(filePath, 'r');
  try {
    const { buffer, bytesRead } = await handle.read(Buffer.alloc(5), 0, 5, 0);
    return bytesRead === 5 && buffer.toString('latin1') === '%PDF-';
  } finally {
    await handle.close();
  }
}

async function upload(req, res) {
  const files = req.files || [];
  if (files.length === 0) {
    return res.status(400).json({ message: 'กรุณาเลือกไฟล์ PDF อย่างน้อย 1 ไฟล์' });
  }

  const invalid = [];
  for (const file of files) {
    if (!(await isPdfFile(file.path))) invalid.push(decodeName(file.originalname));
  }
  if (invalid.length > 0) {
    await Promise.all(files.map((file) => fs.unlink(file.path).catch(() => {})));
    return res.status(400).json({ message: `ไฟล์ต่อไปนี้ไม่ใช่ PDF จริง: ${invalid.join(', ')}` });
  }

  const documents = [];
  for (const file of files) {
    documents.push(await Document.create({
      userId: req.userId,
      originalName: decodeName(file.originalname),
      storedPath: toRelative(file.path),
      sizeBytes: file.size,
    }));
  }
  return res.status(201).json({ documents });
}

async function streamFile(req, res) {
  const doc = await Document.findOwned(req.params.id, req.userId);
  if (!doc) return res.status(404).json({ message: 'ไม่พบเอกสาร' });

  const filePath = toAbsolute(doc.stored_path);
  try {
    await fs.access(filePath);
  } catch {
    return res.status(404).json({ message: 'ไม่พบไฟล์บนเซิร์ฟเวอร์' });
  }

  res.type('application/pdf');
  res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(doc.original_name)}`);
  return res.sendFile(filePath);
}

async function updateProgress(req, res) {
  const { last_page: lastPage, page_count: pageCount } = req.body;
  const doc = await Document.updateProgress(req.params.id, req.userId, { lastPage, pageCount });
  if (!doc) return res.status(404).json({ message: 'ไม่พบเอกสาร' });
  return res.json({ document: doc });
}

async function remove(req, res) {
  const deleted = await Document.remove(req.params.id, req.userId);
  if (!deleted) return res.status(404).json({ message: 'ไม่พบเอกสาร' });

  await fs.unlink(toAbsolute(deleted.stored_path)).catch(() => {});
  return res.status(204).end();
}

async function getAnnotations(req, res) {
  const row = await Annotation.find(req.params.id, req.userId);
  if (!row) return res.status(404).json({ message: 'ไม่พบเอกสาร' });
  return res.json({ strokes: row.strokes || {}, updated_at: row.updated_at });
}

async function saveAnnotations(req, res) {
  let strokes;
  try {
    strokes = sanitizeStrokes(req.body.strokes);
  } catch (err) {
    if (err instanceof AnnotationValidationError) return res.status(400).json({ message: err.message });
    throw err;
  }
  const row = await Annotation.save(req.params.id, req.userId, strokes);
  if (!row) return res.status(404).json({ message: 'ไม่พบเอกสาร' });
  return res.json({ updated_at: row.updated_at });
}

module.exports = { list, upload, streamFile, updateProgress, remove, getAnnotations, saveAnnotations };
