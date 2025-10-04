import Expense from '../models/Expense.js';
import User from '../models/User.js';

/**
 * AI-POWERED SMART INSIGHTS
 * WOW FACTOR: Intelligent spending analysis with predictions
 */
export const generateSmartInsights = async (userId, companyId) => {
  try {
    const insights = [];
    
    // Get user's expenses
    const userExpenses = await Expense.find({
      employee: userId,
      status: { $in: ['submitted', 'approved'] }
    }).sort({ date: -1 });
    
    if (userExpenses.length === 0) {
      return [{
        type: 'info',
        icon: '💡',
        title: 'Get Started',
        message: 'Submit your first expense to start receiving smart insights!',
        priority: 'low'
      }];
    }
    
    // === INSIGHT 1: Month-over-Month Comparison ===
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const lastMonth = new Date(thisMonth);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const thisMonthExpenses = userExpenses.filter(e => new Date(e.date) >= thisMonth);
    const lastMonthExpenses = userExpenses.filter(e => {
      const date = new Date(e.date);
      return date >= lastMonth && date < thisMonth;
    });
    
    const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    if (lastMonthTotal > 0) {
      const percentChange = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
      
      if (Math.abs(percentChange) > 15) {
        insights.push({
          type: percentChange > 0 ? 'warning' : 'success',
          icon: percentChange > 0 ? '📈' : '📉',
          title: percentChange > 0 ? 'Spending Increased' : 'Great Savings!',
          message: `You've spent ${Math.abs(percentChange).toFixed(0)}% ${percentChange > 0 ? 'more' : 'less'} this month compared to last month`,
          value: `${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%`,
          priority: Math.abs(percentChange) > 30 ? 'high' : 'medium'
        });
      }
    }
    
    // === INSIGHT 2: Category Breakdown & Anomalies ===
    const categoryTotals = {};
    thisMonthExpenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });
    
    const sortedCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a);
    
    if (sortedCategories.length > 0) {
      const topCategory = sortedCategories[0];
      const topPercentage = (topCategory[1] / thisMonthTotal) * 100;
      
      if (topPercentage > 40) {
        insights.push({
          type: 'info',
          icon: '🎯',
          title: `${topCategory[0]} Dominates`,
          message: `${topPercentage.toFixed(0)}% of your spending is on ${topCategory[0]} this month`,
          value: `${topPercentage.toFixed(0)}%`,
          priority: 'medium'
        });
      }
    }
    
    // === INSIGHT 3: Unusual Expense Detection ===
    const avgExpenseAmount = userExpenses.reduce((sum, e) => sum + e.amount, 0) / userExpenses.length;
    const unusualExpenses = thisMonthExpenses.filter(e => e.amount > avgExpenseAmount * 3);
    
    if (unusualExpenses.length > 0) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Unusual Expenses Detected',
        message: `${unusualExpenses.length} expense${unusualExpenses.length > 1 ? 's' : ''} significantly higher than your average`,
        priority: 'high',
        details: unusualExpenses.map(e => ({
          description: e.description,
          amount: e.amount,
          category: e.category
        }))
      });
    }
    
    // === INSIGHT 4: Pending Expenses Alert ===
    const pendingExpenses = userExpenses.filter(e => e.status === 'submitted');
    if (pendingExpenses.length > 5) {
      insights.push({
        type: 'info',
        icon: '⏳',
        title: 'Many Pending Approvals',
        message: `You have ${pendingExpenses.length} expenses waiting for approval`,
        priority: 'medium'
      });
    }
    
    // === INSIGHT 5: Fastest Approval Time ===
    const approvedExpenses = userExpenses.filter(e => e.status === 'approved' && e.submittedAt && e.approvedAt);
    if (approvedExpenses.length > 0) {
      const avgApprovalTime = approvedExpenses.reduce((sum, e) => {
        const timeDiff = new Date(e.approvedAt) - new Date(e.submittedAt);
        return sum + timeDiff;
      }, 0) / approvedExpenses.length;
      
      const hours = Math.round(avgApprovalTime / (1000 * 60 * 60));
      
      if (hours < 24) {
        insights.push({
          type: 'success',
          icon: '⚡',
          title: 'Fast Approvals!',
          message: `Your expenses get approved in ~${hours} hours on average`,
          priority: 'low'
        });
      }
    }
    
    // === INSIGHT 6: Prediction for Next Month ===
    if (userExpenses.length >= 3) {
      const recentMonths = userExpenses
        .filter(e => new Date(e.date) >= lastMonth)
        .reduce((sum, e) => sum + e.amount, 0);
      
      const predictedNext = recentMonths / 2; // Simple average-based prediction
      
      insights.push({
        type: 'info',
        icon: '🔮',
        title: 'Next Month Prediction',
        message: `Based on trends, you might spend around $${predictedNext.toFixed(0)} next month`,
        priority: 'low'
      });
    }
    
    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    return insights;
    
  } catch (error) {
    console.error('Generate insights error:', error);
    return [{
      type: 'error',
      icon: '❌',
      title: 'Unable to generate insights',
      message: 'Please try again later',
      priority: 'low'
    }];
  }
};

