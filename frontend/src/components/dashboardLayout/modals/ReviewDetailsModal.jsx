import React from 'react';
import { X, Star, User, Building, Quote, Calendar, MapPin, Mail } from 'lucide-react';

const ReviewDetailsModal = ({ isOpen, onClose, review }) => {
    if (!isOpen || !review) return null;

    // Helper to render star rating
    const renderStars = (rating) => {
        return [...Array(5)].map((_, index) => (
            <Star
                key={index}
                size={20}
                className={`${index < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'
                    }`}
            />
        ));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white/95 backdrop-blur-xl w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-white/20 ring-1 ring-black/5">

                {/* Header */}
                <div className="relative h-32 bg-gradient-to-r from-blue-600 to-indigo-700 flex flex-col justify-end p-6">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md transition-all duration-200 border border-white/10 shadow-lg"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-end justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-blue-100 mb-2">
                                <Star size={18} className="text-yellow-300" />
                                <span className="text-sm font-medium tracking-wide">REVIEW DETAILS</span>
                            </div>
                            <h2 className="text-3xl font-bold text-white tracking-tight">
                                {Number(review.rating).toFixed(1)} / 5.0
                            </h2>
                        </div>
                        <div className="text-right">
                            <p className="text-white/80 text-sm font-medium mb-1">Date Posted</p>
                            <p className="text-xl font-bold text-white">
                                {new Date(review.review_date).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">

                    {/* Rating Visual */}
                    <div className="flex items-center justify-center gap-2 mb-8 pb-6 border-b border-gray-100">
                        {renderStars(review.rating)}
                        <span className="ml-3 text-sm text-gray-400 font-medium">|</span>
                        <span className="text-sm text-gray-500 font-mono">ID: #{review.review_id}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

                        {/* Customer Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-2">
                                <User size={16} className="text-blue-600" />
                                Customer
                            </h3>
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <User size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase">Name</p>
                                        <p className="font-semibold text-gray-900">{review.customer_name || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 border-t border-gray-50 pt-3">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <Mail size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase">Email</p>
                                        <p className="font-semibold text-gray-900 break-all">{review.customer_email || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Venue Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-2">
                                <Building size={16} className="text-blue-600" />
                                Review For
                            </h3>
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <Building size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase">Venue</p>
                                        <p className="font-semibold text-gray-900">{review.venue_name || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 border-t border-gray-50 pt-3">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <MapPin size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase">Location</p>
                                        <p className="font-semibold text-gray-900">{review.venue_city || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Review Content */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-2">
                            <Quote size={16} className="text-blue-600" />
                            Review Comment
                        </h3>
                        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 relative">
                            <Quote size={40} className="absolute top-4 left-4 text-gray-200 -z-0" />
                            <p className="text-gray-700 leading-relaxed relative z-10 italic">
                                "{review.review_text || 'No written comment provided.'}"
                            </p>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-8 py-5 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-black shadow-lg shadow-gray-200 transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReviewDetailsModal;
