// src/components/DetailsVenue/VenueFacilities.jsx
import PropTypes from 'prop-types';
import { Check } from 'lucide-react';

const VenueFacilities = ({ facilities }) => {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
        <span className="w-1.5 h-8 bg-blue-600 rounded-full"></span>
        Facilities & Amenities
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {facilities.map((facility, index) => (
          <div
            key={index}
            className={`
              flex items-center justify-between p-4 rounded-2xl border transition-all duration-300
              ${facility.availability === 'yes'
                ? 'bg-blue-50/50 border-blue-100 hover:border-blue-300 hover:shadow-md'
                : 'bg-gray-50 border-gray-100 opacity-60'
              }
            `}
          >
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-xl ${facility.availability === 'yes' ? 'bg-white text-blue-600 shadow-sm' : 'bg-gray-200 text-gray-400'}`}>
                {facility.availability === 'yes' ? <Check className="w-5 h-5" /> : <div className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{facility.facility_name}</h3>
                {facility.availability === 'yes' && (
                  <p className="text-xs text-blue-600 font-medium">Available</p>
                )}
              </div>
            </div>

            {facility.availability === 'yes' && (
              <div className="text-right">
                <span className="block text-sm font-bold text-gray-900">
                  +Rs. {parseFloat(facility.extra_price).toLocaleString()}
                </span>
              </div>
            )}
            {facility.availability !== 'yes' && (
              <span className="text-xs font-bold text-gray-400 px-3 py-1 bg-gray-100 rounded-full">
                Unavailable
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

VenueFacilities.propTypes = {
  facilities: PropTypes.arrayOf(PropTypes.shape({
    facility_name: PropTypes.string.isRequired,
    extra_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    availability: PropTypes.string,
  })).isRequired,
};

export default VenueFacilities;