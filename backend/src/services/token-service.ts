import jwt, { Secret } from 'jsonwebtoken';
import { createClient } from 'redis';
import { AuthTokenPayload } from '../types/auth.types';

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET as Secret;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET as Secret;
const ACCESS_TOKEN_EXPIRY = '10m';
const REFRESH_TOKEN_EXPIRY = '7d';

const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect();

export class TokenService {
  static generateAccessToken(payload: AuthTokenPayload): string {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  }

  static generateRefreshToken(payload: AuthTokenPayload): string {
    return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
  }

  static async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    await redisClient.set(`refresh:${userId}`, refreshToken, { EX: 7 * 24 * 60 * 60 }); // 7 days
  }

  static async isRefreshTokenValid(userId: string, refreshToken: string): Promise<boolean> {
    const stored = await redisClient.get(`refresh:${userId}`);
    return stored === refreshToken;
  }

  static async revokeRefreshToken(userId: string): Promise<void> {
    await redisClient.del(`refresh:${userId}`);
  }
} 