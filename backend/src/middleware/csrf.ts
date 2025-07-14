import csurf from 'csurf';

const csrfMiddleware = csurf({
  cookie: false // Use session-based tokens
});

export default csrfMiddleware; 