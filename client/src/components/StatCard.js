import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color = 'primary', change, changeType }) => {
  const colorClasses = {
    primary: 'text-primary-600 bg-primary-100',
    success: 'text-success-600 bg-success-100',
    warning: 'text-warning-600 bg-warning-100',
    danger: 'text-danger-600 bg-danger-100',
  };

  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <div className="flex items-center">
          <div className={`flex-shrink-0 p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="ml-4 flex-1">
            <p className="stat-card-label">{title}</p>
            <p className="stat-card-value">{value}</p>
          </div>
        </div>
        {change !== undefined && (
          <div className="mt-4">
            <div className={`flex items-center text-sm ${changeType === 'positive' ? 'stat-card-change-positive' : 'stat-card-change-negative'}`}>
              {changeType === 'positive' ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              <span>{Math.abs(change)}%</span>
            </div>
            <p className="text-xs text-gray-500">from last month</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard; 