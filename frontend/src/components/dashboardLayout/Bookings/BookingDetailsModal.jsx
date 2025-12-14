// components/BookingDetailsModal.jsx
import React, { useState } from 'react';
import {
    X, User, Phone, Mail, Calendar, MapPin, Users,
    CreditCard, FileText, CheckCircle, XCircle, Edit
} from 'lucide-react';

const BookingDetailsModal = ({
    isOpen,
    onClose,
    booking,
    onApprove,
    onReject,
    onUpdateStatus
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [notes, setNotes] = useState(booking.notes || '');

    if (!isOpen || !booking) return null;

    const handleSaveNotes = () => {
        // In a real app, you would update the booking in your database
        ('Saving notes:', notes);
        setIsEditing(false);
    };

    const handleStatusChange = (newStatus) => {
        if (newStatus === 'confirmed') {
            onApprove(booking.id);
        } else if (newStatus === 'cancelled') {
            onReject(booking.id);
        } else {
            onUpdateStatus(booking.id, newStatus);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'confirmed': return 'bg-blue-100 text-blue-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const statusOptions = [
        { value: 'pending', label: 'Pending', color: 'text-yellow-600' },
        { value: 'confirmed', label: 'Confirmed', color: 'text-blue-600' },
        { value: 'completed', label: 'Completed', color: 'text-green-600' },
        { value: 'cancelled', label: 'Cancelled', color: 'text-red-600' }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                            Booking #{booking.id}
                        </h2>
                        <div className="flex items-center gap-3 mt-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                            <span className="text-gray-500 text-sm">
                                Created: {new Date(booking.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column - Booking Details */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Calendar size={20} />
                                Booking Information
                            </h3>

                            <div className="space-y-6">
                                {/* Customer Info */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                                        <User size={18} />
                                        Customer Details
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                                <User className="text-blue-600" size={20} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{booking.customer}</p>
                                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                                    <span className="flex items-center gap-1">
                                                        <Phone size={14} />
                                                        {booking.contact}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Mail size={14} />
                                                        {booking.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Venue Info */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                                        <MapPin size={18} />
                                        Venue Details
                                    </h4>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="font-bold text-gray-800 text-lg">{booking.venue}</p>
                                            <p className="text-gray-600">Event Type: {booking.eventType}</p>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-2">
                                                <Users size={18} className="text-gray-500" />
                                                <span className="text-gray-700">{booking.guests} Guests</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar size={18} className="text-gray-500" />
                                                <span className="text-gray-700">{booking.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Info */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                                        <CreditCard size={18} />
                                        Payment Information
                                    </h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Amount:</span>
                                            <span className="font-bold text-green-700 text-lg">{booking.amount}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Payment Method:</span>
                                            <span className="font-medium text-gray-800">{booking.paymentMethod}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Status:</span>
                                            <span className={`px-2 py-1 rounded text-sm ${getStatusColor(booking.status)}`}>
                                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Actions & Notes */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <FileText size={20} />
                                Actions & Notes
                            </h3>

                            <div className="space-y-6">
                                {/* Status Actions */}
                                <div className="bg-white border rounded-lg p-4">
                                    <h4 className="font-medium text-gray-700 mb-3">Update Status</h4>
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        {statusOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => handleStatusChange(option.value)}
                                                disabled={booking.status === option.value}
                                                className={`p-3 rounded-lg border text-center ${booking.status === option.value
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                    : 'border-gray-300 hover:bg-gray-50'
                                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                <div className={`font-medium ${option.color}`}>
                                                    {option.label}
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    {booking.status === 'pending' && (
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => onApprove(booking.id)}
                                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                            >
                                                <CheckCircle size={18} />
                                                Approve Booking
                                            </button>
                                            <button
                                                onClick={() => onReject(booking.id)}
                                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                            >
                                                <XCircle size={18} />
                                                Reject Booking
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Notes Section */}
                                <div className="bg-white border rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-medium text-gray-700 flex items-center gap-2">
                                            <FileText size={18} />
                                            Notes
                                        </h4>
                                        {!isEditing ? (
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                                            >
                                                <Edit size={16} />
                                                Edit
                                            </button>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setIsEditing(false);
                                                        setNotes(booking.notes);
                                                    }}
                                                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleSaveNotes}
                                                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {isEditing ? (
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            rows="4"
                                            placeholder="Add notes about this booking..."
                                        />
                                    ) : (
                                        <div className="bg-gray-50 rounded-lg p-4 min-h-[100px]">
                                            {booking.notes ? (
                                                <p className="text-gray-700 whitespace-pre-wrap">{booking.notes}</p>
                                            ) : (
                                                <p className="text-gray-500 italic">No notes added yet</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Quick Actions */}
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                                    <h4 className="font-medium text-blue-700 mb-3">Quick Actions</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button className="p-3 bg-white border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-50">
                                            Send Invoice
                                        </button>
                                        <button className="p-3 bg-white border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-50">
                                            View Contract
                                        </button>
                                        <button className="p-3 bg-white border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-50">
                                            Contact Customer
                                        </button>
                                        <button className="p-3 bg-white border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-50">
                                            Download Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t flex justify-end gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Close
                        </button>
                        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingDetailsModal;