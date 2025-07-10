import { Request, Response } from 'express';
import { whatsappBot } from '../index';
import { OrderModel } from '../models/order';

export const dummyPaymentPage = async (req: Request, res: Response) => {
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
};

export const dummyPaymentConfirm = async (req: Request, res: Response) => {
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
};

export const dummyPaymentReceipt = async (req: Request, res: Response) => {
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
}; 