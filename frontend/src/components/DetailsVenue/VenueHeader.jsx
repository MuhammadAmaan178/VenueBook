// src/components/VenueDetails/VenueHeader.jsx
import { motion } from 'framer-motion';
import { Star, Users, MapPin } from 'lucide-react';
import PropTypes from 'prop-types';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const VenueHeader = ({ venue }) => {
  const hasImages = venue.images && venue.images.length > 0;

  // Debug logging
  console.log('VenueHeader - venue data:', venue);
  console.log('VenueHeader - hasImages:', hasImages);
  console.log('VenueHeader - images:', venue.images);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="venue-header"
    >
      {/* Image Carousel */}
      {hasImages && (
        <div className="venue-image-carousel">
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
            className="venue-swiper"
          >
            {venue.images.map((image, index) => (
              <SwiperSlide key={image.image_id || index}>
                <div
                  className="venue-slide-image"
                  style={{
                    backgroundImage: `url(${image.image_url})`,
                  }}
                >
                  {/* Dark overlay for text readability */}
                  <div className="venue-image-overlay" />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      {/* Content Overlay */}
      <div className={hasImages ? "header-content-overlay" : "header-gradient"}>
        <h1 className="venue-title">{venue.name}</h1>

        <div className="venue-meta">
          <div className="location">
            <MapPin className="w-5 h-5" />
            <span>{venue.address}, {venue.city}</span>
          </div>

          <div className="venue-stats">
            <div className="capacity-badge">
              <Users className="w-5 h-5 mr-2" />
              <span>Capacity: {venue.capacity} people</span>
            </div>

            <div className="rating">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`star-icon ${i < Math.floor(parseFloat(venue.rating)) ? 'filled' : 'empty'}`}
                />
              ))}
              <span className="rating-text">{venue.rating}</span>
            </div>
          </div>
        </div>

        <p className="price-badge">
          Base Price: Rs. {parseFloat(venue.base_price).toLocaleString()}
        </p>
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