import React from 'react';
import { Calendar, Clock, Users, User, Mail, Phone, ChevronLeft, CheckCircle, Receipt } from 'lucide-react';

// Component 5: Booking Summary
const BookingSummary = ({ data, onSubmit, onBack, venue }) => {
    // Calculate totals
    const venueBasePrice = venue ? parseFloat(venue.base_price) : 150000;

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
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 overflow-hidden">
            {/* Header */}
            <div className="bg-gray-900 p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Booking Summary</h1>
                        <p className="text-gray-400">Review your details before confirming.</p>
                    </div>
                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                        <Receipt className="w-8 h-8 text-blue-300" />
                    </div>
                </div>
            </div>

            <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Event Details Section */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Event Details</h2>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-gray-700">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase">Date</p>
                                    <p className="font-semibold">
                                        {data.eventDate ? new Date(data.eventDate).toLocaleDateString('en-US', {
                                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                        }) : 'Not selected'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 text-gray-700">
                                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase">Time</p>
                                    <p className="font-semibold">{data.timeSlot || 'Not selected'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 text-gray-700">
                                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                    <Users className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase">Guests</p>
                                    <p className="font-semibold">{data.guests || 0} People</p>
                                </div>
                            </div>
                        </div>

                        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2 pt-4">Contact Info</h2>
                        <div className="space-y-3 pl-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <User className="w-4 h-4" /> {data.fullName || 'N/A'}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail className="w-4 h-4" /> {data.email || 'N/A'}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="w-4 h-4" /> {data.phoneNumber || 'N/A'}
                            </div>
                        </div>
                    </div>

                    {/* Pricing Breakdown Section */}
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Breakdown</h2>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center text-gray-600">
                                <span>Venue Base Price</span>
                                <span className="font-medium text-gray-900">Rs. {venueBasePrice.toLocaleString()}</span>
                            </div>

                            {getSelectedServices().map((service, index) => (
                                <div key={index} className="flex justify-between items-center text-blue-600">
                                    <span>{service.name}</span>
                                    <span className="font-medium">+ Rs. {service.price.toLocaleString()}</span>
                                </div>
                            ))}

                            <div className="border-t border-gray-200 my-2"></div>

                            <div className="flex justify-between items-center text-gray-600">
                                <span>Subtotal</span>
                                <span className="font-medium text-gray-900">Rs. {subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-600">
                                <span>Tax (5%)</span>
                                <span className="font-medium text-gray-900">Rs. {tax.toLocaleString()}</span>
                            </div>

                            <div className="border-t-2 border-dashed border-gray-300 my-4 pt-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold text-gray-900">Total Amount</span>
                                    <span className="text-2xl font-extrabold text-blue-600">Rs. {totalAmount.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="bg-blue-50 text-blue-800 text-xs font-bold px-3 py-2 rounded-lg mt-4 text-center">
                                Payment Method: {data.paymentMethod === 'bank' ? 'Bank Transfer' : 'Cash'} - TRX: {data.transactionId}
                            </div>
                        </div>
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
                        onClick={onSubmit}
                        className="flex-[2] py-4 bg-green-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-green-700 hover:shadow-green-500/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                    >
                        <CheckCircle className="w-6 h-6" /> Confirm Booking
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingSummary;
