import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { serverConfig } from './config/server';
import { initializeTimescaleDB } from './config/database';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { schedulerService } from './services/schedulerService';

const app: Express = express();

// Security middleware
app.use(helmet());

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

    // Run migrations automatically on startup (only in production/Docker)
    if (process.env.NODE_ENV === 'production' || process.env.AUTO_MIGRATE === 'true') {
      console.log('🔄 Running database migrations...');
      try {
        const { migrate } = await import('./database/migrate');
        await migrate('up');
        console.log('✅ Migrations completed');
      } catch (error: any) {
        console.error('⚠️  Migration error (continuing anyway):', error.message);
        // Don't exit - allow server to start even if migrations fail
        // This is useful if migrations were already run
      }
    }

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

