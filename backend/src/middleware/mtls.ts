import { Request, Response, NextFunction } from 'express';

export function mtlsMiddleware(req: Request, res: Response, next: NextFunction) {
  // Simulate mTLS by checking for a client certificate (in real mTLS, use HTTPS server with requestCert: true)
  const cert = (req.connection as any).getPeerCertificate?.();
  if (!cert || !cert.subject || !cert.issuer || !cert.valid_to) {
    return res.status(403).json({ error: 'Client certificate required' });
  }
  // Optionally check issuer or other cert fields
  const expectedIssuer = process.env.CERT_ISSUER;
  if (expectedIssuer && cert.issuer !== expectedIssuer) {
    return res.status(403).json({ error: 'Invalid client certificate issuer' });
  }
  next();
} 