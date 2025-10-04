import Expense from '../models/Expense.js';
import ApprovalRule from '../models/ApprovalRule.js';
import User from '../models/User.js';
import { checkApprovalRequirements, getApprovalStats } from '../utils/approvalHelper.js';
import { convertExpensesBatch } from '../services/currencyService.js';
// Switch between OCR services
// import { extractReceiptData } from '../services/ocrService.js'; // Tesseract.js
import { extractReceiptData } from '../services/ocrService_OCRSpace.js'; // OCR.space (more accurate)

// @desc    Get all expenses for user
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req, res) => {
  try {
    let query = { company: req.user.company._id };
    
    // Filter based on user role
    if (req.user.role === 'employee') {
      // Employees see only their own expenses
      query.employee = req.user._id;
    } else if (req.user.role === 'manager') {
      // Managers see expenses they need to approve OR their team's expenses
      query.$or = [
        { currentApprover: req.user._id },  // Expenses waiting for this manager's approval
        { employee: req.user._id },         // Their own expenses
        // If manager-employee relationships exist, add: { employee: { $in: teamMemberIds } }
      ];
    }
    // Admins see all company expenses (no additional filter needed)

    const expenses = await Expense.find(query)
      .populate('employee', 'name email')
      .populate('currentApprover', 'name email')
      .populate('approvalHistory.approver', 'name email')
      .sort({ createdAt: -1 });

    // ✅ FAST CURRENCY CONVERSION - Uses cache!
    const companyCurrency = req.user.company.currency?.code || 'USD';
    const expensesWithConversion = await convertExpensesBatch(
      expenses.map(e => e.toObject()),
      companyCurrency
    );

    // Calculate totals by status (using converted amounts for accuracy)
    const totals = {
      draft: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
    };

    expensesWithConversion.forEach(expense => {
      totals[expense.status] += (expense.convertedAmount || expense.amount);
    });

    // For managers, also get approval statistics
    let approvalStats = null;
    if (req.user.role === 'manager') {
      approvalStats = await getApprovalStats(req.user._id, req.user.company._id);
    }

    res.json({ 
      expenses: expensesWithConversion, 
      totals,
      companyCurrency,
      ...(approvalStats && { stats: approvalStats })
    });
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
export const createExpenseWithReceipt = async (req, res) => {
  try {
    const { description, date, category, paidBy, amount, currency, remarks } = req.body;

    // Validate required fields
    if (!description || !amount || !date) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Create expense with receipt
    const expense = await Expense.create({
      employee: req.user._id,
      company: req.user.company._id,
      description,
      date,
      category: category || 'Other',
      paidBy: paidBy || 'employee',
      amount: parseFloat(amount),
      currency: currency || req.user.company.currency?.code || 'USD',
      remarks,
      receiptUrl: req.file ? `/uploads/${req.file.filename}` : null,
      receiptData: req.file ? {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      } : null,
      status: 'draft',
    });

    await expense.populate('employee', 'name email');

    res.status(201).json({
      message: 'Expense with receipt created successfully',
      expense,
    });
  } catch (error) {
    console.error('Create expense with receipt error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createExpense = async (req, res) => {
  try {
    const { description, amount, category, date, paidBy, remarks, currency } = req.body;

    const expense = await Expense.create({
      employee: req.user._id,
      company: req.user.company._id,
      description,
      amount,
      currency: currency || req.user.company.currency.code,  // ✅ FIXED - Use provided currency or fallback to company currency
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

    // Extract data from receipt using OCR
    const ocrData = await extractReceiptData(req.file.buffer);

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

    const { description, amount, category, date, paidBy, remarks, currency } = req.body;

    if (description) expense.description = description;
    if (amount) expense.amount = amount;
    if (currency) expense.currency = currency;  // ✅ FIXED - Allow currency updates
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

    // Always submit for approval (FIXED: No auto-approval!)
    expense.status = 'submitted';
    expense.submittedAt = new Date();

    if (!approvalRule) {
      // No approval rule - assign to company admin as default approver
      const defaultApprover = await User.findOne({ 
        company: req.user.company._id, 
        role: 'admin' 
      });
      if (defaultApprover) {
        expense.currentApprover = defaultApprover._id;
      }
    } else {
      // Determine appropriate approver based on rule
      if (approvalRule.isManagerApprover && approvalRule.manager) {
        // Manager-first workflow
        expense.currentApprover = approvalRule.manager._id;
      } else if (approvalRule.approvers.length > 0) {
        // Sequential or parallel workflow
        if (approvalRule.isSequential) {
          // First approver in sequence
          expense.currentApprover = approvalRule.approvers[0].user._id;
        } else {
          // Parallel - set to first approver (will notify all)
          expense.currentApprover = approvalRule.approvers[0].user._id;
        }
      } else {
        // No specific approvers - assign to company admin
        const defaultApprover = await User.findOne({ 
          company: req.user.company._id, 
          role: 'admin' 
        });
        if (defaultApprover) {
          expense.currentApprover = defaultApprover._id;
        }
      }
    }

    // Add entry to approval history
    expense.approvalHistory.push({
      approver: req.user._id,
      status: 'submitted',
      comments: 'Expense submitted for approval',
      timestamp: new Date()
    });

    await expense.save();
    await expense.populate('employee', 'name email');
    await expense.populate('currentApprover', 'name email');

    res.json({ 
      message: 'Expense submitted for approval',
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
      .populate('employee', 'name email')
      .populate('currentApprover', 'name email');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    if (expense.status !== 'submitted') {
      return res.status(400).json({ message: 'Expense is not pending approval' });
    }

    // ✅ STRICT SEQUENTIAL CHECK: Only current approver OR admin can approve
    const isCurrentApprover = expense.currentApprover && 
                              expense.currentApprover._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCurrentApprover && !isAdmin) {
      return res.status(403).json({ 
        message: 'Not authorized to approve this expense',
        reason: 'This expense is waiting for approval from another user',
        currentApprover: expense.currentApprover?.name || 'Unknown'
      });
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
      // Smart approval logic - check percentage, required approvers, etc.
      const approvalResult = await checkApprovalRequirements(expense);
      
      if (approvalResult.status === 'approved') {
        expense.status = 'approved';
        expense.approvedAt = new Date();
        expense.currentApprover = null;
      } else {
        // Move to next approver or keep waiting
        expense.status = 'submitted';
        if (approvalResult.nextApprover) {
          expense.currentApprover = approvalResult.nextApprover;
        }
      }
    }

    await expense.save();
    await expense.populate('approvalHistory.approver', 'name email');

    res.json({ 
      message: `Expense ${action}`,
      expense 
    });
  } catch (error) {
    console.error('❌ Approve expense error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

