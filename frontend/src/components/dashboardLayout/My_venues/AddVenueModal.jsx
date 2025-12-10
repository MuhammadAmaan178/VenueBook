// components/AddVenueModal.jsx
import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';

const AddVenueModal = ({ isOpen, onClose, onAddVenue }) => {
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        type: '',
        capacity: '',
        price: '',
        description: '',
        amenities: []
    });

    const venueTypes = [
        'Banquet Hall', 'Garden Venue', 'Convention Center',
        'Hotel Ballroom', 'Wedding Lawn', 'Conference Hall',
        'Party Hall', 'Outdoor Venue', 'Indoor Venue'
    ];

    const amenitiesList = [
        'Parking', 'Catering', 'Audio System', 'Projector', 'WiFi',
        'Air Conditioning', 'Stage', 'Lighting', 'Security', 'Restrooms'
    ];

    const handleSubmit = (e) => {
        e.preventDefault();

        const newVenue = {
            ...formData,
            capacity: parseInt(formData.capacity),
            rating: 0,
            reviews: 0,
            image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&h=300&fit=crop",
            price: `Rs. ${parseInt(formData.price).toLocaleString()}`
        };

        onAddVenue(newVenue);
        onClose();
        setFormData({
            name: '',
            location: '',
            type: '',
            capacity: '',
            price: '',
            description: '',
            amenities: []
        });
    };

    const handleAmenityToggle = (amenity) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity]
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-800">Add New Venue</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Venue Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="Royal Banquet Hall"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Location *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="Karachi, Gulshan-e-Iqbal"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Venue Type *
                            </label>
                            <select
                                required
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                                <option value="">Select type</option>
                                {venueTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Capacity *
                            </label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Starting Price (PKR) *
                            </label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="150000"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows="3"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="Describe your venue..."
                            />
                        </div>
                    </div>

                    {/* Amenities */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Amenities
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            {amenitiesList.map(amenity => (
                                <div key={amenity} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`amenity-${amenity}`}
                                        checked={formData.amenities.includes(amenity)}
                                        onChange={() => handleAmenityToggle(amenity)}
                                        className="mr-2 h-5 w-5 text-blue-600 rounded"
                                    />
                                    <label htmlFor={`amenity-${amenity}`} className="text-gray-700">
                                        {amenity}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div className="mb-8">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Venue Images
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <Upload className="mx-auto text-gray-400 mb-3" size={48} />
                            <p className="text-gray-600 mb-2">Drag & drop images here or click to browse</p>
                            <p className="text-gray-500 text-sm">Supported formats: JPG, PNG, WebP</p>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-4 pt-6 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Add Venue
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddVenueModal;