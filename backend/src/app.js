const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
// The Vite dev server proxies /api, so CORS only matters when calling the API directly.
app.use(cors({ origin: /^http:\/\/localhost:\d+$/ }));
// Annotation strokes can be a few MB on heavily marked-up documents.
app.use(express.json({ limit: '10mb' }));

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
