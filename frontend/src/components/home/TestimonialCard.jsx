import React from "react";

const TestimonialCard = ({ review }) => {
    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Render star rating
    const renderStars = (rating) => {
        return (
            <div className="flex gap-1">
                {[...Array(5)].map((_, index) => (
                    <svg
                        key={index}
                        className={`w-5 h-5 ${index < rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-1">
            {/* Rating */}
            <div className="mb-4">
                {renderStars(review.rating)}
            </div>

            {/* Review Text */}
            <p className="text-gray-700 text-base leading-relaxed mb-6 line-clamp-4">
                "{review.review_text}"
            </p>

            {/* Customer Info */}
            <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold text-lg">
                        {review.customer_name.charAt(0).toUpperCase()}
                    </div>

                    {/* Name and Venue */}
                    <div>
                        <h4 className="font-semibold text-gray-900">{review.customer_name}</h4>
                        <p className="text-sm text-gray-500">Booked {review.venue_name}</p>
                    </div>
                </div>

                {/* Date */}
                <p className="text-xs text-gray-400 mt-3">
                    {formatDate(review.review_date)}
                </p>
            </div>
        </div>
    );
};

export default TestimonialCard;
