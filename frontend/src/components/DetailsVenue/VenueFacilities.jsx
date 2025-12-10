// src/components/VenueDetails/VenueFacilities.jsx
import { useState } from 'react';
import { Check } from 'lucide-react';
import PropTypes from 'prop-types';
import FacilityIcon from './FacilityIcon';

const VenueFacilities = ({ facilities }) => {
  const [selectedFacilities, setSelectedFacilities] = useState({});

  const handleFacilityToggle = (facilityId) => {
    setSelectedFacilities(prev => ({
      ...prev,
      [facilityId]: !prev[facilityId]
    }));
  };

  return (
    <div className="venue-section">
      <h2 className="section-title">Facilities & Amenities</h2>
      <div className="facilities-grid">
        {facilities.map((facility) => (
          <div
            key={facility.facility_id}
            onClick={() => facility.availability === 'yes' && handleFacilityToggle(facility.facility_id)}
            className={`facility-card ${facility.availability === 'yes' ? 'available' : 'unavailable'}`}
          >
            <div className="facility-content">
              <div className="facility-icon-container">
                <FacilityIcon facilityName={facility.facility_name} />
              </div>
              <span className="facility-name">{facility.facility_name}</span>
            </div>
            <div className="facility-price">
              {facility.availability === 'yes' ? (
                <span className={`price-tag ${selectedFacilities[facility.facility_id] ? 'selected' : ''}`}>
                  {selectedFacilities[facility.facility_id] && <Check className="w-4 h-4" />}
                  +Rs. {parseFloat(facility.extra_price).toLocaleString()}
                </span>
              ) : (
                <span className="unavailable-text">Unavailable</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

VenueFacilities.propTypes = {
  facilities: PropTypes.arrayOf(
    PropTypes.shape({
      facility_id: PropTypes.number.isRequired,
      facility_name: PropTypes.string.isRequired,
      extra_price: PropTypes.string.isRequired,
      availability: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default VenueFacilities;