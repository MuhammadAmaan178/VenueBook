import React, { useState } from 'react';
import { CreditCard, Wallet, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';

const PaymentMethod = ({ data, onUpdate, onNext, onBack }) => {
    const [transactionId, setTransactionId] = useState(data.transactionId || '');
    const [copied, setCopied] = useState(false);

    const handleChange = (field, value) => {
        onUpdate({ ...data, [field]: value });
    };

    const handleSubmit = () => {
        if (data.paymentMethod === 'bank') {
            handleChange('transactionId', transactionId);
        } else {
            handleChange('transactionId', 'CASH-PAYMENT');
        }
        onNext();
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText('PA-0001234567-TEST');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-8 border border-white/50">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Payment</h1>
            <p className="text-gray-500 mb-8">Finalize your booking by completing the payment.</p>

            <div className="space-y-8">
                {/* Account Information Card - Only for Bank Transfer */}
                {data.paymentMethod === 'bank' && (
                    <>
                        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>

                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 relative z-10">
                                <CreditCard className="w-5 h-5" /> Official Bank Account
                            </h2>

                            <div className="space-y-4 relative z-10">
                                <div className="flex justify-between items-center border-b border-white/20 pb-2">
                                    <span className="text-blue-200 text-sm">Account Holder</span>
                                    <span className="font-bold text-lg tracking-wide">Nihal Shiekh</span>
                                </div>

                                <div className="flex justify-between items-center border-b border-white/20 pb-2">
                                    <span className="text-blue-200 text-sm">Account Number</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-lg tracking-wider">PA-0001234567-TEST</span>
                                        <button
                                            onClick={copyToClipboard}
                                            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                                            title="Copy Account Number"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-green-300" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-blue-200 text-sm">Bank Name</span>
                                    <span className="font-bold">Meezan Bank Ltd.</span>
                                </div>
                            </div>
                        </div>

                        {/* Transaction ID */}
                        <div className="space-y-4">
                            <label className="block text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-blue-600" />
                                Enter Transaction ID <span className="text-red-500">*</span>
                            </label>
                            <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl text-orange-800 text-sm flex gap-3">
                                <div className="mt-0.5">⚠️</div>
                                <p>
                                    Please make the transfer to the account above and enter the Transaction ID below.
                                    Also send a screenshot of the receipt to <span className="font-bold">+92 310 56790286</span> on WhatsApp.
                                </p>
                            </div>
                            <input
                                type="text"
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)}
                                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-mono font-medium text-lg text-gray-900 placeholder-gray-400 tracking-wider"
                                placeholder="e.g. TRX-88291029"
                                required
                            />
                        </div>
                    </>
                )}

                {/* Cash Payment Message */}
                {data.paymentMethod === 'cash' && (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                            <Wallet className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-green-800">Cash Payment Selected</h2>
                        <p className="text-green-700 max-w-md mx-auto">
                            You have chosen to pay in cash. Please visit the venue to complete your payment before the event date.
                        </p>
                    </div>
                )}

                {/* Selected Method Summary */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Payment Mode</p>
                        <p className="font-bold text-gray-900 flex items-center gap-2">
                            {data.paymentMethod === 'bank' ? 'Bank Transfer' : 'Cash Payment'}
                        </p>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${data.paymentMethod === 'bank' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                        {data.paymentMethod === 'bank' ? 'Online' : 'On Site'}
                    </div>
                </div>

                {/* Navigation */}
                <div className="pt-6 border-t border-gray-100 flex gap-4">
                    <button
                        onClick={onBack}
                        className="flex-1 py-4 border-2 border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
                    >
                        <ChevronLeft className="w-5 h-5" /> Back
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={data.paymentMethod === 'bank' && !transactionId}
                        className={`
                            flex-[2] py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all duration-300
                            ${(data.paymentMethod === 'bank' && !transactionId)
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:-translate-y-1 hover:shadow-blue-500/30'
                            }
                        `}
                    >
                        Review Booking <ChevronRight className="w-5 h-5 ml-1" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentMethod;
