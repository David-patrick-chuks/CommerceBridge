import { NextFunction, Request, Response } from 'express';
import geoip from 'geoip-lite';

const blockedRegions = process.env.BLOCKED_REGIONS ? process.env.BLOCKED_REGIONS.split(',') : [];

export function geoBlockMiddleware(req: Request, res: Response, next: NextFunction) {
  const geo = geoip.lookup(req.ip);
  if (geo && blockedRegions.includes(geo.country)) {
    return res.status(403).json({ error: 'Access denied: Restricted region' });
  }
  next();
} 