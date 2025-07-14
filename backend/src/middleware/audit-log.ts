import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

export function auditLogMiddleware(req: Request, res: Response, next: NextFunction) {
  logger.info({
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    time: new Date().toISOString(),
    user: req.user?.username || null
  });
  next();
} 