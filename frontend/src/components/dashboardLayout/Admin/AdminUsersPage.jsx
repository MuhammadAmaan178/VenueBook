import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, User, Mail, Phone, Calendar } from 'lucide-react';
import { adminService } from '../../../services/api';

const AdminUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const [filters, setFilters] = useState({
        role: '',
        status: '', // Assuming status filter is supported by backend or will be
        sort_by: 'created_at'
    });

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const filterParams = {
                role: 'user', // Only show regular users
                per_page: 15,
                sort_by: 'created_at',
                page: page
            };

            if (searchTerm) filterParams.search = searchTerm;
            if (filters.role) filterParams.role = filters.role; // Apply role filter if set
            if (filters.status) filterParams.status = filters.status; // Apply status filter if set
            if (filters.sort_by) filterParams.sort_by = filters.sort_by; // Apply sort_by filter if set


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

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1); // Reset to first page on filter change
    };

    const clearFilters = () => {
        setFilters({ role: '', status: '', sort_by: 'created_at' });
        setSearchTerm('');
    };

    const handleExport = () => {
        if (!users.length) return alert("No users to export");
        const headers = ['ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Joined'];
        const csvContent = [
            headers.join(','),
            ...users.map(u => [
                u.user_id,
                `"${u.name || ''}"`,
                `"${u.email || ''}"`,
                `"${u.phone || ''}"`,
                u.role,
                u.status || 'Active', // Default to Active if missing
                u.created_at
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'all_users.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'blocked': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const [selectedUser, setSelectedUser] = useState(null);
    const [userDetails, setUserDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

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

    const closeDetails = () => {
        setSelectedUser(null);
        setUserDetails(null);
    };

    const handleDetailsExport = () => {
        if (!userDetails || !userDetails.bookings) return;

        const headers = ['Booking ID', 'Venue', 'Slot', 'Price', 'Status', 'Created At', 'Date'];
        const csvContent = [
            headers.join(','),
            ...userDetails.bookings.map(b => [
                b.booking_id,
                `"${b.venue_name}"`,
                `"${b.slot}"`,
                b.total_price,
                b.status,
                b.created_at,
                b.event_date
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `user_${userDetails.user.user_id}_bookings.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const [venueDetails, setVenueDetails] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);

    const handleVenueClick = async (venueId) => {
        try {
            const token = localStorage.getItem('token');
            const data = await adminService.getVenueDetails(venueId, token);
            setVenueDetails(data);
        } catch (error) {
            console.error("Error fetching venue details:", error);
        }
    };



    if (selectedUser && userDetails) {
        return (
            <div className="p-6 relative">
                <button onClick={closeDetails} className="mb-6 flex items-center text-gray-600 hover:text-gray-900">
                    ← Back to Users
                </button>

                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{userDetails.user.name}</h1>
                        <p className="text-gray-500">{userDetails.user.email} • {userDetails.user.phone}</p>
                    </div>
                    <button onClick={handleDetailsExport} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        <Download size={20} /> Export Bookings
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <h3 className="text-gray-500 text-sm font-medium mb-2">Total Bookings</h3>
                        <p className="text-3xl font-bold text-gray-800">{userDetails.stats.total_bookings}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <h3 className="text-gray-500 text-sm font-medium mb-2">Total Spent</h3>
                        <p className="text-3xl font-bold text-gray-800">Rs. {userDetails.stats.total_spent.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <h3 className="text-gray-500 text-sm font-medium mb-2">Status</h3>
                        <span className={`px-2 py-1 text-sm font-bold rounded ${getStatusColor(userDetails.user.status || 'active')}`}>
                            {userDetails.user.status || 'Active'}
                        </span>
                    </div>
                </div>

                {/* Bookings Table */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800">Booking History</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Venue</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {userDetails.bookings.length > 0 ? (
                                    userDetails.bookings.map(b => (
                                        <tr key={b.booking_id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleVenueClick(b.venue_id)}
                                                    className="font-medium text-blue-600 hover:underline text-left"
                                                >
                                                    {b.venue_name}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">{new Date(b.event_date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-gray-900">Rs. {b.total_price.toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                                                    ${b.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                        b.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-gray-100 text-gray-800'}`}>
                                                    {b.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => setSelectedBooking(b)}
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No bookings found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Venue Details Modal */}
                {venueDetails && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">{venueDetails.original_name || venueDetails.name}</h2>
                                <button onClick={() => setVenueDetails(null)} className="text-gray-500 hover:text-gray-700">✕</button>
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-gray-500 text-sm">Location</p>
                                        <p className="font-medium">{venueDetails.address}, {venueDetails.city}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-sm">Capacity</p>
                                        <p className="font-medium">{venueDetails.capacity} guests</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-sm">Base Price</p>
                                        <p className="font-medium">Rs. {venueDetails.base_price}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-sm">Status</p>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(venueDetails.status)}`}>
                                            {venueDetails.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <h3 className="font-bold mb-2">Description</h3>
                                    <p className="text-gray-600">{venueDetails.description}</p>
                                </div>

                                <div className="border-t pt-4">
                                    <h3 className="font-bold mb-2">Owner Details</h3>
                                    <p className="text-gray-600">{venueDetails.owner_name} ({venueDetails.owner_contact_name})</p>
                                    <p className="text-gray-500">{venueDetails.owner_email} • {venueDetails.owner_phone}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Booking Details Modal */}
                {selectedBooking && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl max-w-lg w-full p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">Booking Details</h2>
                                <button onClick={() => setSelectedBooking(null)} className="text-gray-500 hover:text-gray-700">✕</button>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Booking ID</span>
                                    <span className="font-medium">#{selectedBooking.booking_id}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Venue</span>
                                    <span className="font-medium">{selectedBooking.venue_name}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Event Date</span>
                                    <span className="font-medium">{new Date(selectedBooking.event_date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Slot</span>
                                    <span className="font-medium">{selectedBooking.slot}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Total Price</span>
                                    <span className="font-bold text-green-600">Rs. {selectedBooking.total_price.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Status</span>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                                        ${selectedBooking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                            selectedBooking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'}`}>
                                        {selectedBooking.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">All Users</h1>
                    <p className="text-gray-500">Manage customers</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                        <Download size={20} /> Export
                    </button>
                </div>
            </div>

            <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">No users found.</td></tr>
                        ) : (
                            users.map((u) => (
                                <tr key={u.user_id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleUserClick(u.user_id)}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-3">
                                                <User size={16} />
                                            </div>
                                            <span className="font-medium text-gray-900 hover:text-blue-600 hover:underline">{u.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-500 flex flex-col gap-1">
                                            <span className="flex items-center gap-1"><Mail size={12} /> {u.email}</span>
                                            {u.phone && <span className="flex items-center gap-1"><Phone size={12} /> {u.phone}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(u.status || 'active')}`}>
                                            {u.status || 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(u.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View Details</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {!loading && users.length > 0 && (
                <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-500">
                        Page {page} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsersPage;
