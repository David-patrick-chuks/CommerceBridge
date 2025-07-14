import { NextFunction, Request, Response } from 'express';
import sodium from 'libsodium-wrappers';

const PAYLOAD_ENCRYPTION_KEY = Buffer.from(process.env.PAYLOAD_ENCRYPTION_KEY || sodium.randombytes_buf(32).toString('hex'), 'hex');

export async function encryptedPayloadMiddleware(req: Request, res: Response, next: NextFunction) {
  await sodium.ready;
  if (req.body && req.body.encryptedPayload) {
    try {
      const [nonceHex, ciphertextHex] = req.body.encryptedPayload.split(':');
      const nonce = Buffer.from(nonceHex, 'hex');
      const ciphertext = Buffer.from(ciphertextHex, 'hex');
      const decrypted = sodium.crypto_secretbox_open_easy(ciphertext, nonce, PAYLOAD_ENCRYPTION_KEY);
      req.body = JSON.parse(Buffer.from(decrypted).toString('utf8'));
      next();
    } catch (error) {
      return res.status(400).json({ error: 'Invalid payload encryption' });
    }
  } else {
    next();
  }
} 