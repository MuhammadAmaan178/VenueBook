import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { bookingService } from '../../services/api';
import BookingInformation from './BookingInformation';
import ContactInformation from './ContactInformation';
import AdditionalServices from './AdditionalServices';
import PaymentMethod from './PaymentMethod';
import BookingSummary from './BookingSummary';

const VenueBookingForm = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, token } = useAuth();

    // Get initial data from navigation state
    const { venue, selectedDate, selectedSlot } = location.state || {};

    const [currentStep, setCurrentStep] = useState(1);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        // Booking Information
        eventType: 'Wedding', // Default
        eventDate: selectedDate || '',
        timeSlot: selectedSlot || '',
        guests: '',

        // Contact Information
        fullName: user?.name || '',
        email: user?.email || '',
        phoneNumber: user?.phone || '',
        alternativePhone: '',
        specialRequirements: '',

        // Additional Services
        services: [],
        paymentMethod: '',

        // Payment
        transactionId: ''
    });

    useEffect(() => {
        // Redirect if no venue data (direct access)
        if (!venue && !location.state) {
            // Optional: navigate('/venues');
            // For now, we allow it but it might look empty
        }
    }, [venue, location.state, navigate]);

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

    const handleUpdateFormData = (updatedData) => {
        setFormData(updatedData);
    };

    const handleSubmitBooking = async () => {
        if (!token) {
            alert("Please log in to complete booking");
            navigate('/login');
            return;
        }

        setIsSubmitting(true);

        try {
            // Calculate amount (re-calculate to be safe)
            const venueBasePrice = venue ? parseFloat(venue.base_price) : 150000;
            const servicePrices = {
                catering: 50000,
                stageLighting: 15000,
                decoration: 25000,
                photography: 30000,
                projector: 8000,
                security: 10000
            };

            const serviceTotal = (formData.services || []).reduce((total, serviceId) => {
                return total + (servicePrices[serviceId] || 0);
            }, 0);

            const subtotal = venueBasePrice + serviceTotal;
            const tax = subtotal * 0.05;
            const totalAmount = subtotal + tax;

            // Prepare payload for backend
            const servicesString = formData.services.map(s => s).join(', ');
            const notes = `${formData.specialRequirements} | Services: ${servicesString}`;

            const bookingPayload = {
                venue_id: venue ? venue.venue_id : 0,
                event_date: formData.eventDate,
                slot: formData.timeSlot,
                event_type: formData.eventType,
                special_requirements: notes,
                fullname: formData.fullName,
                email: formData.email,
                phone_primary: formData.phoneNumber,
                facility_ids: [],
                amount: totalAmount,
                payment_method: formData.paymentMethod,
                trx_id: formData.transactionId
            };

            // Map 'bank' to 'bank_transfer' for backend enum compatibility
            if (bookingPayload.payment_method === 'bank') {
                bookingPayload.payment_method = 'bank_transfer';
            }

            await bookingService.createBooking(bookingPayload, token);

            setShowSuccess(true);

            // Redirect after success
            setTimeout(() => {
                navigate('/');
            }, 3000);

        } catch (err) {
            console.error("Booking failed:", err);
            alert("Booking failed: " + err.message);
        } finally {
            setIsSubmitting(false);
        }
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
                                Your booking for {venue ? venue.name : 'Venue'} has been confirmed.
                                A confirmation email has been sent to {formData.email}.
                            </p>
                        </div>
                    </div>
                )}

                {/* Back Button */}
                <button
                    onClick={() => navigate('/venues')}
                    className="mb-6 text-blue-600 hover:text-blue-800 font-medium flex items-center transition-colors"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Venues
                </button>

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
                        venue={venue}
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
                        venue={venue}
                    />
                )}
            </div>
        </div>
    );
};

export default VenueBookingForm;
