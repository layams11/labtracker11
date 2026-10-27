import express from 'express';
import { loginUser, getCurrentUser } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginUser);
router.get('/me', requireAuth, getCurrentUser);

export default router;
