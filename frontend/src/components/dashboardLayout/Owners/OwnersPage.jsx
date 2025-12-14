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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-6 flex justify-between items-center z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Owner Profile</h2>
                        <p className="text-purple-100 text-sm mt-0.5">{owner.owner?.business_name || owner.owner?.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-8 space-y-6">
                    {/* Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-purple-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full blur-xl -mr-12 -mt-12 group-hover:bg-purple-100 transition-colors"></div>
                            <div className="relative">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-bold text-purple-600 uppercase">Total Venues</p>
                                    <Building2 className="text-purple-300" size={24} />
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{owner.stats?.total_venues || 0}</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full blur-xl -mr-12 -mt-12 group-hover:bg-blue-100 transition-colors"></div>
                            <div className="relative">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-bold text-blue-600 uppercase">Total Bookings</p>
                                    <Calendar className="text-blue-300" size={24} />
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{owner.stats?.total_bookings || 0}</p>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full blur-xl -mr-12 -mt-12 group-hover:bg-green-100 transition-colors"></div>
                            <div className="relative">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-bold text-green-600 uppercase">Total Revenue</p>
                                    <span className="text-2xl">💰</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900">{formatCurrency(owner.stats?.total_revenue || 0)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Personal & Business Info */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Personal Information */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <Mail className="text-blue-600" size={20} />
                                </div>
                                Personal Information
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Full Name</p>
                                    <p className="font-semibold text-gray-900">{owner.owner?.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Email</p>
                                    <p className="font-semibold text-gray-700 break-all">{owner.owner?.email}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Phone</p>
                                    <p className="font-semibold text-gray-900">{owner.owner?.phone}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Member Since</p>
                                    <p className="font-semibold text-gray-900">{formatDate(owner.owner?.user_created_at)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Business Details */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <Building2 className="text-purple-600" size={20} />
                                </div>
                                Business Details
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Business Name</p>
                                    <p className="font-semibold text-gray-900">{owner.owner?.business_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">CNIC</p>
                                    <p className="font-semibold text-gray-900">{owner.owner?.cnic || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Verification Status</p>
                                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${owner.owner?.verification_status === 'verified' ? 'bg-green-50 text-green-700 border-green-200' :
                                            owner.owner?.verification_status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                'bg-gray-50 text-gray-700 border-gray-200'
                                        }`}>
                                        {owner.owner?.verification_status || 'Unverified'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Venues List */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Venues ({owner.venues?.length || 0})</h3>
                        {owner.venues && owner.venues.length > 0 ? (
                            <div className="overflow-x-auto rounded-xl border border-gray-200">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Venue</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Bookings</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Revenue</th>
                                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {owner.venues.map((venue) => (
                                            <tr
                                                key={venue.venue_id}
                                                className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                                                onClick={() => onVenueClick && onVenueClick(venue.venue_id)}
                                            >
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{venue.name}</p>
                                                </td>
                                                <td className="px-6 py-4 text-gray-700">{venue.city}</td>
                                                <td className="px-6 py-4 text-gray-700 capitalize">{venue.type}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold border border-blue-100">
                                                        {venue.bookings_count}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(venue.revenue)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${venue.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                                                            'bg-red-50 text-red-700 border-red-200'
                                                        }`}>
                                                        {venue.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-12 text-center bg-gray-50 rounded-xl border border-gray-200">
                                <Building2 className="mx-auto text-gray-300 mb-3" size={48} />
                                <p className="text-gray-500">No venues listed yet</p>
                            </div>
                        )}
                    </div>

                    {/* Recent Bookings */}
                    {owner.recent_bookings && owner.recent_bookings.length > 0 && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Bookings</h3>
                            <div className="space-y-3">
                                {owner.recent_bookings.map((booking) => (
                                    <div key={booking.booking_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-blue-50 transition-colors">
                                        <div>
                                            <p className="font-bold text-gray-900">{booking.venue_name}</p>
                                            <p className="text-sm text-gray-500">{formatDate(booking.event_date)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900">{formatCurrency(booking.total_price)}</p>
                                            <span className={`text-xs px-2 py-1 rounded-full ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-gray-100 text-gray-700'
                                                }`}>
                                                {booking.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-4">
                    <button
                        onClick={onClose}
                        className="w-full bg-gray-900 text-white py-3 rounded-xl hover:bg-black transition-colors font-medium shadow-lg shadow-gray-900/20"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OwnersPage;
