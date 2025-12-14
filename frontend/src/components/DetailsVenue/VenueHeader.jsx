// src/components/DetailsVenue/VenueHeader.jsx
import { motion } from 'framer-motion';
import { Star, MapPin, Users, Share2, Heart, Shield, CheckCircle, MessageCircle, Phone } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';
import PropTypes from 'prop-types';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { useState } from 'react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const VenueHeader = ({ venue }) => {
  const hasImages = venue.images && venue.images.length > 0;
  const { openChat, isChatOpen } = useSocket();
  const { user, isAuthenticated } = useAuth();
  const [loadingChat, setLoadingChat] = useState(false);

  const handleMessageOwner = async () => {
    if (!isAuthenticated) {
      alert("Please login to message the owner.");
      return; // Or redirect to login
    }

    try {
      setLoadingChat(true);
      const token = localStorage.getItem('token');
      // Create or get conversation
      const response = await axios.post(`${API_BASE_URL}/api/users/conversations`, {
        owner_id: venue.owner_id,
        venue_id: venue.venue_id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.conversation_id) {
        // Open chat with this conversation
        const conversation = {
          conversation_id: response.data.conversation_id,
          name: venue.name // Or owner name
        };
        openChat(conversation);
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      alert("Failed to start conversation.");
    } finally {
      setLoadingChat(false);
    }
  };

  const handleWhatsApp = () => {
    if (venue.owner_phone) {
      const text = `Hi, I'm interested in ${venue.name} listed on Venue Finder.`;
      window.open(`https://wa.me/${venue.owner_phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-3xl shadow-2xl bg-white group"
    >
      {/* Image Carousel or Placeholder */}
      <div className="relative h-[400px] md:h-[500px] w-full bg-gray-200">
        {hasImages ? (
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={0}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
            }}
            loop={venue.images.length > 1}
            className="h-full w-full"
          >
            {venue.images.map((image, index) => (
              <SwiperSlide key={image.image_id || index}>
                <div className="relative h-full w-full">
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/40 to-transparent z-10" />
                  <img
                    src={image.image_url}
                    alt={`${venue.name} view ${index + 1}`}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-100 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50" />
            <span className="text-gray-400 font-medium relative z-10">No images available</span>
          </div>
        )}
      </div>

      {/* Content Overlay - Floating aesthetics */}
      <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 z-20">
        <div className="flex flex-col md:flex-row items-end justify-between gap-6">
          <div className="space-y-4 flex-1">
            {/* Title with gradient */}
            <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-xl tracking-tight leading-tight">
              {venue.name}
            </h1>

            {/* Location Badge */}
            <div className="flex items-center gap-2 text-white/90 font-medium backdrop-blur-md bg-white/10 w-fit px-4 py-2 rounded-full border border-white/20">
              <MapPin className="w-5 h-5 text-blue-300" />
              <span>{venue.address}, {venue.city}</span>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white/95 text-gray-900 px-4 py-2 rounded-full shadow-lg font-bold">
                <Users className="w-4 h-4 text-blue-600" />
                <span>{venue.capacity} Guests</span>
              </div>
              <div className="flex items-center gap-1.5 bg-yellow-400 text-yellow-950 px-3 py-2 rounded-full shadow-lg font-bold">
                <Star className="w-4 h-4 fill-current" />
                <span>{venue.rating}</span>
              </div>
            </div>

            {/* Contact Actions */}
            <div className="mt-4 flex flex-wrap gap-3 relative z-50">
              <button
                onClick={handleMessageOwner}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Message</span>
              </button>

              {venue.owner_phone && (
                <button
                  onClick={handleWhatsApp}
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-green-500/20 transition-all hover:scale-105 active:scale-95"
                >
                  <Phone className="w-5 h-5" />
                  <span>WhatsApp</span>
                </button>
              )}
            </div>
          </div>

          {/* Price Badge - Enhanced */}
          <div className="bg-white/95 backdrop-blur-md p-1 rounded-[2rem] shadow-2xl skew-x-0 transform transition-transform hover:scale-105 duration-300">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 rounded-[1.8rem] text-center border-4 border-white/50">
              <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-0.5">Starting from</p>
              <p className="text-3xl font-extrabold text-white">
                Rs. {parseFloat(venue.base_price).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

VenueHeader.propTypes = {
  venue: PropTypes.shape({
    name: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    city: PropTypes.string.isRequired,
    capacity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    rating: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    base_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    images: PropTypes.arrayOf(PropTypes.shape({
      image_id: PropTypes.number,
      image_url: PropTypes.string.isRequired,
    })),
  }).isRequired,
};

export default VenueHeader;