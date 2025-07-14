import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

export function raspMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = process.hrtime.bigint();
  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - startTime) / 1e6; // ms
    if (duration > 800) {
      logger.warn(`RASP: High-latency request detected: ${req.method} ${req.url} took ${duration}ms`);
    }
  });
  const memoryUsage = process.memoryUsage();
  if (memoryUsage.heapUsed > 80 * 1024 * 1024 || memoryUsage.rss > 150 * 1024 * 1024) {
    logger.warn(`RASP: Excessive memory usage detected: ${JSON.stringify(memoryUsage)}`);
    return res.status(503).json({ error: 'Service temporarily unavailable' });
  }
  next();
} 