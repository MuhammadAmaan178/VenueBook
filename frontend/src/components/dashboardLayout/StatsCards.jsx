// components/StatsCards.jsx
import React from 'react';
import { Building2, Calendar, DollarSign, Star } from 'lucide-react';

const StatsCards = ({ stats }) => {
    const cards = [
        {
            icon: <Building2 className="text-blue-500" size={24} />,
            label: "Total Venues",
            value: stats.totalVenues,
            bgColor: "bg-blue-50"
        },
        {
            icon: <Calendar className="text-green-500" size={24} />,
            label: "Total Bookings",
            value: stats.totalBookings,
            bgColor: "bg-green-50"
        },
        {
            icon: <DollarSign className="text-purple-500" size={24} />,
            label: "Total Revenue",
            value: `Rs. ${stats.totalRevenue}`,
            bgColor: "bg-purple-50"
        },
        {
            icon: <Star className="text-yellow-500" size={24} />,
            label: "Avg Rating",
            value: stats.avgRating,
            bgColor: "bg-yellow-50"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card, index) => (
                <div
                    key={index}
                    className={`${card.bgColor} p-6 rounded-xl shadow-sm border`}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-white rounded-lg">
                            {card.icon}
                        </div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-1">
                        {card.value}
                    </h3>
                    <p className="text-gray-600">{card.label}</p>
                </div>
            ))}
        </div>
    );
};

export default StatsCards;