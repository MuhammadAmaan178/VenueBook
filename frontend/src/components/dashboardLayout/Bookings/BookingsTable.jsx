// components/BookingsTable.jsx
import React from 'react';
import { Eye, CheckCircle, XCircle, Calendar, User, Building } from 'lucide-react';

const BookingsTable = ({ bookings, onViewDetails, onApprove, onReject, onUpdateStatus }) => {
    const getStatusBadge = (status) => {
        const config = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
            confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Confirmed' },
            completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
            cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' }
        };

        const { bg, text, label } = config[status] || config.pending;

        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${bg} ${text}`}>
                {label}
            </span>
        );
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const handleQuickAction = (bookingId, action) => {
        if (action === 'approve') {
            onApprove(bookingId);
        } else if (action === 'reject') {
            onReject(bookingId);
        }
    };

    if (bookings.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Calendar className="text-gray-400" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No bookings found</h3>
                <p className="text-gray-500">Try adjusting your filters or check back later</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {/* Table Header */}
            <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-800">
                    All Bookings ({bookings.length})
                </h2>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Booking ID</th>
                            <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Customer</th>
                            <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Venue</th>
                            <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Date</th>
                            <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Amount</th>
                            <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Status</th>
                            <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.map((booking) => (
                            <tr key={booking.id} className="border-b hover:bg-gray-50">
                                {/* Booking ID */}
                                <td className="py-4 px-6">
                                    <div className="font-mono font-medium text-gray-800">
                                        #{booking.id}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Created: {formatDate(booking.createdAt)}
                                    </div>
                                </td>

                                {/* Customer */}
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <User size={18} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-800">{booking.customer}</div>
                                            <div className="text-sm text-gray-500">{booking.email}</div>
                                        </div>
                                    </div>
                                </td>

                                {/* Venue */}
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                            <Building size={18} className="text-green-600" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-800">{booking.venue}</div>
                                            <div className="text-sm text-gray-500">{booking.eventType}</div>
                                        </div>
                                    </div>
                                </td>

                                {/* Date */}
                                <td className="py-4 px-6">
                                    <div className="font-medium text-gray-800">{booking.date}</div>

                                </td>

                                {/* Amount */}
                                <td className="py-4 px-6">
                                    <div className="font-bold text-green-700">{booking.amount}</div>
                                    <div className="text-sm text-gray-500">
                                        {booking.paymentMethod}
                                    </div>
                                </td>

                                {/* Status */}
                                <td className="py-4 px-6">
                                    {getStatusBadge(booking.status)}
                                    {booking.status === 'pending' && (
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={() => handleQuickAction(booking.id, 'approve')}
                                                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleQuickAction(booking.id, 'reject')}
                                                className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </td>

                                {/* Actions */}
                                <td className="py-4 px-6">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onViewDetails(booking)}
                                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                            title="View Details"
                                        >
                                            <Eye size={18} />
                                        </button>

                                        {booking.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => onApprove(booking.id)}
                                                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg"
                                                    title="Approve"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                                <button
                                                    onClick={() => onReject(booking.id)}
                                                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                    title="Reject"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination/Footer */}
            <div className="p-4 border-t flex justify-between items-center">
                <div className="text-sm text-gray-600">
                    Showing {bookings.length} of {bookings.length} bookings
                </div>
                <div className="flex gap-2">
                    <button className="px-3 py-1 border border-gray-300 rounded text-sm">
                        Previous
                    </button>
                    <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                        1
                    </button>
                    <button className="px-3 py-1 border border-gray-300 rounded text-sm">
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingsTable;