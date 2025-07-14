import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import { createServer } from 'http';
import mongoose from 'mongoose'; // Added for MongoDB connection status

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
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(compression());
// Use appropriate logger based on environment
const logger = process.env.NODE_ENV === 'production' ? prodLogger : devLogger;
app.use(logger);
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
app.use(csrfMiddleware);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Get system metrics
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const botStatus = whatsappBot.getStatus();
    
    // Check database connections
    const dbHealth = await databaseService.healthCheck();
    const dbConnectionStatus = databaseService.getConnectionStatus();
    
    // Determine overall health
    const isHealthy = dbHealth.mongodb && dbHealth.redis && botStatus.connectionState !== 'disconnected';
    
    const healthResponse = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: {
        seconds: Math.floor(uptime),
        formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`
      },
      services: {
        mongodb: {
          status: dbHealth.mongodb ? 'connected' : 'disconnected',
          connectionState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
        },
        redis: {
          status: dbHealth.redis ? 'connected' : 'disconnected',
          connectionState: dbConnectionStatus.redis ? 'connected' : 'disconnected'
        },
        whatsappBot: {
          status: botStatus.connectionState,
          isReady: botStatus.isReady,
          isConnected: botStatus.isConnected,
          isConnecting: botStatus.isConnecting,
          lastActivity: botStatus.lastActivity
        }
      },
      system: {
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
        },
        nodeVersion: process.version,
        platform: process.platform,
        pid: process.pid
      },
      endpoints: {
        botStatus: `http://localhost:${PORT}/api/bot/status`,
        qrCode: `http://localhost:${PORT}/api/bot/qr`,
        health: `http://localhost:${PORT}/health`
      }
    };

    res.status(isHealthy ? 200 : 503).json(healthResponse);
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Service unavailable'
    });
  }
});

// Detailed health check endpoint for monitoring
app.get('/health/detailed', async (req, res) => {
  try {
    const startTime = Date.now();
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const botStatus = whatsappBot.getStatus();
    
    // Check database connections
    const dbHealth = await databaseService.healthCheck();
    const dbConnectionStatus = databaseService.getConnectionStatus();
    
    // Get session information
    const sessionManager = whatsappBot['sessionManager'];
    const activeSessions = sessionManager ? sessionManager.getActiveSessions() : [];
    const sessionCount = sessionManager ? sessionManager.getSessionCount() : 0;
    
    // Get database stats
    let userCount = 0;
    let orderCount = 0;
    try {
      const { UserModel } = await import('./models/user');
      const { OrderModel } = await import('./models/order');
      userCount = await UserModel.countDocuments();
      orderCount = await OrderModel.countDocuments();
    } catch (err) {
      console.error('❌ Failed to get database stats:', err);
    }
    
    const responseTime = Date.now() - startTime;
    
    const detailedHealthResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      responseTime: `${responseTime}ms`,
      uptime: {
        seconds: Math.floor(uptime),
        formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`
      },
      services: {
        mongodb: {
          status: dbHealth.mongodb ? 'connected' : 'disconnected',
          connectionState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
          stats: {
            users: userCount,
            orders: orderCount
          }
        },
        redis: {
          status: dbHealth.redis ? 'connected' : 'disconnected',
          connectionState: dbConnectionStatus.redis ? 'connected' : 'disconnected'
        },
        whatsappBot: {
          status: botStatus.connectionState,
          isReady: botStatus.isReady,
          isConnected: botStatus.isConnected,
          isConnecting: botStatus.isConnecting,
          lastActivity: botStatus.lastActivity,
          qrCodeAvailable: !!botStatus.qrCode
        }
      },
      sessions: {
        active: activeSessions.length,
        total: sessionCount,
        activeUsers: activeSessions.map(s => ({
          phoneNumber: s.phoneNumber,
          userType: s.userType,
          lastActivity: s.lastActivity,
          needsAccount: s.needsAccount
        }))
      },
      system: {
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
          heapUsagePercent: `${Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)}%`
        },
        nodeVersion: process.version,
        platform: process.platform,
        pid: process.pid,
        cpuUsage: process.cpuUsage(),
        env: process.env.NODE_ENV || 'development'
      },
      performance: {
        responseTime,
        memoryUsagePercent: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
        uptimePercent: Math.round((uptime / (24 * 3600)) * 100) // Assuming 24h as 100%
      },
      endpoints: {
        botStatus: `http://localhost:${PORT}/api/bot/status`,
        qrCode: `http://localhost:${PORT}/api/bot/qr`,
        health: `http://localhost:${PORT}/health`,
        detailedHealth: `http://localhost:${PORT}/health/detailed`
      }
    };

    res.status(200).json(detailedHealthResponse);
  } catch (error) {
    console.error('❌ Detailed health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Detailed health check failed',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Service unavailable'
    });
  }
});

// Readiness probe - checks if service is ready to accept traffic
app.get('/ready', async (req, res) => {
  try {
    const dbHealth = await databaseService.healthCheck();
    const botStatus = whatsappBot.getStatus();
    
    // Service is ready if databases are connected and bot is initialized
    const isReady = dbHealth.mongodb && dbHealth.redis && botStatus.connectionState !== 'disconnected';
    
    if (isReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        message: 'Service is ready to accept traffic'
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        message: 'Service is not ready to accept traffic',
        issues: {
          mongodb: !dbHealth.mongodb ? 'disconnected' : 'connected',
          redis: !dbHealth.redis ? 'disconnected' : 'connected',
          whatsappBot: botStatus.connectionState === 'disconnected' ? 'disconnected' : 'connected'
        }
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: 'Readiness check failed'
    });
  }
});

// Liveness probe - checks if service is alive
app.get('/live', (req, res) => {
  const uptime = process.uptime();
  
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.floor(uptime),
      formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`
    },
    pid: process.pid
  });
});

// API Routes
app.use('/api/auth', authLimiter, bruteForce.prevent, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/pay', paymentRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', shortUrlRoutes);
app.use('/api/bot', botRoutes);

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

