import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import producersRouter from './routes/producers.js';
import tracksRouter from './routes/tracks.js';
import stemsRouter from './routes/stems.js';
import licensesRouter from './routes/licenses.js';
import royaltiesRouter from './routes/royalties.js';
import reviewsRouter from './routes/reviews.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Routes
app.use('/api/producers', producersRouter);
app.use('/api/tracks', tracksRouter);
app.use('/api/stems', stemsRouter);
app.use('/api/licenses', licensesRouter);
app.use('/api/royalties', royaltiesRouter);
app.use('/api/reviews', reviewsRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`Harmoniq backend running on port ${PORT}`);
});

export default app;
