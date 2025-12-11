import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import clubRoutes from './routes/clubs';
import memberRoutes from './routes/membersNew';
import practiceRoutes from './routes/practices';
import matchRoutes from './routes/matches';
import statsRoutes from './routes/stats';
import financeRoutes from './routes/finances';
import tournamentRoutes from './routes/tournaments';
import attendanceRoutes from './routes/attendance';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Trust proxy - important for rate limiting with reverse proxy
app.set('trust proxy', 1); // Trust only 1 proxy (Nginx)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Increased limit
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks
    if (req.path === '/health') return true;
    // In development, be very permissive
    if (process.env.NODE_ENV === 'development') return true;
    return false;
  },
  keyGenerator: (req) => {
    // Use X-Forwarded-For header if present (for proxied requests), otherwise use IP
    return req.headers['x-forwarded-for'] as string || req.ip || 'unknown';
  }
});

// Strict rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Increased for testing
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => {
    // In development, skip rate limiting
    if (process.env.NODE_ENV === 'development') return true;
    return false;
  },
  keyGenerator: (req) => {
    // Use X-Forwarded-For for proxied requests
    return req.headers['x-forwarded-for'] as string || req.ip || 'unknown';
  }
});

// Moderate rate limiting for registration
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5000, // Increased for testing
  message: 'Too many registration attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => {
    // In development, skip rate limiting
    if (process.env.NODE_ENV === 'development') return true;
    return false;
  },
  keyGenerator: (req) => {
    // Use X-Forwarded-For for proxied requests
    return req.headers['x-forwarded-for'] as string || req.ip || 'unknown';
  }
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(compression()); // Compress responses
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// Apply rate limiting to all API routes
app.use('/api', limiter);

// Apply stricter rate limiting to specific auth routes
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);

// Health check endpoint (no auth, no rate limit)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    message: 'GoBad Backend is running!',
    timestamp: new Date().toISOString(),
  });
});

// API routes placeholder
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    message: 'Welcome to GoBad API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      clubs: '/api/clubs',
      members: '/api/members',
      practices: '/api/practices',
      matches: '/api/matches',
      stats: '/api/stats',
      summaries: '/api/summaries',
      tournaments: '/api/tournaments',
      finances: '/api/finances',
      attendance: '/api/attendance',
      exports: '/api/exports',
    },
  });
});

// Auth routes
app.use('/api/auth', authRoutes);

// User routes
app.use('/api/users', userRoutes);

// Club routes
app.use('/api/clubs', clubRoutes);

// Member routes
app.use('/api/members', memberRoutes);

// Practice routes
app.use('/api/practices', practiceRoutes);

// Match routes
app.use('/api/matches', matchRoutes);

// Stats routes - Stats endpoints for player statistics, leaderboards, performance trends
app.use('/api/stats', statsRoutes);

// Tournament routes
app.use('/api/tournaments', tournamentRoutes);

// Finance routes
app.use('/api/finances', financeRoutes);

// Attendance routes
app.use('/api/attendance', attendanceRoutes);
// 
// // Export routes
// app.use('/api/exports', exportRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist.',
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Rate limiting enabled`);
});

export default app;
