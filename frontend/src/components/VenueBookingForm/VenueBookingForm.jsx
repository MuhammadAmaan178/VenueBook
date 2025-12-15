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

            // Map 'bank' to 'bank-transfer' for backend enum compatibility
            if (bookingPayload.payment_method === 'bank') {
                bookingPayload.payment_method = 'bank-transfer';
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
        <div className="min-h-screen bg-gray-50 relative overflow-hidden">
            {/* Background Blobs */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-[800px] h-[800px] bg-blue-50/40 rounded-full blur-3xl pointer-events-none z-0"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-[600px] h-[600px] bg-purple-50/40 rounded-full blur-3xl pointer-events-none z-0"></div>

            <div className="relative z-10 p-4 md:p-8 pt-24 max-w-5xl mx-auto">
                {/* Success Message Modal */}
                {showSuccess && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-2xl transform scale-100 animate-in zoom-in-95 duration-300">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-3">Booking Confirmed!</h2>
                            <p className="text-gray-600 mb-8 text-lg">
                                Your booking for {venue ? venue.name : 'Venue'} has been secured.
                                <br />A confirmation email has been sent to <span className="font-semibold text-gray-900">{formData.email}</span>.
                            </p>
                        </div>
                    </div>
                )}

                {/* Back Button */}
                <button
                    onClick={() => navigate('/venues')}
                    className="mb-8 flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-medium group"
                >
                    <div className="p-2 bg-white rounded-full shadow-sm group-hover:shadow-md transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </div>
                    Back to Venues
                </button>

                {/* Progress Bar - Modern */}
                <div className="mb-12">
                    <div className="flex items-center justify-between relative">
                        {/* Connecting Line */}
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full -z-10"></div>
                        <div
                            className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-blue-600 rounded-full -z-10 transition-all duration-500 ease-in-out"
                            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                        ></div>

                        {steps.map((step, index) => {
                            const isCompleted = currentStep > index + 1;
                            const isCurrent = currentStep === index + 1;

                            return (
                                <div key={step} className="flex flex-col items-center">
                                    <div
                                        className={`
                                            w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-sm md:text-base transition-all duration-300 border-4
                                            ${isCompleted
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                                                : isCurrent
                                                    ? 'bg-white border-blue-600 text-blue-600 shadow-lg scale-110'
                                                    : 'bg-white border-gray-200 text-gray-400'
                                            }
                                        `}
                                    >
                                        {isCompleted ? (
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : index + 1}
                                    </div>
                                    <span
                                        className={`
                                            mt-3 font-semibold text-xs md:text-sm tracking-wide transition-colors duration-300
                                            ${isCurrent ? 'text-blue-900' : isCompleted ? 'text-blue-600' : 'text-gray-400'}
                                        `}
                                    >
                                        {step}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Render Current Step */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
        </div>
    );
};

export default VenueBookingForm;
