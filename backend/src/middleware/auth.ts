import { NextFunction, Request, Response } from 'express';
import jwt, { Secret } from 'jsonwebtoken';
import { TokenService } from '../services/token-service';
import { AuthTokenPayload } from '../types/auth.types';

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET as Secret;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET as Secret;

// Attach user to request if valid access token is present
export async function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as AuthTokenPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Middleware to verify refresh token
export async function verifyRefreshToken(req: Request, res: Response, next: NextFunction) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }
  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as AuthTokenPayload;
    // Optionally check if token is blacklisted in Redis
    const isValid = await TokenService.isRefreshTokenValid(decoded.sub, refreshToken);
    if (!isValid) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired refresh token' });
  }
} 