import { GoogleGenerativeAI } from '@google/generative-ai';
import Expense from '../models/Expense.js';
import User from '../models/User.js';

/**
 * SUPER POWERED AI INSIGHTS WITH GEMINI
 * WOW FACTOR: Real AI-powered financial analysis!
 */

let genAI = null;

// Initialize Gemini AI (will be called when API key is available)
export const initializeGemini = (apiKey) => {
  if (apiKey && apiKey !== 'your_gemini_api_key_here' && apiKey.length > 20) {
    try {
      // Initialize with proper configuration for free tier
      genAI = new GoogleGenerativeAI(apiKey);
      console.log('✅ Gemini AI initialized successfully!');
    } catch (error) {
      console.log('⚠️ Gemini AI initialization failed:', error.message);
      genAI = null;
    }
  } else {
    console.log('⚠️ Gemini API key not configured or invalid');
    console.log('   Please set GEMINI_API_KEY environment variable with your free Gemini API key');
    genAI = null;
  }
};

/**
 * Generate AI-Powered Smart Insights
 */
export const generateAIInsights = async (userId, companyId) => {
  try {
    const insights = [];
    
    // Get user's expenses
    const userExpenses = await Expense.find({
      employee: userId,
      status: { $in: ['submitted', 'approved'] }
    }).sort({ date: -1 }).limit(100);
    
    if (userExpenses.length === 0) {
      return [{
        type: 'info',
        icon: '💡',
        title: 'Welcome!',
        message: 'Submit your first expense to start receiving AI-powered insights!',
        priority: 'low',
        aiGenerated: false
      }];
    }

    // === BASIC ANALYTICS (Always available) ===
    
    // 1. Month-over-Month Comparison
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
      const absChange = Math.abs(percentChange);
      
      if (absChange > 15) {
        insights.push({
          type: percentChange > 0 ? 'warning' : 'success',
          icon: percentChange > 0 ? '📈' : '📉',
          title: percentChange > 0 ? 'Spending Increased!' : 'Great Savings!',
          message: `You've spent ${absChange.toFixed(0)}% ${percentChange > 0 ? 'more' : 'less'} this month (${formatCurrency(thisMonthTotal)}) compared to last month (${formatCurrency(lastMonthTotal)})`,
          value: `${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%`,
          priority: absChange > 30 ? 'high' : 'medium',
          aiGenerated: false,
          details: {
            thisMonth: thisMonthTotal,
            lastMonth: lastMonthTotal,
            difference: thisMonthTotal - lastMonthTotal
          }
        });
      }
    }
    
    // 2. Fraud Detection - Unusual Expenses (3x average)
    const avgExpenseAmount = userExpenses.reduce((sum, e) => sum + e.amount, 0) / userExpenses.length;
    const unusualExpenses = thisMonthExpenses.filter(e => e.amount > avgExpenseAmount * 3);
    
    if (unusualExpenses.length > 0) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: '🚨 Fraud Alert: Unusual Expenses Detected',
        message: `${unusualExpenses.length} expense${unusualExpenses.length > 1 ? 's are' : ' is'} significantly higher than your average (${formatCurrency(avgExpenseAmount)}). This could indicate fraud or data entry errors!`,
        priority: 'high',
        aiGenerated: false,
        details: unusualExpenses.slice(0, 3).map(e => ({
          description: e.description,
          amount: e.amount,
          category: e.category,
          date: e.date,
          timesAboveAverage: (e.amount / avgExpenseAmount).toFixed(1)
        }))
      });
    }
    
    // 3. Category Dominance
    const categoryTotals = {};
    thisMonthExpenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });
    
    const sortedCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a);
    
    if (sortedCategories.length > 0) {
      const [topCategory, topAmount] = sortedCategories[0];
      const topPercentage = (topAmount / thisMonthTotal) * 100;
      
      if (topPercentage > 40) {
        insights.push({
          type: 'info',
          icon: '🎯',
          title: `${topCategory} Dominates Your Spending`,
          message: `${topPercentage.toFixed(0)}% of your spending (${formatCurrency(topAmount)}) is on ${topCategory} this month. Consider setting a budget!`,
          value: `${topPercentage.toFixed(0)}%`,
          priority: 'medium',
          aiGenerated: false
        });
      }
    }
    
    // 4. Pending Expenses Alert
    const pendingExpenses = userExpenses.filter(e => e.status === 'submitted');
    if (pendingExpenses.length > 5) {
      insights.push({
        type: 'info',
        icon: '⏳',
        title: 'Many Pending Approvals',
        message: `You have ${pendingExpenses.length} expenses waiting for approval. Total pending: ${formatCurrency(pendingExpenses.reduce((sum, e) => sum + e.amount, 0))}`,
        priority: 'medium',
        aiGenerated: false
      });
    }
    
    // 5. Approval Speed Stats
    const approvedExpenses = userExpenses.filter(e => 
      e.status === 'approved' && e.submittedAt && e.approvedAt
    );
    
    if (approvedExpenses.length > 0) {
      const avgApprovalTime = approvedExpenses.reduce((sum, e) => {
        const timeDiff = new Date(e.approvedAt) - new Date(e.submittedAt);
        return sum + timeDiff;
      }, 0) / approvedExpenses.length;
      
      const hours = Math.round(avgApprovalTime / (1000 * 60 * 60));
      const days = Math.round(hours / 24);
      
      if (hours < 24) {
        insights.push({
          type: 'success',
          icon: '⚡',
          title: 'Lightning Fast Approvals!',
          message: `Your expenses get approved in ~${hours} hours on average. Your manager is very responsive!`,
          priority: 'low',
          aiGenerated: false
        });
      } else if (days > 7) {
        insights.push({
          type: 'warning',
          icon: '🐌',
          title: 'Slow Approval Process',
          message: `Average approval time is ${days} days. Consider following up with your manager.`,
          priority: 'medium',
          aiGenerated: false
        });
      }
    }
    
    // 6. Spending Streak
    const last7Days = userExpenses.filter(e => {
      const daysDiff = (new Date() - new Date(e.date)) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    });
    
    if (last7Days.length > 10) {
      insights.push({
        type: 'warning',
        icon: '🔥',
        title: 'High Spending Streak!',
        message: `${last7Days.length} expenses in the last 7 days totaling ${formatCurrency(last7Days.reduce((sum, e) => sum + e.amount, 0))}. Are you on a business trip?`,
        priority: 'high',
        aiGenerated: false
      });
    }
    
    // === AI-POWERED INSIGHTS (If Gemini is available) ===
    if (genAI && userExpenses.length >= 5) {
      try {
        const aiInsight = await generateGeminiInsight(userExpenses, thisMonthTotal, lastMonthTotal, categoryTotals);
        if (aiInsight) {
          insights.unshift(aiInsight); // Add AI insight at top
        }
      } catch (error) {
        console.error('Gemini AI error:', error);
      }
    }
    
    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    return insights.slice(0, 8); // Return top 8 insights
    
  } catch (error) {
    console.error('Generate AI insights error:', error);
    return [{
      type: 'error',
      icon: '❌',
      title: 'Unable to generate insights',
      message: 'Please try again later',
      priority: 'low',
      aiGenerated: false
    }];
  }
};

