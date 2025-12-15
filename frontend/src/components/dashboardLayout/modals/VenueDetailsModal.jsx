// components/dashboardLayout/modals/VenueDetailsModal.jsx
import React from 'react';
import { X, MapPin, Users, DollarSign, Star, Building2, Calendar, Check, Image as ImageIcon } from 'lucide-react';

const VenueDetailsModal = ({ venue, onClose, onApprove, onReject }) => {
    if (!venue) return null;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'bg-green-50 text-green-700 border-green-200';
            case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'inactive': return 'bg-gray-50 text-gray-700 border-gray-200';
            case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-6 flex justify-between items-center z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white">{venue.name}</h2>
                        <p className="text-blue-100 text-sm mt-0.5 flex items-center gap-2">
                            <MapPin size={14} />
                            {venue.city}
                        </p>
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
                    {/* Status Banner */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-600">Status:</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getStatusColor(venue.status)}`}>
                                    {venue.status}
                                </span>
                            </div>
                        </div>
                        {venue.rating && (
                            <div className="flex items-center gap-2">
                                <Star className="text-yellow-500 fill-yellow-500" size={20} />
                                <span className="text-xl font-bold text-gray-900">{Number(venue.rating).toFixed(1)}</span>
                            </div>
                        )}
                    </div>

                    {/* Images Gallery */}
                    {venue.images && venue.images.length > 0 && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <ImageIcon className="text-blue-600" size={20} />
                                Venue Gallery
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {venue.images.map((image, index) => (
                                    <div key={index} className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                                        <img
                                            src={image.image_url}
                                            alt={`Venue ${index + 1}`}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Basic Information */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Venue Details */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Building2 className="text-purple-600" size={20} />
                                Venue Details
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Type</p>
                                    <p className="font-semibold text-gray-900 capitalize">{venue.type}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Capacity</p>
                                    <div className="flex items-center gap-2">
                                        <Users size={18} className="text-gray-400" />
                                        <p className="font-semibold text-gray-900">{venue.capacity} people</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Base Price</p>
                                    <div className="flex items-center gap-2">
                                        <DollarSign size={18} className="text-green-600" />
                                        <p className="font-bold text-green-700 text-lg">{formatCurrency(venue.base_price)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <MapPin className="text-red-600" size={20} />
                                Location
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">City</p>
                                    <p className="font-semibold text-gray-900">{venue.city}</p>
                                </div>
                                {venue.address && (
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Full Address</p>
                                        <p className="font-semibold text-gray-700 leading-relaxed">{venue.address}</p>
                                    </div>
                                )}
                                {venue.owner_name && (
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Owner</p>
                                        <p className="font-semibold text-gray-900">{venue.owner_name}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {venue.description && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-3">Description</h3>
                            <p className="text-gray-700 leading-relaxed">{venue.description}</p>
                        </div>
                    )}

                    {/* Facilities */}
                    {venue.facilities && venue.facilities.length > 0 && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Available Facilities</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {venue.facilities.map((facility, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                        <Check className="text-blue-600" size={18} />
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900 text-sm">{facility.facility_name}</p>
                                            {facility.extra_price > 0 && (
                                                <p className="text-xs text-blue-600 font-medium">+{formatCurrency(facility.extra_price)}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Booking Statistics */}
                    {(venue.total_bookings !== undefined || venue.total_revenue !== undefined) && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Booking Statistics</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {venue.total_bookings !== undefined && (
                                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Calendar className="text-blue-600" size={18} />
                                            <p className="text-sm font-bold text-blue-600 uppercase">Total Bookings</p>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900">{venue.total_bookings || 0}</p>
                                    </div>
                                )}
                                {venue.total_revenue !== undefined && (
                                    <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <DollarSign className="text-green-600" size={18} />
                                            <p className="text-sm font-bold text-green-600 uppercase">Total Revenue</p>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(venue.total_revenue || 0)}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Reviews */}
                    {venue.reviews && venue.reviews.length > 0 && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Reviews</h3>
                            <div className="space-y-4">
                                {venue.reviews.slice(0, 3).map((review, index) => (
                                    <div key={index} className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="font-bold text-gray-900">{review.customer_name}</p>
                                            <div className="flex items-center gap-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={14}
                                                        className={i < review.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        {review.review_text && (
                                            <p className="text-sm text-gray-700 italic">"{review.review_text}"</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-4 flex gap-3">
                    {onApprove && venue.status !== 'active' && (
                        <button
                            onClick={onApprove}
                            className="flex-1 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-colors font-bold shadow-lg shadow-green-200"
                        >
                            Approve Venue
                        </button>
                    )}

                    {onReject && venue.status !== 'rejected' && (
                        <button
                            onClick={onReject}
                            className="flex-1 bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 transition-colors font-bold shadow-lg shadow-red-200"
                        >
                            {venue.status === 'active' ? 'Deactivate Venue' : 'Reject Venue'}
                        </button>
                    )}

                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-colors font-bold"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VenueDetailsModal;
