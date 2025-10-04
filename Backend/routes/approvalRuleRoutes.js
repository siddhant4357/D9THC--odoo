import express from 'express';
import {
  getApprovalRule,
  createOrUpdateApprovalRule,
  getAllApprovalRules,
  deleteApprovalRule,
  checkApprovalStatus,
} from '../controllers/approvalRuleController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all approval rules (admin only)
router.get('/', admin, getAllApprovalRules);

// Get specific approval rule
router.get('/:userId', getApprovalRule);

// Create or update approval rule (admin only)
router.post('/', admin, createOrUpdateApprovalRule);

// Delete approval rule (admin only)
router.delete('/:userId', admin, deleteApprovalRule);

// Check approval status (for expense workflows)
router.post('/check-approval', checkApprovalStatus);

export default router;

