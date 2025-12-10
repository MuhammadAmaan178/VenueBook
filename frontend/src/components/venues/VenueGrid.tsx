// src/components/venues/VenueGrid.jsx
import VenueCard, { Venue } from "./VenueCard";
import { ChevronDown } from "lucide-react";

interface VenueGridProps {
  venues: Venue[];
  totalResults: number;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

const VenueGrid = ({ venues, totalResults, sortBy, onSortChange }: VenueGridProps) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 md:p-6 shadow-inner">
      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <p className="text-gray-700 dark:text-gray-300 font-medium text-lg">
            Showing <span className="font-bold text-blue-600 dark:text-blue-400">
              {Math.min(venues.length, 10)}
            </span> of <span className="font-bold text-blue-600 dark:text-blue-400">
              {totalResults}
            </span> results
          </p>
          {totalResults > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Found {totalResults} venue{totalResults !== 1 ? 's' : ''} matching your criteria
            </p>
          )}
        </div>
        
        {/* Sort Dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-3 py-2 pl-4 pr-8 rounded-lg text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
          >
            <option value="popularity">Sort By Popularity</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Venues Grid */}
      {venues.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {venues.map((venue, index) => (
            <VenueCard key={venue.id} venue={venue} index={index} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mb-4">
            <svg className="h-12 w-12 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
            No venues found matching your criteria.
          </p>
          <p className="text-gray-400 dark:text-gray-500 mt-2">
            Try adjusting your search or filters.
          </p>
        </div>
      )}
    </div>
  );
};

export default VenueGrid;