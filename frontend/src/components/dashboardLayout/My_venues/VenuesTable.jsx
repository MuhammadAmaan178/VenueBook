// components/VenuesTable.jsx
import React from 'react';
import { Eye, Edit } from 'lucide-react';

const VenuesTable = ({ venues, onEdit, onView }) => {

    const columns = [
        "Image", "Venue Name", "Location", "Capacity", "Price", "Status", "Bookings", "Actions"
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">My Venues</h2>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b">
                            {columns.map((col, index) => (
                                <th
                                    key={index}
                                    className="text-left py-3 px-4 text-sm font-medium text-gray-600"
                                >
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {venues.map((venue) => (
                            <tr key={venue.id} className="border-b hover:bg-gray-50">
                                <td className="py-4 px-4">
                                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                        {venue.image}
                                    </div>
                                </td>
                                <td className="py-4 px-4 font-medium">{venue.name}</td>
                                <td className="py-4 px-4 text-gray-600">{venue.location}</td>
                                <td className="py-4 px-4 text-gray-600">{venue.capacity}</td>
                                <td className="py-4 px-4 font-medium text-green-600">
                                    {venue.price}
                                </td>
                                <td className="py-4 px-4">
                                    <span className={`px-3 py-1 rounded-full text-sm ${venue.status === 'active' ? 'bg-green-100 text-green-800' :
                                        venue.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {venue.status}
                                    </span>
                                </td>
                                <td className="py-4 px-4 text-blue-600">
                                    {venue.bookings}
                                </td>
                                <td className="py-4 px-4">
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (onView) onView(venue);
                                            }}
                                            className="p-1 text-gray-600 hover:text-blue-600 transition"
                                            title="View Details"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(venue);
                                            }}
                                            className="p-1 text-gray-600 hover:text-green-600 transition"
                                            title="Edit Venue"
                                        >
                                            <Edit size={18} />
                                        </button>

                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default VenuesTable;