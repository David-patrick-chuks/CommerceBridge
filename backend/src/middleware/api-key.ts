import { NextFunction, Request, Response } from 'express';

const API_KEY = process.env.API_KEY;

export function apiKeyMiddleware(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(403).json({ error: 'Invalid API key' });
  }
  next();
} 