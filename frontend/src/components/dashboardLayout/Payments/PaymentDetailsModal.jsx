// components/PaymentDetailsModal.jsx
import React from 'react';
import {
    X, User, Phone, Mail, Calendar, Building, DollarSign,
    CreditCard, FileText, CheckCircle, XCircle, RefreshCw,
    Clock, AlertCircle, Receipt
} from 'lucide-react';

const PaymentDetailsModal = ({
    isOpen,
    onClose,
    payment,
    onApprove,
    onReject,
    onRefund
}) => {
    if (!isOpen || !payment) return null;

    const getStatusConfig = (status) => {
        const configs = {
            pending: {
                color: 'text-yellow-600',
                bg: 'bg-yellow-100',
                label: 'Pending',
                icon: <Clock className="text-yellow-600" size={20} />
            },
            processing: {
                color: 'text-blue-600',
                bg: 'bg-blue-100',
                label: 'Processing',
                icon: <RefreshCw className="text-blue-600" size={20} />
            },
            completed: {
                color: 'text-green-600',
                bg: 'bg-green-100',
                label: 'Completed',
                icon: <CheckCircle className="text-green-600" size={20} />
            },
            failed: {
                color: 'text-red-600',
                bg: 'bg-red-100',
                label: 'Failed',
                icon: <XCircle className="text-red-600" size={20} />
            },
            refunded: {
                color: 'text-purple-600',
                bg: 'bg-purple-100',
                label: 'Refunded',
                icon: <RefreshCw className="text-purple-600" size={20} />
            }
        };
        return configs[status] || configs.pending;
    };

    const statusConfig = getStatusConfig(payment.status);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-lg ${statusConfig.bg}`}>
                                {statusConfig.icon}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">
                                    Payment #{payment.id}
                                </h2>
                                <div className={`inline-flex items-center gap-1 mt-1 ${statusConfig.color}`}>
                                    <span className="font-medium">{statusConfig.label}</span>
                                </div>
                            </div>
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
                        {/* Left Column - Payment Details */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Receipt size={20} />
                                Payment Information
                            </h3>

                            <div className="space-y-6">
                                {/* Payment Summary */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-medium text-gray-700">Transaction Summary</h4>
                                            <p className="text-sm text-gray-500">Transaction ID: {payment.transactionId}</p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full ${statusConfig.bg} ${statusConfig.color}`}>
                                            {statusConfig.label}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Invoice Number:</span>
                                            <span className="font-medium text-gray-800">{payment.invoiceNumber}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Booking ID:</span>
                                            <span className="font-medium text-gray-800">{payment.bookingId}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Payment Date:</span>
                                            <span className="font-medium text-gray-800">{payment.date}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Due Date:</span>
                                            <span className="font-medium text-gray-800">{payment.dueDate}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Amount Details */}
                                <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                                    <h4 className="font-medium text-green-700 mb-3 flex items-center gap-2">
                                        <DollarSign size={18} />
                                        Amount Details
                                    </h4>
                                    <div className="text-center mb-4">
                                        <div className="text-3xl font-bold text-green-700">
                                            {payment.amount}
                                        </div>
                                        <p className="text-green-600">Total Payment Amount</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Payment Method:</span>
                                            <span className="font-medium text-gray-800 flex items-center gap-2">
                                                <CreditCard size={16} />
                                                {payment.paymentMethod}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Created:</span>
                                            <span className="font-medium text-gray-800">{payment.createdAt}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Customer Details */}
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
                                                <p className="font-bold text-gray-800">{payment.customer}</p>
                                                <div className="text-sm text-gray-600 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Phone size={14} />
                                                        <span>+92 300 1234567</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Mail size={14} />
                                                        <span>{payment.customer.toLowerCase().replace(' ', '.')}@email.com</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Actions & Notes */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Building size={20} />
                                Venue & Actions
                            </h3>

                            <div className="space-y-6">
                                {/* Venue Details */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-700 mb-3">Venue Information</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                                <Building className="text-green-600" size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">{payment.venue}</p>
                                                <p className="text-gray-600">Karachi, Pakistan</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center p-2 bg-white rounded">
                                                <div className="text-sm text-gray-500">Event Date</div>
                                                <div className="font-medium text-gray-800">{payment.date}</div>
                                            </div>
                                            <div className="text-center p-2 bg-white rounded">
                                                <div className="text-sm text-gray-500">Booking ID</div>
                                                <div className="font-medium text-gray-800">{payment.bookingId}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Actions */}
                                <div className="bg-white border rounded-lg p-4">
                                    <h4 className="font-medium text-gray-700 mb-3">Payment Actions</h4>

                                    {payment.status === 'pending' && (
                                        <div className="space-y-3">
                                            <div className="text-sm text-gray-600 mb-3">
                                                This payment is pending approval. You can approve or reject it.
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => onApprove(payment.id)}
                                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                                >
                                                    <CheckCircle size={18} />
                                                    Approve Payment
                                                </button>
                                                <button
                                                    onClick={() => onReject(payment.id)}
                                                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                                >
                                                    <XCircle size={18} />
                                                    Reject Payment
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {payment.status === 'completed' && (
                                        <div className="space-y-3">
                                            <div className="text-sm text-gray-600 mb-3">
                                                This payment has been completed. You can process a refund if needed.
                                            </div>
                                            <button
                                                onClick={() => onRefund(payment.id)}
                                                className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                            >
                                                <RefreshCw size={18} />
                                                Process Refund
                                            </button>
                                        </div>
                                    )}

                                    {payment.status === 'failed' && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-red-600 mb-3">
                                                <AlertCircle size={18} />
                                                <span className="text-sm">This payment has failed. Contact the customer for resolution.</span>
                                            </div>
                                            <button className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg">
                                                Contact Customer
                                            </button>
                                        </div>
                                    )}

                                    {payment.status === 'refunded' && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-purple-600 mb-3">
                                                <CheckCircle size={18} />
                                                <span className="text-sm">This payment has been refunded successfully.</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Notes */}
                                <div className="bg-white border rounded-lg p-4">
                                    <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                                        <FileText size={18} />
                                        Notes
                                    </h4>
                                    <div className="bg-gray-50 rounded-lg p-4 min-h-[100px]">
                                        {payment.notes ? (
                                            <p className="text-gray-700 whitespace-pre-wrap">{payment.notes}</p>
                                        ) : (
                                            <p className="text-gray-500 italic">No notes added</p>
                                        )}
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="grid grid-cols-2 gap-3">
                                    <button className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 hover:bg-blue-100 flex items-center justify-center gap-2">
                                        <Receipt size={18} />
                                        View Invoice
                                    </button>
                                    <button className="p-3 bg-green-50 border border-green-100 rounded-lg text-green-700 hover:bg-green-100 flex items-center justify-center gap-2">
                                        <FileText size={18} />
                                        Generate Receipt
                                    </button>
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
                            Download Receipt
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentDetailsModal;