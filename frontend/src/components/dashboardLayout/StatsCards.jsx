// components/StatsCards.jsx
import React from 'react';
import { Building2, Calendar, DollarSign, Star, TrendingUp } from 'lucide-react';

const StatsCards = ({ stats }) => {
    const cards = [
        {
            icon: <Building2 className="text-white" size={24} />,
            label: "Total Venues",
            value: stats.totalVenues,
            gradient: "from-blue-500 to-blue-600",
            shadow: "shadow-blue-200"
        },
        {
            icon: <Calendar className="text-white" size={24} />,
            label: "Total Bookings",
            value: stats.totalBookings,
            gradient: "from-emerald-500 to-emerald-600",
            shadow: "shadow-emerald-200"
        },
        {
            icon: <DollarSign className="text-white" size={24} />,
            label: "Total Revenue",
            value: `Rs. ${stats.totalRevenue}`,
            gradient: "from-purple-500 to-purple-600",
            shadow: "shadow-purple-200"
        },
        {
            icon: <Star className="text-white" size={24} />,
            label: "Avg Rating",
            value: stats.avgRating,
            gradient: "from-amber-400 to-amber-500",
            shadow: "shadow-amber-200"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card, index) => (
                <div
                    key={index}
                    className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-2xl bg-gradient-to-br ${card.gradient} shadow-lg ${card.shadow} group-hover:scale-110 transition-transform duration-300`}>
                            {card.icon}
                        </div>
                        <div className="bg-gray-50 px-2 py-1 rounded-lg text-xs font-bold text-gray-400 flex items-center gap-1">
                            <TrendingUp size={12} /> +2.5%
                        </div>
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium mb-1">{card.label}</p>
                        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                            {card.value}
                        </h3>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StatsCards;