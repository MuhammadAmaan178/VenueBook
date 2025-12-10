import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Star } from 'lucide-react';
import { adminService } from '../../../services/api';

const AdminReviewsPage = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Stats for header
    const [stats, setStats] = useState({ total_reviews: 0, avg_rating: 0 });

    const [filters, setFilters] = useState({
        rating_min: '',
        date_from: '',
        date_to: ''
    });

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const filterParams = {};
            if (filters.rating_min) filterParams.rating_min = filters.rating_min;
            if (filters.date_from) filterParams.date_from = filters.date_from;
            if (filters.date_to) filterParams.date_to = filters.date_to;
            if (searchTerm) filterParams.search = searchTerm;

            const data = await adminService.getReviews(filterParams, token);
            setReviews(data.reviews || []);

            // Calculate simple local stats if API doesn't return them agg or if we want from visible list
            // API returns 'total_reviews' (count). Let's use visible avg for simplicity if API doesn't provide avg.
            // Actually admin.py get_admin_dashboard provided global avg rating.
            // Here we can just show count.
            setStats({
                total_reviews: data.total_reviews || 0,
                // Simple avg calc of fetched reviews for display (might be partial list due to paging, but ok for now)
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
        const timer = setTimeout(() => {
            fetchReviews();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, filters]);

    const handleExport = () => {
        if (!reviews.length) return alert("No reviews to export");

        const headers = ['Review ID', 'Venue', 'Customer', 'Rating', 'Comment', 'Date'];
        const csvContent = [
            headers.join(','),
            ...reviews.map(r => [
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
        link.setAttribute('download', 'all_reviews.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({ rating_min: '', date_from: '', date_to: '' });
        setSearchTerm('');
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">All Reviews</h1>
                    <p className="text-gray-500">Monitor customer feedback globally</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                        <Filter size={20} /> Filter
                    </button>
                    <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                        <Download size={20} /> Export
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Search venue or customer name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
            </div>

            {showFilters && (
                <div className="bg-white rounded-lg shadow-sm border p-4 mb-4 grid grid-cols-4 gap-4">
                    <select value={filters.rating_min} onChange={(e) => handleFilterChange('rating_min', e.target.value)} className="border rounded px-3 py-2">
                        <option value="">All Ratings</option>
                        <option value="5">5 Stars Only</option>
                        <option value="4">4+ Stars</option>
                        <option value="3">3+ Stars</option>
                        <option value="2">2+ Stars</option>
                    </select>
                    <input type="date" value={filters.date_from} onChange={(e) => handleFilterChange('date_from', e.target.value)} className="border rounded px-3 py-2" />
                    <input type="date" value={filters.date_to} onChange={(e) => handleFilterChange('date_to', e.target.value)} className="border rounded px-3 py-2" />
                    <button onClick={clearFilters} className="text-gray-600">Clear</button>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Venue</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comment</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
                        ) : reviews.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">No reviews found.</td></tr>
                        ) : (
                            reviews.map((r) => (
                                <tr key={r.review_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{r.venue_name}</div>
                                        <div className="text-xs text-gray-500">{r.venue_city}</div>
                                    </td>
                                    <td className="px-6 py-4">{r.customer_name}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <span className="font-bold mr-1">{r.rating}</span>
                                            <Star size={16} className="text-yellow-400 fill-current" />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">{r.review_text || '-'}</td>
                                    <td className="px-6 py-4 text-gray-500">{new Date(r.review_date).toLocaleDateString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminReviewsPage;