/**
 * Generate Smart Insight using Gemini AI
 */
async function generateGeminiInsight(expenses, thisMonthTotal, lastMonthTotal, categoryTotals) {
  if (!genAI) return null;
  
  try {
    // Use Gemini 2.0 Flash Experimental (tested and working!)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',  // ✅ Verified working with your API key
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });
    
    // Prepare expense data for AI
    const expenseSummary = {
      totalExpenses: expenses.length,
      thisMonthTotal,
      lastMonthTotal,
      percentChange: lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(1) : 0,
      topCategories: Object.entries(categoryTotals).slice(0, 3).map(([cat, amt]) => ({
        category: cat,
        amount: amt,
        percentage: ((amt / thisMonthTotal) * 100).toFixed(1)
      })),
      recentExpenses: expenses.slice(0, 10).map(e => ({
        description: e.description,
        amount: e.amount,
        category: e.category,
        date: new Date(e.date).toLocaleDateString()
      }))
    };
    
    const prompt = `You are a financial advisor AI analyzing an employee's expense patterns. 

Expense Data:
- Total expenses: ${expenseSummary.totalExpenses}
- This month spending: $${thisMonthTotal.toFixed(2)}
- Last month spending: $${lastMonthTotal.toFixed(2)}
- Change: ${expenseSummary.percentChange}%
- Top categories: ${expenseSummary.topCategories.map(c => `${c.category} ($${c.amount.toFixed(2)} - ${c.percentage}%)`).join(', ')}

Recent expenses: ${expenseSummary.recentExpenses.slice(0, 5).map(e => `${e.description} - $${e.amount} (${e.category})`).join(', ')}

Provide ONE concise, actionable insight (max 100 words) about their spending patterns. Focus on:
1. Spending trends or anomalies
2. Budget recommendations
3. Category optimization
4. Potential savings

Be conversational, helpful, and specific. Start with an emoji that matches the insight type.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    if (text && text.length > 20) {
      // Extract emoji from start of text
      const emojiMatch = text.match(/^([\u{1F300}-\u{1F9FF}])/u);
      const icon = emojiMatch ? emojiMatch[1] : '🤖';
      
      return {
        type: 'info',
        icon: icon,
        title: '🤖 AI Financial Advisor',
        message: text.replace(/^[\u{1F300}-\u{1F9FF}]\s*/u, ''),
        priority: 'high',
        aiGenerated: true
      };
    }
    
    return null;
  } catch (error) {
    console.error('Gemini insight generation error:', error);
    return null;
  }
}

/**
 * Generate AI Recommendations for Budget Optimization
 */
export const generateAIRecommendations = async (userId, companyId) => {
  if (!genAI) {
    return {
      recommendations: [],
      message: 'AI recommendations require Gemini API key'
    };
  }
  
  try {
    const expenses = await Expense.find({
      employee: userId,
      status: { $in: ['submitted', 'approved'] }
    }).sort({ date: -1 }).limit(50);
    
    if (expenses.length < 5) {
      return {
        recommendations: ['Submit more expenses to get personalized AI recommendations'],
        message: 'Need more data'
      };
    }
    
    // Use Gemini 2.0 Flash Experimental (tested and working!)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',  // ✅ Verified working with your API key
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });
    
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const categoryBreakdown = {};
    expenses.forEach(e => {
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount;
    });
    
    const prompt = `As a financial advisor, analyze this expense data and provide 3-5 specific, actionable budget recommendations:

