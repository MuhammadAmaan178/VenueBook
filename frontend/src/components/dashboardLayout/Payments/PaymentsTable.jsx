// components/PaymentsTable.jsx
import React from 'react';
import { Eye, CheckCircle, XCircle, RefreshCw, DollarSign, User, Building } from 'lucide-react';

const PaymentsTable = ({ payments, onViewDetails, onApprove, onReject, onRefund }) => {
    const getStatusBadge = (status) => {
        const config = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⏳', label: 'Pending' },
            processing: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '🔄', label: 'Processing' },
            completed: { bg: 'bg-green-100', text: 'text-green-800', icon: '✅', label: 'Completed' },
            failed: { bg: 'bg-red-100', text: 'text-red-800', icon: '❌', label: 'Failed' },
            refunded: { bg: 'bg-purple-100', text: 'text-purple-800', icon: '↩️', label: 'Refunded' }
        };

        const { bg, text, icon, label } = config[status] || config.pending;

        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${bg} ${text}`}>
                <span>{icon}</span>
                {label}
            </span>
        );
    };

    const getPaymentMethodIcon = (method) => {
        const icons = {
            'Bank Transfer': '🏦',
            'Credit Card': '💳',
            'EasyPaisa': '📱',
            'JazzCash': '📲',
            'Cash': '💰'
        };
        return icons[method] || '💸';
    };

    if (payments.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <DollarSign className="text-gray-400" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No payments found</h3>
                <p className="text-gray-500">Try adjusting your filters</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {/* Table Header */}
            <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-800">
                    Payment Transactions ({payments.length})
                </h2>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Payment ID</th>
                            <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Customer</th>
                            <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Venue</th>
                            <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Date</th>
                            <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Amount</th>
                            <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Method</th>
                            <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Status</th>
                            <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.map((payment) => (
                            <tr key={payment.id} className="border-b hover:bg-gray-50">
                                {/* Payment ID */}
                                <td className="py-4 px-6">
                                    <div className="font-mono font-medium text-gray-800">
                                        #{payment.id}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Txn: {payment.transactionId}
                                    </div>
                                </td>

                                {/* Customer */}
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <User size={18} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-800">{payment.customer}</div>
                                            <div className="text-sm text-gray-500">
                                                Booking: {payment.bookingId}
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* Venue */}
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                            <Building size={18} className="text-green-600" />
                                        </div>
                                        <div className="font-medium text-gray-800">{payment.venue}</div>
                                    </div>
                                </td>

                                {/* Date */}
                                <td className="py-4 px-6">
                                    <div className="font-medium text-gray-800">{payment.date}</div>
                                    <div className="text-sm text-gray-500">
                                        Due: {payment.dueDate}
                                    </div>
                                </td>

                                {/* Amount */}
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-2">
                                        <DollarSign size={18} className="text-green-600" />
                                        <span className="font-bold text-green-700 text-lg">
                                            {payment.amount}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Inv: {payment.invoiceNumber}
                                    </div>
                                </td>

                                {/* Payment Method */}
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{getPaymentMethodIcon(payment.paymentMethod)}</span>
                                        <span className="font-medium text-gray-800">
                                            {payment.paymentMethod}
                                        </span>
                                    </div>
                                </td>

                                {/* Status */}
                                <td className="py-4 px-6">
                                    {getStatusBadge(payment.status)}
                                    {payment.status === 'pending' && (
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={() => onApprove(payment.id)}
                                                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => onReject(payment.id)}
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
                                            onClick={() => onViewDetails(payment)}
                                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                            title="View Details"
                                        >
                                            <Eye size={18} />
                                        </button>

                                        {payment.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => onApprove(payment.id)}
                                                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg"
                                                    title="Approve"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                                <button
                                                    onClick={() => onReject(payment.id)}
                                                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                    title="Reject"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            </>
                                        )}

                                        {payment.status === 'completed' && (
                                            <button
                                                onClick={() => onRefund(payment.id)}
                                                className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                                                title="Refund"
                                            >
                                                <RefreshCw size={18} />
                                            </button>
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
                    Showing {payments.length} of {payments.length} payments
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

export default PaymentsTable;