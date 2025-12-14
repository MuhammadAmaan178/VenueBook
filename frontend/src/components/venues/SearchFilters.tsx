// src/components/venues/SearchFilters.jsx
import { Search, ChevronDown, MapPin, Building2, Users, DollarSign, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { venueService } from "../../services/api";

// --- Interfaces and Data ---
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

  const [cityOptions, setCityOptions] = useState(["All Cities"]);
  const [typeOptions, setTypeOptions] = useState(["All Types"]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const data = await venueService.getFilters();
        setCityOptions(["All Cities", ...data.cities]);
        setTypeOptions(["All Types", ...data.types]);
      } catch (error) {
        console.error("Failed to fetch filters:", error);
      }
    };
    fetchFilters();
  }, []);

  const handleSearch = () => {
    onSearch(searchQuery);
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="relative mb-10 group z-30">
      {/* Background Layer - Handles glassmorphism and clips blobs */}
      <div className="absolute inset-0 bg-gray-50/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 overflow-hidden transition-all duration-300 group-hover:shadow-2xl">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-50/50 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-purple-50/50 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Content Layer - No overflow hidden, allows dropdowns to show */}
      <div className="relative z-10 p-8">
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-700 mb-3 tracking-tight">
            Find Your Perfect Venue
          </h1>
          <p className="text-gray-600 text-lg font-medium">
            Discover curated spaces for weddings, events, and unforgettable moments
          </p>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative group/search">
            <input
              type="text"
              placeholder="Search by venue name, location, or features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full h-14 py-4 pl-14 pr-6 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 bg-white/50 hover:bg-white transition-all text-gray-900 font-medium placeholder-gray-400 shadow-sm group-hover/search:shadow-md"
            />
            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400 group-hover/search:text-blue-500 transition-colors" />
          </div>
          <button
            onClick={handleSearch}
            className="h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-10 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Search className="h-5 w-5" />
            <span>Search</span>
          </button>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <CustomDropdown
            icon={<MapPin className="w-5 h-5" />}
            label="City"
            value={filters.city}
            options={cityOptions}
            onChange={(value) => handleFilterChange("city", value)}
          />
          <CustomDropdown
            icon={<Building2 className="w-5 h-5" />}
            label="Venue Type"
            value={filters.type}
            options={typeOptions}
            onChange={(value) => handleFilterChange("type", value)}
          />
          <CustomDropdown
            icon={<Users className="w-5 h-5" />}
            label="Capacity"
            value={filters.capacity}
            options={capacities}
            onChange={(value) => handleFilterChange("capacity", value)}
          />
          <CustomDropdown
            icon={<DollarSign className="w-5 h-5" />}
            label="Price Range"
            value={filters.range}
            options={ranges}
            onChange={(value) => handleFilterChange("range", value)}
          />
        </div>
      </div>
    </div>
  );
};

// --- Custom Dropdown Component ---
interface CustomDropdownProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

const CustomDropdown = ({ icon, label, value, options, onChange }: CustomDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-bold text-gray-700 mb-2.5 flex items-center gap-2 ml-1">
        <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">{icon}</span>
        {label}
      </label>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-14 bg-white/80 backdrop-blur-sm border text-left px-5 rounded-2xl flex items-center justify-between transition-all duration-300 group ${isOpen
          ? "border-blue-500 ring-4 ring-blue-100 shadow-lg bg-white"
          : "border-gray-200 hover:border-blue-400 hover:shadow-md hover:bg-white"
          }`}
      >
        <span className="font-semibold truncate text-gray-900">{value}</span>
        <ChevronDown
          className={`h-5 w-5 text-gray-400 transition-all duration-300 group-hover:text-blue-500 ${isOpen ? "transform rotate-180 text-blue-600" : ""
            }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-2xl max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-200 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          <div className="p-2 space-y-1">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${value === option
                  ? "bg-blue-50 text-blue-700 shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1"
                  }`}
              >
                <span>{option}</span>
                {value === option && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilters;