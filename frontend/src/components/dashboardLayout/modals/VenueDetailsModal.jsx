import React from 'react';
import { X } from 'lucide-react';

const VenueDetailsModal = ({ venue, onClose }) => {
    if (!venue) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Venue Details</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Venue Name</p>
                                <p className="font-semibold">{venue.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Type</p>
                                <p className="font-semibold capitalize">{venue.type}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">City</p>
                                <p className="font-semibold">{venue.city}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Capacity</p>
                                <p className="font-semibold">{venue.capacity} people</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Base Price</p>
                                <p className="font-semibold">Rs. {venue.base_price?.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Rating</p>
                                <p className="font-semibold">{venue.rating} ⭐</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Status</p>
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${venue.status === 'active' ? 'bg-green-100 text-green-800' :
                                        venue.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                    }`}>
                                    {venue.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    {venue.address && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Address</h3>
                            <p className="text-gray-700">{venue.address}</p>
                        </div>
                    )}

                    {/* Description */}
                    {venue.description && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                            <p className="text-gray-700">{venue.description}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t px-6 py-4">
                    <button
                        onClick={onClose}
                        className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VenueDetailsModal;
