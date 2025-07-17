import { NextFunction, Request, Response } from 'express';
import { createClient } from 'redis';

const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect();

export async function updateIpWhitelist(ip: string, action: 'add' | 'remove') {
  if (action === 'add') {
    await redisClient.sAdd('whitelist:ips', ip);
  } else if (action === 'remove') {
    await redisClient.sRem('whitelist:ips', ip);
  }
}

export async function ipWhitelistMiddleware(req: Request, res: Response, next: NextFunction) {
  const clientIp = req.ip;
  // Allow all IPs in development
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }
  // Always allow localhost
  if (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '0.0.0.0') {
    return next();
  }
  if (!clientIp) {
    return res.status(400).json({ error: 'Unable to determine client IP' });
  }
  const isWhitelisted = await redisClient.sIsMember('whitelist:ips', clientIp);
  if (!isWhitelisted) {
    return res.status(403).json({ error: 'Access denied: IP not whitelisted' });
  }
  return next();
} 