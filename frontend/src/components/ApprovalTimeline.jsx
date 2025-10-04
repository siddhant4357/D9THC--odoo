import { FiClock, FiCheck, FiX, FiSend, FiFileText } from 'react-icons/fi';

const ApprovalTimeline = ({ expense }) => {
  // Format duration from milliseconds to human-readable
  const formatDuration = (ms) => {
    if (!ms) return null;
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    }
    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m`;
    }
    return `${seconds}s`;
  };

  // Calculate timeline
  const getTimeline = () => {
    const timeline = [];
    
    // Created
    timeline.push({
      stage: 'Draft Created',
      icon: FiFileText,
      timestamp: expense.createdAt,
      color: 'gray',
      completed: true
    });
    
    // Submitted
    if (expense.submittedAt) {
      const duration = new Date(expense.submittedAt) - new Date(expense.createdAt);
      timeline.push({
        stage: 'Submitted for Approval',
        icon: FiSend,
        timestamp: expense.submittedAt,
        duration: formatDuration(duration),
        color: 'blue',
        completed: true
      });
    }
    
    // Approval history
    let previousTime = expense.submittedAt ? new Date(expense.submittedAt) : new Date(expense.createdAt);
    
    if (expense.approvalHistory && expense.approvalHistory.length > 0) {
      expense.approvalHistory.forEach((approval, index) => {
        const approvalTime = new Date(approval.date);
        const duration = approvalTime - previousTime;
        
        timeline.push({
          stage: approval.action === 'approved' ? `Approved by ${approval.approver?.name}` : `Rejected by ${approval.approver?.name}`,
          icon: approval.action === 'approved' ? FiCheck : FiX,
          timestamp: approval.date,
          duration: formatDuration(duration),
          color: approval.action === 'approved' ? 'green' : 'red',
          comments: approval.comments,
          completed: true,
          action: approval.action
        });
        
        previousTime = approvalTime;
      });
    }
    
    // Current pending approval
    if (expense.status === 'submitted' && expense.currentApprover) {
      const pendingTime = new Date() - previousTime;
      timeline.push({
        stage: `Waiting for ${expense.currentApprover?.name || 'Approver'}`,
        icon: FiClock,
        timestamp: null,
        duration: formatDuration(pendingTime),
        color: 'yellow',
        completed: false,
        isPending: true
      });
    }
    
    // Final approval
    if (expense.approvedAt) {
      const totalTime = new Date(expense.approvedAt) - new Date(expense.submittedAt);
      timeline.push({
        stage: 'Fully Approved',
        icon: FiCheck,
        timestamp: expense.approvedAt,
        duration: null,
        color: 'green',
        completed: true,
        isFinal: true,
        totalTime: formatDuration(totalTime)
      });
    }
    
    return timeline;
  };

  const timeline = getTimeline();

  const getColorClasses = (color, completed) => {
    const colors = {
      gray: completed ? 'bg-gray-500 border-gray-500' : 'bg-gray-200 border-gray-300',
      blue: completed ? 'bg-blue-500 border-blue-500' : 'bg-blue-200 border-blue-300',
      green: completed ? 'bg-green-500 border-green-500' : 'bg-green-200 border-green-300',
      red: completed ? 'bg-red-500 border-red-500' : 'bg-red-200 border-red-300',
      yellow: completed ? 'bg-yellow-500 border-yellow-500' : 'bg-yellow-200 border-yellow-300',
    };
    return colors[color] || colors.gray;
  };

  const getTextColorClasses = (color) => {
    const colors = {
      gray: 'text-gray-700',
      blue: 'text-blue-700',
      green: 'text-green-700',
      red: 'text-red-700',
      yellow: 'text-yellow-700',
    };
    return colors[color] || colors.gray;
  };

  const getBgColorClasses = (color) => {
    const colors = {
      gray: 'bg-gray-50 border-gray-200',
      blue: 'bg-blue-50 border-blue-200',
      green: 'bg-green-50 border-green-200',
      red: 'bg-red-50 border-red-200',
      yellow: 'bg-yellow-50 border-yellow-200',
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-purple-100 p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg md:text-xl font-bold text-gray-900 flex items-center">
          <FiClock className="mr-2 text-purple-600" />
          Approval Timeline
        </h3>
        {expense.status === 'approved' && expense.submittedAt && expense.approvedAt && (
          <div className="text-right">
            <p className="text-xs text-gray-500">Total Time</p>
            <p className="text-lg font-bold text-green-600">
              {formatDuration(new Date(expense.approvedAt) - new Date(expense.submittedAt))}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {timeline.map((item, index) => (
          <div key={index} className="flex items-start space-x-3 md:space-x-4">
            {/* Timeline line and icon */}
            <div className="flex flex-col items-center">
              {/* Icon */}
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${getColorClasses(item.color, item.completed)} ${item.completed ? 'text-white' : getTextColorClasses(item.color)}`}>
                <item.icon size={16} className="md:w-5 md:h-5" />
              </div>
              
              {/* Vertical line */}
              {index < timeline.length - 1 && (
                <div className={`w-0.5 h-12 md:h-16 ${item.completed ? 'bg-purple-300' : 'bg-gray-200'}`} />
              )}
            </div>

            {/* Content */}
            <div className={`flex-1 pb-4 md:pb-6 border rounded-lg p-3 md:p-4 ${getBgColorClasses(item.color)} ${item.isPending ? 'animate-pulse' : ''}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className={`font-semibold text-sm md:text-base ${getTextColorClasses(item.color)}`}>
                    {item.stage}
                    {item.isPending && (
                      <span className="ml-2 inline-block w-2 h-2 bg-yellow-500 rounded-full animate-ping" />
                    )}
                  </p>
                  {item.timestamp && (
                    <p className="text-xs md:text-sm text-gray-500 mt-1">
                      {new Date(item.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
                
                {item.duration && (
                  <div className="flex items-center space-x-1 text-xs md:text-sm font-medium text-gray-600">
                    <FiClock size={14} />
                    <span>{item.duration}</span>
                  </div>
                )}
              </div>
              
              {item.comments && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs md:text-sm text-gray-600 italic">"{item.comments}"</p>
                </div>
              )}
              
              {item.isFinal && item.totalTime && (
                <div className="mt-2 pt-2 border-t border-green-200">
                  <p className="text-xs md:text-sm font-semibold text-green-700">
                    ✓ Approval completed in {item.totalTime}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApprovalTimeline;

