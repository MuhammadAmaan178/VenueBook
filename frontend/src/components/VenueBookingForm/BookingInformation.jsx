import React, { useState, useEffect } from 'react';
import { venueService } from '../../services/api';
import { Loader } from 'lucide-react';

const BookingInformation = ({ data, onUpdate, onNext, venue }) => {
    const [availability, setAvailability] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const eventTypes = [
        'Wedding', 'Corporate', 'Birthday',
        'Conference', 'Engagement', 'Other'
    ];

    useEffect(() => {
        if (data.eventDate && venue) {
            checkAvailability(data.eventDate);
        }
    }, [data.eventDate, venue]);

    const checkAvailability = async (date) => {
        setLoading(true);
        setError('');
        try {
            const response = await venueService.getBookingData(venue.venue_id, date);
            setAvailability(response.availability);

            // Check if currently selected slot is still available
            if (data.timeSlot) {
                const slotInfo = response.availability.find(s => s.slot === data.timeSlot);
                if (slotInfo && !slotInfo.is_available) {
                    setError(`The slot "${data.timeSlot}" is not available on this date.`);
                }
            }
        } catch (err) {
            console.error("Error fetching availability:", err);
            setError("Failed to check availability. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        onUpdate({ ...data, [field]: value });
        if (field === 'eventDate') {
            // Reset slot when date changes
            onUpdate({ ...data, eventDate: value, timeSlot: '' });
        }
        if (field === 'timeSlot') {
            setError(''); // Clear error when selecting a new slot
        }
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
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        required
                    />
                </div>

                {/* Time Slot */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time Slot *
                    </label>
                    {loading ? (
                        <div className="flex items-center text-gray-500">
                            <Loader className="w-4 h-4 animate-spin mr-2" />
                            Checking availability...
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {availability ? (
                                availability.map((slot) => (
                                    <button
                                        key={slot.slot}
                                        type="button"
                                        disabled={!slot.is_available}
                                        onClick={() => handleChange('timeSlot', slot.slot)}
                                        className={`px-4 py-3 rounded-lg border text-center transition-colors ${data.timeSlot === slot.slot
                                                ? 'bg-blue-50 border-blue-500 text-blue-700'
                                                : !slot.is_available
                                                    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        {slot.slot}
                                        {!slot.is_available && <span className="block text-xs text-red-500">(Booked)</span>}
                                    </button>
                                ))
                            ) : (
                                <p className="text-gray-500 col-span-2">Select a date to see available slots</p>
                            )}
                        </div>
                    )}
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
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
                        disabled={!data.eventType || !data.eventDate || !data.timeSlot || !data.guests || !!error}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        Next → Contact Information
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingInformation;
