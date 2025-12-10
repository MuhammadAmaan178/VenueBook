// components/AddVenueCard.jsx
import React from 'react';
import { Plus } from 'lucide-react';

const AddVenueCard = ({ onClick }) => {
    return (
        <div
            onClick={onClick}
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group"
        >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <Plus size={32} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Add a New Venue</h3>
            <p className="text-gray-500 text-center text-sm">
                Click here to add a new venue to your portfolio
            </p>
        </div>
    );
};

export default AddVenueCard;