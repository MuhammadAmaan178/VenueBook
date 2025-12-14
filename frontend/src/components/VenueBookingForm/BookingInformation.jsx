import React, { useState, useEffect } from 'react';
import { venueService } from '../../services/api';
import { Loader, Calendar, Clock, Users, Tag, ChevronRight } from 'lucide-react';

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
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-8 border border-white/50">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Details</h1>
            <p className="text-gray-500 mb-8">Tell us about your event to get started.</p>

            <div className="space-y-8">
                {/* Event Type */}
                <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-blue-500" />
                        Event Type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {eventTypes.map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => handleChange('eventType', type)}
                                className={`
                                    px-4 py-3 rounded-xl border-2 font-medium transition-all duration-300
                                    ${data.eventType === type
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 transform scale-105'
                                        : 'bg-white border-gray-100 text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:shadow-md'
                                    }
                                `}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Event Date */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            Event Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={data.eventDate || ''}
                            onChange={(e) => handleChange('eventDate', e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-gray-700 hover:bg-white"
                            required
                        />
                    </div>

                    {/* Number of Guests */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-500" />
                            Expected Guests <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={data.guests || ''}
                            onChange={(e) => handleChange('guests', e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-gray-700 hover:bg-white placeholder-gray-400"
                            placeholder="e.g. 150"
                            required
                        />
                    </div>
                </div>

                {/* Time Slot */}
                <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        Select Time Slot <span className="text-red-500">*</span>
                    </label>

                    {!data.eventDate ? (
                        <div className="p-8 bg-gray-50 border border-dashed border-gray-300 rounded-2xl text-center">
                            <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500 font-medium">Please select a date first to view available slots</p>
                        </div>
                    ) : loading ? (
                        <div className="flex items-center justify-center p-8 bg-gray-50 rounded-2xl">
                            <Loader className="w-6 h-6 animate-spin text-blue-600 mr-3" />
                            <span className="text-gray-600 font-medium">Checking availability...</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {availability ? (
                                availability.map((slot) => (
                                    <button
                                        key={slot.slot}
                                        type="button"
                                        disabled={!slot.is_available}
                                        onClick={() => handleChange('timeSlot', slot.slot)}
                                        className={`
                                            relative px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all duration-300
                                            ${data.timeSlot === slot.slot
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200 transform scale-105 z-10'
                                                : !slot.is_available
                                                    ? 'bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:shadow-md'
                                            }
                                        `}
                                    >
                                        {slot.slot}
                                        {!slot.is_available && (
                                            <span className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full border border-red-200 font-bold">
                                                BOOKED
                                            </span>
                                        )}
                                    </button>
                                ))
                            ) : (
                                <p className="text-red-500 col-span-3">Unable to load slots.</p>
                            )}
                        </div>
                    )}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-2 text-sm font-medium animate-in slide-in-from-top-2">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                            {error}
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="pt-6 border-t border-gray-100">
                    <button
                        onClick={onNext}
                        disabled={!data.eventType || !data.eventDate || !data.timeSlot || !data.guests || !!error}
                        className={`
                            w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all duration-300
                            ${!data.eventType || !data.eventDate || !data.timeSlot || !data.guests || !!error
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

export default BookingInformation;
