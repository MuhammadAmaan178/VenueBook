import React from 'react';
import { X, CreditCard, Calendar, User, Building, MapPin, Hash, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const PaymentDetailsModal = ({ isOpen, onClose, payment }) => {
    if (!isOpen || !payment) return null;

    const StatusBadge = ({ status }) => {
        const styles = {
            completed: 'bg-green-100 text-green-700 border-green-200',
            pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            failed: 'bg-red-100 text-red-700 border-red-200',
            refunded: 'bg-gray-100 text-gray-700 border-gray-200'
        };
        const icons = {
            completed: <CheckCircle size={14} />,
            pending: <Clock size={14} />,
            failed: <AlertCircle size={14} />,
            refunded: <Clock size={14} /> // Or a refund icon if available
        };

        const style = styles[status] || styles.pending;
        const icon = icons[status] || icons.pending;

        return (
            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${style}`}>
                {icon}
                {status}
            </span>
        );
    };

    const DetailItem = ({ icon: Icon, label, value, subValue }) => (
        <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Icon size={18} />
            </div>
            <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{value}</p>
                {subValue && <p className="text-xs text-gray-500 mt-0.5">{subValue}</p>}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
            <div className="payment-modal-content bg-white/95 backdrop-blur-xl w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-white/20 ring-1 ring-black/5">

                {/* Header */}
                <div className="relative h-32 bg-gradient-to-r from-blue-600 to-indigo-700 flex flex-col justify-end p-6">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md transition-all duration-200 border border-white/10 shadow-lg"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-end justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-blue-100 mb-2">
                                <CreditCard size={18} />
                                <span className="text-sm font-medium tracking-wide">PAYMENT DETAILS</span>
                            </div>
                            <h2 className="text-3xl font-bold text-white tracking-tight">
                                {payment.venue_name || 'N/A'}
                            </h2>
                        </div>
                        <div className="text-right">
                            <p className="text-white/80 text-sm font-medium mb-1">Total Amount</p>
                            <p className="text-3xl font-bold text-white">Rs. {Number(payment.amount).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">

                    {/* Status & ID */}
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                        <div className="flex items-center gap-4">
                            <StatusBadge status={payment.payment_status} />
                            <span className="text-sm text-gray-400 font-medium">|</span>
                            <span className="text-sm text-gray-500 font-mono">ID: #{payment.payment_id}</span>
                        </div>
                        <div className="text-sm text-gray-500">
                            {new Date(payment.payment_date).toLocaleString()}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* Transaction Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-2">
                                <CreditCard size={16} className="text-blue-600" />
                                Transaction Info
                            </h3>
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2">
                                <DetailItem
                                    icon={Hash}
                                    label="Transaction ID"
                                    value={payment.trx_id || 'N/A'}
                                />
                                <DetailItem
                                    icon={DollarSign}
                                    label="Method"
                                    value={payment.method || 'N/A'}
                                />
                                <DetailItem
                                    icon={Calendar}
                                    label="Booking Event Date"
                                    value={new Date(payment.event_date).toLocaleDateString()}
                                    subValue={payment.event_type}
                                />
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-2">
                                <User size={16} className="text-blue-600" />
                                Payer Details
                            </h3>
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2">
                                <DetailItem
                                    icon={User}
                                    label="Customer Name"
                                    value={payment.customer_name || 'N/A'}
                                />
                                <DetailItem
                                    icon={Building}
                                    label="Customer Email"
                                    value={payment.customer_email || 'N/A'}
                                />
                            </div>
                        </div>

                        {/* Venue Info */}
                        <div className="space-y-4 md:col-span-2">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-2">
                                <Building size={16} className="text-blue-600" />
                                Venue & Owner
                            </h3>
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 grid grid-cols-1 md:grid-cols-2">
                                <DetailItem
                                    icon={Building}
                                    label="Venue"
                                    value={payment.venue_name}
                                    subValue={payment.venue_city}
                                />
                                <DetailItem
                                    icon={User}
                                    label="Owner"
                                    value={payment.owner_name}
                                    subValue="Business Owner"
                                />
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-8 py-5 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-white text-gray-700 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all"
                    >
                        Close
                    </button>
                    <button
                        className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-black shadow-lg shadow-gray-200 transition-all flex items-center gap-2"
                        onClick={() => window.print()}
                    >
                        <CreditCard size={16} />
                        Download Receipt
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentDetailsModal;
