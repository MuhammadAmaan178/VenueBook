// components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import StatsCards from './StatsCards';
import { useAuth } from '../../contexts/AuthContext';
import { ownerService } from '../../services/api';
import { Eye, Edit, Check } from 'lucide-react';
import VenueDetailsModal from './modals/VenueDetailsModal';
import BookingDetailsModal from './modals/BookingDetailsModal';

const Dashboard = () => {
  const { user } = useAuth ? useAuth() : { user: {} };
  const [statsData, setStatsData] = useState({
    totalVenues: 0,
    totalBookings: 0,
    totalRevenue: "0",
    avgRating: "0"
  });
  const [topVenues, setTopVenues] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showVenueDetails, setShowVenueDetails] = useState(false);
  const [showBookingDetails, setShowBookingDetails] = useState(false);

  const userData = {
    name: user?.name || "Owner"
  };

  useEffect(() => {
    fetchDashboard();
  }, [user]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token || !user) return;

      const ownerId = user.owner_id || user.user_id;
      const data = await ownerService.getDashboard(ownerId, token);

      setStatsData({
        totalVenues: data.total_venues || 0,
        totalBookings: data.total_bookings || 0,
        totalRevenue: data.total_revenue ? `${(data.total_revenue / 1000).toFixed(0)}K` : "0",
        avgRating: data.avg_rating ? `${data.avg_rating} ⭐` : "0 ⭐"
      });

      setTopVenues(data.top_venues || []);
      setRecentBookings(data.recent_bookings || []);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Venue Actions
  const handleViewVenue = async (venueId) => {
    try {
      const token = localStorage.getItem('token');
      const ownerId = user.owner_id || user.user_id;
      const venueData = await ownerService.getVenueDetails(ownerId, venueId, token);
      setSelectedVenue(venueData);
      setShowVenueDetails(true);
    } catch (error) {
      console.error('Error fetching venue details:', error);
      alert('Failed to load venue details');
    }
  };





  // Booking Actions
  const handleViewBooking = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      const ownerId = user.owner_id || user.user_id;
      const bookingData = await ownerService.getBookingDetails(ownerId, bookingId, token);
      setSelectedBooking(bookingData);
      setShowBookingDetails(true);
    } catch (error) {
      console.error('Error fetching booking details:', error);
      alert('Failed to load booking details');
    }
  };

  const handleConfirmBooking = async (bookingId, customerName) => {
    const confirmed = window.confirm(
      `Confirm booking for ${customerName}?\n\nThe customer will be notified.`
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      const ownerId = user.owner_id || user.user_id;
      await ownerService.updateBookingStatus(ownerId, bookingId, { status: 'confirmed' }, token);
      alert('Booking confirmed successfully!');
      fetchDashboard(); // Refresh data
    } catch (error) {
      console.error('Error confirming booking:', error);
      alert('Failed to confirm booking');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6">
        <Header userName={userData.name} />

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Here's what's happening with your venues today
          </h2>
          <StatsCards stats={statsData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Venues */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4">My Venues (Top 5)</h3>
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : topVenues.length === 0 ? (
              <p className="text-gray-500">No venues found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-sm font-semibold text-gray-700">Name</th>
                      <th className="text-left py-2 text-sm font-semibold text-gray-700">City</th>
                      <th className="text-left py-2 text-sm font-semibold text-gray-700">Rating</th>
                      <th className="text-right py-2 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topVenues.map((venue) => (
                      <tr key={venue.venue_id} className="border-b hover:bg-gray-50">
                        <td className="py-3 text-sm">{venue.name}</td>
                        <td className="py-3 text-sm">{venue.city}</td>
                        <td className="py-3 text-sm">{venue.rating} ⭐</td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleViewVenue(venue.venue_id)}
                              className="p-2 hover:bg-blue-100 rounded-lg transition"
                              title="View Details"
                            >
                              <Eye size={18} className="text-blue-600" />
                            </button>


                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Bookings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4">Recent Bookings</h3>
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : recentBookings.length === 0 ? (
              <p className="text-gray-500">No bookings found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-sm font-semibold text-gray-700">Customer</th>
                      <th className="text-left py-2 text-sm font-semibold text-gray-700">Date</th>
                      <th className="text-left py-2 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-right py-2 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((booking) => (
                      <tr key={booking.booking_id} className="border-b hover:bg-gray-50">
                        <td className="py-3 text-sm">{booking.customer_name || 'N/A'}</td>
                        <td className="py-3 text-sm">{formatDate(booking.event_date)}</td>
                        <td className="py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleViewBooking(booking.booking_id)}
                              className="p-2 hover:bg-blue-100 rounded-lg transition"
                              title="View Details"
                            >
                              <Eye size={18} className="text-blue-600" />
                            </button>
                            {booking.status === 'pending' && (
                              <button
                                onClick={() => handleConfirmBooking(booking.booking_id, booking.customer_name)}
                                className="p-2 hover:bg-green-100 rounded-lg transition"
                                title="Confirm Booking"
                              >
                                <Check size={18} className="text-green-600" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showVenueDetails && (
        <VenueDetailsModal
          venue={selectedVenue}
          onClose={() => {
            setShowVenueDetails(false);
            setSelectedVenue(null);
          }}
        />
      )}



      {showBookingDetails && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => {
            setShowBookingDetails(false);
            setSelectedBooking(null);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;