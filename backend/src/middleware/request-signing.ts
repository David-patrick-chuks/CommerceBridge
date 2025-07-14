import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';

const SIGNING_SECRET = process.env.REQUEST_SIGNING_SECRET || crypto.randomBytes(32).toString('hex');

export function verifyRequestSignature(req: Request, res: Response, next: NextFunction) {
  const signature = req.headers['x-request-signature'] as string;
  const timestamp = req.headers['x-request-timestamp'] as string;
  if (!signature || !timestamp) {
    return res.status(401).json({ error: 'Request signature and timestamp required' });
  }
  const timeDiff = Math.abs(Date.now() - parseInt(timestamp, 10));
  if (timeDiff > 3 * 60 * 1000) { // 3-minute window
    return res.status(401).json({ error: 'Request timestamp expired' });
  }
  const payload = `${req.method}:${req.originalUrl}:${JSON.stringify(req.body)}:${timestamp}`;
  const computedSignature = crypto.createHmac('sha256', SIGNING_SECRET).update(payload).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSignature))) {
    return res.status(401).json({ error: 'Invalid request signature' });
  }
  next();
} 