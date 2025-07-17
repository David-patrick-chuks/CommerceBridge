/// <reference path="./types/express.d.ts" />
import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';

// Import services
import { WhatsAppBot } from './chatbot/whatsapp-bot';
import { DatabaseService } from './services/database-service';
import { schedulerService } from './services/scheduler-service';

// Import routes
import authRoutes from './routes/auth';
import botRoutes from './routes/bot';
import notificationRoutes from './routes/notifications';
import orderRoutes from './routes/orders';
import paymentRoutes from './routes/payments';
import productRoutes from './routes/products';
import shortUrlRoutes from './routes/short-url';
import usersRoutes from './routes/users';
import webhookRoutes from './routes/webhooks';

import path from 'path';
import { auditLogMiddleware } from './middleware/audit-log';
import { bruteForce } from './middleware/brute-force';
import csrfMiddleware from './middleware/csrf';
import { geoBlockMiddleware } from './middleware/geo-block';
import helmetMiddleware from './middleware/helmet';
import { ipWhitelistMiddleware } from './middleware/ip-whitelist';
import { devLogger, prodLogger } from './middleware/logger';
import { authLimiter, globalLimiter } from './middleware/rate-limit';
import sessionMiddleware from './middleware/session';
import { wafMiddleware } from './middleware/waf';
import { backupDatabase } from './utils/backup';
import { checkFileIntegrity, updateFileHash } from './utils/file-integrity';
import { rotateKey } from './utils/key-manager';
import { logger } from './utils/logger';
// Remove: import { logger } from './utils/logger';

// Load environment variables
dotenv.config({ quiet: true });

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Debug: Log every route registration (only if DEBUG_ROUTES is enabled)
const originalUse = app.use;
app.use = function() {
  if (process.env.DEBUG_ROUTES === 'true' && typeof arguments[0] === 'string') {
    console.log('Registering route:', arguments[0]);
  }
  // @ts-ignore: Forwarding arguments for debug logging
  return originalUse.apply(this, arguments);
};

// Initialize services
const databaseService = new DatabaseService();
const whatsappBot = new WhatsAppBot();

// Update initiateCheckout in conversation-flow.ts to generate a unique orderId and payment link
// (Assume this is already done or will be done next)

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(compression());
// Use appropriate logger based on environment
const loggerInstance = process.env.NODE_ENV === 'production' ? prodLogger : devLogger;
app.use(loggerInstance);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Security headers and WAF
app.use(helmetMiddleware);
app.use(wafMiddleware);
app.use(geoBlockMiddleware);
app.use(ipWhitelistMiddleware);

// Audit logging
app.use(auditLogMiddleware);

// Periodic file integrity check and backup
if (process.env.NODE_ENV === 'production') {
  const filesToMonitor = [__filename];
  setInterval(async () => {
    for (const file of filesToMonitor) {
      const ok = await checkFileIntegrity(file);
      if (!ok) {
        logger.error(`File integrity violation detected for ${file}`);
        process.exit(1);
      }
      await updateFileHash(file);
    }
  }, 60 * 1000); // Every minute
}

setInterval(async () => {
  const backupPath = path.join(__dirname, `backup-${Date.now()}.json`);
  // Replace with actual DB/data to backup
  const dummyData = { timestamp: new Date().toISOString() };
  await backupDatabase(dummyData, backupPath);
  logger.info(`Database backup created at ${backupPath}`);
}, 24 * 60 * 60 * 1000); // Daily

// Key rotation schedule (every 4 hours)
setInterval(async () => {
  const newKey = await rotateKey();
  logger.info(`Key rotated at ${new Date().toISOString()}: ${newKey.slice(0, 10)}...`);
}, 4 * 60 * 60 * 1000); // 4 hours

// Core security middleware
app.use(sessionMiddleware);
app.use(globalLimiter);

// --- CSRF EXEMPTION FOR /api/shorten ---
// Allow public onboarding/account creation to POST /api/shorten without CSRF (no sensitive state change)
app.use('/api/shorten', shortUrlRoutes); // Register this route BEFORE csrfMiddleware
// --- END EXEMPTION ---

app.use(csrfMiddleware);

// API Routes
app.use('/api/auth', authLimiter, bruteForce.prevent, authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/bot', botRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/products', productRoutes);
app.use('/api/webhooks', webhookRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize and start server
async function startServer() {
  try {
    // Connect to databases
    await databaseService.connect();
    console.log('✅ Database connected successfully');

    // Initialize WhatsApp bot (non-blocking)
    whatsappBot.initialize().then(() => {
      console.log('✅ WhatsApp bot initialized');
    }).catch((error) => {
      console.error('❌ WhatsApp bot initialization failed:', error);
    });

    // Start scheduled tasks
    schedulerService.startScheduledTasks();

    // Wait for WhatsApp bot to be ready (connected) with timeout
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.log('⚠️ WhatsApp bot connection timeout - starting server anyway');
        resolve();
      }, 30000); // 30 second timeout

      if (whatsappBot.isReady()) {
        clearTimeout(timeout);
        resolve();
      } else {
        whatsappBot.once('ready', () => {
          clearTimeout(timeout);
          console.log('✅ WhatsApp bot is now connected and ready!');
          resolve();
        });
        // Also handle QR code generation
        whatsappBot.once('qr', () => {
          console.log('📱 QR Code generated - scan to connect WhatsApp');
        });
      }
    });

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 CommerceBridge server running on port ${PORT}`);
      if (whatsappBot.isReady()) {
        console.log(`📱 WhatsApp bot is ready to receive messages`);
      } else {
        console.log(`📱 WhatsApp bot waiting for QR code scan`);
      }
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 Detailed health: http://localhost:${PORT}/health/detailed`);
      console.log(`✅ Readiness probe: http://localhost:${PORT}/ready`);
      console.log(`💓 Liveness probe: http://localhost:${PORT}/live`);
      console.log(`📊 Bot status: http://localhost:${PORT}/api/bot/status`);
      console.log(`📱 QR Code: http://localhost:${PORT}/api/bot/qr`);
      console.log(`🔔 Notification API: http://localhost:${PORT}/api/notifications`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  schedulerService.stopScheduledTasks();
  await whatsappBot.disconnect();
  await databaseService.disconnect();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  schedulerService.stopScheduledTasks();
  await whatsappBot.disconnect();
  await databaseService.disconnect();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Start the server
startServer();
export { whatsappBot };

