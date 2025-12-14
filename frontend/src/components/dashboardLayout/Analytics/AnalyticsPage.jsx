import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { ownerService } from '../../../services/api';
import { DollarSign, Calendar, TrendingUp, Activity, ChevronDown } from 'lucide-react';

const AnalyticsPage = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const { user } = useAuth ? useAuth() : {};

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');

                if (!token || !user) {
                    setLoading(false);
                    return;
                }

                if (user.role === 'owner') {
                    const ownerId = user.owner_id || user.user_id;
                    const data = await ownerService.getAnalytics(ownerId, token, selectedYear);
                    setStats(data);
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
    }, [user, selectedYear]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="p-8 text-center bg-red-50 rounded-2xl border border-red-100 text-red-600">
                Failed to load analytics data.
            </div>
        );
    }

    // Prepare Date for Charts/Dropdown
    const availableYears = stats?.yearly ? stats.yearly.map(y => parseInt(y.year)).sort((a, b) => b - a) : [];
    if (!availableYears.includes(new Date().getFullYear())) availableYears.unshift(new Date().getFullYear());

    // Process Monthly Data for Chart (Ensure 12 months)
    const processMonthlyData = (backendData) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyRevenue = [];

        for (let i = 1; i <= 12; i++) {
            const monthStr = String(i).padStart(2, '0'); // Backend usually returns '01', '02'
            // Handle case where backend returns number or string
            const found = backendData?.find(item => String(item.month).padStart(2, '0') === monthStr);
            monthlyRevenue.push({
                month: months[i - 1],
                revenue: found ? parseFloat(found.revenue) : 0
            });
        }
        return monthlyRevenue;
    };

    const chartData = processMonthlyData(stats?.monthly || []);
    const maxRevenue = Math.max(...chartData.map(d => d.revenue), 100); // Minimum 100 scale

    // SVG Chart Helpers
    const chartHeight = 300;
    const chartWidth = 800;
    const padding = 40;
    const availableWidth = chartWidth - (padding * 2);
    const availableHeight = chartHeight - (padding * 2);

    const getX = (index) => padding + (index * (availableWidth / 11)); // 11 segments for 12 points
    const getY = (value) => chartHeight - padding - ((value / maxRevenue) * availableHeight);

    const generatePath = () => {
        if (chartData.length === 0) return "";
        return chartData.map((point, index) =>
            `${index === 0 ? 'M' : 'L'} ${getX(index)} ${getY(point.revenue)}`
        ).join(' ');
    };

    const generateArea = () => {
        if (chartData.length === 0) return "";
        const linePath = generatePath();
        return `${linePath} L ${getX(11)} ${chartHeight - padding} L ${getX(0)} ${chartHeight - padding} Z`;
    };

    return (
        <div className="p-6 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Analytics Overview</h1>
                    <p className="text-gray-500 mt-1">Detailed performance metrics for {selectedYear}</p>
                </div>

                <div className="relative">
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="appearance-none bg-white border border-gray-200 text-gray-700 pl-4 pr-10 py-2.5 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none font-medium cursor-pointer shadow-sm hover:border-gray-300 transition-all"
                    >
                        {availableYears.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-8 rounded-3xl text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 text-blue-100 mb-2">
                            <DollarSign className="w-5 h-5" />
                            <span className="font-medium">Total Revenue</span>
                        </div>
                        <p className="text-4xl font-bold tracking-tight">Rs. {stats.total_revenue?.toLocaleString() || 0}</p>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg shadow-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-green-100 transition-colors duration-500"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 text-gray-500 mb-2">
                            <Calendar className="w-5 h-5 text-green-500" />
                            <span className="font-medium">Total Bookings</span>
                        </div>
                        <p className="text-4xl font-bold text-gray-900 tracking-tight">{stats.total_bookings || 0}</p>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg shadow-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-orange-100 transition-colors duration-500"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 text-gray-500 mb-2">
                            <TrendingUp className="w-5 h-5 text-orange-500" />
                            <span className="font-medium">Avg. Revenue / Booking</span>
                        </div>
                        <p className="text-4xl font-bold text-gray-900 tracking-tight">
                            Rs. {stats.total_bookings > 0 ? (stats.total_revenue / stats.total_bookings).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bookings Breakdown */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-full">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-500" />
                        Bookings by Status
                    </h3>
                    <div className="space-y-4">
                        {stats.status_breakdown?.map((item, index) => (
                            <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                                <span className="text-gray-700 capitalize font-medium flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${item.status === 'confirmed' ? 'bg-green-500' :
                                        item.status === 'pending' ? 'bg-yellow-500' :
                                            item.status === 'cancelled' ? 'bg-red-500' : 'bg-gray-400'
                                        }`}></span>
                                    {item.status}
                                </span>
                                <span className="bg-white px-3 py-1 rounded-lg border border-gray-200 text-gray-900 font-bold shadow-sm">{item.count}</span>
                            </div>
                        ))}
                        {(!stats.status_breakdown || stats.status_breakdown.length === 0) && (
                            <div className="text-center text-gray-400 py-8">No booking status data available.</div>
                        )}
                    </div>
                </div>

                {/* Monthly Trend Chart */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        Monthly Revenue ({selectedYear})
                    </h3>
                    <div className="w-full h-[300px] relative">
                        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                            {/* Grid Lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                                const y = chartHeight - padding - (tick * availableHeight);
                                return (
                                    <g key={tick}>
                                        <line
                                            x1={padding}
                                            y1={y}
                                            x2={chartWidth - padding}
                                            y2={y}
                                            stroke="#f3f4f6"
                                            strokeWidth="2"
                                            strokeDasharray="4 4"
                                        />
                                        <text
                                            x={padding - 10}
                                            y={y + 4}
                                            textAnchor="end"
                                            className="text-xs fill-gray-400 font-medium"
                                        >
                                            {Math.round(tick * maxRevenue / 1000)}k
                                        </text>
                                    </g>
                                );
                            })}

                            {/* Area Fill */}
                            <defs>
                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path d={generateArea()} fill="url(#chartGradient)" />

                            {/* Line Path */}
                            <path
                                d={generatePath()}
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="drop-shadow-sm"
                            />

                            {/* Data Points */}
                            {chartData.map((d, i) => (
                                <g key={i} className="group cursor-pointer">
                                    <circle
                                        cx={getX(i)}
                                        cy={getY(d.revenue)}
                                        r="6"
                                        className="fill-white stroke-blue-600 stroke-4 hover:r-8 transition-all duration-200"
                                    />
                                    {/* Tooltip */}
                                    <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                        <foreignObject x={getX(i) - 50} y={getY(d.revenue) - 60} width="100" height="50">
                                            <div className="bg-gray-900 text-white text-xs rounded-lg py-1 px-2 text-center shadow-xl">
                                                <p className="font-bold">Rs. {d.revenue.toLocaleString()}</p>
                                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                                            </div>
                                        </foreignObject>
                                    </g>

                                    {/* X-Axis Labels */}
                                    <text
                                        x={getX(i)}
                                        y={chartHeight - 10}
                                        textAnchor="middle"
                                        className="text-xs fill-gray-500 font-medium"
                                    >
                                        {d.month}
                                    </text>
                                </g>
                            ))}
                        </svg>
                    </div>
                </div>
            </div>

            {/* Top Venues Table */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-900">Top Performing Venues</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50">Venue Name</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50">Total Bookings</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50">Total Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {stats.top_venues?.length > 0 ? (
                                stats.top_venues.map((venue, index) => (
                                    <tr key={index} className="hover:bg-blue-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-900">{venue.name}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                                                {venue.booking_count} bookings
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-green-600">Rs. {Number(venue.revenue).toLocaleString()}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="px-6 py-12 text-center text-gray-400">
                                        No top venues data available.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
