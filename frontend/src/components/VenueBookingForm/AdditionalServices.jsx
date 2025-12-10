import React from 'react';

const AdditionalServices = ({ data, onUpdate, onNext, onBack }) => {
    const services = [
        {
            id: 'catering',
            title: 'Catering Service',
            description: 'Professional catering with variety of menu options',
            price: 50000
        },
        {
            id: 'stageLighting',
            title: 'Stage & Lighting',
            description: 'Professional stage setup with LED lighting',
            price: 15000
        },
        {
            id: 'decoration',
            title: 'Decoration',
            description: 'Complete venue decoration as per theme',
            price: 25000
        },
        {
            id: 'photography',
            title: 'Photography & Videography',
            description: 'Professional photographer and videographer team',
            price: 30000
        },
        {
            id: 'projector',
            title: 'Projector & Screen',
            description: 'HD projector with large screen for presentations',
            price: 8000
        },
        {
            id: 'security',
            title: 'Security Services',
            description: 'Professional security personnel for event',
            price: 10000
        }
    ];

    const handleServiceToggle = (serviceId) => {
        const currentServices = data.services || [];
        const isSelected = currentServices.includes(serviceId);

        if (isSelected) {
            onUpdate({
                ...data,
                services: currentServices.filter(id => id !== serviceId)
            });
        } else {
            onUpdate({
                ...data,
                services: [...currentServices, serviceId]
            });
        }
    };

    const handlePaymentMethodSelect = (method) => {
        onUpdate({ ...data, paymentMethod: method });
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Additional Services</h1>
            <p className="text-gray-600 mb-6">Select additional services for your event</p>

            <div className="space-y-6">
                {/* Services List */}
                <div className="space-y-4">
                    {services.map((service) => {
                        const isSelected = data.services?.includes(service.id);

                        return (
                            <div
                                key={service.id}
                                className={`p-4 border rounded-lg cursor-pointer transition-all ${isSelected
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-300 hover:border-blue-300'
                                    }`}
                                onClick={() => handleServiceToggle(service.id)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-400'
                                                }`}>
                                                {isSelected && (
                                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                            <h3 className="font-medium text-gray-800">{service.title}</h3>
                                        </div>
                                        <p className="text-gray-600 text-sm mt-2 ml-8">{service.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-semibold text-blue-600">+Rs. {service.price.toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Payment Methods */}
                <div className="pt-6 border-t border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">PAYMENT METHODS</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                            onClick={() => handlePaymentMethodSelect('bank')}
                            className={`p-4 border rounded-lg text-left transition-all ${data.paymentMethod === 'bank'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 hover:border-blue-300'
                                }`}
                        >
                            <h3 className="font-medium text-gray-800 mb-1">Bank Transfer</h3>
                            <p className="text-sm text-gray-600">Direct bank transfer</p>
                        </button>

                        <button
                            onClick={() => handlePaymentMethodSelect('cash')}
                            className={`p-4 border rounded-lg text-left transition-all ${data.paymentMethod === 'cash'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 hover:border-blue-300'
                                }`}
                        >
                            <h3 className="font-medium text-gray-800 mb-1">Cash Payment</h3>
                            <p className="text-sm text-gray-600">Pay at venue</p>
                        </button>
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
                        onClick={onNext}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        Next → Payment Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdditionalServices;
