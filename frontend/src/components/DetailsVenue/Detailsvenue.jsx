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
import './VenueDetails.css';

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
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Venue</h2>
            <p className="text-gray-600">{error || 'Venue not found'}</p>
            <button
              onClick={() => navigate('/venues')}
              className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800 mx-auto"
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
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-8 pt-20">
        {/* Back Button */}
        <button
          onClick={() => navigate('/venues')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Venues
        </button>

        {/* Venue Header */}
        <VenueHeader venue={venue} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Content Sections */}
          <div className="lg:col-span-2 space-y-8">
            <VenueAbout description={venue.description} />

            {venue.facilities && venue.facilities.length > 0 && (
              <VenueFacilities facilities={venue.facilities} />
            )}

            {venue.reviews && venue.reviews.length > 0 && (
              <VenueReviews reviews={venue.reviews} />
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
  );
};

export default VenueDetails;