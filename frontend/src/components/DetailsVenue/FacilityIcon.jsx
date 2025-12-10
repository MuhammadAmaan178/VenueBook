// src/components/VenueDetails/FacilityIcon.jsx
import { Volume2, Utensils, Car, Sparkles, Check, Wifi, Tv } from 'lucide-react';
import PropTypes from 'prop-types';

const FacilityIcon = ({ facilityName }) => {
  const lowerName = facilityName.toLowerCase();
  
  if (lowerName.includes('sound') || lowerName.includes('audio')) {
    return <Volume2 className="facility-icon" />;
  }
  if (lowerName.includes('catering') || lowerName.includes('food')) {
    return <Utensils className="facility-icon" />;
  }
  if (lowerName.includes('parking')) {
    return <Car className="facility-icon" />;
  }
  if (lowerName.includes('decoration') || lowerName.includes('decor')) {
    return <Sparkles className="facility-icon" />;
  }
  if (lowerName.includes('wifi') || lowerName.includes('internet')) {
    return <Wifi className="facility-icon" />;
  }
  if (lowerName.includes('projector') || lowerName.includes('screen') || lowerName.includes('tv')) {
    return <Tv className="facility-icon" />;
  }
  
  return <Check className="facility-icon" />;
};

FacilityIcon.propTypes = {
  facilityName: PropTypes.string.isRequired,
};

export default FacilityIcon;