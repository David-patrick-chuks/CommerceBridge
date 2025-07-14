import { NextFunction, Request, Response } from 'express';

const maliciousPatterns = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /SELECT\s.*?\sFROM\s/gi,
  /UNION\s/gi,
  /--\s/gi,
  /eval\(/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /DROP\s+TABLE/gi
];

function checkInput(input: any): boolean {
  if (typeof input === 'string') {
    return maliciousPatterns.some(pattern => pattern.test(input));
  }
  if (typeof input === 'object' && input !== null) {
    return Object.values(input).some(checkInput);
  }
  return false;
}

export function wafMiddleware(req: Request, res: Response, next: NextFunction) {
  if (
    checkInput(req.body) ||
    checkInput(req.query) ||
    checkInput(req.params)
  ) {
    return res.status(403).json({ error: 'Malicious input detected' });
  }
  next();
} 