/**
 * Get Comprehensive Analytics Data
 * WOW FACTOR: Rich data for charts and visualizations
 */
export const getAnalyticsData = async (userId, companyId, role) => {
  try {
    const query = role === 'employee' 
      ? { employee: userId, company: companyId }
      : { company: companyId }; // Admin/Manager see all
    
    const expenses = await Expense.find(query)
      .populate('employee', 'name email')
      .sort({ date: -1 });
    
    // === 1. Monthly Trends (Last 6 Months) ===
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      monthDate.setDate(1);
      monthDate.setHours(0, 0, 0, 0);
      
      const nextMonth = new Date(monthDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      const monthExpenses = expenses.filter(e => {
        const expDate = new Date(e.date);
        return expDate >= monthDate && expDate < nextMonth;
      });
      
      monthlyTrends.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        total: monthExpenses.reduce((sum, e) => sum + e.amount, 0),
        count: monthExpenses.length,
        approved: monthExpenses.filter(e => e.status === 'approved').length,
        pending: monthExpenses.filter(e => e.status === 'submitted').length,
        rejected: monthExpenses.filter(e => e.status === 'rejected').length
      });
    }
    
    // === 2. Category Breakdown ===
    const categoryData = {};
    expenses.forEach(e => {
      // Normalize category name (trim whitespace, capitalize)
      const categoryName = (e.category || 'Other').trim();
      
      if (!categoryData[categoryName]) {
        categoryData[categoryName] = { amount: 0, count: 0, color: getCategoryColor(categoryName) };
      }
      categoryData[categoryName].amount += e.amount;
      categoryData[categoryName].count += 1;
    });
    
    // Sort categories by amount (highest first)
    const categories = Object.entries(categoryData)
      .map(([name, data]) => ({
        name,
        amount: parseFloat(data.amount.toFixed(2)), // Round to 2 decimals
        count: data.count,
        color: data.color,
        percentage: 0 // Will calculate below
      }))
      .sort((a, b) => b.amount - a.amount);
    
    // Calculate percentages
    const totalAmount = categories.reduce((sum, c) => sum + c.amount, 0);
    categories.forEach(c => {
      c.percentage = parseFloat(((c.amount / totalAmount) * 100).toFixed(1));
    });
    
    // === 3. Status Distribution ===
    const statusData = {
      draft: { count: 0, amount: 0, color: '#EF4444' },
      submitted: { count: 0, amount: 0, color: '#F59E0B' },
      approved: { count: 0, amount: 0, color: '#10B981' },
      rejected: { count: 0, amount: 0, color: '#6B7280' }
    };
    
    expenses.forEach(e => {
      statusData[e.status].count += 1;
      statusData[e.status].amount += e.amount;
    });
    
    // === 4. Top Spenders (Admin/Manager only) ===
    let topSpenders = [];
    if (role !== 'employee') {
      const employeeMap = {};
      expenses.forEach(e => {
        const empId = e.employee._id.toString();
        if (!employeeMap[empId]) {
          employeeMap[empId] = {
            id: empId,
            name: e.employee.name,
            email: e.employee.email,
            total: 0,
            count: 0
          };
        }
        employeeMap[empId].total += e.amount;
        employeeMap[empId].count += 1;
      });
      
      topSpenders = Object.values(employeeMap)
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
    }
    
    // === 5. Recent Activity ===
    const recentActivity = expenses.slice(0, 10).map(e => ({
      id: e._id,
      description: e.description,
      employee: e.employee.name,
      amount: e.amount,
      currency: e.currency,
      category: e.category,
      status: e.status,
      date: e.date
    }));
    
    return {
      monthlyTrends,
      categories,
      statusData,
      topSpenders,
      recentActivity,
      summary: {
        totalExpenses: expenses.length,
        totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
        approvedAmount: expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0),
        pendingAmount: expenses.filter(e => e.status === 'submitted').reduce((sum, e) => sum + e.amount, 0),
        avgExpense: expenses.length > 0 ? (expenses.reduce((sum, e) => sum + e.amount, 0) / expenses.length) : 0
      }
    };
    
  } catch (error) {
    console.error('Get analytics data error:', error);
    throw error;
  }
};

// Helper function for category colors
function getCategoryColor(category) {
  const colors = {
    'Food': '#EF4444',           // Red
    'Travel': '#3B82F6',          // Blue
    'Accommodation': '#8B5CF6',   // Purple
    'Office Supplies': '#10B981', // Green
    'Transportation': '#F59E0B',  // Orange
    'Entertainment': '#EC4899',   // Pink
    'Utilities': '#14B8A6',       // Teal
    'Marketing': '#F97316',       // Deep Orange
    'Training': '#6366F1',        // Indigo
    'Other': '#6B7280'            // Gray
  };
  return colors[category] || '#94A3B8'; // Light slate as fallback
}

