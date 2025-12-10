import React from 'react';
import { X, Calendar, User, Mail, Phone, MapPin, DollarSign } from 'lucide-react';

const BookingDetailsModal = ({ booking, onClose }) => {
    if (!booking) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'completed': return 'bg-blue-100 text-blue-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Booking Info */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Booking Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Booking ID</p>
                                <p className="font-semibold">#{booking.booking_id}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Status</p>
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(booking.status)}`}>
                                    {booking.status}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Event Date</p>
                                <p className="font-semibold flex items-center gap-2">
                                    <Calendar size={16} />
                                    {formatDate(booking.event_date)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Time Slot</p>
                                <p className="font-semibold">{booking.slot || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Venue</p>
                                <p className="font-semibold">{booking.venue_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Price</p>
                                <p className="font-semibold flex items-center gap-1">
                                    <DollarSign size={16} />
                                    Rs. {booking.total_price?.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <User size={18} className="text-gray-600" />
                                <div>
                                    <p className="text-sm text-gray-600">Name</p>
                                    <p className="font-semibold">{booking.fullname || booking.customer_name || 'N/A'}</p>
                                </div>
                            </div>
                            {(booking.email || booking.customer_email) && (
                                <div className="flex items-center gap-3">
                                    <Mail size={18} className="text-gray-600" />
                                    <div>
                                        <p className="text-sm text-gray-600">Email</p>
                                        <p className="font-semibold">{booking.email || booking.customer_email}</p>
                                    </div>
                                </div>
                            )}
                            {booking.phone_primary && (
                                <div className="flex items-center gap-3">
                                    <Phone size={18} className="text-gray-600" />
                                    <div>
                                        <p className="text-sm text-gray-600">Phone</p>
                                        <p className="font-semibold">{booking.phone_primary}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Event Details */}
                    {booking.event_type && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Event Type</h3>
                            <p className="text-gray-700 capitalize">{booking.event_type}</p>
                        </div>
                    )}

                    {/* Special Requirements */}
                    {booking.special_requirements && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Special Requirements</h3>
                            <p className="text-gray-700">{booking.special_requirements}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t px-6 py-4">
                    <button
                        onClick={onClose}
                        className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingDetailsModal;
