// src/components/VenueDetails/VenueReviews.jsx
import { Star } from 'lucide-react';
import PropTypes from 'prop-types';

const VenueReviews = ({ reviews }) => {
  return (
    <div className="venue-section">
      <h2 className="section-title">Customer Reviews</h2>
      <div className="reviews-container">
        {reviews.map((review) => (
          <div key={review.review_id} className="review-card">
            <div className="review-header">
              <div>
                <h3 className="reviewer-name">{review.user_name}</h3>
                <p className="review-date">
                  {new Date(review.review_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className="review-rating">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`star-icon ${i < review.rating ? 'filled' : 'empty'}`}
                  />
                ))}
              </div>
            </div>
            <p className="review-text">{review.review_text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

VenueReviews.propTypes = {
  reviews: PropTypes.arrayOf(
    PropTypes.shape({
      review_id: PropTypes.number.isRequired,
      user_name: PropTypes.string.isRequired,
      review_date: PropTypes.string.isRequired,
      rating: PropTypes.number.isRequired,
      review_text: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default VenueReviews;