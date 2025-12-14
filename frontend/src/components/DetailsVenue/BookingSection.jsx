// src/components/VenueDetails/BookingSection.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Loader, Check, Info } from 'lucide-react';
import PropTypes from 'prop-types';
import { useAuth } from '../../contexts/AuthContext';
import { venueService } from '../../services/api';

const BookingSection = ({ venue }) => {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookingData, setBookingData] = useState(null);
  const [selectedFacilities, setSelectedFacilities] = useState({});
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  useEffect(() => {
    if (selectedDate && venue) {
      fetchBookingData();
    }
  }, [selectedDate, venue]);

  const fetchBookingData = async () => {
    try {
      setLoadingAvailability(true);
      const data = await venueService.getBookingData(venue.venue_id, selectedDate);
      setBookingData(data);
    } catch (err) {
      console.error('Error fetching booking data:', err);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const calculateTotal = () => {
    let total = parseFloat(venue.base_price);

    venue.facilities?.forEach(facility => {
      if (selectedFacilities[facility.facility_id] && facility.availability === 'yes') {
        total += parseFloat(facility.extra_price);
      }
    });

    return total;
  };

  const handleBooking = () => {
    if (!user || !token) {
      navigate('/login');
      return;
    }

    if (!selectedDate || !selectedSlot) {
      alert('Please select date and time slot');
      return;
    }

    const selectedFacilityIds = Object.keys(selectedFacilities)
      .filter(id => selectedFacilities[id])
      .map(id => parseInt(id));

    navigate('/booking-form', {
      state: {
        venue: venue,
        selectedDate: selectedDate,
        selectedSlot: selectedSlot,
        selectedFacilities: selectedFacilityIds,
        totalAmount: calculateTotal()
      }
    });
  };

  return (
    <div className="sticky top-24 bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl p-8 shadow-2xl transition-all hover:shadow-blue-900/10">
      {/* Price Header */}
      <div className="text-center mb-8 pb-8 border-b border-gray-100">
        <p className="text-gray-500 font-medium text-sm uppercase tracking-wide mb-2">Total Estimated Cost</p>
        <div className="flex items-center justify-center gap-1 text-5xl font-extrabold text-gray-900 tracking-tight">
          <span className="text-3xl text-gray-400 font-medium">Rs.</span>
          {calculateTotal().toLocaleString()}
        </div>
        <p className="text-blue-600 text-sm font-medium mt-2 bg-blue-50 py-1 px-3 rounded-full inline-block">
          Includes Base Price: Rs. {parseFloat(venue.base_price).toLocaleString()}
        </p>
      </div>

      <div className="space-y-6">
        {/* Date Selection */}
        <div className="group">
          <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-gray-700 group-hover:bg-white"
          />
        </div>

        {/* Time Slot Selection */}
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            Select Time Slot
          </label>

          {!selectedDate ? (
            <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-center text-gray-500 text-sm">
              Please select a date first
            </div>
          ) : loadingAvailability ? (
            <div className="flex items-center justify-center gap-2 py-8 bg-gray-50 rounded-2xl">
              <Loader className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-gray-500 font-medium">Checking availability...</span>
            </div>
          ) : bookingData?.availability ? (
            <div className="grid grid-cols-2 gap-3">
              {bookingData.availability.map((slot) => (
                <button
                  key={slot.slot}
                  onClick={() => slot.is_available && setSelectedSlot(slot.slot)}
                  disabled={!slot.is_available}
                  className={`
                    relative p-3 rounded-xl border-2 text-sm font-bold transition-all duration-200
                    ${selectedSlot === slot.slot
                      ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105 z-10'
                      : !slot.is_available
                        ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed decoration-slice'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-blue-400 hover:shadow-md'
                    }
                  `}
                >
                  {slot.slot}
                  {selectedSlot === slot.slot && (
                    <div className="absolute top-1 right-1">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium text-center">
              No availability data found
            </div>
          )}
        </div>

        {/* Facilities */}
        {venue.facilities && venue.facilities.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500" />
              Add Extra Facilities
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
              {venue.facilities.map((facility) => (
                facility.availability === 'yes' && (
                  <label
                    key={facility.facility_id}
                    className={`
                      flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer
                      ${selectedFacilities[facility.facility_id]
                        ? 'bg-blue-50 border-blue-200 shadow-inner'
                        : 'bg-white border-gray-200 hover:border-blue-300'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-5 h-5 rounded border flex items-center justify-center transition-colors
                        ${selectedFacilities[facility.facility_id]
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-gray-300'
                        }
                      `}>
                        {selectedFacilities[facility.facility_id] && <Check className="w-3 h-3" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedFacilities[facility.facility_id] || false}
                        onChange={(e) => {
                          setSelectedFacilities(prev => ({
                            ...prev,
                            [facility.facility_id]: e.target.checked
                          }));
                        }}
                        className="hidden"
                      />
                      <span className={`text-sm font-medium ${selectedFacilities[facility.facility_id] ? 'text-blue-900' : 'text-gray-700'}`}>
                        {facility.facility_name}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                      +Rs. {parseFloat(facility.extra_price).toLocaleString()}
                    </span>
                  </label>
                )
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Book Button */}
      <div className="mt-8">
        <button
          onClick={handleBooking}
          disabled={!selectedDate || !selectedSlot}
          className={`
            w-full py-4 rounded-2xl font-bold text-lg shadow-xl transition-all duration-300 flex items-center justify-center gap-2
            ${!selectedDate || !selectedSlot
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:-translate-y-1 hover:shadow-blue-500/30'
            }
          `}
        >
          Book Venue
        </button>
        <p className="text-center text-xs text-gray-400 mt-4">
          Secure booking powered by Venue Finder
        </p>
      </div>
    </div>
  );
};

BookingSection.propTypes = {
  venue: PropTypes.shape({
    venue_id: PropTypes.number.isRequired,
    base_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    facilities: PropTypes.array,
  }).isRequired,
};

export default BookingSection;