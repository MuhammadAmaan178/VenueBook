import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer';
import { userService } from '../../services/api';
import {
    Calendar, Clock, MapPin, DollarSign, Search, Filter,
    AlertCircle, CheckCircle, Clock3, XCircle, ChevronRight
} from 'lucide-react';
import BookingDetailsModal from '../dashboardLayout/modals/BookingDetailsModal';

const UserBookingsPage = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        const fetchBookings = async () => {
            try {
                const token = localStorage.getItem('token');
                const userId = user.user_id || user.id;
                // Fetch all bookings initially
                const data = await userService.getUserBookings(userId, {}, token);
                // Ensure we handle the response format correctly
                setBookings(Array.isArray(data) ? data : data.bookings || []);
            } catch (error) {
                console.error("Error fetching bookings:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchBookings();
        }
    }, [user, isAuthenticated, navigate]);

    // Filter and Search Logic
    const filteredBookings = bookings.filter(booking => {
        const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
        const matchesSearch = booking.venue_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.event_type?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
            case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'confirmed': return <CheckCircle size={14} />;
            case 'pending': return <Clock3 size={14} />;
            case 'cancelled': return <XCircle size={14} />;
            default: return <AlertCircle size={14} />;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const handleViewDetails = async (bookingId) => {
        setDetailsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const userId = user.user_id || user.id;
            const fullDetails = await userService.getBookingDetails(userId, bookingId, token);
            setSelectedBooking(fullDetails);
        } catch (error) {
            console.error("Error fetching booking details:", error);
        } finally {
            setDetailsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />

            <main className="flex-1 max-w-6xl mx-auto w-full px-4 pt-24 pb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
                        <p className="text-gray-500 mt-1">Manage and track your venue reservations</p>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search venue..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none w-full sm:w-64"
                            />
                        </div>

                        <div className="relative">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none cursor-pointer w-full sm:w-auto"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="completed">Completed</option>
                            </select>
                            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 shadow-sm">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="text-gray-400 w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No bookings found</h3>
                        <p className="text-gray-500 max-w-md mx-auto mb-6">
                            {searchTerm || filterStatus !== 'all'
                                ? "Try adjusting your search or filters to find what you're looking for."
                                : "You haven't made any bookings yet. Start exploring venues to plan your event!"}
                        </p>
                        {(searchTerm || filterStatus !== 'all') ? (
                            <button
                                onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
                                className="text-blue-600 font-medium hover:underline"
                            >
                                Clear all filters
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate('/venues')}
                                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                            >
                                Browse Venues
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredBookings.map((booking) => (
                            <div
                                key={booking.booking_id}
                                onClick={() => handleViewDetails(booking.booking_id)}
                                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer"
                            >
                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Date Box */}
                                    <div className="flex-shrink-0 flex flex-col items-center justify-center w-full md:w-24 h-24 bg-blue-50 rounded-xl border border-blue-100 text-blue-800">
                                        <span className="text-xs font-bold uppercase tracking-wider">{new Date(booking.event_date).toLocaleString('default', { month: 'short' })}</span>
                                        <span className="text-3xl font-bold">{new Date(booking.event_date).getDate()}</span>
                                        <span className="text-xs opacity-75">{new Date(booking.event_date).getFullYear()}</span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                                    {booking.venue_name}
                                                </h3>
                                                <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                                                    <MapPin size={14} />
                                                    {booking.address || booking.city || 'Location N/A'}
                                                </div>
                                            </div>
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusColor(booking.status)}`}>
                                                {getStatusIcon(booking.status)}
                                                {booking.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-6 mt-4 pt-4 border-t border-gray-50">
                                            <div className="flex items-center gap-2.5 text-sm text-gray-600">
                                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                                    <Calendar size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 font-medium">Event Type</p>
                                                    <p className="font-semibold text-gray-900">{booking.event_type}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2.5 text-sm text-gray-600">
                                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                                    <Clock size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 font-medium">Time Slot</p>
                                                    <p className="font-semibold text-gray-900">{booking.slot_id === 1 ? 'Morning' : booking.slot_id === 2 ? 'Evening' : 'Full Day'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2.5 text-sm text-gray-600">
                                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                                    <DollarSign size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 font-medium">Total Price</p>
                                                    <p className="font-semibold text-gray-900">Rs. {Number(booking.total_price).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Arrow */}
                                    <div className="hidden md:flex items-center justify-center pl-4 border-l border-gray-100">
                                        <button className="p-2 rounded-full hover:bg-gray-50 text-gray-300 hover:text-blue-600 transition-all">
                                            <ChevronRight size={24} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
            <Footer />

            {/* Booking Details Modal */}
            {selectedBooking && (
                <BookingDetailsModal
                    booking={selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                />
            )}

            {/* Loading Overlay */}
            {detailsLoading && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white p-4 rounded-xl shadow-xl flex items-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="font-medium text-gray-700">Loading details...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserBookingsPage;
