// src/components/venues/VenueCard.jsx
import { Star, MapPin, Users } from "lucide-react";
import { Link } from "react-router-dom";

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
  return (
    <Link 
      to={`/venues/${venue.id}`}
      className="block"
    >
      <div
        className="cursor-pointer rounded-lg shadow-xl overflow-hidden bg-white dark:bg-gray-800 transition-all duration-300 hover:shadow-2xl hover:translate-y-[-4px] animate-slide-up"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <div className="relative overflow-hidden aspect-[4/3]">
          <img
            src={venue.image}
            alt={venue.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
            loading="lazy"
          />
          <div className="absolute top-3 left-3 bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium">
            {venue.type}
          </div>
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-800 px-2 py-1 rounded text-sm font-medium">
            Rs {venue.price.toLocaleString()}
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
              {venue.name}
            </h3>

            <div className="flex items-center gap-1 text-sm bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
              <Star className="h-3.5 w-3.5 fill-yellow-500 stroke-none" />
              <span>{venue.rating.toFixed(1)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <MapPin className="h-4 w-4" />
              <span>{venue.city}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Users className="h-4 w-4" />
              <span>Capacity: {venue.capacity} people</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default VenueCard;