import React from 'react';
import { formatCurrency, formatRelativeTime } from '../utils/formatters';
import { CreditCard, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

const RecentActivity = ({ transactions }) => {
  const getTransactionIcon = (type) => {
    switch (type) {
      case 'funding':
        return <DollarSign className="h-4 w-4 text-success-600" />;
      case 'purchase':
        return <CreditCard className="h-4 w-4 text-primary-600" />;
      case 'refund':
        return <TrendingDown className="h-4 w-4 text-warning-600" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-success-600 bg-success-100';
      case 'pending':
        return 'text-warning-600 bg-warning-100';
      case 'failed':
        return 'text-danger-600 bg-danger-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <div key={transaction._id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex-shrink-0">
            {getTransactionIcon(transaction.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {transaction.description}
                </p>
                <p className="text-xs text-gray-500">
                  {transaction.cardId?.cardholderName || 'Unknown Card'} • {formatRelativeTime(transaction.createdAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(transaction.amount, transaction.currency)}
                </p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                  {transaction.status}
                </span>
              </div>
            </div>
            {transaction.profitAmount > 0 && (
              <div className="mt-1">
                <p className="text-xs text-success-600">
                  Profit: {formatCurrency(transaction.profitAmount, transaction.currency)} ({transaction.profitMargin}%)
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentActivity; 