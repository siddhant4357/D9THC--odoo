import { useState, useEffect } from 'react';
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX, FiZap } from 'react-icons/fi';
import axios from 'axios';

const SmartInsights = () => {
  const [insights, setInsights] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(new Set());
  const [showRecommendations, setShowRecommendations] = useState(false);

  useEffect(() => {
    fetchInsights();
    fetchRecommendations();
  }, []);

  const fetchInsights = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/analytics/insights', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInsights(response.data.insights || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching insights:', error);
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/analytics/recommendations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecommendations(response.data.recommendations || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const dismissInsight = (index) => {
    setDismissed(prev => new Set([...prev, index]));
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'success': return <FiCheckCircle className="text-green-600 text-2xl" />;
      case 'warning': return <FiAlertCircle className="text-orange-600 text-2xl" />;
      case 'error': return <FiAlertCircle className="text-red-600 text-2xl" />;
      default: return <FiInfo className="text-blue-600 text-2xl" />;
    }
  };

  const getInsightBgColor = (type) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-orange-50 border-orange-200';
      case 'error': return 'bg-red-50 border-red-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-800';
      case 'warning': return 'text-orange-800';
      case 'error': return 'text-red-800';
      default: return 'text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const visibleInsights = insights.filter((_, index) => !dismissed.has(index));

  if (visibleInsights.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <span className="mr-2">🧠</span>
          AI-Powered Smart Insights
        </h2>
        {recommendations.length > 0 && (
          <button
            onClick={() => setShowRecommendations(!showRecommendations)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center"
          >
            <FiZap className="mr-2" />
            {showRecommendations ? 'Hide' : 'Show'} AI Recommendations
          </button>
        )}
      </div>

      {/* AI Recommendations Panel */}
      {showRecommendations && recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-purple-900 flex items-center mb-4">
            <FiZap className="mr-2 text-purple-600" />
            AI Budget Recommendations
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start space-x-3 bg-white p-3 rounded-lg shadow-sm">
                <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </div>
                <p className="text-sm text-gray-800 flex-1">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        {visibleInsights.map((insight, index) => (
          <div
            key={index}
            className={`${getInsightBgColor(insight.type)} border rounded-xl p-4 transition-all duration-300 hover:shadow-md ${
              insight.aiGenerated ? 'ring-2 ring-purple-400 ring-offset-2' : ''
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getInsightIcon(insight.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`font-bold ${getTextColor(insight.type)} flex items-center flex-wrap`}>
                      <span className="mr-2 text-2xl">{insight.icon}</span>
                      {insight.title}
                      {insight.aiGenerated && (
                        <span className="ml-2 px-2 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold rounded-full flex items-center">
                          <FiZap size={10} className="mr-1" />
                          AI
                        </span>
                      )}
                    </p>
                    <p className={`mt-1 text-sm ${getTextColor(insight.type)}`}>
                      {insight.message}
                    </p>
                    {insight.value && (
                      <div className={`mt-2 inline-block px-3 py-1 rounded-full font-bold ${
                        insight.type === 'success' ? 'bg-green-200 text-green-900' :
                        insight.type === 'warning' ? 'bg-orange-200 text-orange-900' :
                        insight.type === 'error' ? 'bg-red-200 text-red-900' :
                        'bg-blue-200 text-blue-900'
                      }`}>
                        {insight.value}
                      </div>
                    )}
                    {insight.details && (
                      <div className="mt-3 space-y-1">
                        {insight.details.map((detail, idx) => (
                          <div key={idx} className="text-xs bg-white bg-opacity-50 rounded p-2">
                            <span className="font-semibold">{detail.description}</span>
                            {' - '}
                            <span className="text-purple-600">${detail.amount}</span>
                            {' '}
                            <span className="text-gray-600">({detail.category})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => dismissInsight(index)}
                    className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FiX />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SmartInsights;

