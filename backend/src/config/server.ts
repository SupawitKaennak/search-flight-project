import dotenv from 'dotenv';

dotenv.config();

// CORS: รองรับหลาย origin คั่นด้วย comma (สำหรับเทสมือถือผ่าน IP เช่น http://192.168.1.100:3000)
const corsOriginRaw = process.env.CORS_ORIGIN || 'http://localhost:3000';
const corsOrigin = corsOriginRaw.includes(',')
  ? corsOriginRaw.split(',').map((o) => o.trim()).filter(Boolean)
  : corsOriginRaw;

export const serverConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin,
  rateLimit: {
    // In development, use more lenient rate limits
    // In production, use stricter limits
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute (default)
    max: parseInt(
      process.env.RATE_LIMIT_MAX_REQUESTS || 
      (process.env.NODE_ENV === 'production' ? '300' : '1000'), // 1000 in dev, 300 in prod
      10
    ),
  },
};

