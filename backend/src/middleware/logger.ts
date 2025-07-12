import morgan from 'morgan';

/**
 * Custom logging middleware for CommerceBridge
 * 
 * Provides colored, structured logging with emojis and human-readable timestamps
 * for better debugging and monitoring experience.
 */
export const customLogger = morgan((tokens, req, res) => {
  const method = tokens.method(req, res);
  const url = tokens.url(req, res);
  const status = tokens.status(req, res);
  const responseTime = tokens['response-time'](req, res);
  
  // Format timestamp in a human-readable format
  const now = new Date();
  const timestamp = now.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  // Color coding based on status
  let statusColor = '';
  let statusIcon = '';
  
  if (status) {
    const statusCode = parseInt(status, 10);
    if (statusCode >= 500) {
      statusColor = '\x1b[31m'; // Red
      statusIcon = '❌';
    } else if (statusCode >= 400) {
      statusColor = '\x1b[33m'; // Yellow
      statusIcon = '⚠️';
    } else if (statusCode >= 300) {
      statusColor = '\x1b[36m'; // Cyan
      statusIcon = '🔄';
    } else if (statusCode >= 200) {
      statusColor = '\x1b[32m'; // Green
      statusIcon = '✅';
    }
  }
  
  const resetColor = '\x1b[0m';
  
  // Format the log message
  return `${statusIcon} ${timestamp} | ${method} ${url} | ${statusColor}${status}${resetColor} | ${responseTime}ms\n`;
});

/**
 * Development logger with additional details
 * 
 * Includes request body size and user agent for debugging
 */
export const devLogger = morgan((tokens, req, res) => {
  const method = tokens.method(req, res);
  const url = tokens.url(req, res);
  const status = tokens.status(req, res);
  const responseTime = tokens['response-time'](req, res);
  const contentLength = tokens.res(req, res, 'content-length');
  const userAgent = tokens['user-agent'](req, res);
  
  // Format timestamp in a human-readable format
  const now = new Date();
  const timestamp = now.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  // Color coding based on status
  let statusColor = '';
  let statusIcon = '';
  
  if (status) {
    const statusCode = parseInt(status, 10);
    if (statusCode >= 500) {
      statusColor = '\x1b[31m'; // Red
      statusIcon = '❌';
    } else if (statusCode >= 400) {
      statusColor = '\x1b[33m'; // Yellow
      statusIcon = '⚠️';
    } else if (statusCode >= 300) {
      statusColor = '\x1b[36m'; // Cyan
      statusIcon = '🔄';
    } else if (statusCode >= 200) {
      statusColor = '\x1b[32m'; // Green
      statusIcon = '✅';
    }
  }
  
  const resetColor = '\x1b[0m';
  
  // Format the log message with additional details
  return `${statusIcon} ${timestamp} | ${method} ${url} | ${statusColor}${status}${resetColor} | ${responseTime}ms | ${contentLength || '-'}B | ${userAgent || '-'}\n`;
});

/**
 * Production logger with minimal information
 * 
 * Optimized for production with essential info only
 */
export const prodLogger = morgan((tokens, req, res) => {
  const method = tokens.method(req, res);
  const url = tokens.url(req, res);
  const status = tokens.status(req, res);
  const responseTime = tokens['response-time'](req, res);
  
  // Format timestamp in a human-readable format
  const now = new Date();
  const timestamp = now.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  // Color coding based on status
  let statusColor = '';
  let statusIcon = '';
  
  if (status) {
    const statusCode = parseInt(status, 10);
    if (statusCode >= 500) {
      statusColor = '\x1b[31m'; // Red
      statusIcon = '❌';
    } else if (statusCode >= 400) {
      statusColor = '\x1b[33m'; // Yellow
      statusIcon = '⚠️';
    } else if (statusCode >= 300) {
      statusColor = '\x1b[36m'; // Cyan
      statusIcon = '🔄';
    } else if (statusCode >= 200) {
      statusColor = '\x1b[32m'; // Green
      statusIcon = '✅';
    }
  }
  
  const resetColor = '\x1b[0m';
  
  // Format the log message (production - minimal info)
  return `${statusIcon} ${timestamp} | ${method} ${url} | ${statusColor}${status}${resetColor} | ${responseTime}ms\n`;
}); 