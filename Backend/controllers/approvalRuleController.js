import ApprovalRule from '../models/ApprovalRule.js';
import User from '../models/User.js';

// @desc    Get approval rule for a specific user
// @route   GET /api/approval-rules/:userId
// @access  Private/Admin
export const getApprovalRule = async (req, res) => {
  try {
    const approvalRule = await ApprovalRule.findOne({ 
      user: req.params.userId,
      company: req.user.company._id 
    })
      .populate('user', 'name email role')
      .populate('manager', 'name email')
      .populate('approvers.user', 'name email role');

    if (!approvalRule) {
      return res.status(404).json({ message: 'Approval rule not found' });
    }

    res.json(approvalRule);
  } catch (error) {
    console.error('Get approval rule error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create or update approval rule
// @route   POST /api/approval-rules
// @access  Private/Admin
export const createOrUpdateApprovalRule = async (req, res) => {
  try {
    const {
      userId,
      description,
      manager,
      isManagerApprover,
      approvers,
      isSequential,
      minApprovalPercentage,
    } = req.body;

    // Validation
    if (!userId || !description) {
      return res.status(400).json({ message: 'User ID and description are required' });
    }

    // Check if user exists and belongs to same company
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.company.toString() !== req.user.company._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to create rule for this user' });
    }

    // Check if approval rule already exists
    let approvalRule = await ApprovalRule.findOne({ 
      user: userId,
      company: req.user.company._id 
    });

    if (approvalRule) {
      // Update existing rule
      approvalRule.description = description;
      approvalRule.manager = manager || null;
      approvalRule.isManagerApprover = isManagerApprover || false;
      approvalRule.approvers = approvers || [];
      approvalRule.isSequential = isSequential || false;
      approvalRule.minApprovalPercentage = minApprovalPercentage || 50;
      
      await approvalRule.save();
      
      await approvalRule.populate('user', 'name email role');
      await approvalRule.populate('manager', 'name email');
      await approvalRule.populate('approvers.user', 'name email role');

      res.json({ 
        message: 'Approval rule updated successfully',
        approvalRule 
      });
    } else {
      // Create new rule
      approvalRule = await ApprovalRule.create({
        user: userId,
        company: req.user.company._id,
        description,
        manager: manager || null,
        isManagerApprover: isManagerApprover || false,
        approvers: approvers || [],
        isSequential: isSequential || false,
        minApprovalPercentage: minApprovalPercentage || 50,
      });

      await approvalRule.populate('user', 'name email role');
      await approvalRule.populate('manager', 'name email');
      await approvalRule.populate('approvers.user', 'name email role');

      res.status(201).json({ 
        message: 'Approval rule created successfully',
        approvalRule 
      });
    }
  } catch (error) {
    console.error('Create/Update approval rule error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all approval rules for company
// @route   GET /api/approval-rules
// @access  Private/Admin
export const getAllApprovalRules = async (req, res) => {
  try {
    const approvalRules = await ApprovalRule.find({ 
      company: req.user.company._id 
    })
      .populate('user', 'name email role')
      .populate('manager', 'name email')
      .populate('approvers.user', 'name email role')
      .sort({ createdAt: -1 });

    res.json(approvalRules);
  } catch (error) {
    console.error('Get all approval rules error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete approval rule
// @route   DELETE /api/approval-rules/:userId
// @access  Private/Admin
export const deleteApprovalRule = async (req, res) => {
  try {
    const approvalRule = await ApprovalRule.findOne({ 
      user: req.params.userId,
      company: req.user.company._id 
    });

    if (!approvalRule) {
      return res.status(404).json({ message: 'Approval rule not found' });
    }

    await ApprovalRule.findByIdAndDelete(approvalRule._id);

    res.json({ message: 'Approval rule deleted successfully' });
  } catch (error) {
    console.error('Delete approval rule error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Check approval status for an expense
// @route   POST /api/approval-rules/check-approval
// @access  Private
export const checkApprovalStatus = async (req, res) => {
  try {
    const { userId, approvals, rejections } = req.body;

    const approvalRule = await ApprovalRule.findOne({ 
      user: userId,
      company: req.user.company._id 
    })
      .populate('approvers.user', 'name email');

    if (!approvalRule) {
      return res.json({ 
        approved: true, // No rule means auto-approve
        message: 'No approval rule found, auto-approved' 
      });
    }

    // Check for required approver rejection
    const requiredApprovers = approvalRule.approvers.filter(a => a.isRequired);
    const hasRequiredRejection = requiredApprovers.some(ra => 
      rejections?.includes(ra.user._id.toString())
    );

    if (hasRequiredRejection) {
      return res.json({ 
        approved: false, 
        rejected: true,
        message: 'Required approver rejected the request' 
      });
    }

    // Check manager approval if required
    if (approvalRule.isManagerApprover && approvalRule.manager) {
      const managerApproved = approvals?.includes(approvalRule.manager.toString());
      if (!managerApproved) {
        return res.json({ 
          approved: false, 
          pending: true,
          message: 'Waiting for manager approval' 
        });
      }
    }

    // Calculate approval percentage
    const totalApprovers = approvalRule.approvers.length;
    const approvedCount = approvals?.length || 0;
    const approvalPercentage = totalApprovers > 0 ? (approvedCount / totalApprovers) * 100 : 0;

    if (approvalPercentage >= approvalRule.minApprovalPercentage) {
      return res.json({ 
        approved: true,
        message: `Approved with ${approvalPercentage.toFixed(0)}% approval rate` 
      });
    }

    res.json({ 
      approved: false, 
      pending: true,
      currentPercentage: approvalPercentage.toFixed(0),
      requiredPercentage: approvalRule.minApprovalPercentage,
      message: `Need ${approvalRule.minApprovalPercentage}% approval, currently at ${approvalPercentage.toFixed(0)}%` 
    });

  } catch (error) {
    console.error('Check approval status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

