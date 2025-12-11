import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, X, Eye, Check } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { ownerService, adminService } from '../../../services/api';

const PaymentsPage = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [filters, setFilters] = useState({
        payment_status: '',
        method: '',
        date_start: '',
        date_end: ''
    });

    const { user } = useAuth ? useAuth() : {};

    const handleUpdateStatus = async (paymentId, newStatus) => {
        if (!window.confirm(`Are you sure you want to mark this payment as ${newStatus}?`)) return;

        try {
            const token = localStorage.getItem('token');
            const ownerId = user.owner_id || user.user_id;

            await ownerService.updatePaymentStatus(ownerId, paymentId, newStatus, token);

            // Refresh payments list
            fetchPayments();
            alert(`Payment marked as ${newStatus} successfully`);
        } catch (error) {
            console.error('Error updating payment status:', error);
            alert('Failed to update payment status');
        }
    };

    const fetchPayments = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');

            if (!token || !user) {
                console.error('No authentication token or user found');
                setError('Authentication required');
                setLoading(false);
                return;
            }

            // Build filter params
            const filterParams = {};
            if (filters.payment_status) filterParams.payment_status = filters.payment_status;
            if (filters.method) filterParams.method = filters.method;
            if (filters.date_start) filterParams.date_start = filters.date_start;
            if (filters.date_end) filterParams.date_end = filters.date_end;

            console.log('Fetching payments with filters:', filterParams);

            let data;
            if (user.role === 'admin') {
                data = await adminService.getPayments(filterParams, token);
            } else if (user.role === 'owner') {
                const ownerId = user.owner_id || user.user_id;
                console.log('Fetching for owner:', ownerId);
                data = await ownerService.getPayments(ownerId, filterParams, token);
            } else {
                console.error('Invalid user role:', user.role);
                setError('Invalid user role');
                setLoading(false);
                return;
            }

            console.log('Payments data received:', data);
            setPayments(data.payments || []);
        } catch (error) {
            console.error("Error fetching payments:", error);
            setError(error.message || 'Failed to load payments');
            setPayments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchPayments();
        }
    }, [user, filters]);

    const handleExport = () => {
        if (!payments.length) return alert("No payments to export");

        const headers = ['Payment ID', 'Transaction ID', 'Booking ID', 'Venue', 'Method', 'Amount', 'Status', 'Date'];

        const escapeCSV = (value) => {
            if (value === null || value === undefined) return '';
            const str = String(value);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const csvContent = [
            headers.join(','),
            ...payments.map(p => [
                p.payment_id || '',
                escapeCSV(p.trx_id || ''),
                p.booking_id || '',
                escapeCSV(p.venue_name || ''),
                escapeCSV(p.method || ''),
                p.amount || 0,
                p.payment_status || '',
                p.payment_date || ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `payments_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            payment_status: '',
            method: '',
            date_start: '',
            date_end: ''
        });
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'failed': return 'bg-red-100 text-red-800';
            case 'refunded': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Payments</h1>
                    <p className="text-gray-500">Track your venue transactions</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
                    >
                        <Filter size={20} /> Filter
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50"
                    >
                        <Download size={20} /> Export
                    </button>
                </div>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
                <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Filter size={20} />
                            Advanced Filters
                        </h3>
                        <button
                            onClick={() => setShowFilters(false)}
                            className="p-1 hover:bg-gray-100 rounded"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Payment Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Payment Status
                            </label>
                            <select
                                value={filters.payment_status}
                                onChange={(e) => handleFilterChange('payment_status', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="">All Statuses</option>
                                <option value="completed">Completed</option>
                                <option value="pending">Pending</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>

                        {/* Payment Method Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Payment Method
                            </label>
                            <select
                                value={filters.method}
                                onChange={(e) => handleFilterChange('method', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="">All Methods</option>
                                <option value="Cash">Cash</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                            </select>
                        </div>

                        {/* Date Start */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                From Date
                            </label>
                            <input
                                type="date"
                                value={filters.date_start}
                                onChange={(e) => handleFilterChange('date_start', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>

                        {/* Date End */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                To Date
                            </label>
                            <input
                                type="date"
                                value={filters.date_end}
                                onChange={(e) => handleFilterChange('date_end', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            )}

            {/* Payments Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venue</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-12 text-center text-gray-500">Loading payments...</td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-12 text-center text-red-600">
                                        Error: {error}
                                    </td>
                                </tr>
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                                        No payments found. {filters.payment_status || filters.method || filters.date_start ? 'Try adjusting your filters.' : ''}
                                    </td>
                                </tr>
                            ) : (
                                payments.map((payment) => (
                                    <tr key={payment.payment_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            #{payment.payment_id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {payment.trx_id || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            #{payment.booking_id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {payment.venue_name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                            {payment.method || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            Rs. {payment.amount?.toLocaleString() || '0'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(payment.payment_date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment.payment_status)}`}>
                                                {payment.payment_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {payment.payment_status === 'pending' && user.role === 'owner' && (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleUpdateStatus(payment.payment_id, 'completed')}
                                                        className="text-green-600 hover:text-green-900 bg-green-50 p-1 rounded transition-colors"
                                                        title="Mark as Completed"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(payment.payment_id, 'failed')}
                                                        className="text-red-600 hover:text-red-900 bg-red-50 p-1 rounded transition-colors"
                                                        title="Mark as Failed"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PaymentsPage;