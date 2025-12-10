import React, { useState, useEffect } from 'react';
import { adminService } from '../../../services/api';

const AdminAnalyticsPage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const result = await adminService.getAnalytics({ year }, token);
                setData(result);
            } catch (error) {
                console.error("Error fetching analytics:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [year]);

    if (loading) return <div className="p-6">Loading analytics...</div>;
    if (!data) return <div className="p-6">Failed to load analytics data.</div>;

    const { total_revenue, total_bookings, yearly, status_breakdown, top_venues } = data;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Global Analytics</h1>

                <select
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    aria-label="Select Year"
                >
                    {[2023, 2024, 2025, 2026].map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h3 className="text-gray-500 text-sm font-medium mb-2">Total Revenue (All Time)</h3>
                    <p className="text-3xl font-bold text-gray-800">Rs. {total_revenue.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h3 className="text-gray-500 text-sm font-medium mb-2">Total Bookings (All Time)</h3>
                    <p className="text-3xl font-bold text-gray-800">{total_bookings.toLocaleString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Bookings Breakdown */}
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Bookings by Status</h3>
                    <div className="space-y-4">
                        {status_breakdown.map((item, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600 capitalize font-medium">{item.status}</span>
                                <span className="bg-white px-3 py-1 rounded border text-gray-800 font-bold">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Yearly Revenue Trend (Simple List) */}
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Monthly Revenue Trend (Last 12 Months)</h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                        {yearly.length > 0 ? (
                            yearly.map((item, index) => (
                                <div key={index} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                                    <span className="text-gray-600">{item.month}</span>
                                    <span className="font-semibold text-gray-800">Rs. {item.revenue.toLocaleString()}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-sm">No revenue data for the past year.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Top Venues */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="p-6 border-b">
                    <h3 className="text-lg font-bold text-gray-800">Top Performing Venues by Revenue (Global)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Venue</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Bookings</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {top_venues.length > 0 ? (
                                top_venues.map((venue) => (
                                    <tr key={venue.venue_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{venue.name}</td>
                                        <td className="px-6 py-4 text-gray-600">{venue.total_bookings}</td>
                                        <td className="px-6 py-4 font-semibold text-green-600">Rs. {venue.revenue.toLocaleString()}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500">No data available.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalyticsPage;
