// components/dashboardLayout/Admin/AdminUsersPage.jsx
import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, User, Mail, Phone, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { adminService } from '../../../services/api';

const AdminUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [filters, setFilters] = useState({
        role: '',
        status: '',
        sort_by: 'created_at'
    });

    const [selectedUser, setSelectedUser] = useState(null);
    const [userDetails, setUserDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [venueDetails, setVenueDetails] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const filterParams = {
                role: 'user',
                per_page: 15,
                sort_by: filters.sort_by,
                page: page
            };

            if (searchTerm) filterParams.search = searchTerm;
            if (filters.status) filterParams.status = filters.status;

            const data = await adminService.getUsers(filterParams, token);
            setUsers(data.users || []);
            setTotalPages(data.total_pages || 1);
        } catch (error) {
            console.error("Error fetching users:", error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 500);
        return () => clearTimeout(timer);
    }, [filters, searchTerm, page]);

    const handleUserClick = async (userId) => {
        try {
            setDetailsLoading(true);
            const token = localStorage.getItem('token');
            const data = await adminService.getUserDetails(userId, token);
            setUserDetails(data);
            setSelectedUser(userId);
        } catch (error) {
            console.error("Error fetching user details:", error);
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleVenueClick = async (venueId) => {
        try {
            const token = localStorage.getItem('token');
            const data = await adminService.getVenueDetails(venueId, token);
            setVenueDetails(data);
        } catch (error) {
            console.error("Error fetching venue details:", error);
        }
    };

    const closeDetails = () => {
        setSelectedUser(null);
        setUserDetails(null);
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'bg-green-100 text-green-700 border-green-200';
            case 'blocked': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    if (selectedUser && userDetails) {
        return (
            <div className="space-y-6">
                {/* Back Button */}
                <button
                    onClick={closeDetails}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200"
                >
                    <ChevronLeft size={20} /> Back to Users
                </button>

                {/* Header */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 shadow-inner">
                            <User size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{userDetails.user.name}</h1>
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-gray-500 text-sm mt-1">
                                <span className="flex items-center gap-1"><Mail size={14} /> {userDetails.user.email}</span>
                                <span className="flex items-center gap-1"><Phone size={14} /> {userDetails.user.phone}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-full blur-xl -mr-12 -mt-12 group-hover:bg-red-100 transition-colors"></div>
                        <h3 className="text-gray-500 text-sm font-medium mb-1">Total Bookings</h3>
                        <p className="text-3xl font-bold text-gray-900">{userDetails.stats.total_bookings}</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full blur-xl -mr-12 -mt-12 group-hover:bg-green-100 transition-colors"></div>
                        <h3 className="text-gray-500 text-sm font-medium mb-1">Total Spent</h3>
                        <p className="text-3xl font-bold text-gray-900">Rs. {userDetails.stats.total_spent.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full blur-xl -mr-12 -mt-12 group-hover:bg-purple-100 transition-colors"></div>
                        <h3 className="text-gray-500 text-sm font-medium mb-1">Status</h3>
                        <div className="mt-1">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getStatusColor(userDetails.user.status || 'active')}`}>
                                {userDetails.user.status || 'Active'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Bookings Table */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-lg font-bold text-gray-900">Booking History</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Venue</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {userDetails.bookings.length > 0 ? (
                                    userDetails.bookings.map(b => (
                                        <tr key={b.booking_id} className="hover:bg-blue-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleVenueClick(b.venue_id)}
                                                    className="font-bold text-gray-900 hover:text-red-600 transition-colors"
                                                >
                                                    {b.venue_name}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 font-medium">{new Date(b.event_date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-gray-900 font-bold">Rs. {b.total_price.toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-bold rounded-full border 
                                                    ${b.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        b.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                            'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                    {b.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => setSelectedBooking(b)}
                                                    className="text-red-600 hover:text-red-800 text-sm font-bold hover:underline"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400">No bookings history.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modals for Venue and Booking Details would go here (simplified for redesign focus) */}
                {venueDetails && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">{venueDetails.name}</h2>
                                <button onClick={() => setVenueDetails(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                            </div>
                            <div className="space-y-4 text-gray-600">
                                <p><span className="font-bold text-gray-900">Address:</span> {venueDetails.address}, {venueDetails.city}</p>
                                <p><span className="font-bold text-gray-900">Capacity:</span> {venueDetails.capacity} People</p>
                                <p><span className="font-bold text-gray-900">Price:</span> Rs. {venueDetails.base_price}</p>
                            </div>
                        </div>
                    </div>
                )}
                {selectedBooking && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                        <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
                            {/* Header */}
                            <div className="sticky top-0 bg-gradient-to-r from-red-600 to-purple-600 px-8 py-6 flex justify-between items-center z-10">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Booking Details</h2>
                                    <p className="text-red-100 text-sm mt-0.5">Reference #{selectedBooking.booking_id}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedBooking(null)}
                                    className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-8 space-y-6">
                                {/* Status Banner */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className={`px-4 py-2 rounded-full text-sm font-bold border ${selectedBooking.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200' :
                                            selectedBooking.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                selectedBooking.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    'bg-gray-50 text-gray-700 border-gray-200'
                                            }`}>
                                            {selectedBooking.status}
                                        </div>
                                    </div>
                                    {selectedBooking.created_at && (
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500 font-medium">Created</p>
                                            <p className="text-sm font-semibold text-gray-700">{new Date(selectedBooking.created_at).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Venue Information */}
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Venue Details</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Venue Name</p>
                                                <p className="font-semibold text-gray-900">{selectedBooking.venue_name}</p>
                                            </div>
                                            {selectedBooking.event_type && (
                                                <div>
                                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Event Type</p>
                                                    <p className="font-semibold text-gray-900 capitalize">{selectedBooking.event_type}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Event Information */}
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Event Details</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Event Date</p>
                                                <p className="font-semibold text-gray-900">{new Date(selectedBooking.event_date).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}</p>
                                            </div>
                                            {selectedBooking.slot && (
                                                <div>
                                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Time Slot</p>
                                                    <p className="font-semibold text-gray-900">{selectedBooking.slot}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Information */}
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Payment</h3>
                                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
                                        <span className="text-sm font-medium text-gray-600">Total Amount</span>
                                        <span className="text-2xl font-bold text-emerald-700">Rs. {selectedBooking.total_price?.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Special Requirements */}
                                {selectedBooking.special_requirements && (
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                        <h3 className="text-lg font-bold text-gray-900 mb-3">Special Requirements</h3>
                                        <p className="text-gray-700 leading-relaxed">{selectedBooking.special_requirements}</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-4">
                                <button
                                    onClick={() => setSelectedBooking(null)}
                                    className="w-full bg-gray-900 text-white py-3 rounded-xl hover:bg-black transition-colors font-medium shadow-lg shadow-gray-900/20"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">All Users</h1>
                    <p className="text-gray-500 mt-1">Manage and view registered customers</p>
                </div>

                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 outline-none shadow-sm transition-all"
                    />
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User Details</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Info</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Joined Date</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400">Loading users...</td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400">No user found.</td></tr>
                            ) : (
                                users.map((u) => (
                                    <tr key={u.user_id} className="hover:bg-red-50/50 transition-colors group cursor-pointer" onClick={() => handleUserClick(u.user_id)}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <span className="font-bold text-gray-900 group-hover:text-red-600 transition-colors">{u.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 text-sm text-gray-500">
                                                <span className="flex items-center gap-1.5"><Mail size={12} /> {u.email}</span>
                                                {u.phone && <span className="flex items-center gap-1.5"><Phone size={12} /> {u.phone}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-bold rounded-full border ${getStatusColor(u.status || 'active')}`}>
                                                {u.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                                            {new Date(u.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="text-red-600 hover:text-red-800 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                                View Profile →
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination - styled simply */}
                {!loading && users.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <span className="text-sm text-gray-500 font-medium">Page {page} of {totalPages}</span>
                        <div className="flex gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); setPage(p => Math.max(1, p - 1)); }}
                                disabled={page === 1}
                                className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50 transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setPage(p => Math.min(totalPages, p + 1)); }}
                                disabled={page === totalPages}
                                className="p-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50 transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUsersPage;
