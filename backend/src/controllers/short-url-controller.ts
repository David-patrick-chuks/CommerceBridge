import { Request, Response } from 'express';
import { ShortUrlModel } from '../models/short-url';

function generateCode(length = 7) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const createShortUrl = async (req: Request, res: Response) => {
  const { url, createdBy, expiryMinutes } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Missing url' });
  }
  let code;
  let exists = true;
  // Ensure unique code
  while (exists) {
    code = generateCode();
    exists = !!(await ShortUrlModel.exists({ code }));
  }
  // Determine expiry
  let expireMins = Number(expiryMinutes);
  if (!expireMins || isNaN(expireMins) || expireMins <= 0) {
    expireMins = Number(process.env.SHORTENER_EXPIRE_MINUTES) || 1440; // default 24h
  }
  const expiresAt = new Date(Date.now() + expireMins * 60 * 1000);
  const shortUrl = new ShortUrlModel({ code, targetUrl: url, createdBy, expiresAt });
  await shortUrl.save();
  // Construct the full short URL (assume production base URL is set in env, fallback to localhost)
  const base = process.env.SHORTENER_BASE_URL || 'http://localhost:3001/api';
  return res.json({ shortUrl: `${base}/s/${code}`, expiresAt });
};

export const redirectShortUrl = async (req: Request, res: Response) => {
  const { code } = req.params;
  const shortUrl = await ShortUrlModel.findOne({ code });
  const frontendBase = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
  if (!shortUrl) {
    return res.redirect(`${frontendBase}/create-account?expired=1`);
  }
  // Always redirect to React app, pass code and wa
  const wa = encodeURIComponent(shortUrl.targetUrl.split('wa=')[1] || '');
  return res.redirect(`${frontendBase}/create-account?wa=${wa}&code=${code}`);
};

export const validateShortUrl = async (req: Request, res: Response) => {
  const { code } = req.params;
  const shortUrl = await ShortUrlModel.findOne({ code });
  if (!shortUrl) {
    return res.status(404).json({ valid: false, reason: 'not_found' });
  }
  if (shortUrl.expiresAt && shortUrl.expiresAt.getTime() < Date.now()) {
    return res.status(410).json({ valid: false, reason: 'expired', expiresAt: shortUrl.expiresAt });
  }
  return res.json({ valid: true, expiresAt: shortUrl.expiresAt });
}; 