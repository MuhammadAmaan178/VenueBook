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
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-gray-200">
        <div>
          <p className="text-gray-900 font-medium text-lg">
            Showing <span className="font-bold text-blue-600">
              {Math.min(venues.length, 10)}
            </span> of <span className="font-bold text-blue-600">
              {totalResults}
            </span> results
          </p>
          {totalResults > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              Found {totalResults} venue{totalResults !== 1 ? 's' : ''} matching your criteria
            </p>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="appearance-none bg-white border border-gray-300 text-gray-900 px-4 py-2.5 pl-4 pr-10 rounded-xl text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all hover:border-gray-400"
          >
            <option value="popularity">Sort By Popularity</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* Venues Grid */}
      {venues.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {venues.map((venue, index) => (
            <VenueCard key={venue.id} venue={venue} index={index} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-2xl border border-gray-200 shadow-sm border-dashed">
          <div className="mb-4 bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
            <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            No venues found
          </h3>
          <p className="text-gray-500">
            We couldn't find any venues matching your filters.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 text-blue-600 font-medium hover:text-blue-700 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};

export default VenueGrid;