import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './lib/db.js';
import { seedDefaultAdmin } from './lib/seed.js';

import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import { ZodError } from 'zod';

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(helmet());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

const origins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (origins.length === 0) return cb(null, true);
    if (origins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));

app.use(morgan('dev'));

app.use(rateLimit({
  windowMs: 60_000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
}));

app.get('/health', (_, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employee', employeeRoutes);

// serve uploaded CSVs (optional)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  // Zod validation => 400 (so the UI can show a clean message instead of 500)
  if (err instanceof ZodError || err?.name === 'ZodError') {
    const msg = err.issues?.[0]?.message || 'Validation error';
    return res.status(400).json({ message: msg, issues: err.issues });
  }

  // Mongoose validation / cast errors => 400
  if (err?.name === 'ValidationError' || err?.name === 'CastError') {
    return res.status(400).json({ message: err.message || 'Invalid data' });
  }

  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Server error' });
});

await connectDB();
await seedDefaultAdmin();

app.listen(PORT, () => {
  console.log(`CanovaCRM API running on http://localhost:${PORT}`);
});