Total spent: $${totalSpent.toFixed(2)} across ${expenses.length} expenses
Categories: ${Object.entries(categoryBreakdown).map(([cat, amt]) => `${cat}: $${amt.toFixed(2)}`).join(', ')}

Provide recommendations as a JSON array of strings. Each recommendation should be:
1. Specific and actionable
2. Include numbers/percentages
3. Focus on optimization or savings
4. Be under 80 characters

Format: ["recommendation 1", "recommendation 2", ...]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON array from response
    const jsonMatch = text.match(/\[(.*?)\]/s);
    if (jsonMatch) {
      const recommendations = JSON.parse(`[${jsonMatch[1]}]`);
      return {
        recommendations: recommendations.slice(0, 5),
        message: 'AI-powered recommendations',
        generatedAt: new Date()
      };
    }
    
    return {
      recommendations: [],
      message: 'Unable to generate recommendations'
    };
    
  } catch (error) {
    console.error('AI recommendations error:', error);
    
    // Return fallback recommendations when Gemini fails
    const fallbackRecommendations = [
      'Optimize frequent small purchases (coffee, snacks)',
      'Set weekly category limits to curb overspending',
      'Use expense tracking apps for better monitoring',
      'Negotiate vendor rates for recurring expenses',
      'Consider bulk purchasing for office supplies'
    ];
    
    return {
      recommendations: fallbackRecommendations,
      message: 'Fallback recommendations (AI not available)'
    };
  }
};

// Helper function
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

