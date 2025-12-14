import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Download, X, Eye, Calendar, MapPin, User, ChevronLeft, ChevronRight, SlidersHorizontal, ChevronDown, Check, Activity } from 'lucide-react';
import { adminService } from '../../../services/api';
import BookingDetailsModal from '../modals/BookingDetailsModal';
import { CustomDropdown, DateRangeFilter } from './AdminFilters';

const AdminBookingsPage = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSearch, setActiveSearch] = useState('');

    const statusOptions = ["All Statuses", "pending", "confirmed", "completed", "cancelled"];

    const [filters, setFilters] = useState({
        status: "All Statuses",
        date_start: '',
        date_end: ''
    });

    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showBookingDetails, setShowBookingDetails] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showExportMenu, setShowExportMenu] = useState(false);

    const [showFilters, setShowFilters] = useState(false);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const filterParams = {
                page: page,
                per_page: 15
            };

            if (activeSearch) filterParams.search = activeSearch;

            if (filters.status && filters.status !== "All Statuses") filterParams.status = filters.status;
            if (filters.date_start) filterParams.date_start = filters.date_start;
            if (filters.date_end) filterParams.date_end = filters.date_end;

            const data = await adminService.getBookings(filterParams, token);
            setBookings(data.bookings || []);
            setTotalPages(data.total_pages || 1);
        } catch (error) {
            console.error("Error fetching bookings:", error);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
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
        setFilters(prev => ({ ...prev, date_start: start, date_end: end }));
        setPage(1);
    };

    const handleViewBooking = async (bookingId) => {
        try {
            const token = localStorage.getItem('token');
            const data = await adminService.getBookingDetails(bookingId, token);
            setSelectedBooking(data);
            setShowBookingDetails(true);
        } catch (error) {
            console.error('Error fetching booking details', error);
            alert('Failed to load booking details');
        }
    };

    const handleExport = async (type) => {
        setShowExportMenu(false);
        let bookingsToExport = [];

        if (type === 'current') {
            bookingsToExport = bookings;
            if (!bookingsToExport.length) return alert("No bookings to export on current page");
        } else {
            try {
                const token = localStorage.getItem('token');
                const filterParams = { page: 1, per_page: 100000 };

                if (activeSearch) filterParams.search = activeSearch;
                if (filters.status && filters.status !== "All Statuses") filterParams.status = filters.status;
                if (filters.date_start) filterParams.date_start = filters.date_start;
                if (filters.date_end) filterParams.date_end = filters.date_end;

                const data = await adminService.getBookings(filterParams, token);
                bookingsToExport = data.bookings || [];
                if (!bookingsToExport.length) return alert("No bookings found to export");
            } catch (error) {
                console.error("Error fetching all bookings:", error);
                return alert("Failed to fetch all bookings");
            }
        }

        const headers = ['ID', 'Event Type', 'Venue', 'Customer', 'Price', 'Status', 'Date'];
        const csvContent = [
            headers.join(','),
            ...bookingsToExport.map(b => [
                b.booking_id,
                `"${b.event_type || ''}"`,
                `"${b.venue_name || ''}"`,
                `"${b.customer_name || ''}"`,
                b.total_price,
                b.status,
                b.event_date
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `bookings_${type}_${new Date().toISOString().split('T')[0]}.csv`);
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

    return (
        <div className="p-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Manage Bookings
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">
                        Search, filter, and manage event reservations
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
                                    All Bookings
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
                                placeholder="Search customer, venue or booking ID..."
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
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Booking Info</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-400">Loading bookings...</td></tr>
                            ) : bookings.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-400">No bookings found.</td></tr>
                            ) : (
                                bookings.map((booking) => (
                                    <tr key={booking.booking_id} className="hover:bg-blue-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-bold text-gray-900 group-hover:text-red-600 transition-colors">#{booking.booking_id}</p>
                                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin size={10} /> {booking.venue_name}</p>
                                                <p className="text-xs text-red-600 font-medium mt-0.5 capitalize">{booking.event_type}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-700">
                                            {booking.customer_name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <div className="flex items-center gap-1.5 font-medium"><Calendar size={14} className="text-gray-400" /> {new Date(booking.event_date).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                            Rs. {booking.total_price?.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(booking.status)}`}>
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleViewBooking(booking.booking_id)}
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
                {!loading && bookings.length > 0 && (
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

            {selectedBooking && showBookingDetails && (
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

export default AdminBookingsPage;
