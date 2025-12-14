import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Download, X, Eye, DollarSign, CreditCard, Calendar, SlidersHorizontal, ChevronLeft, ChevronRight, ChevronDown, Check, Activity, Wallet } from 'lucide-react';
import { adminService } from '../../../services/api';
import PaymentDetailsModal from '../modals/PaymentDetailsModal';
import { CustomDropdown, DateRangeFilter } from './AdminFilters';

const AdminPaymentsPage = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total_amount: 0, total_payments: 0 });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Modal state
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSearch, setActiveSearch] = useState('');

    const statusOptions = ["All Statuses", "completed", "pending", "failed"];
    const methodOptions = ["All Methods", "bank-transfer", "cash"];

    const [filters, setFilters] = useState({
        payment_status: "All Statuses",
        method: "All Methods",
        date_from: '',
        date_to: ''
    });

    const [showFilters, setShowFilters] = useState(false);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const filterParams = {
                page: page,
                per_page: 15
            };

            if (activeSearch) filterParams.search = activeSearch;
            if (filters.payment_status && filters.payment_status !== "All Statuses") filterParams.payment_status = filters.payment_status;
            if (filters.method && filters.method !== "All Methods") filterParams.method = filters.method;
            if (filters.date_from) filterParams.date_from = filters.date_from;
            if (filters.date_to) filterParams.date_to = filters.date_to;

            const data = await adminService.getPayments(filterParams, token);
            setPayments(data.payments || []);
            setTotalPages(data.total_pages || 1);
            setStats({
                total_amount: data.total_amount || 0,
                total_payments: data.total_payments || 0
            });
        } catch (error) {
            console.error("Error fetching payments:", error);
            setPayments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, [activeSearch, filters, page]);

    const handleSearch = () => {
        setActiveSearch(searchQuery);
        setPage(1);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1);
    };

    const handleDateRangeChange = (start, end) => {
        setFilters(prev => ({ ...prev, date_from: start, date_to: end }));
        setPage(1);
    };

    const handleExport = async (type) => {
        setShowExportMenu(false);
        let paymentsToExport = [];

        if (type === 'current') {
            paymentsToExport = payments;
            if (!paymentsToExport.length) return alert("No payments to export on current page");
        } else {
            try {
                const token = localStorage.getItem('token');
                const filterParams = { page: 1, per_page: 100000 };

                if (activeSearch) filterParams.search = activeSearch;
                if (filters.payment_status && filters.payment_status !== "All Statuses") filterParams.payment_status = filters.payment_status;
                if (filters.method && filters.method !== "All Methods") filterParams.method = filters.method;
                if (filters.date_from) filterParams.date_from = filters.date_from;
                if (filters.date_to) filterParams.date_to = filters.date_to;

                const data = await adminService.getPayments(filterParams, token);
                paymentsToExport = data.payments || [];
                if (!paymentsToExport.length) return alert("No payments found to export");
            } catch (error) {
                console.error("Error fetching all payments:", error);
                return alert("Failed to fetch all payments");
            }
        }

        const headers = ['Payment ID', 'Booking ID', 'Amount', 'Method', 'Status', 'Venue', 'Owner', 'Customer', 'Date'];
        const csvContent = [
            headers.join(','),
            ...paymentsToExport.map(p => [
                p.payment_id,
                p.booking_id,
                p.amount,
                p.method,
                p.payment_status,
                `"${p.venue_name || ''}"`,
                `"${p.owner_name || ''}"`,
                `"${p.customer_name || ''}"`,
                p.payment_date
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `payments_${type}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleViewPayment = async (paymentId) => {
        try {
            const token = localStorage.getItem('token');
            const data = await adminService.getPaymentDetails(paymentId, token);
            setSelectedPayment(data);
            setIsModalOpen(true);
        } catch (error) {
            console.error("Error fetching payment details:", error);
            alert("Failed to load payment details");
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'bg-green-50 text-green-700 border-green-200';
            case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'failed': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header with Search/Export/Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Financial Overview
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">
                        Track revenue, transactions, and payment statuses
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all ${showFilters
                            ? "bg-red-50 text-red-600 border border-red-100"
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
                                    onClick={() => handleExport('current')}
                                    className="block w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700 font-medium"
                                >
                                    Current Page
                                </button>
                                <button
                                    onClick={() => handleExport('all')}
                                    className="block w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700 font-medium"
                                >
                                    All Payments
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-500 mb-1 uppercase tracking-wider">Total Revenue</p>
                        <p className="text-3xl font-extrabold text-gray-900">Rs. {stats.total_amount.toLocaleString()}</p>
                    </div>
                    <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center border border-green-100">
                        <DollarSign size={28} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-500 mb-1 uppercase tracking-wider">Total Transactions</p>
                        <p className="text-3xl font-extrabold text-gray-900">{stats.total_payments}</p>
                    </div>
                    <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center border border-red-100">
                        <CreditCard size={28} />
                    </div>
                </div>
            </div>

            {/* Filter Section (Conditional Render) */}
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

                    {/* Search Bar */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="flex-1 relative group/search">
                            <input
                                type="text"
                                placeholder="Search payments..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                className="w-full h-12 py-3 pl-12 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 bg-gray-50/50 hover:bg-white transition-all text-gray-900 font-medium placeholder-gray-400"
                            />
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover/search:text-red-500 transition-colors" />
                        </div>
                        <button
                            onClick={handleSearch}
                            className="h-12 bg-red-600 hover:bg-red-700 text-white px-8 rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Search className="h-5 w-5" />
                            <span>Search</span>
                        </button>
                    </div>

                    {/* Filter Dropdowns Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <CustomDropdown
                            icon={<Activity className="w-5 h-5" />}
                            label="Status"
                            value={filters.payment_status}
                            options={statusOptions}
                            onChange={(value) => handleFilterChange("payment_status", value)}
                        />
                        <CustomDropdown
                            icon={<Wallet className="w-5 h-5" />}
                            label="Method"
                            value={filters.method}
                            options={methodOptions}
                            onChange={(value) => handleFilterChange("method", value)}
                        />

                        <DateRangeFilter
                            startDate={filters.date_from}
                            endDate={filters.date_to}
                            onDateChange={handleDateRangeChange}
                        />

                        <div className="flex items-end justify-end h-full">
                            <button
                                onClick={() => {
                                    setFilters({
                                        payment_status: "All Statuses",
                                        method: "All Methods",
                                        date_from: '',
                                        date_to: ''
                                    });
                                    setSearchQuery('');
                                    setActiveSearch('');
                                    setPage(1);
                                }}
                                className="h-14 mb-0.5 w-full bg-white border border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 rounded-2xl font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                            >
                                <X size={18} /> Reset
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Payment ID</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Parties</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-400">Loading payments...</td></tr>
                            ) : payments.length === 0 ? (
                                <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-400">No payments found.</td></tr>
                            ) : (
                                payments.map((p) => (
                                    <tr key={p.payment_id} className="hover:bg-red-50/50 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-gray-500">#{p.payment_id}</td>
                                        <td className="px-6 py-4 text-gray-900 font-bold">Rs. {p.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900 capitalize">{p.method?.replace('_', ' ')}</span>
                                                <span className="text-xs text-gray-500">Ref: #{p.booking_id}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(p.payment_status)}`}>
                                                {p.payment_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                                            <div className="flex items-center gap-1.5"><Calendar size={14} className="text-gray-400" /> {new Date(p.payment_date).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-medium text-gray-900">{p.customer_name}</span>
                                                <span className="text-xs text-gray-500">to {p.venue_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleViewPayment(p.payment_id)}
                                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 hover:scale-105 transition-all shadow-sm"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && payments.length > 0 && (
                    <div className="flex justify-between items-center mt-6 px-6 py-4">
                        <div className="text-sm font-medium text-gray-500">
                            Page <span className="text-gray-900">{page}</span> of {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-gray-700 shadow-sm transition-all"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-gray-700 shadow-sm transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
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

export default AdminPaymentsPage;
