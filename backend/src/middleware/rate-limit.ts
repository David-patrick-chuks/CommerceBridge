import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect();

export const globalLimiter = rateLimit({
  store: new RedisStore({ sendCommand: (...args: any[]) => redisClient.sendCommand(args) }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 80,
  message: 'Too many requests, please try again later.'
});

export const authLimiter = rateLimit({
  store: new RedisStore({ sendCommand: (...args: any[]) => redisClient.sendCommand(args) }),
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Too many authentication requests, please try again later.'
});

export const dataLimiter = rateLimit({
  store: new RedisStore({ sendCommand: (...args: any[]) => redisClient.sendCommand(args) }),
  windowMs: 15 * 60 * 1000,
  max: 40,
  keyGenerator: (req) => (req.user?.username || req.ip),
  message: 'Too many data requests for this user, please try again later.'
}); 