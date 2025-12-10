// components/dashboardLayout/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import StatsCards from './StatsCards';
import { useAuth } from '../../contexts/AuthContext';
import { adminService } from '../../services/api';
import { Eye, FileText, Activity } from 'lucide-react';

const AdminDashboard = () => {
    const { user } = useAuth ? useAuth() : { user: {} };
    const [statsData, setStatsData] = useState({
        totalVenues: 0,
        totalBookings: 0,
        totalRevenue: "0",
        avgRating: "0"
    });
    const [topVenues, setTopVenues] = useState([]);
    const [recentLogs, setRecentLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const userData = {
        name: user?.name || "Admin"
    };

    useEffect(() => {
        fetchDashboard();
    }, [user]);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) return;

            const data = await adminService.getDashboard(token);

            setStatsData({
                totalVenues: data.stats.total_venues || 0,
                totalBookings: data.stats.total_bookings || 0,
                totalRevenue: data.stats.total_revenue ? `${(data.stats.total_revenue / 1000).toFixed(0)}K` : "0",
                avgRating: data.stats.avg_rating ? `${data.stats.avg_rating} ⭐` : "0 ⭐"
            });

            setTopVenues(data.top_venues || []);
            setRecentLogs(data.recent_logs || []);
        } catch (error) {
            console.error('Error fetching dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>

            <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">
                    Global Overview
                </h2>
                <StatsCards stats={statsData} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Venues (Global) */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Top Performing Venues</h3>
                        <Activity className="text-blue-500" size={20} />
                    </div>

                    {loading ? (
                        <div className="animate-pulse space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-12 bg-gray-100 rounded"></div>
                            ))}
                        </div>
                    ) : topVenues.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No venues found</p>
                    ) : (
                        <div className="space-y-4">
                            {topVenues.map((venue, index) => (
                                <div key={venue.venue_id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border-b last:border-0 border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{venue.name}</p>
                                            <p className="text-xs text-gray-500">{venue.city} • {venue.owner_name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1 justify-end text-yellow-500 font-semibold">
                                            <span>{venue.rating}</span>
                                            <Activity size={12} className="fill-current" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Logs */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Recent System Logs</h3>
                        <FileText className="text-gray-500" size={20} />
                    </div>

                    {loading ? (
                        <div className="animate-pulse space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-12 bg-gray-100 rounded"></div>
                            ))}
                        </div>
                    ) : recentLogs.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No logs found</p>
                    ) : (
                        <div className="space-y-4">
                            {recentLogs.map((log, index) => (
                                <div key={index} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors border-b last:border-0 border-gray-100">
                                    <div className="mt-1">
                                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <p className="font-medium text-gray-900 text-sm">{log.action_type}</p>
                                            <span className="text-xs text-gray-400">{formatDate(log.created_at)}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">{log.action_details}</p>
                                        {log.user_name && (
                                            <p className="text-xs text-blue-500 mt-1">By: {log.user_name}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
