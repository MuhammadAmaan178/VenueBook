import React from 'react';

const ContactInformation = ({ data, onUpdate, onNext, onBack }) => {
    const handleChange = (field, value) => {
        onUpdate({ ...data, [field]: value });
    };

    const isFormValid = () => {
        return data.fullName && data.email && data.phoneNumber;
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Contact Information</h1>
            <p className="text-gray-600 mb-6">Please provide your contact details</p>

            <div className="space-y-6">
                {/* Full Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                    </label>
                    <input
                        type="text"
                        value={data.fullName || ''}
                        onChange={(e) => handleChange('fullName', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="Enter Your Full Name"
                        required
                    />
                </div>

                {/* Email Address */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                    </label>
                    <input
                        type="email"
                        value={data.email || ''}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="Enter Your Email Address"
                        required
                    />
                </div>

                {/* Phone Number */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                    </label>
                    <input
                        type="tel"
                        value={data.phoneNumber || ''}
                        onChange={(e) => handleChange('phoneNumber', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="Enter Your Phone Number"
                        required
                    />
                </div>

                {/* Alternative Phone Number */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Alternative Phone Number
                    </label>
                    <input
                        type="tel"
                        value={data.alternativePhone || ''}
                        onChange={(e) => handleChange('alternativePhone', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="Enter Your Second Phone Number"
                    />
                </div>

                {/* Special Requirements */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Special Requirement/Notes
                    </label>
                    <textarea
                        value={data.specialRequirements || ''}
                        onChange={(e) => handleChange('specialRequirements', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        rows="4"
                        placeholder="Any special arrangement, dietary restrictions, accessibility needs, etc"
                    />
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
                        disabled={!isFormValid()}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        Next → Additional Services
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContactInformation;
