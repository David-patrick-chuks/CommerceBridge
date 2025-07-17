import { NextFunction, Request, Response } from 'express';
import geoip from 'geoip-lite';

const blockedRegions = process.env.BLOCKED_REGIONS ? process.env.BLOCKED_REGIONS.split(',') : [];

export function geoBlockMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket?.remoteAddress || '127.0.0.1';
  const geo = geoip.lookup(ip);
  if (geo && blockedRegions.includes(geo.country)) {
    return res.status(403).json({ error: 'Access denied: Restricted region' });
  }
  return next();
}