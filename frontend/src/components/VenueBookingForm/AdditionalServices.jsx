import React from 'react';
import { Check, ChevronLeft, ChevronRight, Utensils, Lightbulb, PartyPopper, Camera, MonitorPlay, Shield } from 'lucide-react';

const AdditionalServices = ({ data, onUpdate, onNext, onBack }) => {
    const services = [
        {
            id: 'catering',
            title: 'Catering Service',
            description: 'Professional catering with variety of menu options',
            price: 50000,
            icon: Utensils
        },
        {
            id: 'stageLighting',
            title: 'Stage & Lighting',
            description: 'Professional stage setup with LED lighting',
            price: 15000,
            icon: Lightbulb
        },
        {
            id: 'decoration',
            title: 'Decoration',
            description: 'Complete venue decoration as per theme',
            price: 25000,
            icon: PartyPopper
        },
        {
            id: 'photography',
            title: 'Photography & Videography',
            description: 'Professional photographer and videographer team',
            price: 30000,
            icon: Camera
        },
        {
            id: 'projector',
            title: 'Projector & Screen',
            description: 'HD projector with large screen for presentations',
            price: 8000,
            icon: MonitorPlay
        },
        {
            id: 'security',
            title: 'Security Services',
            description: 'Professional security personnel for event',
            price: 10000,
            icon: Shield
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
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-8 border border-white/50">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Additional Services</h1>
            <p className="text-gray-500 mb-8">Select any extra services you need for your event.</p>

            <div className="space-y-8">
                {/* Services List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((service) => {
                        const isSelected = data.services?.includes(service.id);
                        const Icon = service.icon;

                        return (
                            <div
                                key={service.id}
                                onClick={() => handleServiceToggle(service.id)}
                                className={`
                                    relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 group
                                    ${isSelected
                                        ? 'border-blue-500 bg-blue-50 shadow-md transform scale-[1.02]'
                                        : 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-lg'
                                    }
                                `}
                            >
                                {isSelected && (
                                    <div className="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center animate-in zoom-in">
                                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                    </div>
                                )}

                                <div className="flex items-start gap-4">
                                    <div className={`
                                        p-3 rounded-xl transition-colors
                                        ${isSelected ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600'}
                                    `}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={`font-bold text-lg mb-1 ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>{service.title}</h3>
                                        <p className="text-sm text-gray-500 leading-relaxed mb-3">{service.description}</p>
                                        <div className={`
                                            inline-block px-3 py-1 rounded-lg text-sm font-bold
                                            ${isSelected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}
                                        `}>
                                            +Rs. {service.price.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Payment Methods */}
                <div className="pt-8 border-t border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        Payment Preference
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button
                            onClick={() => handlePaymentMethodSelect('bank')}
                            className={`
                                p-6 rounded-2xl border-2 text-left transition-all duration-300 relative overflow-hidden
                                ${data.paymentMethod === 'bank'
                                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                                    : 'border-gray-200 bg-gray-50 hover:bg-white hover:shadow-md'
                                }
                            `}
                        >
                            <div className="relative z-10">
                                <h3 className={`font-bold text-lg mb-1 ${data.paymentMethod === 'bank' ? 'text-blue-900' : 'text-gray-900'}`}>Bank Transfer</h3>
                                <p className="text-sm text-gray-500">Direct bank transfer to official account</p>
                            </div>
                            {data.paymentMethod === 'bank' && <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100 rounded-bl-[100px] -mr-4 -mt-4 opacity-50"></div>}
                        </button>

                        <button
                            onClick={() => handlePaymentMethodSelect('cash')}
                            className={`
                                p-6 rounded-2xl border-2 text-left transition-all duration-300 relative overflow-hidden
                                ${data.paymentMethod === 'cash'
                                    ? 'border-green-500 bg-green-50 shadow-lg'
                                    : 'border-gray-200 bg-gray-50 hover:bg-white hover:shadow-md'
                                }
                            `}
                        >
                            <div className="relative z-10">
                                <h3 className={`font-bold text-lg mb-1 ${data.paymentMethod === 'cash' ? 'text-green-900' : 'text-gray-900'}`}>Cash Payment</h3>
                                <p className="text-sm text-gray-500">Pay at venue on event day</p>
                            </div>
                            {data.paymentMethod === 'cash' && <div className="absolute top-0 right-0 w-24 h-24 bg-green-100 rounded-bl-[100px] -mr-4 -mt-4 opacity-50"></div>}
                        </button>
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
                        onClick={onNext}
                        className={`
                            flex-[2] py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all duration-300
                            bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:-translate-y-1 hover:shadow-blue-500/30
                        `}
                    >
                        Next Step <ChevronRight className="w-5 h-5 ml-1" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdditionalServices;
