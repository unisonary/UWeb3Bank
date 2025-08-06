import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { cardsAPI } from '../services/api';
import { Plus, Search, Filter, Eye, Edit, DollarSign } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatCardNumber } from '../utils/formatters';

const Cards = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: cardsData, isLoading, error } = useQuery(
    ['cards', currentPage, searchTerm, statusFilter],
    () => cardsAPI.getAll({
      page: currentPage,
      limit: 20,
      search: searchTerm,
      status: statusFilter
    })
  );

  const cards = cardsData?.data?.data || [];
  const pagination = cardsData?.data?.pagination || {};

  const getStatusBadge = (status) => {
    const statusClasses = {
      active: 'badge-success',
      inactive: 'badge-secondary',
      blocked: 'badge-danger',
      expired: 'badge-warning'
    };
    return `badge ${statusClasses[status] || 'badge-secondary'}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-danger-600">Error loading cards: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Virtual Cards</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your virtual cards and view their status
          </p>
        </div>
        <Link
          to="/cards/new"
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Card
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search cards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blocked">Blocked</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setCurrentPage(1);
                }}
                className="btn btn-secondary w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cards table */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">
            Cards ({pagination.total || 0})
          </h3>
        </div>
        <div className="card-body">
          {cards.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No cards found</p>
              <p className="text-sm text-gray-400 mt-1">
                {searchTerm || statusFilter ? 'Try adjusting your filters' : 'Create your first card to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Cardholder</th>
                    <th className="table-header-cell">Card Number</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell">Balance</th>
                    <th className="table-header-cell">Currency</th>
                    <th className="table-header-cell">Created</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {cards.map((card) => (
                    <tr key={card._id} className="table-row">
                      <td className="table-cell">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {card.cardholderName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {card.issuedBy?.email || 'Unknown'}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="font-mono text-sm">
                          {formatCardNumber(card.cardNumber)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={getStatusBadge(card.status)}>
                          {card.status}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="font-medium">
                          {formatCurrency(card.balance, card.currency)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="text-sm text-gray-500">
                          {card.currency}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="text-sm text-gray-500">
                          {new Date(card.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/cards/${card.cardId}`}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/cards/${card.cardId}/edit`}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Edit Card"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/cards/${card.cardId}/fund`}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Fund Card"
                          >
                            <DollarSign className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="btn btn-secondary"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                  disabled={currentPage === pagination.pages}
                  className="btn btn-secondary"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cards; 