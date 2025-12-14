import React, { useState, useEffect } from 'react';
import { Phone, CheckCircle, AlertCircle } from 'lucide-react';

const PhoneInput = ({
    value,
    onChange,
    placeholder = "Enter phone number",
    required = false,
    className = "",
    error: externalError,
    label = "Phone Number"
}) => {
    const [internalError, setInternalError] = useState(null);
    const [isTouched, setIsTouched] = useState(false);

    // Format: +92-3XX-XXXXXXX
    const formatPhoneNumber = (input) => {
        // Remove all non-digit characters
        let cleaned = input.replace(/\D/g, '');

        // Handle cases where user might copy-paste or type with country code
        if (cleaned.startsWith('92')) {
            cleaned = cleaned.substring(2);
        } else if (cleaned.startsWith('0')) {
            cleaned = cleaned.substring(1);
        }

        // Limit to 10 digits (3 for area code, 7 for number)
        cleaned = cleaned.substring(0, 10);

        let formatted = '';
        if (cleaned.length > 0) {
            formatted = '+92';
            if (cleaned.length > 0) {
                formatted += '-' + cleaned.substring(0, 3);
            }
            if (cleaned.length > 3) {
                formatted += '-' + cleaned.substring(3);
            }
        }

        return { formatted, cleanLength: cleaned.length };
    };

    const handleChange = (e) => {
        const rawValue = e.target.value;

        // If user is clearing the input
        if (!rawValue) {
            onChange({ target: { value: '' } });
            setInternalError(required ? 'Phone number is required' : null);
            return;
        }

        const { formatted, cleanLength } = formatPhoneNumber(rawValue);

        onChange({ target: { value: formatted } });

        // Validate on change if touched
        if (isTouched) {
            validate(cleanLength);
        }
    };

    const validate = (length) => {
        if (required && length === 0) {
            setInternalError('Phone number is required');
            return false;
        }
        if (length > 0 && length < 10) {
            setInternalError('Invalid format: +92-3XX-XXXXXXX');
            return false;
        }
        setInternalError(null);
        return true;
    };

    const handleBlur = () => {
        setIsTouched(true);
        const { cleanLength } = formatPhoneNumber(value || '');
        validate(cleanLength);
    };

    const isValid = !internalError && !externalError && value && value.length === 15; // +92-3XX-XXXXXXX is 15 chars

    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Phone className={`w-4 h-4 ${isValid ? 'text-green-500' : 'text-blue-500'}`} />
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div className="relative">
                <input
                    type="tel"
                    value={value || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="+92-3XX-XXXXXXX"
                    className={`w-full pl-4 pr-10 py-3 bg-gray-50 border rounded-xl outline-none transition-all font-medium text-gray-700 hover:bg-white placeholder-gray-400
                        ${internalError || externalError
                            ? 'border-red-300 focus:ring-4 focus:ring-red-100 focus:border-red-500'
                            : isValid
                                ? 'border-green-300 focus:ring-4 focus:ring-green-100 focus:border-green-500'
                                : 'border-gray-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500'
                        } ${className}`}
                />

                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    {internalError || externalError ? (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                    ) : isValid ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : null}
                </div>
            </div>

            {(internalError || externalError) && (
                <p className="text-red-500 text-xs font-medium pl-1 animate-in slide-in-from-top-1">
                    {internalError || externalError}
                </p>
            )}
        </div>
    );
};

export default PhoneInput;
