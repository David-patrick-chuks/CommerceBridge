import { Router } from 'express';
import {
    deleteBotSession,
    getBotQRCode,
    getBotStatus,
    listBotSessions,
    logoutBot
} from '../controllers/bot-controller';

const router = Router();

router.get('/status', getBotStatus);
router.get('/qr', getBotQRCode);
router.get('/sessions', listBotSessions);
router.delete('/sessions/:sessionName', deleteBotSession);
router.post('/logout', logoutBot);

export default router; 