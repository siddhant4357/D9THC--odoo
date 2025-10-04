import express from 'express';
import {
  getUsers,
  createUserAndSendPassword,
  updateUser,
  deleteUser,
} from '../controllers/userController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);

// Get all users
router.get('/', getUsers);

// Create user and send password
router.post('/create-send-password', createUserAndSendPassword);

// Update user
router.put('/:id', admin, updateUser);

// Delete user
router.delete('/:id', admin, deleteUser);

export default router;

