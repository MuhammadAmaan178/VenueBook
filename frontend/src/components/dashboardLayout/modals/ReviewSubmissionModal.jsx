import React, { useState } from 'react';
import { X, Star, Quote, AlertCircle, CheckCircle } from 'lucide-react';
import { bookingService } from '../../../services/api';

const ReviewSubmissionModal = ({ isOpen, onClose, bookingId, venueName, onSuccess }) => {
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [hoveredRating, setHoveredRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (rating === 0) {
            setError('Please select a star rating');
            return;
        }

        try {
            setIsSubmitting(true);
            setError('');
            const token = localStorage.getItem('token');

            await bookingService.submitReview(bookingId, {
                rating,
                review_text: reviewText
            }, token);

            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to submit review. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white/95 backdrop-blur-xl w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-white/20 ring-1 ring-black/5">

                {/* Header */}
                <div className="relative h-28 bg-gradient-to-r from-purple-600 to-blue-600 flex flex-col justify-end p-6">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md transition-all duration-200 border border-white/10 shadow-lg"
                    >
                        <X size={20} />
                    </button>

                    <div>
                        <div className="flex items-center gap-2 text-blue-100 mb-1">
                            <Star size={16} className="text-yellow-300 fill-yellow-300" />
                            <span className="text-xs font-bold tracking-wider uppercase">Share Your Experience</span>
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight truncate">
                            {venueName || 'Rate Your Experience'}
                        </h2>
                    </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">

                    {/* Rating Input */}
                    <div className="flex flex-col items-center justify-center space-y-3 py-2">
                        <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Tap to Rate</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    onClick={() => setRating(star)}
                                    className="p-1 transition-transform hover:scale-110 focus:outline-none"
                                >
                                    <Star
                                        size={36}
                                        className={`transition-all duration-200 ${star <= (hoveredRating || rating)
                                                ? 'fill-yellow-400 text-yellow-400 drop-shadow-md'
                                                : 'text-gray-200 fill-gray-50'
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                        <div className="h-6">
                            {(hoveredRating || rating) > 0 && (
                                <span className={`text-sm font-bold px-3 py-1 rounded-full ${(hoveredRating || rating) >= 4 ? 'bg-green-100 text-green-700' :
                                        (hoveredRating || rating) === 3 ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                    }`}>
                                    {(hoveredRating || rating) === 5 ? 'Excellent!' :
                                        (hoveredRating || rating) === 4 ? 'Great!' :
                                            (hoveredRating || rating) === 3 ? 'Good' :
                                                (hoveredRating || rating) === 2 ? 'Fair' : 'Poor'}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Review Text */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <Quote size={16} className="text-purple-600" />
                            Your Review (Optional)
                        </label>
                        <textarea
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            placeholder="Tell us what you liked (or didn't like)..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-50 outline-none transition-all resize-none bg-gray-50/50 hover:bg-white text-gray-700 placeholder-gray-400"
                            rows="4"
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl flex items-start gap-3 border border-red-100 animate-in slide-in-from-top-2">
                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3.5 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] px-6 py-3.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    Submit Review <CheckCircle size={18} />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReviewSubmissionModal;
