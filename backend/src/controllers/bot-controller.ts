import { Request, Response } from 'express';
import { whatsappBot } from '../index';
import { BotStatusResponse } from '../types';

export const getBotStatus = (req: Request, res: Response) => {
  const status = whatsappBot.getStatus();
  const detailedStatus: BotStatusResponse = {
    ...status,
    message: status.connectionState === 'ready' 
      ? 'WhatsApp bot is connected and ready to receive messages'
      : status.connectionState === 'connecting'
      ? 'WhatsApp bot is waiting for QR code scan'
      : status.connectionState === 'connected'
      ? 'WhatsApp bot is authenticated but not fully ready'
      : 'WhatsApp bot is disconnected'
  };
  res.json(detailedStatus);
};

export const getBotQRCode = async (req: Request, res: Response) => {
  try {
    const qrCode = await whatsappBot.getQRCode();
    if (!qrCode) {
      return res.status(404).json({ error: 'QR code not available' });
    }
    const accept = req.headers.accept || '';
    if (accept.includes('image/png')) {
      const base64 = qrCode.split(',')[1];
      const imgBuffer = Buffer.from(base64, 'base64');
      res.setHeader('Content-Type', 'image/png');
      return res.send(imgBuffer);
    }
    if (accept.includes('text/html') || accept === '' || accept === '*/*') {
      return res.send(`<!DOCTYPE html>
<html lang=\"en\">
<head>
  <meta charset=\"UTF-8\">
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
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
  <img src=\"${qrCode}\" alt=\"WhatsApp QR Code\" width=\"320\" height=\"320\" />
  <div class=\"note\">Open WhatsApp &rarr; Menu &rarr; Linked Devices &rarr; Scan QR</div>
</body>
</html>`);
    }
    res.json({ qrCode });
    return;
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate QR code' });
    return;
  }
};

export const listBotSessions = async (req: Request, res: Response) => {
  try {
    const sessions = await whatsappBot.listSessions();
    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list sessions' });
  }
};

export const deleteBotSession = async (req: Request, res: Response) => {
  try {
    const { sessionName } = req.params;
    await whatsappBot.deleteSession(sessionName);
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
};

export const logoutBot = async (req: Request, res: Response) => {
  try {
    await whatsappBot.logout();
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to logout' });
  }
}; 