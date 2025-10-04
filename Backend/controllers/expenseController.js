import Expense from '../models/Expense.js';
import ApprovalRule from '../models/ApprovalRule.js';
// Switch between OCR services
// import { extractReceiptData } from '../services/ocrService.js'; // Tesseract.js
import { extractReceiptData } from '../services/ocrService_OCRSpace.js'; // OCR.space (more accurate)

// @desc    Get all expenses for user
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req, res) => {
  try {
    const query = { employee: req.user._id, company: req.user.company._id };
    
    // Allow managers and admins to see all company expenses
    if (req.user.role === 'admin' || req.user.role === 'manager') {
      delete query.employee;
    }

    const expenses = await Expense.find(query)
      .populate('employee', 'name email')
      .populate('currentApprover', 'name email')
      .populate('approvalHistory.approver', 'name email')
      .sort({ createdAt: -1 });

    // Calculate totals by status
    const totals = {
      draft: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
    };

    expenses.forEach(expense => {
      totals[expense.status] += expense.amount;
    });

    res.json({ expenses, totals });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Private
export const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('employee', 'name email')
      .populate('currentApprover', 'name email')
      .populate('approvalHistory.approver', 'name email');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check if user has access
    const hasAccess = 
      expense.employee._id.toString() === req.user._id.toString() ||
      req.user.role === 'admin' ||
      req.user.role === 'manager';

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to view this expense' });
    }

    res.json(expense);
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create expense (with or without OCR)
// @route   POST /api/expenses
// @access  Private
export const createExpense = async (req, res) => {
  try {
    const { description, amount, category, date, paidBy, remarks } = req.body;

    const expense = await Expense.create({
      employee: req.user._id,
      company: req.user.company._id,
      description,
      amount,
      currency: req.user.company.currency.code,
      category: category || 'Other',
      date: date || new Date(),
      paidBy: paidBy || 'employee',
      remarks,
      status: 'draft',
    });

    await expense.populate('employee', 'name email');

    res.status(201).json({ 
      message: 'Expense created successfully',
      expense 
    });
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Upload receipt and create expense with OCR
// @route   POST /api/expenses/ocr-upload
// @access  Private
export const uploadReceiptWithOCR = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No receipt file uploaded' });
    }

    console.log('Processing receipt:', req.file.originalname);

    // Extract data from receipt using OCR
    const ocrData = await extractReceiptData(req.file.buffer);

    console.log('OCR extracted data:', ocrData);

    // Create expense with OCR data
    const expense = await Expense.create({
      employee: req.user._id,
      company: req.user.company._id,
      description: ocrData.description || 'Receipt scan',
      amount: ocrData.amount || 0,
      currency: req.user.company.currency.code,
      category: ocrData.category || 'Other',
      date: ocrData.date || new Date(),
      paidBy: 'employee',
      receiptData: {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
      status: 'draft',
    });

    await expense.populate('employee', 'name email');

    res.status(201).json({ 
      message: 'Receipt processed successfully with OCR',
      expense,
      ocrData,
    });
  } catch (error) {
    console.error('OCR upload error:', error);
    res.status(500).json({ 
      message: 'Failed to process receipt', 
      error: error.message 
    });
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
export const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Only employee who created it can update (and only if draft)
    if (expense.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this expense' });
    }

    if (expense.status !== 'draft') {
      return res.status(400).json({ message: 'Can only update draft expenses' });
    }

    const { description, amount, category, date, paidBy, remarks } = req.body;

    if (description) expense.description = description;
    if (amount) expense.amount = amount;
    if (category) expense.category = category;
    if (date) expense.date = date;
    if (paidBy) expense.paidBy = paidBy;
    if (remarks !== undefined) expense.remarks = remarks;

    await expense.save();
    await expense.populate('employee', 'name email');

    res.json({ message: 'Expense updated successfully', expense });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Submit expense for approval
// @route   POST /api/expenses/:id/submit
// @access  Private
export const submitExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    if (expense.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to submit this expense' });
    }

    if (expense.status !== 'draft') {
      return res.status(400).json({ message: 'Expense already submitted' });
    }

    // Get approval rule for employee
    const approvalRule = await ApprovalRule.findOne({ 
      user: req.user._id 
    }).populate('manager approvers.user');

    if (!approvalRule) {
      // No approval rule - auto approve
      expense.status = 'approved';
      expense.approvedAt = new Date();
    } else {
      expense.status = 'submitted';
      expense.submittedAt = new Date();

      // Determine first approver
      if (approvalRule.isManagerApprover && approvalRule.manager) {
        expense.currentApprover = approvalRule.manager._id;
      } else if (approvalRule.approvers.length > 0) {
        if (approvalRule.isSequential) {
          // First approver in sequence
          expense.currentApprover = approvalRule.approvers[0].user._id;
        } else {
          // Parallel - all get notified (set to first for now)
          expense.currentApprover = approvalRule.approvers[0].user._id;
        }
      }
    }

    await expense.save();
    await expense.populate('employee', 'name email');
    await expense.populate('currentApprover', 'name email');

    res.json({ 
      message: expense.status === 'approved' 
        ? 'Expense auto-approved (no approval rule found)' 
        : 'Expense submitted for approval',
      expense 
    });
  } catch (error) {
    console.error('Submit expense error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Only employee who created it or admin can delete
    const canDelete = 
      expense.employee.toString() === req.user._id.toString() ||
      req.user.role === 'admin';

    if (!canDelete) {
      return res.status(403).json({ message: 'Not authorized to delete this expense' });
    }

    // Can only delete drafts
    if (expense.status !== 'draft') {
      return res.status(400).json({ message: 'Can only delete draft expenses' });
    }

    await Expense.findByIdAndDelete(req.params.id);

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Approve/Reject expense
// @route   POST /api/expenses/:id/approve
// @access  Private (Manager/Admin)
export const approveExpense = async (req, res) => {
  try {
    const { action, comments } = req.body; // action: 'approved' or 'rejected'
    
    const expense = await Expense.findById(req.params.id)
      .populate('employee', 'name email');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    if (expense.status !== 'submitted') {
      return res.status(400).json({ message: 'Expense is not pending approval' });
    }

    // Add to approval history
    expense.approvalHistory.push({
      approver: req.user._id,
      action,
      comments,
      date: new Date(),
    });

    if (action === 'rejected') {
      expense.status = 'rejected';
      expense.rejectionReason = comments;
      expense.currentApprover = null;
    } else {
      // Check if all approval requirements are met
      // For now, simple approval
      expense.status = 'approved';
      expense.approvedAt = new Date();
      expense.currentApprover = null;
    }

    await expense.save();
    await expense.populate('approvalHistory.approver', 'name email');

    res.json({ 
      message: `Expense ${action}`,
      expense 
    });
  } catch (error) {
    console.error('Approve expense error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

