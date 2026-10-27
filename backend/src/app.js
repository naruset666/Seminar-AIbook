const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// CSP allows Google Fonts, the PDF.js worker (same origin / blob) and canvas/audio blobs.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'wasm-unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        workerSrc: ["'self'", 'blob:'],
        connectSrc: ["'self'", 'blob:', 'data:'],
        mediaSrc: ["'self'", 'blob:', 'data:'],
        objectSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);
// The Vite dev server proxies /api, so CORS only matters when calling the API directly.
app.use(cors({ origin: /^http:\/\/localhost:\d+$/ }));
// Annotation strokes can be a few MB on heavily marked-up documents.
app.use(express.json({ limit: '10mb' }));

app.use('/api', routes);

// Production: serve the built frontend (frontend/dist) from the same origin, so /api needs no proxy.
const distDir = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(path.join(distDir, 'index.html'))) {
  app.use(express.static(distDir));
  app.get(/^(?!\/api\/).*/, (req, res) => res.sendFile(path.join(distDir, 'index.html')));
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
