import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { settingsAPI } from '../services/api';
import { Save, RefreshCw, DollarSign, Settings as SettingsIcon } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profit-margins');
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const { data: profitMargins, isLoading: marginsLoading } = useQuery(
    'profit-margins',
    settingsAPI.getProfitMargins
  );

  const { data: allSettings, isLoading: settingsLoading } = useQuery(
    'all-settings',
    () => settingsAPI.getAll()
  );

  const updateProfitMarginsMutation = useMutation(
    settingsAPI.updateProfitMargins,
    {
      onSuccess: () => {
        toast.success('Profit margin settings updated successfully!');
        queryClient.invalidateQueries('profit-margins');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to update settings');
      },
    }
  );

  const initializeSettingsMutation = useMutation(
    settingsAPI.initialize,
    {
      onSuccess: () => {
        toast.success('Default settings initialized successfully!');
        queryClient.invalidateQueries('all-settings');
        queryClient.invalidateQueries('profit-margins');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to initialize settings');
      },
    }
  );

  const onSubmitProfitMargins = (data) => {
    updateProfitMarginsMutation.mutate(data);
  };

  const handleInitializeSettings = () => {
    if (window.confirm('This will reset all settings to default values. Are you sure?')) {
      initializeSettingsMutation.mutate();
    }
  };

  if (marginsLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const margins = profitMargins?.data || {};

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your system configuration and profit margin settings.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profit-margins')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profit-margins'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <DollarSign className="inline h-4 w-4 mr-2" />
            Profit Margins
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'system'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <SettingsIcon className="inline h-4 w-4 mr-2" />
            System Settings
          </button>
        </nav>
      </div>

      {/* Profit Margins Tab */}
      {activeTab === 'profit-margins' && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Profit Margin Configuration</h3>
              <p className="mt-1 text-sm text-gray-500">
                Set your profit margins for different transaction types. These percentages will be applied to all transactions.
              </p>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit(onSubmitProfitMargins)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Default Profit Margin (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      defaultValue={margins.default_profit_margin || 2.5}
                      className="input mt-1"
                      {...register('default_profit_margin', {
                        required: 'Default profit margin is required',
                        min: { value: 0, message: 'Must be at least 0%' },
                        max: { value: 100, message: 'Must be at most 100%' },
                      })}
                    />
                    {errors.default_profit_margin && (
                      <p className="mt-1 text-sm text-danger-600">{errors.default_profit_margin.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Minimum Profit Margin (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      defaultValue={margins.min_profit_margin || 0.5}
                      className="input mt-1"
                      {...register('min_profit_margin', {
                        required: 'Minimum profit margin is required',
                        min: { value: 0, message: 'Must be at least 0%' },
                        max: { value: 100, message: 'Must be at most 100%' },
                      })}
                    />
                    {errors.min_profit_margin && (
                      <p className="mt-1 text-sm text-danger-600">{errors.min_profit_margin.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Maximum Profit Margin (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      defaultValue={margins.max_profit_margin || 10.0}
                      className="input mt-1"
                      {...register('max_profit_margin', {
                        required: 'Maximum profit margin is required',
                        min: { value: 0, message: 'Must be at least 0%' },
                        max: { value: 100, message: 'Must be at most 100%' },
                      })}
                    />
                    {errors.max_profit_margin && (
                      <p className="mt-1 text-sm text-danger-600">{errors.max_profit_margin.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Funding Profit Margin (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      defaultValue={margins.funding_profit_margin || 2.5}
                      className="input mt-1"
                      {...register('funding_profit_margin', {
                        required: 'Funding profit margin is required',
                        min: { value: 0, message: 'Must be at least 0%' },
                        max: { value: 100, message: 'Must be at most 100%' },
                      })}
                    />
                    {errors.funding_profit_margin && (
                      <p className="mt-1 text-sm text-danger-600">{errors.funding_profit_margin.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Transaction Profit Margin (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      defaultValue={margins.transaction_profit_margin || 1.5}
                      className="input mt-1"
                      {...register('transaction_profit_margin', {
                        required: 'Transaction profit margin is required',
                        min: { value: 0, message: 'Must be at least 0%' },
                        max: { value: 100, message: 'Must be at most 100%' },
                      })}
                    />
                    {errors.transaction_profit_margin && (
                      <p className="mt-1 text-sm text-danger-600">{errors.transaction_profit_margin.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => reset()}
                    className="btn btn-secondary"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={updateProfitMarginsMutation.isLoading}
                    className="btn btn-primary"
                  >
                    {updateProfitMarginsMutation.isLoading ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Current Settings Display */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Current Profit Margin Settings</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(margins).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-4">
                    <dt className="text-sm font-medium text-gray-500 capitalize">
                      {key.replace(/_/g, ' ')}
                    </dt>
                    <dd className="mt-1 text-lg font-semibold text-gray-900">
                      {typeof value === 'number' ? `${value}%` : value}
                    </dd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Settings Tab */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">System Configuration</h3>
              <p className="mt-1 text-sm text-gray-500">
                Manage system-wide settings and configurations.
              </p>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Initialize Default Settings</h4>
                    <p className="text-sm text-gray-500">
                      Reset all settings to their default values. This action cannot be undone.
                    </p>
                  </div>
                  <button
                    onClick={handleInitializeSettings}
                    disabled={initializeSettingsMutation.isLoading}
                    className="btn btn-secondary"
                  >
                    {initializeSettingsMutation.isLoading ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Initialize
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* All Settings Display */}
          {allSettings?.data && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">All System Settings</h3>
              </div>
              <div className="card-body">
                <div className="space-y-6">
                  {Object.entries(allSettings.data).map(([category, settings]) => (
                    <div key={category}>
                      <h4 className="text-sm font-medium text-gray-900 capitalize mb-3">
                        {category.replace(/_/g, ' ')}
                      </h4>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {settings.map((setting) => (
                          <div key={setting.key} className="bg-gray-50 rounded-lg p-4">
                            <dt className="text-sm font-medium text-gray-500">
                              {setting.key.replace(/_/g, ' ')}
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {typeof setting.value === 'boolean' 
                                ? (setting.value ? 'Enabled' : 'Disabled')
                                : setting.value
                              }
                            </dd>
                            {setting.description && (
                              <p className="mt-1 text-xs text-gray-500">
                                {setting.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Settings; 