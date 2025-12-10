// components/ReviewsHeader.jsx
import React from 'react';
import { Search, Star, MessageSquare } from 'lucide-react';

const ReviewsHeader = ({ stats, searchQuery, onSearchChange }) => {
    return (
        <div className="mb-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Reviews</h1>
                    <p className="text-gray-600 mt-2">
                        Manage and respond to customer reviews
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search reviews..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                        />
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-500 mb-1">Total Reviews</div>
                            <div className="text-2xl font-bold text-gray-800">{stats.totalReviews}</div>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <MessageSquare size={24} className="text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-500 mb-1">Average Rating</div>
                            <div className="text-2xl font-bold text-gray-800">{stats.averageRating}</div>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <Star size={24} className="text-yellow-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-500 mb-1">Responses Given</div>
                            <div className="text-2xl font-bold text-gray-800">{stats.totalResponses}</div>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <MessageSquare size={24} className="text-green-600" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewsHeader;