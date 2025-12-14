import React from "react";

const StatCard = ({ icon, number, label }) => {
    return (
        <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 text-center">
            <div className="text-4xl mb-3">{icon}</div>
            <div className="text-3xl font-bold text-slate-900 mb-2">{number}</div>
            <div className="text-sm text-gray-600 font-medium">{label}</div>
        </div>
    );
};

export default StatCard;
