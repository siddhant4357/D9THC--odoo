import express from 'express';
import {
  getExpenses,
  getExpenseById,
  createExpense,
  createExpenseWithReceipt,
  uploadReceiptWithOCR,
  updateExpense,
  submitExpense,
  deleteExpense,
  approveExpense,
} from '../controllers/expenseController.js';
import { protect, managerOrAdmin } from '../middleware/auth.js';
import upload, { uploadToDisk } from '../middleware/upload.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all expenses
router.get('/', getExpenses);

// Create expense (manual)
router.post('/', createExpense);

// ✅ NEW: Create expense with receipt attachment (saved to disk)
router.post('/with-receipt', uploadToDisk.single('receipt'), createExpenseWithReceipt);

// Upload receipt with OCR
router.post('/ocr-upload', upload.single('receipt'), uploadReceiptWithOCR);

// Get single expense
router.get('/:id', getExpenseById);

// Update expense
router.put('/:id', updateExpense);

// Submit expense for approval
router.post('/:id/submit', submitExpense);

// Delete expense
router.delete('/:id', deleteExpense);

// Approve/Reject expense (Manager/Admin only)
router.post('/:id/approve', managerOrAdmin, approveExpense);

export default router;

