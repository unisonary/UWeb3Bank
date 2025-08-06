import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/formatters';
import { AlertTriangle, Clock, CreditCard, DollarSign } from 'lucide-react';

const QuickActions = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const cardsNeedingAttention = data?.cardsNeedingAttention || [];
  const failedTransactions = data?.failedTransactions || [];
  const pendingTransactions = data?.pendingTransactions || [];

  return (
    <div className="space-y-4">
      {/* Cards Needing Attention */}
      {cardsNeedingAttention.length > 0 && (
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <AlertTriangle className="h-5 w-5 text-warning-600 mr-2" />
            <h4 className="text-sm font-medium text-warning-800">Cards Needing Attention</h4>
          </div>
          <div className="space-y-2">
            {cardsNeedingAttention.slice(0, 3).map((card) => (
              <div key={card._id} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 text-warning-600 mr-2" />
                  <span className="text-warning-700">{card.cardholderName}</span>
                </div>
                <span className="text-warning-600 font-medium">
                  {card.status === 'blocked' ? 'Blocked' : 
                   card.balance < 10 ? 'Low Balance' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
          {cardsNeedingAttention.length > 3 && (
            <p className="text-xs text-warning-600 mt-2">
              +{cardsNeedingAttention.length - 3} more cards need attention
            </p>
          )}
        </div>
      )}

      {/* Failed Transactions */}
      {failedTransactions.length > 0 && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <AlertTriangle className="h-5 w-5 text-danger-600 mr-2" />
            <h4 className="text-sm font-medium text-danger-800">Failed Transactions</h4>
          </div>
          <div className="space-y-2">
            {failedTransactions.slice(0, 3).map((transaction) => (
              <div key={transaction._id} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-danger-600 mr-2" />
                  <span className="text-danger-700">{transaction.description}</span>
                </div>
                <span className="text-danger-600 font-medium">
                  {formatCurrency(transaction.amount, transaction.currency)}
                </span>
              </div>
            ))}
          </div>
          {failedTransactions.length > 3 && (
            <p className="text-xs text-danger-600 mt-2">
              +{failedTransactions.length - 3} more failed transactions
            </p>
          )}
        </div>
      )}

      {/* Pending Transactions */}
      {pendingTransactions.length > 0 && (
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Clock className="h-5 w-5 text-warning-600 mr-2" />
            <h4 className="text-sm font-medium text-warning-800">Pending Transactions</h4>
          </div>
          <div className="space-y-2">
            {pendingTransactions.slice(0, 3).map((transaction) => (
              <div key={transaction._id} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-warning-600 mr-2" />
                  <span className="text-warning-700">{transaction.description}</span>
                </div>
                <span className="text-warning-600 font-medium">
                  {formatCurrency(transaction.amount, transaction.currency)}
                </span>
              </div>
            ))}
          </div>
          {pendingTransactions.length > 3 && (
            <p className="text-xs text-warning-600 mt-2">
              +{pendingTransactions.length - 3} more pending transactions
            </p>
          )}
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="space-y-2">
        <Link
          to="/cards"
          className="block w-full text-center bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          Create New Card
        </Link>
        <Link
          to="/analytics"
          className="block w-full text-center bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          View Analytics
        </Link>
        <Link
          to="/settings"
          className="block w-full text-center bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          Manage Settings
        </Link>
      </div>

      {/* No Alerts Message */}
      {cardsNeedingAttention.length === 0 && 
       failedTransactions.length === 0 && 
       pendingTransactions.length === 0 && (
        <div className="text-center py-8">
          <div className="h-12 w-12 mx-auto bg-success-100 rounded-full flex items-center justify-center mb-3">
            <AlertTriangle className="h-6 w-6 text-success-600" />
          </div>
          <p className="text-sm text-gray-500">All systems operational</p>
          <p className="text-xs text-gray-400 mt-1">No immediate attention required</p>
        </div>
      )}
    </div>
  );
};

export default QuickActions; 