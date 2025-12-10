// src/components/VenueDetails/VenueAbout.jsx
import PropTypes from 'prop-types';

const VenueAbout = ({ description }) => {
  return (
    <div className="venue-section">
      <h2 className="section-title">About Venue</h2>
      <p className="venue-description">
        {description || 'No description available.'}
      </p>
    </div>
  );
};

VenueAbout.propTypes = {
  description: PropTypes.string,
};

export default VenueAbout;