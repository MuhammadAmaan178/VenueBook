// src/components/VenueDetails/VenueDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer';
import { ArrowLeft, Loader } from 'lucide-react';
import { venueService } from '../../services/api';
import VenueHeader from './VenueHeader';
import VenueAbout from './VenueAbout';
import VenueFacilities from './VenueFacilities';
import VenueReviews from './VenueReviews';
import BookingSection from './BookingSection';

const VenueDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVenueDetails();
  }, [id]);

  const fetchVenueDetails = async () => {
    try {
      setLoading(true);
      const data = await venueService.getVenueDetails(id);
      setVenue(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching venue details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-20">
          <Loader className="h-8 w-8 animate-spin text-blue-600" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-20">
          <div className="text-center p-8 bg-white/80 backdrop-blur-md rounded-3xl shadow-xl max-w-md mx-4">
            <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Venue</h2>
            <p className="text-gray-600 mb-6">{error || 'Venue not found'}</p>
            <button
              onClick={() => navigate('/venues')}
              className="flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl mx-auto transition-all shadow-lg hover:shadow-xl"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Venues
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-[800px] h-[800px] bg-blue-50/40 rounded-full blur-3xl pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-[600px] h-[600px] bg-purple-50/40 rounded-full blur-3xl pointer-events-none z-0"></div>

      <div className="relative z-10">
        <Navbar />

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-8 pt-24 min-h-screen">
          {/* Back Button */}
          <button
            onClick={() => navigate('/venues')}
            className="mb-8 flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-medium group"
          >
            <div className="p-2 bg-white rounded-full shadow-sm group-hover:shadow-md transition-all">
              <ArrowLeft className="w-5 h-5" />
            </div>
            Back to Venues
          </button>

          {/* Venue Header */}
          <VenueHeader venue={venue} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Left Column - Content Sections */}
            <div className="lg:col-span-2 space-y-8">
              <VenueAbout description={venue.description} />

              {venue.facilities && venue.facilities.length > 0 && (
                <VenueFacilities facilities={venue.facilities} />
              )}

              {venue.reviews && venue.reviews.length > 0 && (
                <VenueReviews
                  reviews={venue.reviews}
                  venueId={id}
                  onReviewAdded={fetchVenueDetails}
                />
              )}
              {(!venue.reviews || venue.reviews.length === 0) && (
                <VenueReviews
                  reviews={[]}
                  venueId={id}
                  onReviewAdded={fetchVenueDetails}
                />
              )}
            </div>

            {/* Right Column - Booking Section */}
            <div className="lg:col-span-1">
              <BookingSection venue={venue} />
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default VenueDetails;