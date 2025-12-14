import React, { useState, useEffect } from 'react';
import { Building2, Filter, X, Plus, Search, MapPin, ChevronDown, Activity, ArrowUpDown } from 'lucide-react';
import AddVenueForm from '../AddVenueForm/AddVenueForm';
import VenueDetailsModal from '../modals/VenueDetailsModal';
import { useAuth } from '../../../contexts/AuthContext';
import { ownerService } from '../../../services/api';
import { CustomDropdown } from '../common/DashboardFilters';

const VenuesPage = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  const [filters, setFilters] = useState({
    status: "All Statuses",
    city: '',
    sort_by: 'name'
  });

  const statusOptions = ["All Statuses", "active", "pending", "inactive"];
  const sortOptions = [
    { label: "Name", value: "name" },
    { label: "Capacity", value: "capacity" },
    { label: "Bookings", value: "bookings_count" }
  ];

  // Modal states
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [showVenueDetails, setShowVenueDetails] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);

  const { user } = useAuth ? useAuth() : {};

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const ownerId = user?.owner_id || user?.user_id;

      if (!token || !ownerId) {
        setLoading(false);
        return;
      }

      // Build filter params
      const filterParams = {};
      if (activeSearch) filterParams.search = activeSearch;
      if (filters.status && filters.status !== "All Statuses") filterParams.status = filters.status;
      if (filters.city) filterParams.city = filters.city;
      if (filters.sort_by) filterParams.sort_by = filters.sort_by;

      const data = await ownerService.getVenues(ownerId, filterParams, token);

      if (data && data.venues) {
        setVenues(data.venues);
      }
    } catch (error) {
      console.error("Error fetching venues", error);
      setVenues([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) fetchVenues();
    }, 500);
    return () => clearTimeout(timer);
  }, [user, activeSearch, filters]);

  const handleSearch = () => {
    setActiveSearch(searchQuery);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleEdit = async (venue) => {
    ('handleEdit called with venue:', venue);
    try {
      const token = localStorage.getItem('token');
      const ownerId = user?.owner_id || user?.user_id;
      ('ownerId:', ownerId, 'venue_id:', venue.venue_id);

      // Fetch full details before editing to ensure we have photos, facilities, etc.
      ('Calling getVenueDetails...');
      const fullVenueData = await ownerService.getVenueDetails(ownerId, venue.venue_id, token);
      ('Got venue data:', fullVenueData);

      setEditingVenue(fullVenueData);
      setIsAddModalOpen(true);
    } catch (error) {
      console.error('Error fetching venue details for edit:', error);
      alert('Failed to load venue details for editing');
    }
  };

  const handleView = async (venueId) => {
    try {
      const token = localStorage.getItem('token');
      const ownerId = user?.owner_id || user?.user_id;

      const venueData = await ownerService.getVenueDetails(ownerId, venueId, token);
      setSelectedVenue(venueData);
      setShowVenueDetails(true);
    } catch (error) {
      console.error('Error fetching venue details:', error);
      alert('Failed to load venue details');
    }
  };

  const handleExport = () => {
    setShowExportMenu(false);
    if (!venues.length) return alert("No venues to export");

    const headers = ['ID', 'Name', 'Type', 'City', 'Address', 'Capacity', 'Price', 'Status'];
    const csvContent = [
      headers.join(','),
      ...venues.map(v => [
        v.venue_id,
        `"${v.name || ''}"`,
        `"${v.type || ''}"`,
        `"${v.city || ''}"`,
        `"${v.address || ''}"`,
        v.capacity,
        v.base_price,
        v.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `my_venues_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            My Venues
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Manage your listed properties and their details
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5"
          >
            <Plus size={20} />
            Add Venue
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all ${showFilters
              ? "bg-blue-50 text-blue-600 border border-blue-100"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
          >
            <Filter size={18} />
            <span>Filters</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white hover:bg-black rounded-xl font-bold transition-all shadow-lg shadow-gray-200 hover:scale-[1.02]"
            >
              Export <ChevronDown size={16} />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                <button
                  onClick={handleExport}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700 font-medium"
                >
                  Export CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Section */}
      {showFilters && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-8 animate-in slide-in-from-top-2 duration-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900 text-lg">Filters</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative group/search">
              <input
                type="text"
                placeholder="Search venues by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full h-12 py-3 pl-12 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-gray-50/50 hover:bg-white transition-all text-gray-900 font-medium placeholder-gray-400"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover/search:text-blue-500 transition-colors" />
            </div>
            <button
              onClick={handleSearch}
              className="h-12 bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              <Search className="h-5 w-5" />
              <span>Search</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <CustomDropdown
              icon={<Activity className="w-5 h-5" />}
              label="Status"
              value={filters.status}
              options={statusOptions}
              onChange={(value) => handleFilterChange("status", value)}
            />

            {/* City Filter - Manual Input for now as we don't have dynamic city list prop */}
            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-2.5 flex items-center gap-2 ml-1">
                <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><MapPin className="w-5 h-5" /></span>
                City
              </label>
              <input
                type="text"
                placeholder="Enter city name"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                className="w-full h-14 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl px-5 text-gray-900 font-semibold placeholder:font-normal focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <CustomDropdown
              icon={<ArrowUpDown className="w-5 h-5" />}
              label="Sort By"
              value={filters.sort_by}
              options={sortOptions}
              onChange={(value) => handleFilterChange("sort_by", value)}
            />

            <div className="flex items-end justify-end h-full">
              <button
                onClick={() => {
                  setFilters({
                    status: "All Statuses",
                    city: '',
                    sort_by: 'name'
                  });
                  setSearchQuery('');
                  setActiveSearch('');
                }}
                className="h-14 mb-0.5 w-full bg-white border border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 rounded-2xl font-bold transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <X size={18} /> Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Venues Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Venue</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Capacity</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">Loading venues...</td>
                </tr>
              ) : venues.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    No venues found. {activeSearch || filters.status !== "All Statuses" ? 'Try adjusting your filters.' : ''}
                  </td>
                </tr>
              ) : (
                venues.map((venue) => (
                  <tr key={venue.venue_id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 overflow-hidden">
                          {venue.image_url ? (
                            <img src={venue.image_url} alt={venue.name} className="w-full h-full object-cover" />
                          ) : (
                            <Building2 size={20} />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900">{venue.name}</div>
                          <div className="text-xs text-gray-500">ID: {venue.venue_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                        {venue.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <MapPin size={14} className="text-gray-400" /> {venue.city}, {venue.address}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {venue.capacity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      Rs. {Number(venue.base_price).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full uppercase tracking-wide ${getStatusColor(venue.status)}`}>
                        {venue.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleView(venue.venue_id)}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 hover:scale-105 transition-all shadow-sm"
                          title="View Details"
                        >
                          <Activity size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(venue)}
                          className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 hover:scale-105 transition-all shadow-sm"
                          title="Edit Venue"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddVenueForm
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setEditingVenue(null); }}
        onAddVenue={() => { fetchVenues(); setIsAddModalOpen(false); setEditingVenue(null); }}
        initialData={editingVenue}
      />

      {selectedVenue && showVenueDetails && (
        <VenueDetailsModal
          venue={selectedVenue}
          onClose={() => {
            setShowVenueDetails(false);
            setSelectedVenue(null);
          }}
        />
      )}
    </div>
  );
};

export default VenuesPage;