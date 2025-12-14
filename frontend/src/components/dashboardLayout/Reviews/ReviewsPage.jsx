import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Star, X, MessageSquare, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { ownerService, adminService } from '../../../services/api';
import { CustomDropdown, DateRangeFilter } from '../common/DashboardFilters';

const ReviewsPage = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Filter states
    const [filters, setFilters] = useState({
        rating_min: "All Ratings",
        sort_by: "newest",
        date_start: '',
        date_end: ''
    });

    const ratingOptions = [
        { label: "All Ratings", value: "All Ratings" },
        { label: "5 Stars", value: "5" },
        { label: "4+ Stars", value: "4" },
        { label: "3+ Stars", value: "3" },
        { label: "2+ Stars", value: "2" }
    ];

    const sortOptions = [
        { label: "Newest First", value: "newest" },
        { label: "Oldest First", value: "oldest" },
        { label: "Highest Rated", value: "highest_rated" },
        { label: "Lowest Rated", value: "lowest_rated" }
    ];

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
            if (filters.rating_min && filters.rating_min !== "All Ratings") filterParams.rating_min = filters.rating_min;
            if (filters.date_start) filterParams.date_start = filters.date_start;
            if (filters.date_end) filterParams.date_end = filters.date_end;

            // Map sort options to API expected values if needed, currently passing through
            if (filters.sort_by) {
                if (filters.sort_by === 'newest') filterParams.sort_by = 'review_date'; // Default desc
                else if (filters.sort_by === 'highest_rated') filterParams.sort_by = 'rating';
                // Note: Logic for asc/desc might need backend support or handling here if backend only supports 'sort_by' field name. assuming standard behavior for now.
                // Actually, let's keep it simple and map to what backend likely expects or handle in UI sorting if backend is limited.
                // Based on previous code, backend expects 'sort_by'. Let's trust it handles basic sorts.
                filterParams.sort_by = filters.sort_by === 'newest' ? 'review_date' : filters.sort_by === 'highest_rated' ? 'rating' : 'review_date';
            }

            let data;
            if (user.role === 'admin') {
                data = await adminService.getReviews(filterParams, token);
            } else if (user.role === 'owner') {
                const ownerId = user.owner_id || user.user_id;
                data = await ownerService.getReviews(ownerId, filterParams, token);
            } else {
                setLoading(false);
                return;
            }

            let fetchedReviews = data.reviews || [];

            // Client-side sorting enhancement if backend sort is limited
            if (filters.sort_by === 'oldest') {
                fetchedReviews.sort((a, b) => new Date(a.review_date || a.date) - new Date(b.review_date || b.date));
            } else if (filters.sort_by === 'lowest_rated') {
                fetchedReviews.sort((a, b) => (a.rating || 0) - (b.rating || 0));
            }

            setReviews(fetchedReviews);
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

    const handleDateRangeChange = (start, end) => {
        setFilters(prev => ({ ...prev, date_start: start, date_end: end }));
    };

    const handleExport = () => {
        setShowExportMenu(false);
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
                r.review_date || r.date || ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `reviews_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, index) => (
            <Star
                key={index}
                size={18}
                className={`${index < rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-100 text-gray-200"}`}
            />
        ));
    };

    return (
        <div className="p-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Reviews
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">
                        Feedback and ratings from your customers
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all ${showFilters
                            ? "bg-blue-50 text-blue-600 border border-blue-100"
                            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                            }`}
                    >
                        <Filter size={18} />
                        <span>Filters</span>
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white hover:bg-black rounded-xl font-bold transition-all shadow-lg shadow-gray-200 hover:scale-[1.02]"
                        >
                            Export <ChevronDown size={16} />
                        </button>
                        {showExportMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <button
                                    onClick={handleExport}
                                    className="block w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700 font-medium"
                                >
                                    Export CSV
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            {showFilters && (
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-8 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-900 text-lg">Filters</h3>
                        <button
                            onClick={() => setShowFilters(false)}
                            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <CustomDropdown
                            icon={<Star className="w-5 h-5" />}
                            label="Min Rating"
                            value={filters.rating_min}
                            options={ratingOptions}
                            onChange={(value) => handleFilterChange("rating_min", value)}
                        />
                        <CustomDropdown
                            icon={<Filter className="w-5 h-5" />}
                            label="Sort By"
                            value={filters.sort_by}
                            options={sortOptions}
                            onChange={(value) => handleFilterChange("sort_by", value)}
                        />
                        <DateRangeFilter
                            startDate={filters.date_start}
                            endDate={filters.date_end}
                            onDateChange={handleDateRangeChange}
                        />

                        <div className="flex items-end justify-end h-full">
                            <button
                                onClick={() => setFilters({
                                    rating_min: "All Ratings",
                                    sort_by: "newest",
                                    date_start: '',
                                    date_end: ''
                                })}
                                className="h-14 mb-0.5 w-full bg-white border border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 rounded-2xl font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                            >
                                <X size={18} /> Reset
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reviews List */}
            <div className="grid gap-6">
                {loading ? (
                    <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center text-gray-500 font-medium">
                        Loading reviews...
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center text-gray-500 font-medium">
                        No reviews found. {filters.rating_min !== "All Ratings" || filters.date_start ? 'Try adjusting your filters.' : ''}
                    </div>
                ) : (
                    reviews.map((review) => (
                        <div key={review.review_id || review.id} className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-100 transition-all duration-300 group">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-200 flex items-center justify-center text-white font-bold text-xl">
                                        {(review.customer_name || review.reviewer || 'A').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">{review.customer_name || review.reviewer || 'Anonymous'}</h3>
                                        <p className="text-sm font-medium text-gray-500 flex items-center gap-1">
                                            visited <span className="text-gray-900 px-2 py-0.5 bg-gray-100 rounded-lg">{review.venue_name || review.venue}</span>
                                        </p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wide rounded-lg border border-gray-100">
                                    {new Date(review.review_date || review.date).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>

                            <div className="flex items-center gap-1 mb-4">
                                {renderStars(review.rating)}
                                <span className="ml-2 text-sm font-bold text-gray-700 bg-yellow-50 px-2 py-0.5 rounded-lg border border-yellow-100">
                                    {Number(review.rating).toFixed(1)} / 5.0
                                </span>
                            </div>

                            <div className="relative">
                                <div className="absolute top-0 left-0 -ml-2 -mt-2 text-gray-100 transform -scale-x-100">
                                    <MessageSquare size={48} className="opacity-20" />
                                </div>
                                <p className="text-gray-600 leading-relaxed relative z-10 pl-2">
                                    {review.review_text || review.comment || (
                                        <span className="italic text-gray-400">No written comment provided.</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ReviewsPage;