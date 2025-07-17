import helmet from 'helmet';

const isDev = process.env.NODE_ENV !== 'production';

const helmetMiddleware = helmet({
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      scriptSrc: isDev ? ["'self'", "'unsafe-inline'"] : ["'self'"],
      styleSrc: isDev ? ["'self'", "'unsafe-inline'"] : ["'self'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  referrerPolicy: { policy: 'no-referrer' },
  frameguard: { action: 'deny' },
  noSniff: true,
  dnsPrefetchControl: { allow: false }
});

export default helmetMiddleware; 