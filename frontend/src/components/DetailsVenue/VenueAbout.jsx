// src/components/DetailsVenue/VenueAbout.jsx
import PropTypes from 'prop-types';

const VenueAbout = ({ description }) => {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
        <span className="w-1.5 h-8 bg-blue-600 rounded-full"></span>
        About This Venue
      </h2>
      <div className="prose prose-lg prose-blue max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
        {description}
      </div>
    </div>
  );
};

VenueAbout.propTypes = {
  description: PropTypes.string.isRequired,
};

export default VenueAbout;