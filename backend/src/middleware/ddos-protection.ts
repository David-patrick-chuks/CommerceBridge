import { NextFunction, Request, Response } from 'express';
import { createClient } from 'redis';
import { logger } from '../utils/logger';
import { updateIpWhitelist } from './ip-whitelist';

const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect();

export async function ddosProtectionMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = `ddos:${req.ip}`;
  const count = parseInt(await redisClient.get(key) || '0', 10);
  await redisClient.incr(key);
  await redisClient.expire(key, 10); // 10-second window
  if (count > 100) {
    logger.warn(`DDoS attempt detected from ${req.ip}`);
    await updateIpWhitelist(req.ip, 'remove');
    return res.status(429).json({ error: 'Too many requests, IP blocked' });
  }
  next();
} 