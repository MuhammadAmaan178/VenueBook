import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, X, Eye } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { ownerService, adminService } from '../../../services/api';
import BookingDetailsModal from '../modals/BookingDetailsModal';

const BookingsPage = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showBookingDetails, setShowBookingDetails] = useState(false);

    const [filters, setFilters] = useState({
        status: '',
        venue_id: '',
        date_start: '',
        date_end: ''
    });

    const { user } = useAuth ? useAuth() : {};

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            if (!token || !user) {
                console.error('No authentication token or user found');
                setLoading(false);
                return;
            }

            // Build filter params
            const filterParams = {};
            if (filters.status) filterParams.status = filters.status;
            if (filters.venue_id) filterParams.venue_id = filters.venue_id;
            if (filters.date_start) filterParams.date_start = filters.date_start;
            if (filters.date_end) filterParams.date_end = filters.date_end;
            if (searchTerm) filterParams.search_customer = searchTerm;

            let data;
            if (user.role === 'admin') {
                data = await adminService.getBookings(filterParams, token);
            } else if (user.role === 'owner') {
                const ownerId = user.owner_id || user.user_id;
                data = await ownerService.getBookings(ownerId, filterParams, token);
            } else {
                console.error('Invalid user role');
                setLoading(false);
                return;
            }

            setBookings(data.bookings || []);
        } catch (error) {
            console.error("Error fetching bookings:", error);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (user) {
                fetchBookings();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [user, searchTerm, filters]);

    const handleViewBooking = async (bookingId) => {
        try {
            const token = localStorage.getItem('token');
            const ownerId = user.owner_id || user.user_id;
            const bookingData = await ownerService.getBookingDetails(ownerId, bookingId, token);
            setSelectedBooking(bookingData);
            setShowBookingDetails(true);
        } catch (error) {
            console.error('Error fetching booking details:', error);
            alert('Failed to load booking details');
        }
    };

    const handleExport = () => {
        if (!bookings.length) return alert("No bookings to export");

        const headers = ['Booking ID', 'Event Type', 'Special Requirements', 'Total Price', 'Status', 'Slot', 'Event Date', 'Customer', 'Venue'];

        const escapeCSV = (value) => {
            if (value === null || value === undefined) return '';
            const str = String(value);
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const csvContent = [
            headers.join(','),
            ...bookings.map(b => [
                b.booking_id || '',
                escapeCSV(b.event_type || ''),
                escapeCSV(b.special_requirements || ''),
                b.total_price || 0,
                b.status || '',
                escapeCSV(b.slot || ''),
                b.event_date || '',
                escapeCSV(b.customer_name || b.fullname || ''),
                escapeCSV(b.venue_name || '')
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `bookings_${new Date().toISOString().split('T')[0]}.csv`);
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
            status: '',
            venue_id: '',
            date_start: '',
            date_end: ''
        });
        setSearchTerm('');
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'confirmed': return 'bg-green-100 text-green-800';
            case 'completed': return 'bg-blue-100 text-blue-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
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
                    <h1 className="text-2xl font-bold text-gray-800">Bookings</h1>
                    <p className="text-gray-500">Manage your venue bookings</p>
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

            {/* Search Bar */}
            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by customer name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
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
                        {/* Status Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
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

                        {/* Clear Filters */}
                        <div className="flex items-end">
                            <button
                                onClick={clearFilters}
                                className="w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bookings Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Special Requirements</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slot</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">Loading bookings...</td>
                                </tr>
                            ) : bookings.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                        No bookings found. {searchTerm || filters.status || filters.date_start ? 'Try adjusting your filters.' : ''}
                                    </td>
                                </tr>
                            ) : (
                                bookings.map((booking) => (
                                    <tr key={booking.booking_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                            #{booking.booking_id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                                            {booking.event_type || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                            {booking.special_requirements || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            Rs. {booking.total_price?.toLocaleString() || '0'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {booking.slot || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(booking.event_date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleViewBooking(booking.booking_id)}
                                                className="p-2 hover:bg-blue-100 rounded-lg transition"
                                                title="View Details"
                                            >
                                                <Eye size={18} className="text-blue-600" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Booking Details Modal */}
            {showBookingDetails && (
                <BookingDetailsModal
                    booking={selectedBooking}
                    onClose={() => {
                        setShowBookingDetails(false);
                        setSelectedBooking(null);
                    }}
                />
            )}
        </div>
    );
};

export default BookingsPage;