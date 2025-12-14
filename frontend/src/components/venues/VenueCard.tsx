// src/components/venues/VenueCard.tsx
import { Star, MapPin, Users, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

export interface Venue {
  id: number;
  name: string;
  image: string;
  rating: number;
  price: number;
  city: string;
  type: string;
  capacity: string;
}

interface VenueCardProps {
  venue: Venue;
  index: number;
}

const VenueCard = ({ venue, index }: VenueCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      to={`/venues/${venue.id}`}
      className="block group perspective-1000"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="relative bg-white rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-2 border border-transparent hover:border-blue-100 ease-out"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        {/* Image Container */}
        <div className="relative overflow-hidden aspect-[4/3]">
          <div className={`absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent z-10 transition-opacity duration-300 ${isHovered ? 'opacity-40' : 'opacity-60'}`}></div>
          <img
            src={venue.image}
            alt={venue.name}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            loading="lazy"
          />

          {/* Top Badges */}
          <div className="absolute top-4 left-4 z-20">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-white/95 text-blue-700 shadow-lg backdrop-blur-md border border-white/20">
              {venue.type}
            </span>
          </div>
          <div className="absolute top-4 right-4 z-20">
            <button className="p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white hover:text-red-500 transition-all duration-300 transform group-hover:scale-110">
              <Heart className="h-4 w-4 stroke-[3px]" />
            </button>
          </div>

          {/* Price Badge - Floating Effect */}
          <div className="absolute bottom-4 right-4 z-20">
            <span className="inline-flex items-center px-4 py-2 rounded-2xl text-sm font-extrabold bg-white/95 text-gray-900 shadow-xl backdrop-blur-md border border-white/20 transform transition-transform duration-300 group-hover:scale-105">
              Rs {venue.price.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 relative z-20 bg-white">
          <div className="flex items-start justify-between mb-4 gap-2">
            <h3 className="text-xl font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors duration-300">
              {venue.name}
            </h3>
            <div className="flex items-center gap-1.5 bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-full text-xs font-bold border border-yellow-100 shadow-sm shrink-0">
              <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
              <span>{venue.rating.toFixed(1)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
              <div className="p-1.5 rounded-full bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                <MapPin className="h-4 w-4 shrink-0" />
              </div>
              <span className="line-clamp-1 font-medium">{venue.city}</span>
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
              <div className="p-1.5 rounded-full bg-gray-50 text-gray-400 group-hover:bg-purple-50 group-hover:text-purple-500 transition-colors">
                <Users className="h-4 w-4 shrink-0" />
              </div>
              <span className="font-medium">Capacity: <span className="text-gray-900">{venue.capacity}</span> guests</span>
            </div>
          </div>

          {/* View Details Button - Appears on Hover */}
          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-out absolute inset-x-6 bottom-4 bg-white">
            <span className="text-sm font-semibold text-blue-600">View Details</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default VenueCard;