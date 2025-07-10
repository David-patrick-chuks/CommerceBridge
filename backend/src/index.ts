import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import { createServer } from 'http';
import morgan from 'morgan';

// Import services
import { WhatsAppBot } from './chatbot/whatsapp-bot';
import { OrderModel } from './models/order';
import { DatabaseService } from './services/database-service';

// Import routes
import authRoutes from './routes/auth';
import orderRoutes from './routes/orders';
import paymentRoutes from './routes/payments';
import productRoutes from './routes/products';
import shortUrlRoutes from './routes/short-url';
import usersRoutes from './routes/users';
import webhookRoutes from './routes/webhooks';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Debug: Log every route registration
const originalUse = app.use;
app.use = function() {
  if (typeof arguments[0] === 'string') {
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
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'CommerceBridge WhatsApp Bot is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/users', usersRoutes);
app.use('/api', shortUrlRoutes);

// Dummy payment page
app.get('/api/pay/dummy/:orderId', async (req, res) => {
  const { orderId } = req.params;
  const order = await OrderModel.findOne({ orderId });
  if (!order) {
    return res.status(404).send('Order not found');
  }
  if (order.paid) {
    return res.redirect(`/api/pay/dummy/${orderId}/receipt`);
  }
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Dummy Payment</title>
  <style>
    body { font-family: sans-serif; background: #f9f9f9; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; }
    .card { background: #fff; padding: 32px; border-radius: 12px; box-shadow: 0 2px 16px rgba(0,0,0,0.08); text-align: center; }
    .btn { background: #25d366; color: #fff; border: none; padding: 12px 32px; border-radius: 6px; font-size: 1.2em; cursor: pointer; margin-top: 24px; }
    .btn:active { background: #128c7e; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Pay for Order #${orderId}</h2>
    <p>Total: <b>$${order.total}</b></p>
    <form method="POST" action="/api/pay/dummy/${orderId}/confirm">
      <button class="btn" type="submit">Pay</button>
    </form>
  </div>
</body>
</html>`);
});

// Dummy payment confirmation and digital receipt
app.post('/api/pay/dummy/:orderId/confirm', express.urlencoded({ extended: true }), async (req, res) => {
  const { orderId } = req.params;
  const order = await OrderModel.findOne({ orderId });
  if (!order) {
    res.status(404).send('Order not found');
    return;
  }
  order.paid = true;
  await order.save();
  // Send WhatsApp receipt if phoneNumber is available
  if (order.phoneNumber) {
    try {
      const receiptMsg = `🧾 *Payment Successful!*\n\nOrder ID: ${orderId}\nTotal Paid: $${order.total}\n\nItems:\n${order.items.map(item => `${item.name} x${item.quantity} - $${item.price * item.quantity}`).join('\n')}\n\nThank you for shopping with CommerceBridge!`;
      await whatsappBot.sendMessage(order.phoneNumber, receiptMsg);
    } catch (err) {
      console.error('❌ Failed to send WhatsApp receipt:', err);
    }
  }
  // Render a simple digital receipt
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payment Successful</title>
  <style>
    body { font-family: sans-serif; background: #f9f9f9; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; }
    .receipt { background: #fff; padding: 32px; border-radius: 12px; box-shadow: 0 2px 16px rgba(0,0,0,0.08); text-align: center; }
    .success { color: #25d366; font-size: 2em; }
    .order { margin-top: 16px; }
    .items { margin-top: 16px; text-align: left; }
    .total { margin-top: 16px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="success">✔️ Payment Successful!</div>
    <div class="order">Order ID: <b>${orderId}</b></div>
    <div class="items">
      <div>Items:</div>
      <ul>
        ${order.items.map(item => `<li>${item.name} x${item.quantity} - $${item.price * item.quantity}</li>`).join('')}
      </ul>
    </div>
    <div class="total">Total Paid: $${order.total}</div>
    <div style="margin-top:24px; color:#555;">Thank you for shopping with CommerceBridge!</div>
  </div>
</body>
</html>`);
  return;
});

app.get('/api/pay/dummy/:orderId/receipt', async (req, res) => {
  const { orderId } = req.params;
  const order = await OrderModel.findOne({ orderId });
  if (!order || !order.paid) {
    res.status(404).send('Receipt not available');
    return;
  }
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Digital Receipt</title>
  <style>
    body { font-family: sans-serif; background: #f9f9f9; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; }
    .receipt { background: #fff; padding: 32px; border-radius: 12px; box-shadow: 0 2px 16px rgba(0,0,0,0.08); text-align: center; }
    .success { color: #25d366; font-size: 2em; }
    .order { margin-top: 16px; }
    .items { margin-top: 16px; text-align: left; }
    .total { margin-top: 16px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="success">🧾 Digital Receipt</div>
    <div class="order">Order ID: <b>${orderId}</b></div>
    <div class="items">
      <div>Items:</div>
      <ul>
        ${order.items.map(item => `<li>${item.name} x${item.quantity} - $${item.price * item.quantity}</li>`).join('')}
      </ul>
    </div>
    <div class="total">Total Paid: $${order.total}</div>
    <div style="margin-top:24px; color:#555;">Thank you for shopping with CommerceBridge!</div>
  </div>
</body>
</html>`);
  return;
});

// WhatsApp bot status endpoint
app.get('/api/bot/status', (req, res) => {
  const status = whatsappBot.getStatus();
  res.json(status);
});

// WhatsApp bot QR code endpoint
app.get('/api/bot/qr', async (req, res) => {
  try {
    const qrCode = await whatsappBot.getQRCode();
    if (!qrCode) {
      return res.status(404).json({ error: 'QR code not available' });
    }
    const accept = req.headers.accept || '';
    // If client requests image/png, return the image
    if (accept.includes('image/png')) {
      const base64 = qrCode.split(',')[1];
      const imgBuffer = Buffer.from(base64, 'base64');
      res.setHeader('Content-Type', 'image/png');
      return res.send(imgBuffer);
    }
    // If client requests HTML or is a browser, render an HTML page with the QR code image
    if (accept.includes('text/html') || accept === '' || accept === '*/*') {
      return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WhatsApp QR Code</title>
  <style>
    body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; background: #f9f9f9; }
    h1 { color: #25d366; }
    img { margin-top: 24px; border-radius: 8px; }
    .note { margin-top: 16px; color: #555; }
  </style>
</head>
<body>
  <h1>Scan WhatsApp QR Code</h1>
  <img src="${qrCode}" alt="WhatsApp QR Code" width="320" height="320" />
  <div class="note">Open WhatsApp &rarr; Menu &rarr; Linked Devices &rarr; Scan QR</div>
</body>
</html>`);
    }
    // Otherwise, return the data URL as JSON
    res.json({ qrCode });
    return;
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate QR code' });
    return;
  }
});

// Session management endpoints
app.get('/api/bot/sessions', async (req, res) => {
  try {
    const sessions = await whatsappBot.listSessions();
    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list sessions' });
  }
});

app.delete('/api/bot/sessions/:sessionName', async (req, res) => {
  try {
    const { sessionName } = req.params;
    await whatsappBot.deleteSession(sessionName);
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

app.post('/api/bot/logout', async (req, res) => {
  try {
    await whatsappBot.logout();
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to logout' });
  }
});

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

    // Initialize WhatsApp bot
    await whatsappBot.initialize();
    console.log('✅ WhatsApp bot initialized');

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 CommerceBridge server running on port ${PORT}`);
      console.log(`📱 WhatsApp bot is ready to receive messages`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 Bot status: http://localhost:${PORT}/api/bot/status`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  await whatsappBot.disconnect();
  await databaseService.disconnect();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
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
