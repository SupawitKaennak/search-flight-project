import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { serverConfig } from './config/server';
import { initializeTimescaleDB } from './config/database';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { schedulerService } from './services/schedulerService';

const app: Express = express();

// Security middleware - configure helmet to allow cross-origin static files
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(
  cors({
    origin: serverConfig.corsOrigin,
    credentials: true,
  })
);

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory (images, icons, etc.)
// Serve at /api path to match NEXT_PUBLIC_API_URL sub path
// This should be before rate limiting and routes so static files are served first
// Use process.cwd() to ensure it works in both development and production
const publicPath = path.join(process.cwd(), 'public');
// Middleware to check if request is for a static file (has file extension)
const isStaticFileRequest = (req: express.Request): boolean => {
  const path = req.path;
  // Check if path ends with common image/file extensions
  return /\.(jpg|jpeg|png|gif|svg|ico|webp|pdf|css|js|woff|woff2|ttf|eot)$/i.test(path);
};

// Serve static files at /api path, but only for file requests
// Add CORS headers for static files to prevent CORS errors
app.use('/api', (req, res, next) => {
  if (isStaticFileRequest(req)) {
    // Set CORS headers BEFORE serving static files
    res.setHeader('Access-Control-Allow-Origin', serverConfig.corsOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle OPTIONS preflight request
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    
    // Serve static file with proper headers
    express.static(publicPath, {
      setHeaders: (res, path) => {
        // Ensure CORS headers are set for all static files
        res.setHeader('Access-Control-Allow-Origin', serverConfig.corsOrigin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
    })(req, res, next);
  } else {
    next();
  }
});

// More lenient rate limit for statistics endpoint (read-only, less critical)
// Apply this FIRST before the general limiter so it takes precedence
const statisticsLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: serverConfig.nodeEnv === 'production' ? 100 : 200, // More lenient in development
  message: 'Too many statistics requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply statistics limiter FIRST (more specific routes should come first)
app.use('/api/statistics', statisticsLimiter);

// General rate limiting for all other API routes
const limiter = rateLimit({
  windowMs: serverConfig.rateLimit.windowMs,
  max: serverConfig.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.',
});

// Apply general rate limit to all API routes (after the specific one)
app.use('/api/', limiter);

// Routes
app.use('/api', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function startServer(): Promise<void> {
  try {
    // Initialize TimescaleDB
    await initializeTimescaleDB();

    // Start listening
    app.listen(serverConfig.port, () => {
      console.log(`
🚀 Server is running!
📍 Environment: ${serverConfig.nodeEnv}
🌐 Server: http://localhost:${serverConfig.port}
📡 API: http://localhost:${serverConfig.port}/api
❤️  Health: http://localhost:${serverConfig.port}/api/health
      `);
    });

    // ✅ เริ่ม Scheduled Jobs (ถ้าเปิดใช้งาน)
    if (process.env.ENABLE_SCHEDULED_JOBS === 'true') {
      schedulerService.startAll();
    } else {
      console.log('⚠️  Scheduled jobs are disabled (set ENABLE_SCHEDULED_JOBS=true in .env to enable)');
    }
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

  startServer();

export default app;

