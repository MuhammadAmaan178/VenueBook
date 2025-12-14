// src/components/DetailsVenue/VenueReviews.jsx
import PropTypes from 'prop-types';
import { Star, User, Send, X } from 'lucide-react';
import { useState } from 'react';
import { venueService } from '../../services/api';

const VenueReviews = ({ reviews, venueId, onReviewAdded }) => {
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Please login to leave a review");
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await venueService.submitReview(venueId, { rating, review_text: reviewText }, token);
      setShowForm(false);
      setReviewText('');
      setRating(5);
      if (onReviewAdded) onReviewAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <span className="w-1.5 h-8 bg-blue-600 rounded-full"></span>
          Customer Reviews
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
        >
          {showForm ? 'Cancel' : 'Write a Review'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-blue-50/50 rounded-2xl border border-blue-100 animate-fadeIn">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Share you experience</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Review</label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none h-32"
              placeholder="Tell us about your experience..."
              required
            ></textarea>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 hover:shadow-lg disabled:opacity-50 transition-all"
            >
              {submitting ? (
                'Submitting...'
              ) : (
                <>
                  <Send className="w-4 h-4" /> Submit Review
                </>
              )}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500 italic">
            No reviews yet. Be the first to review!
          </div>
        ) : (
          reviews.map((review, index) => (
            <div
              key={index}
              className="group p-6 rounded-2xl bg-gray-50 hover:bg-white border border-transparent hover:border-gray-100 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                    {review.user_name ? review.user_name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{review.user_name || 'Anonymous User'}</h4>
                    <p className="text-xs text-gray-500">
                      {new Date(review.review_date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-gray-900">{review.rating}</span>
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed italic">
                &quot;{review.review_text}&quot;
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

VenueReviews.propTypes = {
  reviews: PropTypes.arrayOf(PropTypes.shape({
    user_name: PropTypes.string,
    review_date: PropTypes.string,
    rating: PropTypes.number,
    review_text: PropTypes.string,
  })).isRequired,
  venueId: PropTypes.string.isRequired,
  onReviewAdded: PropTypes.func.isRequired,
};

export default VenueReviews;