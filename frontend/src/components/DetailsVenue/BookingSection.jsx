// src/components/VenueDetails/BookingSection.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Loader } from 'lucide-react';
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
    // Check if user is logged in
    if (!user || !token) {
      navigate('/login');
      return;
    }

    // Check if date and slot are selected
    if (!selectedDate || !selectedSlot) {
      alert('Please select date and time slot');
      return;
    }

    // Navigate to booking form with venue and booking details
    const selectedFacilityIds = Object.keys(selectedFacilities)
      .filter(id => selectedFacilities[id])
      .map(id => parseInt(id));

    // Store booking data in state and navigate
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
    <div className="booking-section">
      {/* Price Display */}
      <div className="price-display">
        <p className="price-label">Starting from</p>
        <p className="price-amount">Rs. {parseFloat(venue.base_price).toLocaleString()}</p>
        <p className="price-sublabel">Base Price</p>
      </div>

      {/* Date Selection */}
      <div className="booking-field">
        <label className="field-label">
          <Calendar className="w-5 h-5" />
          Select Date
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="date-input"
        />
      </div>

      {/* Time Slot Selection */}
      {selectedDate && (
        <div className="booking-field">
          <label className="field-label">
            <Clock className="w-5 h-5" />
            Time Slot
          </label>
          {loadingAvailability ? (
            <div className="loading-slots">
              <Loader className="h-5 w-5 animate-spin" />
              <span>Loading availability...</span>
            </div>
          ) : bookingData?.availability ? (
            <div className="time-slots-grid">
              {bookingData.availability.map((slot) => (
                <button
                  key={slot.slot}
                  onClick={() => slot.is_available && setSelectedSlot(slot.slot)}
                  disabled={!slot.is_available}
                  className={`time-slot-button ${selectedSlot === slot.slot ? 'selected' : ''} ${!slot.is_available ? 'unavailable' : ''}`}
                >
                  {slot.slot}
                  {!slot.is_available && ' (Booked)'}
                </button>
              ))}
            </div>
          ) : (
            <p className="no-availability">No availability data for this date</p>
          )}
        </div>
      )}

      {/* Facility Selection */}
      {venue.facilities && venue.facilities.length > 0 && (
        <div className="booking-field">
          <label className="field-label">
            Additional Facilities
          </label>
          <div className="facilities-list">
            {venue.facilities.map((facility) => (
              facility.availability === 'yes' && (
                <label
                  key={facility.facility_id}
                  className="facility-checkbox-item"
                >
                  <input
                    type="checkbox"
                    checked={selectedFacilities[facility.facility_id] || false}
                    onChange={(e) => {
                      setSelectedFacilities(prev => ({
                        ...prev,
                        [facility.facility_id]: e.target.checked
                      }));
                    }}
                    className="facility-checkbox"
                  />
                  <span className="facility-name">{facility.facility_name}</span>
                  <span className="facility-price">
                    +Rs. {parseFloat(facility.extra_price).toLocaleString()}
                  </span>
                </label>
              )
            ))}
          </div>
        </div>
      )}

      {/* Total Amount */}
      <div className="total-amount-display">
        <span className="total-label">Total Amount</span>
        <span className="total-amount">Rs. {calculateTotal().toLocaleString()}</span>
      </div>

      {/* Book Now Button */}
      <button
        onClick={handleBooking}
        disabled={!selectedDate || !selectedSlot}
        className="book-now-button"
      >
        Book Now
      </button>
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