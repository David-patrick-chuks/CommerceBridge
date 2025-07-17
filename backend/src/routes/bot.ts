import { Router } from 'express';
import {
    deleteBotSession,
    getBotQRCodeImage,
    getBotQRPage,
    getBotStatus,
    listBotSessions,
    logoutBot
} from '../controllers/bot-controller';

const router = Router();

router.get('/status', getBotStatus);
router.get('/qr', getBotQRPage); // HTML page with QR and refresh
router.get('/qr/image', getBotQRCodeImage); // PNG only
router.get('/sessions', listBotSessions);
router.delete('/sessions/:sessionName', deleteBotSession);
router.post('/logout', logoutBot);

export default router; 