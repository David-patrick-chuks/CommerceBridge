import { Router } from 'express';
import { createOrUpdateUser, getAllPredefinedCategories, getAllStoreCategories } from '../controllers/user-controller';
import { whatsappBot } from '../index'; // Import the instance (will fix if default export is needed)
import upload from '../middleware/upload';

const router = Router();

// CSRF token fetch endpoint for frontend
router.get('/', (req, res) => {
  // If csurf middleware is active, req.csrfToken() will be available
  if (req.csrfToken) {
    return res.status(200).json({ csrfToken: req.csrfToken() });
  }
  // Fallback: return 204 if not available
  return res.status(204).end();
});

// Create or update user account
router.post('/', upload.single('profileImage'), (req, res) => createOrUpdateUser(req, res, whatsappBot));

// Get all unique store categories (from sellers)
router.get('/categories', getAllStoreCategories);

// Get all predefined store categories
router.get('/all-categories', getAllPredefinedCategories);

export default router; 