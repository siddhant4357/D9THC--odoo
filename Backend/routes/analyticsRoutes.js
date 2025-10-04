import express from 'express';
import { 
  getInsights,
  getAIRecommendations,
  getAnalytics, 
  generatePDFReport,
  generateEmployeePDFReport
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/analytics/insights
// @desc    Get AI-powered smart insights
// @access  Private
router.get('/insights', protect, getInsights);

// @route   GET /api/analytics/recommendations
// @desc    Get AI-powered budget recommendations
// @access  Private
router.get('/recommendations', protect, getAIRecommendations);

// @route   GET /api/analytics/data
// @desc    Get analytics data for charts
// @access  Private
router.get('/data', protect, getAnalytics);

// @route   GET /api/analytics/report/pdf
// @desc    Generate PDF report (Admin/Manager)
// @access  Private
router.get('/report/pdf', protect, generatePDFReport);

// @route   GET /api/analytics/report/employee
// @desc    Generate employee PDF report
// @access  Private
router.get('/report/employee', protect, generateEmployeePDFReport);

export default router;

