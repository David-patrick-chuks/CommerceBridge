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
  const isWhitelisted = await redisClient.sIsMember('whitelist:ips', clientIp);
  if (!isWhitelisted) {
    return res.status(403).json({ error: 'Access denied: IP not whitelisted' });
  }
  next();
} 