import { Router } from 'express';
import { createShortUrl, redirectShortUrl, validateShortUrl } from '../controllers/short-url-controller';

const router = Router();

router.post('/shorten', createShortUrl);
router.get('/s/:code', redirectShortUrl);
router.get('/validate/:code', validateShortUrl);

export default router; 