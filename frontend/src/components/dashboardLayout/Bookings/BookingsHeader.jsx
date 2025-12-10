// components/BookingsHeader.jsx
import React from 'react';
import { Filter, Calendar, Download } from 'lucide-react';

const BookingsHeader = ({ stats, filters, onFilterChange, uniqueVenues }) => {
    const statusOptions = [
        { value: 'all', label: 'All Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' }
    ];

    const venueOptions = [
        { value: 'all', label: 'All Venues' },
        ...uniqueVenues.map(venue => ({ value: venue, label: venue }))
    ];

    const statusCounts = {
        pending: stats.pending,
        confirmed: stats.confirmed,
        completed: stats.completed,
        cancelled: stats.cancelled
    };

    return (
        <div className="mb-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Bookings</h1>
                    <p className="text-gray-600 mt-2">
                        Manage and track all your venue bookings
                    </p>
                </div>

                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    <Download size={18} />
                    Export Report
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <div className="text-sm text-gray-500 mb-1">Total Bookings</div>
                    <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-xl shadow-sm border border-yellow-100">
                    <div className="text-sm text-yellow-600 mb-1">Pending</div>
                    <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl shadow-sm border border-blue-100">
                    <div className="text-sm text-blue-600 mb-1">Confirmed</div>
                    <div className="text-2xl font-bold text-blue-700">{stats.confirmed}</div>
                </div>

                <div className="bg-green-50 p-4 rounded-xl shadow-sm border border-green-100">
                    <div className="text-sm text-green-600 mb-1">Completed</div>
                    <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
                </div>

                <div className="bg-red-50 p-4 rounded-xl shadow-sm border border-red-100">
                    <div className="text-sm text-red-600 mb-1">Cancelled</div>
                    <div className="text-2xl font-bold text-red-700">{stats.cancelled}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
                <div className="flex items-center gap-4 mb-4">
                    <Filter size={20} className="text-gray-500" />
                    <h3 className="font-medium text-gray-700">Filters</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                        </label>
                        <select
                            value={filters.status}
                            onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label} {statusCounts[option.value] ? `(${statusCounts[option.value]})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Venue Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Venue
                        </label>
                        <select
                            value={filters.venue}
                            onChange={(e) => onFilterChange({ ...filters, venue: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {venueOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date
                        </label>
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                <input
                                    type="date"
                                    value={filters.date}
                                    onChange={(e) => onFilterChange({ ...filters, date: e.target.value })}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            {filters.date && (
                                <button
                                    onClick={() => onFilterChange({ ...filters, date: '' })}
                                    className="px-3 py-2 text-gray-600 hover:text-red-600"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingsHeader;