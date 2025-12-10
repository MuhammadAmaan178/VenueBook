import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { ownerService } from '../../../services/api';
import { DollarSign, Calendar, TrendingUp } from 'lucide-react';

const AnalyticsPage = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth ? useAuth() : {};

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');

                if (!token || !user) {
                    console.error('No authentication token or user found');
                    setLoading(false);
                    return;
                }

                if (user.role === 'owner') {
                    const ownerId = user.owner_id || user.user_id;
                    const data = await ownerService.getAnalytics(ownerId, token);
                    setStats(data);
                } else {
                    console.error('Invalid user role for analytics');
                    setLoading(false);
                    return;
                }
            } catch (error) {
                console.error("Error fetching analytics:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchAnalytics();
        }
    }, [user]);

    if (loading) {
        return <div className="p-6 text-center text-gray-500">Loading analytics...</div>;
    }

    if (!stats) {
        return <div className="p-6 text-center text-gray-500">No data available</div>;
    }

    // Process Yearly Data for Line Chart
    const processYearlyData = (backendData) => {
        const years = [];
        const currentYear = new Date().getFullYear();
        // Show last 5 years
        for (let i = 4; i >= 0; i--) {
            const year = String(currentYear - i);
            const found = backendData?.find(item => item.year === year);
            years.push({
                year: year,
                revenue: found ? parseFloat(found.revenue) : 0
            });
        }
        return years;
    };

    const yearlyData = stats ? processYearlyData(stats.yearly) : [];
    const maxRevenue = Math.max(...yearlyData.map(y => y.revenue), 1000);

    // SVG Line Chart Helpers
    const chartHeight = 250;
    const chartWidth = 600; // viewbox units
    const padding = 40;
    const availableWidth = chartWidth - (padding * 2);
    const availableHeight = chartHeight - (padding * 2);

    const getX = (index) => padding + (index * (availableWidth / (yearlyData.length - 1)));
    const getY = (value) => chartHeight - padding - ((value / maxRevenue) * availableHeight);

    // Generate path for the line
    const generatePath = () => {
        if (yearlyData.length === 0) return "";
        let pathD = `M ${getX(0)} ${getY(yearlyData[0].revenue)}`;
        yearlyData.forEach((point, index) => {
            if (index === 0) return;
            pathD += ` L ${getX(index)} ${getY(point.revenue)}`;
        });
        return pathD;
    };

    // Generate path for the area fill (optional, looks nice)
    const generateArea = () => {
        if (yearlyData.length === 0) return "";
        let pathD = `M ${getX(0)} ${getY(yearlyData[0].revenue)}`;
        yearlyData.forEach((point, index) => {
            if (index === 0) return;
            pathD += ` L ${getX(index)} ${getY(point.revenue)}`;
        });
        pathD += ` L ${getX(yearlyData.length - 1)} ${chartHeight - padding} L ${getX(0)} ${chartHeight - padding} Z`;
        return pathD;
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
                <p className="text-gray-500">Performance overview of your venues</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <DollarSign size={24} />
                        </div>
                    </div>
                    {/* Raw Value displayed with prefix if needed */}
                    <h3 className="text-2xl font-bold text-gray-900">Rs. {stats.total_revenue?.toLocaleString()}</h3>
                    <p className="text-sm text-gray-500">Total Revenue</p>
                </div>

                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                            <Calendar size={24} />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{stats.total_bookings}</h3>
                    <p className="text-sm text-gray-500">Total Bookings</p>
                </div>

                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                        {stats.total_bookings > 0 ? `Rs. ${(stats.total_revenue / stats.total_bookings).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : 0}
                    </h3>
                    <p className="text-sm text-gray-500">Avg. Revenue per Booking</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Yearly Revenue Line Chart */}
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Yearly Revenue Trend</h3>
                    <div className="w-full h-64 overflow-hidden relative">
                        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                            {/* Background Lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                                const y = chartHeight - padding - (tick * availableHeight);
                                return (
                                    <line
                                        key={tick}
                                        x1={padding}
                                        y1={y}
                                        x2={chartWidth - padding}
                                        y2={y}
                                        stroke="#e5e7eb"
                                        strokeWidth="1"
                                    />
                                );
                            })}

                            {/* Area Fill */}
                            <path d={generateArea()} fill="rgba(59, 130, 246, 0.1)" />

                            {/* Line Path */}
                            <path
                                d={generatePath()}
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />

                            {/* Data Points */}
                            {yearlyData.map((d, i) => (
                                <g key={i} className="group cursor-pointer">
                                    <circle
                                        cx={getX(i)}
                                        cy={getY(d.revenue)}
                                        r="5"
                                        className="fill-blue-600 stroke-white stroke-2 hover:r-7 transition-all duration-300"
                                    />
                                    {/* Tooltip on Hover */}
                                    <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                        <rect
                                            x={getX(i) - 40}
                                            y={getY(d.revenue) - 40}
                                            width="80"
                                            height="30"
                                            rx="4"
                                            fill="#1f2937"
                                        />
                                        <text
                                            x={getX(i)}
                                            y={getY(d.revenue) - 20}
                                            textAnchor="middle"
                                            fontSize="12"
                                            fill="white"
                                        >
                                            Rs. {d.revenue / 1000}k
                                        </text>
                                    </g>
                                    {/* Year Label */}
                                    <text
                                        x={getX(i)}
                                        y={chartHeight - 10}
                                        textAnchor="middle"
                                        className="text-xs fill-gray-500"
                                        fontSize="12"
                                    >
                                        {d.year}
                                    </text>
                                </g>
                            ))}
                        </svg>
                    </div>
                </div>

                {/* Top Venues List */}
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Top Performing Venues</h3>
                    <div className="space-y-4">
                        {stats.top_venues?.map((venue, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{venue.name}</p>
                                        <p className="text-xs text-gray-500">{venue.booking_count} bookings</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-900">Rs. {Number(venue.revenue).toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Status Breakdown */}
            <div className="bg-white p-6 rounded-xl border shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Booking Status Breakdown</h3>
                <div className="flex flex-wrap gap-4">
                    {stats.status_breakdown?.map((status, index) => (
                        <div key={index} className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                            <div className={`w-3 h-3 rounded-full ${status.status === 'completed' ? 'bg-green-500' :
                                status.status === 'pending' ? 'bg-yellow-500' :
                                    status.status === 'confirmed' ? 'bg-blue-500' : 'bg-gray-500'
                                }`}></div>
                            <span className="text-sm font-medium capitalize">{status.status}: {status.count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
