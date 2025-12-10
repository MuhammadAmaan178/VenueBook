// components/VenuesGrid.jsx
import React from 'react';
import VenueCard from './VenueCard';
import AddVenueCard from './AddVenueCard';

const VenuesGrid = ({ venues, onDeleteVenue }) => {
    if (venues.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-4xl">🏢</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No venues yet</h3>
                <p className="text-gray-500 mb-6">Add your first venue to get started</p>
                <AddVenueCard />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue) => (
                <VenueCard
                    key={venue.id}
                    venue={venue}
                    onDeleteVenue={onDeleteVenue}
                />
            ))}
            <AddVenueCard />
        </div>
    );
};

export default VenuesGrid;