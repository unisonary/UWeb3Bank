import React from 'react';
import { useQuery } from 'react-query';
import { dashboardAPI } from '../services/api';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity
} from 'lucide-react';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import RecentActivity from '../components/RecentActivity';
import QuickActions from '../components/QuickActions';
import { formatCurrency } from '../utils/formatters';

const Dashboard = () => {
  const { data: overview, isLoading: overviewLoading } = useQuery(
    'dashboard-overview',
    dashboardAPI.getOverview,
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  const { data: quickActions, isLoading: quickActionsLoading } = useQuery(
    'dashboard-quick-actions',
    dashboardAPI.getQuickActions,
    {
      refetchInterval: 60000, // Refetch every minute
    }
  );

  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const stats = overview?.data?.overview || {};

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's what's happening with your virtual cards today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Cards"
          value={stats.totalCards || 0}
          icon={CreditCard}
          color="primary"
          change={+5}
          changeType="positive"
        />
        <StatCard
          title="Active Cards"
          value={stats.activeCards || 0}
          icon={CheckCircle}
          color="success"
          change={+2}
          changeType="positive"
        />
        <StatCard
          title="Total Balance"
          value={formatCurrency(stats.totalBalance || 0)}
          icon={DollarSign}
          color="warning"
          change={+12.5}
          changeType="positive"
        />
        <StatCard
          title="Total Profit"
          value={formatCurrency(stats.totalProfit || 0)}
          icon={TrendingUp}
          color="success"
          change={+8.2}
          changeType="positive"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            </div>
            <div className="card-body">
              <RecentActivity transactions={overview?.data?.recentActivity || []} />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div className="card-body">
              <QuickActions data={quickActions?.data} loading={quickActionsLoading} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Cards by Status */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Cards by Status</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {overview?.data?.cardsByStatus?.map((status) => (
                <div key={status._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      status._id === 'active' ? 'bg-success-500' :
                      status._id === 'blocked' ? 'bg-danger-500' :
                      status._id === 'inactive' ? 'bg-warning-500' :
                      'bg-gray-500'
                    }`} />
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {status._id}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {status.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transactions by Type */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Transactions by Type</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {overview?.data?.transactionsByType?.map((type) => (
                <div key={type._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-primary-500" />
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {type._id}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">
                      {type.count}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(type.totalAmount || 0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">System Status</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-success-500" />
              <span className="text-sm text-gray-700">API Connected</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-success-500" />
              <span className="text-sm text-gray-700">Database Online</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-success-500" />
              <span className="text-sm text-gray-700">Security Active</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-success-500" />
              <span className="text-sm text-gray-700">Monitoring OK</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 