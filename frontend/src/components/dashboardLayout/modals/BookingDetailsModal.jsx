// components/dashboardLayout/modals/BookingDetailsModal.jsx
import React from 'react';
import { X, Calendar, User, Mail, Phone, MapPin, DollarSign, Building2, Clock, CreditCard, Star, CheckCircle, Package } from 'lucide-react';
import { ownerService } from '../../../services/api';

const BookingDetailsModal = ({ booking, onClose, onUpdateStatus }) => {
    if (!booking) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'confirmed': return 'bg-green-50 text-green-700 border-green-200';
            case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'completed': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const getPaymentStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'bg-green-50 text-green-700 border-green-200';
            case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'failed': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const handleMarkCompleted = async () => {
        if (!onUpdateStatus) return;

        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user'));
            const ownerId = user?.id || user?.user_id; // Robust ID fetch

            await ownerService.updateBookingStatus(ownerId, booking.booking_id, { status: 'completed' }, token);
            onUpdateStatus(); // Refresh parent data
            onClose();
        } catch (error) {
            console.error("Error marking booking as completed:", error);
            alert("Failed to update booking status. Please try again.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 flex justify-between items-center z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Booking Details</h2>
                        <p className="text-blue-100 text-sm mt-0.5">Reference #{booking.booking_id}</p>
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
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Calendar className="text-blue-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Booking Status</p>
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold border mt-1 ${getStatusColor(booking.status)}`}>
                                    {booking.status}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500 font-medium">Created</p>
                            <p className="text-sm font-semibold text-gray-700">{formatDateTime(booking.created_at)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Event Information */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Calendar className="text-blue-600" size={20} />
                                Event Information
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Event Type</p>
                                    <p className="font-semibold text-gray-900 capitalize">{booking.event_type || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Event Date</p>
                                    <p className="font-semibold text-gray-900">{formatDate(booking.event_date)}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Time Slot</p>
                                    <p className="font-semibold text-gray-900">{booking.slot || 'N/A'}</p>
                                </div>

                            </div>
                        </div>

                        {/* Venue Information */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Building2 className="text-purple-600" size={20} />
                                Venue Information
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Venue Name</p>
                                    <p className="font-semibold text-gray-900">{booking.venue_name || 'N/A'}</p>
                                </div>
                                {booking.venue_address && (
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Address</p>
                                        <p className="font-semibold text-gray-700 text-sm">{booking.venue_address}</p>
                                    </div>
                                )}
                                {booking.venue_city && (
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">City</p>
                                        <p className="font-semibold text-gray-900">{booking.venue_city}</p>
                                    </div>
                                )}
                                {booking.owner_name && (
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Owner</p>
                                        <p className="font-semibold text-gray-900">{booking.owner_name}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Customer Information */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <User className="text-green-600" size={20} />
                                Customer Details
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                        <User size={20} className="text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase">Full Name</p>
                                        <p className="font-semibold text-gray-900">{booking.fullname || booking.customer_name || 'N/A'}</p>
                                    </div>
                                </div>
                                {(booking.email || booking.customer_email) && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <Mail size={18} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase">Email</p>
                                            <p className="font-semibold text-gray-700 text-sm">{booking.email || booking.customer_email}</p>
                                        </div>
                                    </div>
                                )}
                                {booking.phone_primary && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                            <Phone size={18} className="text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase">Primary Phone</p>
                                            <p className="font-semibold text-gray-900">{booking.phone_primary}</p>
                                        </div>
                                    </div>
                                )}
                                {booking.phone_secondary && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                            <Phone size={18} className="text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase">Secondary Phone</p>
                                            <p className="font-semibold text-gray-900">{booking.phone_secondary}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Information */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <DollarSign className="text-emerald-600" size={20} />
                                Payment Details
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
                                    <span className="text-sm font-medium text-gray-600">Total Amount</span>
                                    <span className="text-2xl font-bold text-emerald-700">Rs. {booking.total_price?.toLocaleString()}</span>
                                </div>
                                {booking.payment && (
                                    <>
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Payment Status</p>
                                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${getPaymentStatusColor(booking.payment.payment_status)}`}>
                                                {booking.payment.payment_status}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Payment Method</p>
                                            <p className="font-semibold text-gray-900 capitalize">{booking.payment.method?.replace('_', ' ')}</p>
                                        </div>
                                        {booking.payment.payment_date && (
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Payment Date</p>
                                                <p className="font-semibold text-gray-700">{formatDateTime(booking.payment.payment_date)}</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Facilities */}
                    {booking.facilities && booking.facilities.length > 0 && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Package className="text-orange-600" size={20} />
                                Selected Facilities
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {booking.facilities.map((facility, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <CheckCircle className="text-green-600" size={18} />
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900 text-sm">{facility.facility_name}</p>
                                            {facility.extra_price > 0 && (
                                                <p className="text-xs text-gray-500">+Rs. {facility.extra_price}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Special Requirements */}
                    {booking.special_requirements && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-3">Special Requirements</h3>
                            <p className="text-gray-700 leading-relaxed">{booking.special_requirements}</p>
                        </div>
                    )}



                    {/* Timeline */}
                    {booking.timeline && booking.timeline.length > 0 && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Clock className="text-indigo-600" size={20} />
                                Activity Timeline
                            </h3>
                            <div className="space-y-3">
                                {booking.timeline.map((log, index) => (
                                    <div key={index} className="flex gap-3 items-start">
                                        <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold text-gray-900 text-sm">{log.action_type}</p>
                                                <p className="text-xs text-gray-500">{formatDateTime(log.created_at)}</p>
                                            </div>
                                            {log.action_details && (
                                                <p className="text-xs text-gray-600 mt-0.5">{log.action_details}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-4 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                    >
                        Close
                    </button>

                </div>
            </div>
        </div>
    );
};

export default BookingDetailsModal;
