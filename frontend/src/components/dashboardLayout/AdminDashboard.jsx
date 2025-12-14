// components/dashboardLayout/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import StatsCards from './StatsCards';
import { useAuth } from '../../contexts/AuthContext';
import { adminService } from '../../services/api';
import { Eye, FileText, Activity, TrendingUp, Clock, MapPin, Building2 } from 'lucide-react';
import DashboardReportModal from './modals/DashboardReportModal';

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
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

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
        <div className="min-h-screen bg-gray-50 relative overflow-hidden">
            {/* Background Blobs */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-[600px] h-[600px] bg-red-50/50 rounded-full blur-3xl pointer-events-none z-0"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-[500px] h-[500px] bg-purple-50/50 rounded-full blur-3xl pointer-events-none z-0"></div>

            <div className="relative z-10 space-y-8 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
                        <p className="text-gray-500 mt-1">Welcome back, {userData.name} 👋</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsReportModalOpen(true)}
                            className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <FileText size={16} />
                            Generate Report
                        </button>
                    </div>
                </div>

                <div className="mb-8">
                    <StatsCards stats={statsData} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Top Venues (Global) */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg shadow-gray-100 border border-white/50 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Top Performing Venues</h3>
                                <p className="text-sm text-gray-500">Highest rated venues this month</p>
                            </div>
                            <div className="p-2 bg-red-50 rounded-xl text-red-600">
                                <Activity size={20} />
                            </div>
                        </div>

                        {loading ? (
                            <div className="animate-pulse space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-16 bg-gray-100 rounded-2xl"></div>
                                ))}
                            </div>
                        ) : topVenues.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <Building2 size={48} className="mb-3 opacity-20" />
                                <p>No venues found</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {topVenues.map((venue, index) => (
                                    <div key={venue.venue_id} className="flex items-center justify-between p-4 bg-white/50 hover:bg-white rounded-2xl transition-all duration-300 border border-transparent hover:border-gray-100 hover:shadow-md group">
                                        <div className="flex items-center gap-4">
                                            <div className={`
                                                w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg
                                                ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                    index === 1 ? 'bg-gray-100 text-gray-700' :
                                                        index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-red-50 text-red-600'}
                                            `}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 group-hover:text-red-600 transition-colors">{venue.name}</p>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                                    <span className="flex items-center gap-1"><MapPin size={10} /> {venue.city}</span>
                                                    <span>•</span>
                                                    <span>{venue.owner_name}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1.5 justify-end bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                                                <span className="font-bold text-yellow-700">{venue.rating}</span>
                                                <Activity size={14} className="fill-yellow-500 text-yellow-500" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Logs */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg shadow-gray-100 border border-white/50 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
                                <p className="text-sm text-gray-500">Latest system events</p>
                            </div>
                            <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                                <FileText size={20} />
                            </div>
                        </div>

                        {loading ? (
                            <div className="animate-pulse space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-16 bg-gray-100 rounded-2xl"></div>
                                ))}
                            </div>
                        ) : recentLogs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <FileText size={48} className="mb-3 opacity-20" />
                                <p>No logs found</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentLogs.map((log, index) => (
                                    <div key={index} className="flex items-start gap-4 p-4 bg-white/50 hover:bg-white rounded-2xl transition-all duration-300 border border-transparent hover:border-gray-100 hover:shadow-md group">
                                        <div className="mt-1 p-2 bg-gray-100 rounded-lg group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                                            <Clock size={16} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <p className="font-bold text-gray-900 text-sm group-hover:text-red-600 transition-colors">{log.action_type}</p>
                                                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">{formatDate(log.created_at)}</span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{log.action_details}</p>
                                            {log.user_name && (
                                                <p className="text-xs text-red-500 mt-2 flex items-center gap-1 font-medium">
                                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                                    {log.user_name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <DashboardReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                stats={statsData}
                topVenues={topVenues}
                recentLogs={recentLogs}
            />
        </div>
    );
};

export default AdminDashboard;
