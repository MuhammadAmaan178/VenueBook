import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Star, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { ownerService, adminService } from '../../../services/api';

const ReviewsPage = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    // Filter states
    const [filters, setFilters] = useState({
        rating_min: '',
        date_start: '',
        date_end: '',
        sort_by: 'review_date'
    });

    const { user } = useAuth ? useAuth() : {};

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            if (!token || !user) {
                console.error('No authentication token or user found');
                setLoading(false);
                return;
            }

            // Build filter params
            const filterParams = {};
            if (filters.rating_min) filterParams.rating_min = filters.rating_min;
            if (filters.date_start) filterParams.date_start = filters.date_start;
            if (filters.date_end) filterParams.date_end = filters.date_end;
            if (filters.sort_by) filterParams.sort_by = filters.sort_by;

            let data;
            if (user.role === 'admin') {
                data = await adminService.getReviews(filterParams, token);
            } else if (user.role === 'owner') {
                const ownerId = user.owner_id || user.user_id;
                data = await ownerService.getReviews(ownerId, filterParams, token);
            } else {
                console.error('Invalid user role');
                setLoading(false);
                return;
            }

            setReviews(data.reviews || []);
        } catch (error) {
            console.error("Error fetching reviews:", error);
            setReviews([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchReviews();
        }
    }, [user, filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            rating_min: '',
            date_start: '',
            date_end: '',
            sort_by: 'review_date'
        });
    };

    const handleExport = () => {
        if (!reviews.length) return alert("No reviews to export");

        const headers = ['Review ID', 'Customer', 'Venue', 'Rating', 'Comment', 'Date'];

        const escapeCSV = (value) => {
            if (value === null || value === undefined) return '';
            const str = String(value);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const csvContent = [
            headers.join(','),
            ...reviews.map(r => [
                r.review_id || '',
                escapeCSV(r.customer_name || r.reviewer || ''),
                escapeCSV(r.venue_name || r.venue || ''),
                r.rating || 0,
                escapeCSV(r.review_text || r.comment || ''),
                r.review_date || r.date || '' // Backend returns review_date, frontend fallback
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `reviews_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, index) => (
            <Star
                key={index}
                size={16}
                className={index < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
            />
        ));
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Reviews</h1>
                    <p className="text-gray-500">Feedback from your customers</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 bg-white"
                    >
                        <Filter size={20} /> Filter
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 bg-white"
                    >
                        <Download size={20} /> Export
                    </button>
                </div>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
                <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Filter size={20} />
                            Advanced Filters
                        </h3>
                        <button
                            onClick={() => setShowFilters(false)}
                            className="p-1 hover:bg-gray-100 rounded"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Minimum Rating Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Min Rating
                            </label>
                            <select
                                value={filters.rating_min}
                                onChange={(e) => handleFilterChange('rating_min', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="">All Ratings</option>
                                <option value="5">5 Stars</option>
                                <option value="4">4+ Stars</option>
                                <option value="3">3+ Stars</option>
                                <option value="2">2+ Stars</option>
                            </select>
                        </div>

                        {/* Sort By */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sort By
                            </label>
                            <select
                                value={filters.sort_by}
                                onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="review_date">Newest First</option>
                                <option value="rating">Highest Rated</option>
                            </select>
                        </div>

                        {/* Date Start */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                From Date
                            </label>
                            <input
                                type="date"
                                value={filters.date_start}
                                onChange={(e) => handleFilterChange('date_start', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>

                        {/* Date End */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                To Date
                            </label>
                            <input
                                type="date"
                                value={filters.date_end}
                                onChange={(e) => handleFilterChange('date_end', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            )}

            <div className="grid gap-6">
                {loading ? (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-xl border">Loading reviews...</div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-xl border">
                        No reviews found. {filters.rating_min || filters.date_start ? 'Try adjusting your filters.' : ''}
                    </div>
                ) : (
                    reviews.map((review) => (
                        <div key={review.review_id || review.id} className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                        {(review.customer_name || review.reviewer || 'A').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{review.customer_name || review.reviewer || 'Anonymous'}</h3>
                                        <p className="text-sm text-gray-500">Review for <span className="font-medium text-gray-700">{review.venue_name || review.venue}</span></p>
                                    </div>
                                </div>
                                <span className="text-sm text-gray-400">
                                    {new Date(review.review_date || review.date).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>

                            <div className="flex gap-1 mb-3">
                                {renderStars(review.rating)}
                            </div>

                            <p className="text-gray-600 leading-relaxed">
                                {review.review_text || review.comment || (
                                    <span className="italic text-gray-400">No written comment provided.</span>
                                )}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ReviewsPage;