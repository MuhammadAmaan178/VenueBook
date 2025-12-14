import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, X, Eye, Check, XCircle, CreditCard, ChevronDown } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { ownerService, adminService } from '../../../services/api';
import { CustomDropdown, DateRangeFilter } from '../common/DashboardFilters';
import PaymentDetailsModal from '../modals/PaymentDetailsModal';

const PaymentsPage = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Modal state
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [filters, setFilters] = useState({
        payment_status: "All Statuses",
        method: "All Methods",
        date_start: '',
        date_end: ''
    });

    const statusOptions = ["All Statuses", "completed", "pending", "failed", "refunded"];
    const methodOptions = ["All Methods", "Cash", "Bank Transfer", "Credit Card"];

    const { user } = useAuth ? useAuth() : {};

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
            if (filters.payment_status && filters.payment_status !== "All Statuses") filterParams.payment_status = filters.payment_status;
            if (filters.method && filters.method !== "All Methods") filterParams.method = filters.method;
            if (filters.date_start) filterParams.date_start = filters.date_start;
            if (filters.date_end) filterParams.date_end = filters.date_end;

            let data;
            if (user.role === 'admin') {
                data = await adminService.getPayments(filterParams, token);
            } else if (user.role === 'owner') {
                const ownerId = user.owner_id || user.user_id;
                data = await ownerService.getPayments(ownerId, filterParams, token);
            } else {
                setError('Invalid user role');
                setLoading(false);
                return;
            }

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

    const handleViewPayment = async (paymentId) => {
        try {
            const token = localStorage.getItem('token');
            // Check if user is owner to use ownerService, otherwise admin uses adminService (which has its own logic elsewhere if needed, but here we are in PaymentsPage which handles both)
            // But wait, the admin service call is already handled in AdminPaymentsPage separately. 
            // PaymentsPage seems to be shared or mostly for Owner? 
            // Line 47 checks user.role === 'admin'.
            // If admin, we should use adminService.getPaymentDetails.
            // If owner, we should use ownerService.getPaymentDetails.

            let data;
            if (user.role === 'admin') {
                data = await adminService.getPaymentDetails(paymentId, token);
            } else {
                const ownerId = user.owner_id || user.user_id;
                data = await ownerService.getPaymentDetails(ownerId, paymentId, token);
            }

            setSelectedPayment(data);
            setIsModalOpen(true);
        } catch (error) {
            console.error("Error fetching payment details:", error);
            alert("Failed to load payment details");
        }
    };

    const handleUpdateStatus = async (paymentId, newStatus) => {
        if (!window.confirm(`Are you sure you want to mark this payment as ${newStatus}?`)) return;

        try {
            const token = localStorage.getItem('token');
            const ownerId = user.owner_id || user.user_id;

            await ownerService.updatePaymentStatus(ownerId, paymentId, newStatus, token);

            fetchPayments();
            alert(`Payment marked as ${newStatus} successfully`);
        } catch (error) {
            console.error('Error updating payment status:', error);
            alert('Failed to update payment status');
        }
    };

    const handleExport = () => {
        setShowExportMenu(false);
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

    const handleDateRangeChange = (start, end) => {
        setFilters(prev => ({ ...prev, date_start: start, date_end: end }));
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'bg-green-50 text-green-700 border-green-200';
            case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'failed': return 'bg-red-50 text-red-700 border-red-200';
            case 'refunded': return 'bg-blue-50 text-blue-700 border-blue-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
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
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Payments
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">
                        Track and manage your revenue and transactions
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all ${showFilters
                            ? "bg-blue-50 text-blue-600 border border-blue-100"
                            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                            }`}
                    >
                        <Filter size={18} />
                        <span>Filters</span>
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white hover:bg-black rounded-xl font-bold transition-all shadow-lg shadow-gray-200 hover:scale-[1.02]"
                        >
                            Export <ChevronDown size={16} />
                        </button>
                        {showExportMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <button
                                    onClick={handleExport}
                                    className="block w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700 font-medium"
                                >
                                    Export CSV
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            {showFilters && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-8 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-900 text-lg">Filters</h3>
                        <button
                            onClick={() => setShowFilters(false)}
                            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <CustomDropdown
                            icon={<Check className="w-5 h-5" />}
                            label="Status"
                            value={filters.payment_status}
                            options={statusOptions}
                            onChange={(value) => handleFilterChange("payment_status", value)}
                        />
                        <CustomDropdown
                            icon={<CreditCard className="w-5 h-5" />}
                            label="Method"
                            value={filters.method}
                            options={methodOptions}
                            onChange={(value) => handleFilterChange("method", value)}
                        />
                        <DateRangeFilter
                            startDate={filters.date_start}
                            endDate={filters.date_end}
                            onDateChange={handleDateRangeChange}
                        />

                        <div className="flex items-end justify-end h-full">
                            <button
                                onClick={() => setFilters({
                                    payment_status: "All Statuses",
                                    method: "All Methods",
                                    date_start: '',
                                    date_end: ''
                                })}
                                className="h-14 mb-0.5 w-full bg-white border border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 rounded-2xl font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                            >
                                <X size={18} /> Reset
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payments Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Payment ID</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Booking ID</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Venue</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Method</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">Loading payments...</td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-red-500">{error}</td>
                                </tr>
                            ) : payments.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                        No payments found.
                                    </td>
                                </tr>
                            ) : (
                                payments.map((payment) => (
                                    <tr key={payment.payment_id} className="hover:bg-blue-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                            #{payment.payment_id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            #{payment.booking_id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            {payment.venue_name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                            Rs. {payment.amount?.toLocaleString() || '0'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                            {payment.method || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(payment.payment_status)}`}>
                                                {payment.payment_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(payment.payment_date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {payment.payment_status === 'pending' && user.role === 'owner' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleUpdateStatus(payment.payment_id, 'completed')}
                                                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 hover:scale-105 transition-all shadow-sm"
                                                            title="Mark as Completed"
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(payment.payment_id, 'failed')}
                                                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 hover:scale-105 transition-all shadow-sm"
                                                            title="Mark as Failed"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => handleViewPayment(payment.payment_id)}
                                                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 hover:scale-105 transition-all shadow-sm"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Details Modal */}
            <PaymentDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                payment={selectedPayment}
            />
        </div>
    );
};

export default PaymentsPage;