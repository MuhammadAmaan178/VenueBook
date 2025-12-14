import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Download, Star, X, SlidersHorizontal, MessageSquare, ChevronLeft, ChevronRight, Eye, ChevronDown, Check, Activity, Calendar } from 'lucide-react';
import { adminService } from '../../../services/api';
import ReviewDetailsModal from '../modals/ReviewDetailsModal';
import { CustomDropdown, DateRangeFilter } from './AdminFilters';

const AdminReviewsPage = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total_reviews: 0, avg_rating: 0 });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedReview, setSelectedReview] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSearch, setActiveSearch] = useState('');

    const ratingOptions = [
        { label: "All Ratings", value: "" },
        { label: "5 Stars Only", value: "5" },
        { label: "4 Stars & Up", value: "4" },
        { label: "3 Stars & Up", value: "3" },
        { label: "2 Stars & Up", value: "2" }
    ];

    const [filters, setFilters] = useState({
        rating_min: "",
        date_from: '',
        date_to: ''
    });

    const [showFilters, setShowFilters] = useState(false);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const filterParams = {
                page: page,
                per_page: 15
            };

            if (activeSearch) filterParams.search = activeSearch;
            if (filters.rating_min) filterParams.rating_min = filters.rating_min;
            if (filters.date_from) filterParams.date_from = filters.date_from;
            if (filters.date_to) filterParams.date_to = filters.date_to;

            const data = await adminService.getReviews(filterParams, token);
            setReviews(data.reviews || []);
            setTotalPages(data.total_pages || 1);
            setStats({
                total_reviews: data.total_reviews || 0,
                avg_rating: data.reviews?.length ? (data.reviews.reduce((acc, r) => acc + r.rating, 0) / data.reviews.length).toFixed(1) : 0
            });

        } catch (error) {
            console.error("Error fetching reviews:", error);
            setReviews([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [activeSearch, filters, page]);

    const handleSearch = () => {
        setActiveSearch(searchQuery);
        setPage(1);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1);
    };

    const handleDateRangeChange = (start, end) => {
        setFilters(prev => ({ ...prev, date_from: start, date_to: end }));
        setPage(1);
    };

    const handleExport = async (type) => {
        setShowExportMenu(false);
        let reviewsToExport = [];

        if (type === 'current') {
            reviewsToExport = reviews;
            if (!reviewsToExport.length) return alert("No reviews to export on current page");
        } else {
            try {
                const token = localStorage.getItem('token');
                const filterParams = { page: 1, per_page: 100000 };

                if (activeSearch) filterParams.search = activeSearch;
                if (filters.rating_min) filterParams.rating_min = filters.rating_min;
                if (filters.date_from) filterParams.date_from = filters.date_from;
                if (filters.date_to) filterParams.date_to = filters.date_to;

                const data = await adminService.getReviews(filterParams, token);
                reviewsToExport = data.reviews || [];
                if (!reviewsToExport.length) return alert("No reviews found to export");
            } catch (error) {
                console.error("Error fetching all reviews:", error);
                return alert("Failed to fetch all reviews");
            }
        }

        const headers = ['Review ID', 'Venue', 'Customer', 'Rating', 'Comment', 'Date'];
        const csvContent = [
            headers.join(','),
            ...reviewsToExport.map(r => [
                r.review_id,
                `"${r.venue_name || ''}"`,
                `"${r.customer_name || ''}"`,
                r.rating,
                `"${(r.review_text || '').replace(/"/g, '""')}"`,
                r.review_date
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `reviews_${type}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleViewReview = (review) => {
        setSelectedReview(review);
        setIsModalOpen(true);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header and Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Customer Feedback
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">
                        Monitor ratings and reviews from customers
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all ${showFilters
                            ? "bg-red-50 text-red-600 border border-red-100"
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
                                    onClick={() => handleExport('current')}
                                    className="block w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700 font-medium"
                                >
                                    Current Page
                                </button>
                                <button
                                    onClick={() => handleExport('all')}
                                    className="block w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700 font-medium"
                                >
                                    All Reviews
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-500 mb-1 uppercase tracking-wider">Total Reviews</p>
                        <p className="text-3xl font-extrabold text-gray-900">{stats.total_reviews}</p>
                    </div>
                    <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center border border-purple-100">
                        <MessageSquare size={28} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-500 mb-1 uppercase tracking-wider">Average Rating</p>
                        <div className="flex items-center gap-2">
                            <p className="text-3xl font-extrabold text-gray-900">{stats.avg_rating}</p>
                            <Star className="fill-yellow-400 text-yellow-400" size={24} />
                        </div>
                    </div>
                    <div className="w-14 h-14 bg-yellow-50 text-yellow-600 rounded-2xl flex items-center justify-center border border-yellow-100">
                        <Star size={28} />
                    </div>
                </div>
            </div>

            {/* Filter Section (Conditional Render) */}
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

                    {/* Search Bar */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="flex-1 relative group/search">
                            <input
                                type="text"
                                placeholder="Search venue or customer name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                className="w-full h-12 py-3 pl-12 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 bg-gray-50/50 hover:bg-white transition-all text-gray-900 font-medium placeholder-gray-400"
                            />
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-hover/search:text-red-500 transition-colors" />
                        </div>
                        <button
                            onClick={handleSearch}
                            className="h-12 bg-red-600 hover:bg-red-700 text-white px-8 rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Search className="h-5 w-5" />
                            <span>Search</span>
                        </button>
                    </div>

                    {/* Filter Dropdowns Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <CustomDropdown
                            icon={<Star className="w-5 h-5" />}
                            label="Min Rating"
                            value={filters.rating_min}
                            options={ratingOptions}
                            onChange={(value) => handleFilterChange("rating_min", value)}
                        />

                        <DateRangeFilter
                            startDate={filters.date_from}
                            endDate={filters.date_to}
                            onDateChange={handleDateRangeChange}
                        />

                        <div className="flex items-end justify-end h-full">
                            <button
                                onClick={() => {
                                    setFilters({ rating_min: '', date_from: '', date_to: '' });
                                    setSearchQuery('');
                                    setActiveSearch('');
                                    setPage(1);
                                }}
                                className="h-14 mb-0.5 w-full bg-white border border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 rounded-2xl font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                            >
                                <X size={18} /> Reset
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Venue</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Rating</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Comment</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-400">Loading reviews...</td></tr>
                            ) : reviews.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-400">No reviews found.</td></tr>
                            ) : (
                                reviews.map((r) => (
                                    <tr key={r.review_id} className="hover:bg-red-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900 group-hover:text-red-600 transition-colors">{r.venue_name}</div>
                                            <div className="text-xs text-gray-500">{r.venue_city}</div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-700">{r.customer_name}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 bg-yellow-50 w-fit px-2 py-1 rounded-lg border border-yellow-100">
                                                <span className="font-bold text-yellow-700">{r.rating}</span>
                                                <Star size={14} className="text-yellow-400 fill-current" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-600 max-w-sm truncate" title={r.review_text}>
                                                {r.review_text || <span className="text-gray-400 italic">No comment</span>}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                                            {new Date(r.review_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewReview(r);
                                                }}
                                                className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 hover:scale-105 transition-all shadow-sm"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && reviews.length > 0 && (
                    <div className="flex justify-between items-center mt-6 px-6 py-4">
                        <div className="text-sm font-medium text-gray-500">
                            Page <span className="text-gray-900">{page}</span> of {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-gray-700 shadow-sm transition-all"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-gray-700 shadow-sm transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>


            <ReviewDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                review={selectedReview}
            />
        </div >
    );
};

export default AdminReviewsPage;
