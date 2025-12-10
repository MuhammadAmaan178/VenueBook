import React from 'react';

const BookingSummary = ({ data, onSubmit, onBack, venue }) => {
    // Calculate totals
    const venueBasePrice = venue ? parseFloat(venue.base_price) : 150000;
    const venueName = venue ? venue.name : 'Royal Banquet Hall';

    const servicePrices = {
        catering: 50000,
        stageLighting: 15000,
        decoration: 25000,
        photography: 30000,
        projector: 8000,
        security: 10000
    };

    const calculateServiceTotal = () => {
        if (!data.services || data.services.length === 0) return 0;
        return data.services.reduce((total, serviceId) => {
            return total + (servicePrices[serviceId] || 0);
        }, 0);
    };

    const serviceTotal = calculateServiceTotal();
    const subtotal = venueBasePrice + serviceTotal;
    const tax = subtotal * 0.05;
    const totalAmount = subtotal + tax;

    const getSelectedServices = () => {
        if (!data.services || data.services.length === 0) return [];

        const serviceNames = {
            catering: 'Catering Service',
            stageLighting: 'Stage & Lighting',
            decoration: 'Decoration',
            photography: 'Photography & Videography',
            projector: 'Projector & Screen',
            security: 'Security Services'
        };

        return data.services.map(serviceId => ({
            name: serviceNames[serviceId] || serviceId,
            price: servicePrices[serviceId] || 0
        }));
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Booking Summary</h1>
            <p className="text-gray-600 mb-6">Review and confirm your booking details</p>

            <div className="space-y-6">
                {/* Event Details */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-blue-800 mb-4">Event Details</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <div className="text-sm text-gray-600">Venue</div>
                            <div className="font-semibold text-gray-900">{venueName}</div>
                        </div>

                        <div>
                            <div className="text-sm text-gray-600">Date</div>
                            <div className="font-semibold text-gray-900">
                                {data.eventDate ? new Date(data.eventDate).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }) : 'Not specified'}
                            </div>
                        </div>

                        <div>
                            <div className="text-sm text-gray-600">Time Slot</div>
                            <div className="font-semibold text-gray-900">{data.timeSlot || 'Not specified'}</div>
                        </div>

                        <div>
                            <div className="text-sm text-gray-600">Guests</div>
                            <div className="font-semibold text-gray-900">{data.guests || '0'} people</div>
                        </div>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>

                    <div className="space-y-3">
                        <div className="flex items-start">
                            <div className="w-1/3 font-medium text-gray-700">Full Name:</div>
                            <div className="w-2/3 font-semibold text-gray-900">{data.fullName || 'Not provided'}</div>
                        </div>

                        <div className="flex items-start">
                            <div className="w-1/3 font-medium text-gray-700">Email:</div>
                            <div className="w-2/3 font-semibold text-gray-900">{data.email || 'Not provided'}</div>
                        </div>

                        <div className="flex items-start">
                            <div className="w-1/3 font-medium text-gray-700">Phone:</div>
                            <div className="w-2/3 font-semibold text-gray-900">{data.phoneNumber || 'Not provided'}</div>
                        </div>
                    </div>
                </div>

                {/* Price Breakdown */}
                <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Price Breakdown</h3>

                    <div className="space-y-3">
                        {/* Base Price */}
                        <div className="flex justify-between items-center py-2">
                            <div className="text-gray-700">Venue Base Price</div>
                            <div className="font-semibold text-gray-900">Rs. {venueBasePrice.toLocaleString()}</div>
                        </div>

                        {/* Selected Services */}
                        {getSelectedServices().map((service, index) => (
                            <div key={index} className="flex justify-between items-center py-2 border-t border-gray-100">
                                <div className="text-gray-700">{service.name}</div>
                                <div className="font-semibold text-blue-600">+Rs. {service.price.toLocaleString()}</div>
                            </div>
                        ))}

                        {/* Subtotal */}
                        <div className="flex justify-between items-center py-2 border-t border-gray-200 mt-2">
                            <div className="font-medium text-gray-800">Subtotal</div>
                            <div className="font-semibold text-gray-900">Rs. {subtotal.toLocaleString()}</div>
                        </div>

                        {/* Tax */}
                        <div className="flex justify-between items-center py-2">
                            <div className="text-gray-700">Tax (5%)</div>
                            <div className="font-semibold text-gray-900">Rs. {tax.toLocaleString()}</div>
                        </div>

                        {/* Total */}
                        <div className="flex justify-between items-center py-2 border-t border-gray-200 mt-2 pt-4">
                            <div className="text-xl font-bold text-gray-900">Total Amount</div>
                            <div className="text-2xl font-bold text-green-600">Rs. {totalAmount.toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                {/* Payment Details */}
                <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Details</h3>

                    <div className="space-y-3">
                        <div className="flex items-start">
                            <div className="w-1/3 font-medium text-gray-700">Payment Method:</div>
                            <div className="w-2/3">
                                <span className="font-semibold text-gray-900">
                                    {data.paymentMethod === 'bank' ? 'Bank Transfer' : 'Cash Payment'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <div className="w-1/3 font-medium text-gray-700">Transaction ID:</div>
                            <div className="w-2/3 font-semibold text-gray-900">{data.transactionId || 'Not provided'}</div>
                        </div>
                    </div>
                </div>

                {/* Special Requirements */}
                {data.specialRequirements && (
                    <div className="border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Special Requirements</h3>
                        <p className="text-gray-700">{data.specialRequirements}</p>
                    </div>
                )}

                {/* Navigation */}
                <div className="pt-4 border-t border-gray-200 flex gap-4">
                    <button
                        onClick={onBack}
                        className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                        ← Back
                    </button>
                    <button
                        onClick={onSubmit}
                        className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors text-lg"
                    >
                        BOOK NOW
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingSummary;
