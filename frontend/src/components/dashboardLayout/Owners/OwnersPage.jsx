import React, { useState, useEffect } from 'react';
import { Search, Mail, Phone, Building2, Calendar, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { adminService } from '../../../services/api';
import VenueDetailsModal from '../modals/VenueDetailsModal';

const OwnersPage = () => {
    const [owners, setOwners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { user } = useAuth(); // Needed for token

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedOwner, setSelectedOwner] = useState(null);
    const [showOwnerDetails, setShowOwnerDetails] = useState(false);

    // Venue Details State
    const [selectedVenue, setSelectedVenue] = useState(null);
    const [showVenueDetails, setShowVenueDetails] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchOwners();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, page]);

    const fetchOwners = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const filterParams = {
                page: page,
                per_page: 15
            };

            if (searchTerm) filterParams.search = searchTerm;

            const data = await adminService.getOwners(filterParams, token);
            setOwners(data.owners || []);
            setTotalPages(data.total_pages || 1);
        } catch (error) {
            console.error("Error fetching owners:", error);
            setOwners([]);
        } finally {
            setLoading(false);
        }
    };

    // Removed client-side filtering as backend handles search
    const displayedOwners = owners;

    const handleViewOwner = async (ownerId) => {
        // If ownerId is missing (e.g. incomplete profile with no owner_id yet), check if we can still show basic info
        // But getOwnerDetails expects an ownerId. 
        // If the user hasn't completed profile, they might not have an owner_id in the owners table (depending on how we joined).
        // The join was LEFT JOIN, so owner_id might be null.
        // If owner_id is null, we can't fetch details from /owners/:id endpoint as it expects an ID.
        // We should disable click or show a toast.

        // Actually, let's find the owner object from our list first
        const ownerBasic = owners.find(o => o.owner_id === ownerId || o.user_id === ownerId); // Fallback

        if (!ownerBasic?.owner_id) {
            // Can't show details if not a registered owner
            alert("This user has not completed their owner profile yet.");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const data = await adminService.getOwnerDetails(ownerBasic.owner_id, token);
            setSelectedOwner(data);
            setShowOwnerDetails(true);
        } catch (error) {
            console.error("Error fetching owner details:", error);
            alert("Failed to load owner details");
        }
    };

    const handleViewVenue = async (venueId) => {
        try {
            const token = localStorage.getItem('token');
            const data = await adminService.getVenueDetails(venueId, token);
            setSelectedVenue(data);
            setShowVenueDetails(true);
        } catch (error) {
            console.error("Error fetching venue details:", error);
            alert("Failed to load venue details");
        }
    };

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Vehicle Owners</h1>
                    <p className="text-gray-500">Manage and view all registered venue owners</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search owners..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(1);
                        }}
                        className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8">Loading owners...</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Owner</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Contact</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700 text-center">Venues</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700 text-center">Total Bookings</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Joined</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {displayedOwners.map((owner) => (
                                    <tr
                                        key={owner.user_id}
                                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => handleViewOwner(owner.user_id)}
                                    >
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-medium text-gray-900">{owner.name}</div>
                                                <div className="text-sm text-gray-500">{owner.business_name || <span className="text-orange-500 italic">Profile Incomplete</span>}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Mail size={14} className="mr-2" />
                                                    {owner.email}
                                                </div>
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Phone size={14} className="mr-2" />
                                                    {owner.phone}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {owner.total_venues}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <Calendar size={12} className="mr-1" />
                                                {owner.total_bookings}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(owner.joined_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                                {displayedOwners.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                            No owners found matching your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {!loading && displayedOwners.length > 0 && (
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

            {showOwnerDetails && selectedOwner && (
                <OwnerDetailsModal
                    owner={selectedOwner}
                    onClose={() => {
                        setShowOwnerDetails(false);
                        setSelectedOwner(null);
                    }}
                    onVenueClick={handleViewVenue}
                />
            )}

            {showVenueDetails && selectedVenue && (
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

const OwnerDetailsModal = ({ owner, onClose, onVenueClick }) => {
    if (!owner) return null;

    // Helper to format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex justify-between items-start sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Owner Details</h2>
                        <p className="text-sm text-gray-500">View complete owner profile and venues</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Personal & Business Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Personal Information</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span className="text-gray-600">Full Name</span>
                                    <span className="font-medium text-gray-900">{owner.owner?.name}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span className="text-gray-600">Email</span>
                                    <span className="font-medium text-gray-900">{owner.owner?.email}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span className="text-gray-600">Phone</span>
                                    <span className="font-medium text-gray-900">{owner.owner?.phone}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span className="text-gray-600">Joined</span>
                                    <span className="font-medium text-gray-900">
                                        {new Date(owner.owner?.user_created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Business Details</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span className="text-gray-600">Business Name</span>
                                    <span className="font-medium text-gray-900">{owner.owner?.business_name || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span className="text-gray-600">CNIC</span>
                                    <span className="font-medium text-gray-900">{owner.owner?.cnic || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span className="text-gray-600">Verification Status</span>
                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${owner.owner?.verification_status === 'verified' ? 'bg-green-100 text-green-800' :
                                        owner.owner?.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {owner.owner?.verification_status || 'Unverified'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Statistics */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Performance Overview</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                <div className="text-purple-600 text-sm font-medium mb-1">Total Venues</div>
                                <div className="text-2xl font-bold text-gray-900">{owner.stats?.total_venues || 0}</div>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <div className="text-blue-600 text-sm font-medium mb-1">Total Bookings</div>
                                <div className="text-2xl font-bold text-gray-900">{owner.stats?.total_bookings || 0}</div>
                            </div>
                            <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                <div className="text-green-600 text-sm font-medium mb-1">Total Revenue</div>
                                <div className="text-2xl font-bold text-gray-900">{formatCurrency(owner.stats?.total_revenue || 0)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Venues List */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Venues ({owner.venues?.length || 0})</h3>
                        <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                            {owner.venues && owner.venues.length > 0 ? (
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-100 border-b border-gray-200 text-gray-500 font-medium">
                                        <tr>
                                            <th className="px-4 py-3">Venue Name</th>
                                            <th className="px-4 py-3">City</th>
                                            <th className="px-4 py-3">Type</th>
                                            <th className="px-4 py-3">Bookings</th>
                                            <th className="px-4 py-3 text-right">Revenue</th>
                                            <th className="px-4 py-3 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {owner.venues.map((venue) => (
                                            <tr
                                                key={venue.venue_id}
                                                className="hover:bg-gray-100 cursor-pointer transition-colors"
                                                onClick={() => onVenueClick && onVenueClick(venue.venue_id)}
                                            >
                                                <td className="px-4 py-3 font-medium text-gray-900">{venue.name}</td>
                                                <td className="px-4 py-3 text-gray-600">{venue.city}</td>
                                                <td className="px-4 py-3 text-gray-600">{venue.type}</td>
                                                <td className="px-4 py-3 text-gray-600">{venue.bookings_count}</td>
                                                <td className="px-4 py-3 text-right text-gray-900 font-medium">{formatCurrency(venue.revenue)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`px-2 py-0.5 text-xs rounded-full ${venue.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {venue.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-8 text-center text-gray-500">No venues listed yet.</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium shadow-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OwnersPage;
