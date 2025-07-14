import connectRedis from 'connect-redis';
import session from 'express-session';
import { createClient } from 'redis';

const RedisStore = connectRedis(session);
const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect();

const sessionMiddleware = session({
  store: new RedisStore({ client: redisClient as any }),
  secret: process.env.SESSION_SECRET || 'supersecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 6 * 60 * 60 * 1000 // 6 hours
  }
});

export default sessionMiddleware; 