import ExpressBrute from 'express-brute';
import BruteRedis from 'express-brute-redis';

const bruteStore = new BruteRedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379
});

export const bruteForce = new ExpressBrute(bruteStore, {
  freeRetries: 3,
  minWait: 5 * 60 * 1000, // 5 minutes
  maxWait: 60 * 60 * 1000, // 1 hour
  failCallback: (req, res, next, nextValidRequestDate) => {
    res.status(429).json({ error: `Too many attempts, try again after ${nextValidRequestDate.toISOString()}` });
  }
}); 