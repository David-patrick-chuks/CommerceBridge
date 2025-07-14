import { NextFunction, Request, Response } from 'express';
import { createClient } from 'redis';
import { logger } from '../utils/logger';

const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect();

export async function anomalyDetectionMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = `requests:${req.ip}:${req.user?.username || 'anonymous'}`;
  const count = parseInt(await redisClient.get(key) || '0', 10);
  await redisClient.incr(key);
  await redisClient.expire(key, 60); // 1-minute window
  if (count > 30) {
    logger.warn(`Anomaly detected: Excessive requests from ${req.ip} for user ${req.user?.username || 'anonymous'}`);
    return res.status(429).json({ error: 'Suspicious activity detected' });
  }
  if (req.path === '/retrieve-data' && count > 5) {
    logger.warn(`Anomaly detected: Excessive data retrieval from ${req.ip} for user ${req.user?.username}`);
    return res.status(429).json({ error: 'Excessive data access detected' });
  }
  next();
} 