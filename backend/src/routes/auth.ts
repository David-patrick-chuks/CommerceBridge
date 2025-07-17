import bcrypt from 'bcryptjs';
import { Request, Response, Router } from 'express';
import { authenticateJWT, verifyRefreshToken } from '../middleware/auth';
import { UserModel } from '../models/user';
import { TokenService } from '../services/token-service';
import { AuthTokenPayload, LoginRequest, LoginResponse, RefreshTokenResponse } from '../types/auth.types';

// Add RequestWithUser interface
interface RequestWithUser extends Request {
  user?: AuthTokenPayload;
}

const router = Router();

// POST /login
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body as LoginRequest;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  // Use .exec() for better typing and cast to UserDocument | null
  const user = await UserModel.findOne({ name: username }).exec() as import('../types/models.types').UserDocument | null;
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const payload: AuthTokenPayload = {
    sub: user._id.toString(),
    username: user.name,
    userType: user.userType
  };
  const accessToken = TokenService.generateAccessToken(payload);
  const refreshToken = TokenService.generateRefreshToken(payload);
  await TokenService.storeRefreshToken(payload.sub, refreshToken);
  const response: LoginResponse = { accessToken, refreshToken };
  return res.json(response);
});

// POST /refresh-token
router.post('/refresh-token', verifyRefreshToken, async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  const newAccessToken = TokenService.generateAccessToken({
    sub: user.sub,
    username: user.username,
    userType: user.userType
  });
  const response: RefreshTokenResponse = { accessToken: newAccessToken };
  res.json(response);
});

// POST /logout
router.post('/logout', authenticateJWT, async (req: RequestWithUser, res: Response) => {
  const user = req.user!;
  await TokenService.revokeRefreshToken(user.sub);
  res.json({ message: 'Logged out successfully' });
});

export default router; 