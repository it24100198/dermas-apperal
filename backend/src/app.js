import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import routes from './routes/index.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`);
  });
  next();
});

app.get("/api/health", (req, res) => {
  const stateByCode = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const dbStateCode = mongoose.connection.readyState;
  const dbState = stateByCode[dbStateCode] || 'unknown';

  res.json({
    ok: dbState === 'connected',
    message: 'API is running',
    db: {
      state: dbState,
      readyState: dbStateCode,
      name: mongoose.connection.name || null,
      host: mongoose.connection.host || null,
    },
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl,
  });
});

app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR ${req.method} ${req.originalUrl}`, err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5001;

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/manufacturing_erp')
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed. Backend needs a running database.');
    console.error('Options: (1) Start local MongoDB, (2) Use Docker: docker run -d -p 27017:27017 mongo, (3) Use MongoDB Atlas and set MONGODB_URI in .env');
    console.error('Error:', err.message);
    process.exit(1);
  });
