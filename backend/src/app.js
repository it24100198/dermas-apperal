import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import routes from './routes/index.js';

const app = express();
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/manufacturing_erp';
let databaseConnectionPromise = null;

app.set('trust proxy', 1);

const normalizeOrigin = (origin) => String(origin || '').trim().toLowerCase();

const defaultDevOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

const configuredOrigins = String(process.env.CORS_ALLOWED_ORIGINS || process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = (process.env.NODE_ENV === 'production' ? configuredOrigins : [...defaultDevOrigins, ...configuredOrigins])
  .map(normalizeOrigin);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const normalizedOrigin = normalizeOrigin(origin);
      
      if (normalizedOrigin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      
      const isAllowed = allowedOrigins.includes(normalizedOrigin);
      if (!isAllowed) {
        console.warn(`[CORS Blocked] Origin missing: ${normalizedOrigin}`);
        return callback(new Error('CORS origin not allowed'));
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());

app.use((req, res, next) => {
  const startedAt = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`);
  });

  next();
});

app.use((req, res, next) => {
  const header = String(req.headers.cookie || '');
  const cookies = {};
  for (const chunk of header.split(';')) {
    const [rawKey, ...rest] = chunk.split('=');
    const key = String(rawKey || '').trim();
    if (!key) continue;
    const value = rest.join('=');
    cookies[key] = decodeURIComponent(value || '');
  }
  req.cookies = cookies;
  next();
});

// Ensure DB is connected for both serverless and long-running runtimes.
app.use(async (req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    next(error);
  }
});

const healthHandler = (req, res) => {
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
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Support both deployment styles where a platform may already prefix incoming routes with /api.
app.use('/api', routes);
app.use('/', routes);

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl,
  });
});

app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR ${req.method} ${req.originalUrl}`, err);
  const status = Number(err.status || err.statusCode || 500);
  const safeStatus = status >= 400 && status < 600 ? status : 500;

  if (safeStatus >= 500) {
    return res.status(safeStatus).json({ error: 'An unexpected error occurred. Please try again later.' });
  }

  return res.status(safeStatus).json({ error: 'Request could not be processed.' });
});

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!databaseConnectionPromise) {
    mongoose.set('strictQuery', true);

    databaseConnectionPromise = mongoose
      .connect(mongoUri, { serverSelectionTimeoutMS: 10000 })
      .then((connection) => {
        console.log('Connected to MongoDB');
        return connection;
      })
      .catch((error) => {
        databaseConnectionPromise = null;
        throw error;
      });
  }

  return databaseConnectionPromise;
}

export async function disconnectDatabase() {
  databaseConnectionPromise = null;
  await mongoose.disconnect();
}

export default app;

if (process.env.RUN_LOCAL_SERVER === 'true') {
  const PORT = process.env.PORT || 5001;

  connectDatabase()
    .then(() => {
      app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
    })
    .catch((err) => {
      console.error('MongoDB connection failed. Backend needs a running database.');
      console.error('Options: (1) Start local MongoDB, (2) Use Docker: docker run -d -p 27017:27017 mongo, (3) Use MongoDB Atlas and set MONGODB_URI in .env');
      console.error('Error:', err.message);
      process.exit(1);
    });
}
