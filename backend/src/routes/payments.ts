import { Router } from 'express';
import { dummyPaymentConfirm, dummyPaymentPage, dummyPaymentReceipt } from '../controllers/payment-controller';

const router = Router();

// Dummy payment page
router.get('/pay/dummy/:orderId', dummyPaymentPage);
// Dummy payment confirmation
router.post('/pay/dummy/:orderId/confirm', dummyPaymentConfirm);
// Digital receipt
router.get('/pay/dummy/:orderId/receipt', dummyPaymentReceipt);

export default router; 