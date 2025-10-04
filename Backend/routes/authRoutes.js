import express from 'express';
import { signup, signin, getMe, changePassword } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePassword);

export default router;

