import React, { useState, useEffect } from 'react';
import { Building2, Filter, X } from 'lucide-react';
import VenuesHeader from './VenuesHeader';
import VenuesTable from './VenuesTable';
import AddVenueForm from '../AddVenueForm/AddVenueForm';
import VenueDetailsModal from '../modals/VenueDetailsModal';
import { useAuth } from '../../../contexts/AuthContext';
import { ownerService } from '../../../services/api';

const VenuesPage = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Modal states
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [showVenueDetails, setShowVenueDetails] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    city: '',
    sort_by: 'name'
  });

  const auth = useAuth ? useAuth() : {};
  const user = auth.user || { user_id: 1 };
  const [editingVenue, setEditingVenue] = useState(null);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const ownerId = user?.owner_id || user?.user_id || user?.id;

      // Build filter params
      const filterParams = {};
      if (searchTerm) filterParams.search = searchTerm;
      if (filters.status) filterParams.status = filters.status;
      if (filters.city) filterParams.city = filters.city;
      if (filters.sort_by) filterParams.sort_by = filters.sort_by;

      const data = await ownerService.getVenues(ownerId, filterParams, token);

      if (data && data.venues) {
        // Map API data to Table format
        const mappedVenues = data.venues.map(v => ({
          id: v.venue_id,
          _raw: v,
          image: v.image_url ?
            <img src={v.image_url} alt={v.name} className="w-full h-full object-cover rounded" /> :
            <Building2 className="text-gray-400" />,
          name: v.name,
          location: v.city,
          capacity: v.capacity,
          price: `Rs. ${v.base_price?.toLocaleString()}`,
          status: v.status || 'Active',
          bookings: v.bookings_count || 0
        }));
        setVenues(mappedVenues);
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
      fetchVenues();
    }, 500);
    return () => clearTimeout(timer);
  }, [user, searchTerm, filters]);

  const handleAddVenue = () => {
    fetchVenues();
  };

  const handleEdit = (venue) => {
    setEditingVenue(venue._raw || venue);
    setIsAddModalOpen(true);
  };

  const handleView = async (venue) => {
    try {
      const token = localStorage.getItem('token');
      const ownerId = user?.owner_id || user?.user_id || user?.id;
      const venueId = venue.id || venue.venue_id;

      // Fetch full venue details from API
      const venueData = await ownerService.getVenueDetails(ownerId, venueId, token);
      setSelectedVenue(venueData);
      setShowVenueDetails(true);
    } catch (error) {
      console.error('Error fetching venue details:', error);
      alert('Failed to load venue details');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this venue?")) return;
    try {
      const token = localStorage.getItem('token');
      const ownerId = user?.owner_id || user?.user_id || user?.id;
      await ownerService.deleteVenue(ownerId, id, token);
      alert("Venue deleted successfully!");
      fetchVenues();
    } catch (error) {
      console.error("Delete failed", error);
      alert(error.message || "Failed to delete venue");
    }
  };

  const handleExport = () => {
    if (!venues.length) return alert("No venues to export");

    const headers = ['ID', 'Name', 'Type', 'City', 'Address', 'Capacity', 'Price', 'Status'];
    const csvContent = [
      headers.join(','),
      ...venues.map(v => {
        const r = v._raw || {};
        return [
          r.venue_id,
          `"${r.name || ''}"`,
          `"${r.type || ''}"`,
          `"${r.city || ''}"`,
          `"${r.address || ''}"`,
          r.capacity,
          r.base_price,
          r.status
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'my_venues.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFilter = () => {
    setShowFilters(!showFilters);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      city: '',
      sort_by: 'name'
    });
  };

  return (
    <div className="p-6">
      <VenuesHeader
        onAddClick={() => setIsAddModalOpen(true)}
        onSearch={setSearchTerm}
        onFilter={handleFilter}
        onExport={handleExport}
      />

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Filter size={20} />
              Advanced Filters
            </h3>
            <button
              onClick={() => setShowFilters(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* City Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                placeholder="Enter city name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={filters.sort_by}
                onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="name">Name</option>
                <option value="capacity">Capacity</option>
                <option value="bookings_count">Bookings</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading venues...</div>
      ) : venues.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No venues found. {searchTerm || filters.status || filters.city ? 'Try adjusting your filters.' : 'Add your first venue!'}
        </div>
      ) : (
        <VenuesTable venues={venues} onEdit={handleEdit} onDelete={handleDelete} onView={handleView} />
      )}

      <AddVenueForm
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setEditingVenue(null); }}
        onAddVenue={handleAddVenue}
        initialData={editingVenue}
      />

      {/* Venue Details Modal */}
      {showVenueDetails && (
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