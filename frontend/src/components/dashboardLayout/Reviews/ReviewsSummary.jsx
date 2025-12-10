// components/ReviewsSummary.jsx
import React from 'react';
import { Star, Filter } from 'lucide-react';

const ReviewsSummary = ({ stats, filterOptions, activeFilter, onFilterChange }) => {
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

    const calculatePercentage = (count) => {
        return stats.totalReviews > 0 ? Math.round((count / stats.totalReviews) * 100) : 0;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Filter size={20} className="text-gray-500" />
                    <h3 className="text-lg font-semibold text-gray-800">Reviews Summary</h3>
                </div>
                <div className="text-sm text-gray-500">
                    Total: {stats.totalReviews} reviews
                </div>
            </div>

            {/* Rating Distribution */}
            <div className="mb-8">
                <h4 className="font-medium text-gray-700 mb-4">Rating Distribution</h4>
                <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map((rating) => {
                        const count = stats.ratingDistribution[rating] || 0;
                        const percentage = calculatePercentage(count);

                        return (
                            <div key={rating} className="flex items-center gap-3">
                                <div className="flex items-center gap-1 w-16">
                                    <span className="text-sm font-medium text-gray-700">{rating}</span>
                                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                                </div>
                                <div className="flex-1">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-yellow-400 h-2 rounded-full"
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="w-16 text-right">
                                    <span className="text-sm font-medium text-gray-700">
                                        {count} ({percentage}%)
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Filters */}
            <div>
                <h4 className="font-medium text-gray-700 mb-4">Filter Reviews</h4>
                <div className="flex flex-wrap gap-2">
                    {filterOptions.map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => onFilterChange(filter.id)}
                            className={`px-3 py-2 rounded-lg transition-colors ${activeFilter === filter.id
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ReviewsSummary;