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

// Serve HTML page with QR code and refresh button
export const getBotQRPage = async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Scan WhatsApp QR Code</title>
  <style>
    body { background: #181818; color: #fff; min-height: 100vh; margin: 0; display: flex; align-items: center; justify-content: center; }
    .card { background: #222; border-radius: 16px; box-shadow: 0 4px 24px #0008; padding: 40px 32px 32px 32px; display: flex; flex-direction: column; align-items: center; }
    h1 { margin-bottom: 32px; font-size: 2.5rem; font-family: 'Segoe UI', Arial, sans-serif; font-weight: bold; letter-spacing: 2px; }
    #qr { border: 8px solid #fff; border-radius: 8px; background: #fff; margin-bottom: 24px; width: 320px; height: 320px; }
    #refresh { margin-top: 8px; padding: 12px 32px; font-size: 1.1em; border: none; border-radius: 6px; background: #25d366; color: #fff; cursor: pointer; transition: background 0.2s; font-weight: bold; }
    #refresh.refreshed { filter: brightness(1.2); }
    #error { color: #ff4444; margin-top: 18px; font-size: 1.1em; min-height: 24px; }
    .note { margin-top: 18px; color: #bdbdbd; font-size: 1.1em; text-align: center; max-width: 340px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Scan WhatsApp QR Code</h1>
    <img id="qr" src="/api/bot/qr/image" width="320" height="320" alt="WhatsApp QR Code" />
    <button id="refresh">Refresh QR Code</button>
    <div class="note">Open WhatsApp on your phone → Tap <b>Menu</b> (<b>⋮</b> or <b>Settings</b>) → <b>Linked Devices</b> → <b>Link a Device</b> and scan this QR code.</div>
    <div id="error"></div>
  </div>
  <script>
    const btn = document.getElementById('refresh');
    const img = document.getElementById('qr');
    const errorDiv = document.getElementById('error');
    const colors = [
      '#25d366', '#128c7e', '#075e54', '#34b7f1', '#fbbc05', '#ea4335', '#34a853', '#ff9800', '#9c27b0', '#00bcd4', '#ff5722', '#607d8b'
    ];
    function randomColor() {
      return colors[Math.floor(Math.random() * colors.length)];
    }
    btn.onclick = () => {
      img.src = '/api/bot/qr/image?ts=' + Date.now();
      btn.style.background = randomColor();
      btn.classList.add('refreshed');
      setTimeout(() => btn.classList.remove('refreshed'), 500);
      errorDiv.textContent = '';
    };
    img.onerror = () => {
      errorDiv.textContent = 'Failed to load QR code. Please try refreshing or check backend logs.';
    };
    img.onload = () => {
      errorDiv.textContent = '';
    };
  </script>
</body>
</html>`);
};

// Serve PNG image only
export const getBotQRCodeImage = async (req: Request, res: Response) => {
  try {
    const qrCode = await whatsappBot.getQRCode();
    if (!qrCode) {
      return res.status(404).json({ error: 'QR code not available' });
    }
    if (qrCode.startsWith('data:image/png;base64,')) {
      const base64 = qrCode.split(',')[1];
      const imgBuffer = Buffer.from(base64, 'base64');
      res.setHeader('Content-Type', 'image/png');
      return res.send(imgBuffer);
    } else {
      return res.status(500).json({ error: 'QR code is not in PNG format' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Failed to get QR code', details: (err as Error).message });
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