import React, { useState } from 'react';

const PaymentMethod = ({ data, onUpdate, onNext, onBack }) => {
    const [transactionId, setTransactionId] = useState(data.transactionId || '');

    const handleChange = (field, value) => {
        onUpdate({ ...data, [field]: value });
    };

    const handleSubmit = () => {
        handleChange('transactionId', transactionId);
        onNext();
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Method</h1>
            <p className="text-gray-600 mb-6">Complete your payment details</p>

            <div className="space-y-6">
                {/* Account Information */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-blue-800 mb-4">Account Information</h2>

                    <div className="space-y-3">
                        <div className="flex items-start">
                            <div className="w-1/3 font-medium text-gray-700">Account Holder's Name:</div>
                            <div className="w-2/3 font-semibold text-gray-900">Nihal Shiekh</div>
                        </div>

                        <div className="flex items-start">
                            <div className="w-1/3 font-medium text-gray-700">Account Number:</div>
                            <div className="w-2/3 font-semibold text-gray-900">PA-0001234567-TEST</div>
                        </div>

                        <div className="flex items-start">
                            <div className="w-1/3 font-medium text-gray-700">Account Holder's Number:</div>
                            <div className="w-2/3 font-semibold text-gray-900">+92 310 56790286</div>
                        </div>
                    </div>
                </div>

                {/* Transaction ID */}
                <div>
                    <label className="block text-lg font-semibold text-gray-800 mb-2">
                        Transaction ID *
                    </label>
                    <p className="text-gray-600 mb-4">
                        After making payment, write Transaction ID here and send transaction receipt to owner's number
                    </p>
                    <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="Enter Transaction ID"
                        required
                    />
                    <p className="text-sm text-gray-500 mt-2">
                        Please send the payment receipt to +92 310 56790286 via WhatsApp
                    </p>
                </div>

                {/* Payment Methods */}
                <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Selected Payment Method:</h3>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-800">
                                    {data.paymentMethod === 'bank' ? 'Bank Transfer' : 'Cash Payment'}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {data.paymentMethod === 'bank'
                                        ? 'Direct bank transfer to provided account'
                                        : 'Payment at venue on event day'}
                                </p>
                            </div>
                            <div className={`px-4 py-2 rounded-full ${data.paymentMethod === 'bank' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                {data.paymentMethod === 'bank' ? 'Online' : 'Cash'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="pt-4 border-t border-gray-200 flex gap-4">
                    <button
                        onClick={onBack}
                        className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                        ← Back
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!transactionId}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        Next → Booking Summary
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentMethod;
