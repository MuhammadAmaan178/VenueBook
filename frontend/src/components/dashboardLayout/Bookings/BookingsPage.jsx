import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, X, Eye, Check, XCircle, Calendar, MapPin, ChevronDown, Activity, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { ownerService } from '../../../services/api';
import BookingDetailsModal from '../modals/BookingDetailsModal';
import { CustomDropdown, DateRangeFilter } from '../common/DashboardFilters';

const BookingsPage = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSearch, setActiveSearch] = useState('');

    const [filters, setFilters] = useState({
        status: "All Statuses",
        date_start: '',
        date_end: ''
    });

    const statusOptions = ["All Statuses", "pending", "confirmed", "completed", "cancelled"];

    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showBookingDetails, setShowBookingDetails] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState({});
    const [showExportMenu, setShowExportMenu] = useState(false);

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
            if (activeSearch) filterParams.search_customer = activeSearch;
            if (filters.status && filters.status !== "All Statuses") filterParams.status = filters.status;
            if (filters.date_start) filterParams.date_start = filters.date_start;
            if (filters.date_end) filterParams.date_end = filters.date_end;

            const ownerId = user.owner_id || user.user_id;
            const data = await ownerService.getBookings(ownerId, filterParams, token);

            setBookings(data.bookings || []);
        } catch (error) {
            console.error("Error fetching bookings:", error);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            const timer = setTimeout(() => {
                fetchBookings();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [user, activeSearch, filters]);

    const handleSearch = () => {
        setActiveSearch(searchQuery);
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

    const handleStatusUpdate = async (bookingId, newStatus) => {
        try {
            setUpdatingStatus(prev => ({ ...prev, [bookingId]: true }));
            const token = localStorage.getItem('token');
            const ownerId = user.owner_id || user.user_id;

            await ownerService.updateBookingStatus(ownerId, bookingId, { status: newStatus }, token);

            // Refresh bookings list
            await fetchBookings();

            alert(`Booking ${newStatus === 'confirmed' ? 'confirmed' : 'cancelled'} successfully!`);
        } catch (error) {
            console.error('Error updating booking status:', error);
            alert(`Failed to ${newStatus === 'confirmed' ? 'confirm' : 'cancel'} booking. Please try again.`);
        } finally {
            setUpdatingStatus(prev => ({ ...prev, [bookingId]: false }));
        }
    };

    const handleExport = () => {
        setShowExportMenu(false);
        if (!bookings.length) return alert("No bookings to export");

        const headers = ['Booking ID', 'Event Type', 'Special Requirements', 'Total Price', 'Status', 'Slot', 'Customer', 'Venue', 'Event Date'];

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
            ...bookings.map(b => [
                b.booking_id || '',
                escapeCSV(b.event_type || ''),
                escapeCSV(b.special_requirements || ''),
                b.total_price || 0,
                b.status || '',
                escapeCSV(b.slot || ''),
                escapeCSV(b.customer_name || b.fullname || ''),
                escapeCSV(b.venue_name || ''),
                b.event_date || ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `bookings_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'confirmed': return 'bg-green-50 text-green-700 border-green-200';
            case 'completed': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
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
                        Bookings
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">
                        Manage your venue bookings and reservations
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
                                placeholder="Search by customer name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                className="w-full h-12 py-3 pl-12 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-gray-50/50 hover:bg-white transition-all text-gray-900 font-medium placeholder-gray-400"
                            />
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover/search:text-blue-500 transition-colors" />
                        </div>
                        <button
                            onClick={handleSearch}
                            className="h-12 bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Search className="h-5 w-5" />
                            <span>Search</span>
                        </button>
                    </div>

                    {/* Filter Dropdowns Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <CustomDropdown
                            icon={<Activity className="w-5 h-5" />}
                            label="Status"
                            value={filters.status}
                            options={statusOptions}
                            onChange={(value) => handleFilterChange("status", value)}
                        />

                        <DateRangeFilter
                            startDate={filters.date_start}
                            endDate={filters.date_end}
                            onDateChange={handleDateRangeChange}
                        />

                        <div className="flex items-end justify-end h-full">
                            <button
                                onClick={() => {
                                    setFilters({
                                        status: "All Statuses",
                                        date_start: '',
                                        date_end: ''
                                    });
                                    setSearchQuery('');
                                    setActiveSearch('');
                                }}
                                className="h-14 mb-0.5 w-full bg-white border border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 rounded-2xl font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                            >
                                <X size={18} /> Reset
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bookings Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Booking ID</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Event Info</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">Loading bookings...</td>
                                </tr>
                            ) : bookings.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                        No bookings found. {activeSearch || filters.status !== "All Statuses" ? 'Try adjusting your filters.' : ''}
                                    </td>
                                </tr>
                            ) : (
                                bookings.map((booking) => (
                                    <tr key={booking.booking_id} className="hover:bg-blue-50/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                                            #{booking.booking_id}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-bold text-gray-900 capitalize">{booking.event_type || 'Event'}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{booking.venue_name || 'Venue Name'}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-700">
                                            {booking.customer_name || booking.fullname || 'Guest'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                            Rs. {booking.total_price?.toLocaleString() || '0'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(booking.status)}`}>
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(booking.event_date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleViewBooking(booking.booking_id)}
                                                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 hover:scale-105 transition-all shadow-sm"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </button>

                                                {booking.status?.toLowerCase() === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusUpdate(booking.booking_id, 'confirmed')}
                                                            disabled={updatingStatus[booking.booking_id]}
                                                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 hover:scale-105 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title="Confirm Booking"
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(booking.booking_id, 'cancelled')}
                                                            disabled={updatingStatus[booking.booking_id]}
                                                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 hover:scale-105 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title="Cancel Booking"
                                                        >
                                                            <XCircle size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Booking Details Modal */}
            {selectedBooking && showBookingDetails && (
                <BookingDetailsModal
                    booking={selectedBooking}
                    onClose={() => {
                        setShowBookingDetails(false);
                        setSelectedBooking(null);
                    }}
                    onUpdateStatus={fetchBookings}
                />
            )}
        </div>
    );
};

export default BookingsPage;