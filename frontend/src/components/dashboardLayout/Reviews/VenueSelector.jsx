// components/VenueSelector.jsx
import React from 'react';
import { Building2 } from 'lucide-react';

const VenueSelector = ({ venues, selectedVenue, onVenueChange }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
            <div className="flex items-center gap-3 mb-4">
                <Building2 size={20} className="text-gray-500" />
                <h3 className="font-medium text-gray-700">Select Venue</h3>
            </div>

            <div className="flex flex-wrap gap-2">
                {venues.map((venue) => (
                    <button
                        key={venue.id}
                        onClick={() => onVenueChange(venue.name)}
                        className={`px-4 py-2 rounded-lg transition-colors ${selectedVenue === venue.name
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {venue.name}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default VenueSelector;