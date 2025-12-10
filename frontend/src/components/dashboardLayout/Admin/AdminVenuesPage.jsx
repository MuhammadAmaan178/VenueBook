import React, { useState, useEffect } from 'react';
import { Building2, Filter, X, Eye, Check, XCircle } from 'lucide-react';
import { adminService } from '../../../services/api';
import VenueDetailsModal from '../modals/VenueDetailsModal';

const AdminVenuesPage = () => {
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedVenue, setSelectedVenue] = useState(null);
    const [showVenueDetails, setShowVenueDetails] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filter states
    const [filters, setFilters] = useState({
        status: '',
        city: '',
        type: '',
        sort_by: 'created_at'
    });

    const fetchVenues = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            // Build filter params
            const filterParams = {
                page: page,
                per_page: 15
            };
            if (searchTerm) filterParams.search = searchTerm;
            if (filters.status) filterParams.status = filters.status;
            if (filters.city) filterParams.city = filters.city;
            if (filters.type) filterParams.type = filters.type;
            if (filters.sort_by) filterParams.sort_by = filters.sort_by;

            const data = await adminService.getVenues(filterParams, token);

            if (data && data.venues) {
                setVenues(data.venues);
                setTotalPages(data.total_pages || 1);
            }
        } catch (error) {
            console.error("Error fetching venues", error);
            setVenues([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchVenues();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, filters, page]);

    const handleView = async (venueId) => {
        try {
            const token = localStorage.getItem('token');
            const venueData = await adminService.getVenueDetails(venueId, token);
            setSelectedVenue(venueData);
            setShowVenueDetails(true);
        } catch (error) {
            console.error('Error fetching venue details:', error);
            alert('Failed to load venue details');
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1);
    };

    const clearFilters = () => {
        setFilters({
            status: '',
            city: '',
            type: '',
            sort_by: 'created_at'
        });
        setSearchTerm('');
    };

    const handleExport = () => {
        if (!venues.length) return alert("No venues to export");

        const headers = ['ID', 'Name', 'Type', 'City', 'Owner', 'Capacity', 'Price', 'Status', 'Rating'];
        const csvContent = [
            headers.join(','),
            ...venues.map(v => [
                v.venue_id,
                `"${v.name || ''}"`,
                `"${v.type || ''}"`,
                `"${v.city || ''}"`,
                `"${v.owner_name || ''}"`,
                v.capacity,
                v.base_price,
                v.status,
                v.rating
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'all_venues.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'inactive': return 'bg-gray-100 text-gray-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">All Venues</h1>
                    <p className="text-gray-500">Manage all venues on the platform</p>
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
                        className="px-4 py-2 text-white bg-purple-600 hover:bg-purple-700 rounded-lg"
                    >
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search by venue name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Filter size={20} /> Advanced Filters
                        </h3>
                        <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-gray-100 rounded">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full border rounded-lg px-3 py-2"
                            >
                                <option value="">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="pending">Pending</option>
                                <option value="inactive">Inactive</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                            <input
                                type="text"
                                value={filters.city}
                                onChange={(e) => handleFilterChange('city', e.target.value)}
                                className="w-full border rounded-lg px-3 py-2"
                                placeholder="Start typing..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                            <select
                                value={filters.sort_by}
                                onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                                className="w-full border rounded-lg px-3 py-2"
                            >
                                <option value="created_at">Newest First</option>
                                <option value="name">Name</option>
                                <option value="rating">Rating</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={clearFilters}
                                className="w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venue</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">Loading...</td>
                                </tr>
                            ) : venues.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">No venues found.</td>
                                </tr>
                            ) : (
                                venues.map((venue) => (
                                    <tr key={venue.venue_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <Building2 size={20} className="text-gray-500" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{venue.name}</div>
                                                    <div className="text-sm text-gray-500">ID: {venue.venue_id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {venue.owner_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {venue.type}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {venue.city}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(venue.status)}`}>
                                                {venue.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {venue.rating ? venue.rating.toFixed(1) : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleView(venue.venue_id)}
                                                className="text-purple-600 hover:text-purple-900"
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
            </div>

            {/* Pagination */}
            {!loading && venues.length > 0 && (
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

            {selectedVenue && showVenueDetails && (
                <VenueDetailsModal
                    venue={selectedVenue}
                    onClose={() => {
                        setShowVenueDetails(false);
                        setSelectedVenue(null);
                    }}
                />
            )}
        </div>
    );
};

export default AdminVenuesPage;
