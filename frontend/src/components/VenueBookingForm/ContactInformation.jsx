import { User, Mail, Phone, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import PhoneInput from '../common/PhoneInput';

// Component 2: Contact Information
const ContactInformation = ({ data, onUpdate, onNext, onBack }) => {
    const handleChange = (field, value) => {
        onUpdate({ ...data, [field]: value });
    };

    const isFormValid = () => {
        return data.fullName && data.email && data.phoneNumber;
    };

    return (
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-8 border border-white/50">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Details</h1>
            <p className="text-gray-500 mb-8">How can we reach you regarding this booking?</p>

            <div className="space-y-6">
                {/* Full Name */}
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-500" />
                        Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={data.fullName || ''}
                        onChange={(e) => handleChange('fullName', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-gray-700 hover:bg-white placeholder-gray-400"
                        placeholder="Enter Your Full Name"
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Email Address */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-blue-500" />
                            Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            value={data.email || ''}
                            onChange={(e) => handleChange('email', e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-gray-700 hover:bg-white placeholder-gray-400"
                            placeholder="Enter Your Email Address"
                            required
                        />
                    </div>

                    {/* Phone Number */}
                    <PhoneInput
                        value={data.phoneNumber || ''}
                        onChange={(e) => handleChange('phoneNumber', e.target.value)}
                        required
                        label="Phone Number"
                    />
                </div>

                {/* Alternative Phone Number */}
                <PhoneInput
                    value={data.alternativePhone || ''}
                    onChange={(e) => handleChange('alternativePhone', e.target.value)}
                    label="Alternative Phone Number"
                    placeholder="Enter Second Phone Number (Optional)"
                />

                {/* Special Requirements */}
                <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        Special Requirement / Notes
                    </label>
                    <textarea
                        value={data.specialRequirements || ''}
                        onChange={(e) => handleChange('specialRequirements', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-gray-700 hover:bg-white placeholder-gray-400 min-h-[120px]"
                        placeholder="Any special arrangement, dietary restrictions, accessibility needs, etc."
                    />
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
                        disabled={!isFormValid()}
                        className={`
              flex-[2] py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all duration-300
              ${!isFormValid()
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:-translate-y-1 hover:shadow-blue-500/30'
                            }
            `}
                    >
                        Next Step <ChevronRight className="w-5 h-5 ml-1" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContactInformation;
