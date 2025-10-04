import { generateSmartInsights, getAnalyticsData } from '../services/analyticsService.js';
import { generateAIInsights, generateAIRecommendations } from '../services/aiInsightsService.js';
import { generateExpenseReport, generateEmployeeReport } from '../services/pdfService.js';
import Expense from '../models/Expense.js';

/**
 * Get Smart Insights for user
 * WOW FACTOR: AI-powered spending analysis with Gemini
 */
export const getInsights = async (req, res) => {
  try {
    // Use AI-powered insights if available, fallback to basic
    const insights = await generateAIInsights(req.user._id, req.user.company._id);
    res.json({ insights });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({ message: 'Failed to generate insights' });
  }
};

/**
 * Get AI Recommendations
 * NEW: Personalized budget recommendations
 */
export const getAIRecommendations = async (req, res) => {
  try {
    const recommendations = await generateAIRecommendations(req.user._id, req.user.company._id);
    res.json(recommendations);
  } catch (error) {
    console.error('Get AI recommendations error:', error);
    res.status(500).json({ message: 'Failed to generate recommendations' });
  }
};

/**
 * Get Analytics Data
 * WOW FACTOR: Rich data for charts
 */
export const getAnalytics = async (req, res) => {
  try {
    const data = await getAnalyticsData(req.user._id, req.user.company._id, req.user.role);
    res.json(data);
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Failed to get analytics data' });
  }
};

/**
 * Generate PDF Report (Admin/Manager)
 * WOW FACTOR: Professional branded reports
 */
export const generatePDFReport = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    
    // Build query
    const query = { company: req.user.company._id };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Get expenses
    const expenses = await Expense.find(query)
      .populate('employee', 'name email')
      .sort({ date: -1 });
    
    // Calculate totals
    const totals = {
      count: expenses.length,
      amount: expenses.reduce((sum, e) => sum + e.amount, 0),
      approved: expenses.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0),
      pending: expenses.filter(e => e.status === 'submitted').reduce((sum, e) => sum + e.amount, 0),
      rejected: expenses.filter(e => e.status === 'rejected').reduce((sum, e) => sum + e.amount, 0)
    };
    
    // Breakdown by category
    const categoryMap = {};
    expenses.forEach(e => {
      if (!categoryMap[e.category]) {
        categoryMap[e.category] = { amount: 0, count: 0 };
      }
      categoryMap[e.category].amount += e.amount;
      categoryMap[e.category].count += 1;
    });
    
    const byCategory = Object.entries(categoryMap)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.amount - a.amount);
    
    // Top expenses
    const topExpenses = expenses.slice(0, 15);
    
    // Generate PDF
    const reportData = {
      company: req.user.company,
      reportType: type || 'Monthly Expense Report',
      totals,
      byCategory,
      topExpenses
    };
    
    const pdfResult = await generateExpenseReport(reportData);
    
    res.json({
      message: 'Report generated successfully',
      ...pdfResult
    });
    
  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({ message: 'Failed to generate PDF report' });
  }
};

/**
 * Generate Employee Report
 */
export const generateEmployeePDFReport = async (req, res) => {
  try {
    const expenses = await Expense.find({
      employee: req.user._id,
      company: req.user.company._id
    }).sort({ date: -1 });
    
    const totals = {
      submitted: expenses.filter(e => e.status !== 'draft').length,
      approved: expenses.filter(e => e.status === 'approved').length,
      pending: expenses.filter(e => e.status === 'submitted').length,
      rejected: expenses.filter(e => e.status === 'rejected').length
    };
    
    const employeeData = {
      employee: {
        name: req.user.name,
        email: req.user.email
      },
      totals,
      expenses: expenses.slice(0, 20)
    };
    
    const pdfResult = await generateEmployeeReport(employeeData);
    
    res.json({
      message: 'Report generated successfully',
      ...pdfResult
    });
    
  } catch (error) {
    console.error('Generate employee PDF error:', error);
    res.status(500).json({ message: 'Failed to generate report' });
  }
};

