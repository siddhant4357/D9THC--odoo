import Expense from '../models/Expense.js';
import ApprovalRule from '../models/ApprovalRule.js';
import User from '../models/User.js';

/**
 * Smart approval logic that handles:
 * - Manager-first workflows
 * - Sequential vs Parallel approval
 * - Required approvers
 * - Percentage-based approval
 * - Hybrid rules
 */
export const checkApprovalRequirements = async (expense) => {
  try {
    // Get approval rule for the employee (FAST - single query with populate)
    const approvalRule = await ApprovalRule.findOne({
      user: expense.employee._id || expense.employee
    })
    .populate('manager approvers.user')
    .lean(); // ⚡ Use lean() for faster read-only queries

    if (!approvalRule) {
      // No rule - single approval is enough
      return {
        status: 'approved',
        reason: 'No approval rule - auto-approved after first approval'
      };
    }

    const approvalHistory = expense.approvalHistory || [];
    const approvedApprovers = new Set(
      approvalHistory.filter(h => h.action === 'approved').map(h => h.approver.toString())
    );

    // Check manager-first workflow
    if (approvalRule.isManagerApprover && approvalRule.manager) {
      const managerApproved = approvedApprovers.has(approvalRule.manager._id.toString());
      
      if (!managerApproved) {
        return {
          status: 'submitted',
          nextApprover: approvalRule.manager._id,
          reason: 'Waiting for manager approval first'
        };
      }
    }

    // Check required approvers
    const requiredApprovers = approvalRule.approvers.filter(app => app.isRequired);
    const requiredApproved = requiredApprovers.every(app => 
      approvedApprovers.has(app.user._id.toString())
    );

    if (!requiredApproved) {
      // Find next required approver that hasn't approved yet
      const nextRequiredApprover = requiredApprovers.find(app => 
        !approvedApprovers.has(app.user._id.toString())
      );

      if (nextRequiredApprover) {
        return {
          status: 'submitted',
          nextApprover: nextRequiredApprover.user._id,
          reason: `Waiting for required approver: ${nextRequiredApprover.user.name}`
        };
      }
    }

    // Check percentage-based approval
    if (approvalRule.approvers.length > 0) {
      const totalApprovers = approvalRule.approvers.length;
      const requiredApprovals = Math.ceil((totalApprovers * approvalRule.minApprovalPercentage) / 100);
      const currentApprovals = approvalRule.approvers.filter(app => 
        approvedApprovers.has(app.user._id.toString())
      ).length;

      if (currentApprovals < requiredApprovals) {
        // Find next approver (sequential or parallel)
        let nextApprover = null;

        if (approvalRule.isSequential) {
          // Sequential: get next in sequence
          const sortedApprovers = approvalRule.approvers.sort((a, b) => a.sequence - b.sequence);
          nextApprover = sortedApprovers.find(app => 
            !approvedApprovers.has(app.user._id.toString())
          );
        } else {
          // Parallel: any approver can approve
          nextApprover = approvalRule.approvers.find(app => 
            !approvedApprovers.has(app.user._id.toString())
          );
        }

        if (nextApprover) {
          return {
            status: 'submitted',
            nextApprover: nextApprover.user._id,
            reason: `Approval ${currentApprovals}/${requiredApprovals} (${approvalRule.minApprovalPercentage}% needed)`
          };
        }
      }

      // All approval requirements met
      return {
        status: 'approved',
        reason: `All approval requirements met (${currentApprovals}/${requiredApprovals})`
      };
    }

    // No approvers defined - just manager approval or anyone approved
    return {
      status: 'approved',
      reason: 'No additional approvers required'
    };

  } catch (error) {
    console.error('Check approval requirements error:', error);
    return {
      status: 'submitted',
      reason: 'Error checking approval requirements'
    };
  }
};

/**
 * Get approval statistics for dashboard
 */
export const getApprovalStats = async (userId, companyId) => {
  try {
    // Get expenses pending for this user's approval
    const pendingExpenses = await Expense.find({
      company: companyId,
      status: 'submitted',
      currentApprover: userId
    }).populate('employee', 'name email');

    // Get user's approval history
    const approvalHistory = await Expense.find({
      'approvalHistory.approver': userId,
      status: { $in: ['approved', 'rejected'] }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const approvedToday = approvalHistory.filter(expense => {
      const lastApproval = expense.approvalHistory
        .filter(h => h.approver.toString() === userId.toString())
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      
      return lastApproval && 
             lastApproval.action === 'approved' && 
             new Date(lastApproval.date) >= today;
    }).length;

    const rejectedToday = approvalHistory.filter(expense => {
      const lastApproval = expense.approvalHistory
        .filter(h => h.approver.toString() === userId.toString())
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      
      return lastApproval && 
             lastApproval.action === 'rejected' && 
             new Date(lastApproval.date) >= today;
    }).length;

    const totalAmount = pendingExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    return {
      pendingCount: pendingExpenses.length,
      pendingAmount: totalAmount,
      approvedToday,
      rejectedToday,
      avgApprovalTime: '2.5 hours' // Could calculate from history
    };
  } catch (error) {
    console.error('Get approval stats error:', error);
    return {
      pendingCount: 0,
      pendingAmount: 0,
      approvedToday: 0,
      rejectedToday: 0,
      avgApprovalTime: 'N/A'
    };
  }
};
