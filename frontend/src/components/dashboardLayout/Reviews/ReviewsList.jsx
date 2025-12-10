// components/ReviewsList.jsx
import React from 'react';
import {
    Star, Calendar, CheckCircle, MessageSquare,
    ThumbsUp, ThumbsDown, Edit, Trash2, Send, X
} from 'lucide-react';

const ReviewsList = ({
    reviews,
    replyingTo,
    responseText,
    onResponseTextChange,
    onReply,
    onSubmitResponse,
    onDeleteResponse,
    onDeleteReview,
    onHelpful
}) => {
    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Star
                    key={i}
                    size={16}
                    className={i <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                />
            );
        }
        return stars;
    };

    if (reviews.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <MessageSquare className="text-gray-400" size={32} />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No reviews found</h3>
                <p className="text-gray-500">Try adjusting your filters</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    {/* Review Header */}
                    <div className="p-6 border-b">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 font-bold text-lg">
                                        {review.customer.charAt(0)}
                                    </span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-gray-800">{review.customer}</h3>
                                        {review.verified && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                                <CheckCircle size={12} />
                                                Verified
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 mt-1">
                                        <div className="flex items-center gap-1">
                                            {renderStars(review.rating)}
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-500 text-sm">
                                            <Calendar size={14} />
                                            {review.date}
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-500 text-sm">
                                            <MessageSquare size={14} />
                                            {review.venue}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => onReply(review.id)}
                                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                    title="Reply"
                                >
                                    <MessageSquare size={18} />
                                </button>
                                <button
                                    onClick={() => onDeleteReview(review.id)}
                                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                    title="Delete Review"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Review Content */}
                    <div className="p-6">
                        <p className="text-gray-700 mb-4">{review.comment}</p>

                        {/* Helpful Votes */}
                        <div className="flex items-center gap-4 mb-4">
                            <span className="text-sm text-gray-500">Was this review helpful?</span>
                            <button
                                onClick={() => onHelpful(review.id, true)}
                                className="flex items-center gap-1 text-gray-600 hover:text-green-600"
                            >
                                <ThumbsUp size={16} />
                                <span className="text-sm">{review.helpful}</span>
                            </button>
                            <button
                                onClick={() => onHelpful(review.id, false)}
                                className="flex items-center gap-1 text-gray-600 hover:text-red-600"
                            >
                                <ThumbsDown size={16} />
                                <span className="text-sm">{review.notHelpful}</span>
                            </button>
                        </div>

                        {/* Owner Response */}
                        {review.response && (
                            <div className="mt-4 pl-4 border-l-4 border-blue-200 bg-blue-50 rounded-r-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span className="text-blue-600 font-bold text-sm">
                                                {review.response.owner.charAt(0)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-blue-700">{review.response.owner}</span>
                                            <span className="text-gray-500 text-sm ml-2">{review.response.date}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onDeleteResponse(review.id)}
                                        className="text-gray-400 hover:text-red-600"
                                        title="Delete Response"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <p className="text-gray-700">{review.response.comment}</p>
                            </div>
                        )}

                        {/* Reply Form */}
                        {replyingTo === review.id && (
                            <div className="mt-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <span className="text-green-600 font-bold text-sm">B</span>
                                    </div>
                                    <span className="font-medium text-gray-700">Your Response</span>
                                </div>
                                <textarea
                                    value={responseText}
                                    onChange={(e) => onResponseTextChange(e.target.value)}
                                    placeholder="Type your response here..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
                                    rows="3"
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => onReply(null)}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-2"
                                    >
                                        <X size={16} />
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => onSubmitResponse(review.id)}
                                        disabled={!responseText.trim()}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <Send size={16} />
                                        Send Response
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {/* Pagination */}
            {reviews.length > 0 && (
                <div className="flex justify-center mt-6">
                    <div className="flex gap-2">
                        <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                            Previous
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">1</button>
                        <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                            2
                        </button>
                        <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewsList;