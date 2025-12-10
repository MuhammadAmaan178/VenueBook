// src/components/venues/SearchFilters.jsx
import { Search, ChevronDown } from "lucide-react";
import { useState } from "react";

// --- Interfaces and Data (No Change) ---
interface SearchFiltersProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  city: string;
  type: string;
  capacity: string;
  range: string;
}

const cities = ["All Cities", "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad"];
const types = ["All Types", "Banquet Hall", "Conference Hall", "Garden Venue", "Ballroom", "Rooftop"];
const capacities = ["All Capacity", "50-100", "100-200", "200-500", "500+"];
const ranges = ["All Range", "Under 50,000", "50,000 - 100,000", "100,000 - 200,000", "200,000+"];

// --- SearchFilters Component ---
const SearchFilters = ({ onSearch, onFilterChange }: SearchFiltersProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    city: "All Cities",
    type: "All Types",
    capacity: "All Capacity",
    range: "All Range",
  });

  const handleSearch = () => {
    onSearch(searchQuery);
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 md:p-6 mb-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Find Your Perfect Venue
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Discover amazing venues for weddings, corporate events, and celebrations
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by venue name, location, or features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full h-12 py-2 pl-4 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
        <button
          onClick={handleSearch}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 md:px-4 py-1 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2 min-w-[100px]"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>

      {/* Filter Dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <FilterSelect
          label="City"
          value={filters.city}
          options={cities}
          onChange={(value) => handleFilterChange("city", value)}
        />
        <FilterSelect
          label="Venue Type"
          value={filters.type}
          options={types}
          onChange={(value) => handleFilterChange("type", value)}
        />
        <FilterSelect
          label="Capacity"
          value={filters.capacity}
          options={capacities}
          onChange={(value) => handleFilterChange("capacity", value)}
        />
        <FilterSelect
          label="Price Range"
          value={filters.range}
          options={ranges}
          onChange={(value) => handleFilterChange("range", value)}
        />
      </div>
    </div>
  );
};

// --- FilterSelect Component ---
interface FilterSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

const FilterSelect = ({ label, value, options, onChange }: FilterSelectProps) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-12 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white py-2 pl-4 pr-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
};

export default SearchFilters;