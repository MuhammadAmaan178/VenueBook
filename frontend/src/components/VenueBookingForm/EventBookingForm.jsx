import React, { useState } from 'react';
import PhoneInput from '../common/PhoneInput';

// Component 1: Booking Information
const BookingInformation = ({ data, onUpdate, onNext }) => {
  const timeSlots = [
    '9:00 AM - 12:00 PM',
    '12:00 PM - 3:00 PM',
    '3:00 PM - 6:00 PM',
    '6:00 PM - 9:00 PM',
    '9:00 PM - 12:00 AM',
    'Full Day'
  ];

  const eventTypes = [
    'Wedding', 'Corporate', 'Birthday',
    'Conference', 'Engagement', 'Other'
  ];

  const handleChange = (field, value) => {
    onUpdate({ ...data, [field]: value });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Booking Information</h1>
      <p className="text-gray-600 mb-6">Please provide details about your event</p>

      <div className="space-y-6">
        {/* Event Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Type *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {eventTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleChange('eventType', type)}
                className={`px-4 py-3 rounded-lg border text-center transition-colors ${data.eventType === type
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Event Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Date *
          </label>
          <input
            type="date"
            value={data.eventDate || ''}
            onChange={(e) => handleChange('eventDate', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            required
          />
        </div>

        {/* Time Slot */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Slot *
          </label>
          <select
            value={data.timeSlot || ''}
            onChange={(e) => handleChange('timeSlot', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            required
          >
            <option value="">Select Time Slot</option>
            {timeSlots.map((slot, index) => (
              <option key={index} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>

        {/* Number of Guests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expected Number Of Guests *
          </label>
          <input
            type="number"
            min="1"
            value={data.guests || ''}
            onChange={(e) => handleChange('guests', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Enter number of guests"
            required
          />
        </div>

        {/* Navigation */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={onNext}
            disabled={!data.eventType || !data.eventDate || !data.timeSlot || !data.guests}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Next → Contact Information
          </button>
        </div>
      </div>
    </div>
  );
};

// Component 2: Contact Information
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
        <PhoneInput
          value={data.phoneNumber || ''}
          onChange={(e) => handleChange('phoneNumber', e.target.value)}
          required
          label="Phone Number *"
        />

        {/* Alternative Phone Number */}
        <PhoneInput
          value={data.alternativePhone || ''}
          onChange={(e) => handleChange('alternativePhone', e.target.value)}
          label="Alternative Phone Number"
          placeholder="Enter Your Second Phone Number"
        />

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

// Component 3: Additional Services
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

// Component 4: Payment Method
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

// Component 5: Booking Summary
const BookingSummary = ({ data, onSubmit, onBack }) => {
  // Calculate totals
  const venueBasePrice = 150000;

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
              <div className="font-semibold text-gray-900">Royal Banquet Hall</div>
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

// Main App Component
const EventBookingForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    // Booking Information
    eventType: '',
    eventDate: '',
    timeSlot: '',
    guests: '',

    // Contact Information
    fullName: '',
    email: '',
    phoneNumber: '',
    alternativePhone: '',
    specialRequirements: '',

    // Additional Services
    services: [],
    paymentMethod: '',

    // Payment
    transactionId: ''
  });

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmitBooking = () => {
    // In real app, you would send this data to your backend
    ('Booking submitted:', formData);

    // Show success message
    setShowSuccess(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({
        eventType: '',
        eventDate: '',
        timeSlot: '',
        guests: '',
        fullName: '',
        email: '',
        phoneNumber: '',
        alternativePhone: '',
        specialRequirements: '',
        services: [],
        paymentMethod: '',
        transactionId: ''
      });
      setCurrentStep(1);
      setShowSuccess(false);
    }, 3000);
  };

  const handleUpdateFormData = (updatedData) => {
    setFormData(updatedData);
  };

  // Progress bar
  const steps = ['Booking', 'Contact', 'Services', 'Payment', 'Summary'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Success Message Modal */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Successful!</h2>
              <p className="text-gray-600 mb-6">
                Your booking for Royal Banquet Hall has been confirmed.
                A confirmation email has been sent to {formData.email}.
              </p>
              <p className="text-sm text-gray-500">
                Booking Reference: RBH-{Math.random().toString(36).substr(2, 8).toUpperCase()}
              </p>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <React.Fragment key={step}>
                <div className="flex items-center">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-semibold text-sm md:text-base ${currentStep > index + 1
                    ? 'bg-green-500 text-white'
                    : currentStep === index + 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-700'
                    }`}>
                    {index + 1}
                  </div>
                  <span className={`ml-2 font-medium text-sm md:text-base ${currentStep >= index + 1 ? 'text-gray-800' : 'text-gray-500'
                    }`}>
                    {step}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 md:mx-4 ${currentStep > index + 1 ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="text-center text-sm text-gray-600">
            Step {currentStep} of 5
          </div>
        </div>

        {/* Render Current Step */}
        {currentStep === 1 && (
          <BookingInformation
            data={formData}
            onUpdate={handleUpdateFormData}
            onNext={handleNext}
          />
        )}

        {currentStep === 2 && (
          <ContactInformation
            data={formData}
            onUpdate={handleUpdateFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 3 && (
          <AdditionalServices
            data={formData}
            onUpdate={handleUpdateFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 4 && (
          <PaymentMethod
            data={formData}
            onUpdate={handleUpdateFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 5 && (
          <BookingSummary
            data={formData}
            onSubmit={handleSubmitBooking}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
};

export default EventBookingForm;