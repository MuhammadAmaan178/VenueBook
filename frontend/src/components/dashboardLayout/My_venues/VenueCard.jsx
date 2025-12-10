// components/VenueCard.jsx
import React from 'react';
import { MapPin, Users, Star, Edit, Trash2, Eye } from 'lucide-react';

const VenueCard = ({ venue, onDeleteVenue }) => {
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={16}
          className={i <= Math.floor(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
        />
      );
    }
    return stars;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
      {/* Venue Image */}
      <div className="h-48 overflow-hidden">
        <img
          src={venue.image}
          alt={venue.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Venue Details */}
      <div className="p-5">
        {/* Venue Name and Type */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-800 mb-1">{venue.name}</h3>
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <MapPin size={16} />
            <span className="text-sm">{venue.location}</span>
          </div>
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {venue.type}
          </span>
        </div>

        {/* Venue Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Users size={18} className="text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Capacity</p>
              <p className="font-semibold text-gray-800">{venue.capacity.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Star size={18} className="text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Rating</p>
              <div className="flex items-center gap-1">
                {renderStars(venue.rating)}
                <span className="ml-1 font-semibold text-gray-800">
                  {venue.rating}
                </span>
                <span className="text-gray-500 text-sm">
                  ({venue.reviews} reviews)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="mb-6 p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-gray-600">Starting from</p>
          <p className="text-2xl font-bold text-green-700">{venue.price}</p>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center border-t pt-4">
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <Eye size={16} />
              See Details
            </button>
          </div>

          <div className="flex gap-2">
            <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
              <Edit size={18} />
            </button>
            <button
              onClick={() => onDeleteVenue(venue.id)}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueCard;