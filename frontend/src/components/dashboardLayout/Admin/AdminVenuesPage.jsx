import React, { useState, useEffect, useRef } from 'react';
import { Building2, Filter, X, Eye, Check, XCircle, ChevronDown, Download, Search, MapPin, Users, DollarSign, Activity } from 'lucide-react';
import { adminService, venueService } from '../../../services/api';
import VenueDetailsModal from '../modals/VenueDetailsModal';
import { CustomDropdown } from './AdminFilters';

const AdminVenuesPage = () => {
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState(''); // Local state for input
    const [activeSearch, setActiveSearch] = useState(''); // Trigger for API

    // Dropdown Data
    const [cityOptions, setCityOptions] = useState(["All Cities"]);
    const [typeOptions, setTypeOptions] = useState(["All Types"]);
    const capacities = ["All Capacity", "50-100", "100-200", "200-500", "500+"];
    const ranges = ["All Range", "Under 50,000", "50,000 - 100,000", "100,000 - 200,000", "200,000+"];
    const statuses = ["All Statuses", "active", "pending", "inactive", "rejected"];

    const [filters, setFilters] = useState({
        status: "All Statuses",
        city: "All Cities",
        type: "All Types",
        capacity: "All Capacity",
        range: "All Range",
        sort_by: "created_at"
    });

    const [selectedVenue, setSelectedVenue] = useState(null);
    const [showVenueDetails, setShowVenueDetails] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showExportMenu, setShowExportMenu] = useState(false);

    const [showFilters, setShowFilters] = useState(false);

    // Fetch Filter Options
    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
                const data = await venueService.getFilters();
                setCityOptions(["All Cities", ...data.cities]);
                setTypeOptions(["All Types", ...data.types]);
            } catch (error) {
                console.error("Failed to fetch filter options:", error);
            }
        };
        fetchFilterOptions();
    }, []);

    const fetchVenues = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            // Build filter params
            const filterParams = {
                page: page,
                per_page: 15
            };

            if (activeSearch) filterParams.search = activeSearch;

            // Map UI filters to API params
            if (filters.status && filters.status !== "All Statuses") filterParams.status = filters.status;
            if (filters.city && filters.city !== "All Cities") filterParams.city = filters.city;
            if (filters.type && filters.type !== "All Types") filterParams.type = filters.type;
            if (filters.sort_by) filterParams.sort_by = filters.sort_by;

            if (filters.capacity && filters.capacity !== "All Capacity") {
                const parts = filters.capacity.split('-');
                if (parts.length === 2) {
                    filterParams.capacity_min = parts[0];
                    filterParams.capacity_max = parts[1];
                } else if (filters.capacity.endsWith('+')) {
                    filterParams.capacity_min = filters.capacity.replace('+', '');
                }
            }

            if (filters.range && filters.range !== "All Range") {
                switch (filters.range) {
                    case "Under 50,000": filterParams.price_max = 50000; break;
                    case "50,000 - 100,000": filterParams.price_min = 50000; filterParams.price_max = 100000; break;
                    case "100,000 - 200,000": filterParams.price_min = 100000; filterParams.price_max = 200000; break;
                    case "200,000+": filterParams.price_min = 200000; break;
                }
            }

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
        fetchVenues();
    }, [activeSearch, filters, page]);

    const handleSearch = () => {
        setActiveSearch(searchQuery);
        setPage(1);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1);
    };

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

    const handleExport = async (type) => {
        setShowExportMenu(false);
        let venuesToExport = [];

        if (type === 'current') {
            venuesToExport = venues;
            if (!venuesToExport.length) return alert("No venues to export on current page");
        } else {
            try {
                const token = localStorage.getItem('token');
                const filterParams = { page: 1, per_page: 100000 };
                // ... (Include all current filters in export)
                if (activeSearch) filterParams.search = activeSearch;
                if (filters.status && filters.status !== "All Statuses") filterParams.status = filters.status;
                if (filters.city && filters.city !== "All Cities") filterParams.city = filters.city;
                if (filters.type && filters.type !== "All Types") filterParams.type = filters.type;

                const data = await adminService.getVenues(filterParams, token);
                venuesToExport = data.venues || [];
                if (!venuesToExport.length) return alert("No venues found to export");
            } catch (error) {
                console.error("Error fetching all venues:", error);
                return alert("Failed to fetch all venues");
            }
        }

        const headers = ['ID', 'Name', 'Type', 'City', 'Owner', 'Capacity', 'Price', 'Status', 'Rating'];
        const csvContent = [
            headers.join(','),
            ...venuesToExport.map(v => [
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
        link.setAttribute('download', `venues_${type}_${new Date().toISOString().split('T')[0]}.csv`);
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

    const handleApproveVenue = async (venueId) => {
        if (!window.confirm("Are you sure you want to approve this venue?")) return;
        try {
            const token = localStorage.getItem('token');
            await adminService.approveVenue(venueId, token);
            alert("Venue approved successfully");
            setShowVenueDetails(false);
            fetchVenues(); // Refresh list
        } catch (error) {
            console.error("Error approving venue:", error);
            alert("Failed to approve venue");
        }
    };

    const handleRejectVenue = async (venueId, currentStatus) => {
        const action = currentStatus === 'active' ? 'deactivate' : 'reject';
        if (!window.confirm(`Are you sure you want to ${action} this venue?`)) return;

        try {
            const token = localStorage.getItem('token');
            const newStatus = currentStatus === 'active' ? 'inactive' : 'rejected';
            await adminService.updateVenueStatus(venueId, newStatus, token);
            alert(`Venue ${action}ed successfully`);
            setShowVenueDetails(false);
            fetchVenues(); // Refresh list
        } catch (error) {
            console.error(`Error ${action}ing venue:`, error);
            alert(`Failed to ${action} venue`);
        }
    };

    return (
        <div className="p-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Manage Venues
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">
                        Search, filter, and manage all platform venues
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
                                    All Venues
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
                                placeholder="Search by venue name, ID, or owner..."
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        <CustomDropdown
                            icon={<Activity className="w-5 h-5" />}
                            label="Status"
                            value={filters.status}
                            options={statuses}
                            onChange={(value) => handleFilterChange("status", value)}
                        />
                        <CustomDropdown
                            icon={<MapPin className="w-5 h-5" />}
                            label="City"
                            value={filters.city}
                            options={cityOptions}
                            onChange={(value) => handleFilterChange("city", value)}
                        />
                        <CustomDropdown
                            icon={<Building2 className="w-5 h-5" />}
                            label="Venue Type"
                            value={filters.type}
                            options={typeOptions}
                            onChange={(value) => handleFilterChange("type", value)}
                        />
                        <CustomDropdown
                            icon={<Users className="w-5 h-5" />}
                            label="Capacity"
                            value={filters.capacity}
                            options={capacities}
                            onChange={(value) => handleFilterChange("capacity", value)}
                        />
                        <CustomDropdown
                            icon={<DollarSign className="w-5 h-5" />}
                            label="Price Range"
                            value={filters.range}
                            options={ranges}
                            onChange={(value) => handleFilterChange("range", value)}
                        />
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                        <button
                            onClick={() => {
                                setFilters({
                                    status: "All Statuses",
                                    city: "All Cities",
                                    type: "All Types",
                                    capacity: "All Capacity",
                                    range: "All Range",
                                    sort_by: "created_at"
                                });
                                setSearchQuery("");
                                setActiveSearch("");
                                setPage(1);
                            }}
                            className="text-red-500 hover:text-red-700 font-semibold text-sm flex items-center gap-1.5 px-3 py-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <XCircle size={16} /> Reset All Filters
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Venue</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Owner</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Rating</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
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
                                    <tr key={venue.venue_id} className="hover:bg-red-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                                                    <Building2 size={20} />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-gray-900">{venue.name}</div>
                                                    <div className="text-xs text-gray-500">ID: {venue.venue_id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {venue.owner_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                                {venue.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <MapPin size={14} className="text-gray-400" /> {venue.city}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full uppercase tracking-wide ${getStatusColor(venue.status)}`}>
                                                {venue.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm font-bold text-gray-900">
                                                <span className="text-yellow-400 mr-1">★</span>
                                                {venue.rating ? Number(venue.rating).toFixed(1) : 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleView(venue.venue_id)}
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
            </div>

            {/* Pagination */}
            {!loading && venues.length > 0 && (
                <div className="flex justify-between items-center mt-6 px-2">
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

            {selectedVenue && showVenueDetails && (
                <VenueDetailsModal
                    venue={selectedVenue}
                    onClose={() => {
                        setShowVenueDetails(false);
                        setSelectedVenue(null);
                    }}
                    onApprove={() => handleApproveVenue(selectedVenue.venue_id)}
                    onReject={() => handleRejectVenue(selectedVenue.venue_id, selectedVenue.status)}
                />
            )}
        </div>
    );
};

export default AdminVenuesPage;
