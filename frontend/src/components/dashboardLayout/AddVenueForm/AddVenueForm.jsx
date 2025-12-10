// components/AddVenueForm.jsx
import React, { useState } from 'react';
import { X, Upload, ArrowLeft, ArrowRight, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext'; // Import useAuth if available, or assume passed prop

const AddVenueForm = ({ isOpen, onClose, onAddVenue, initialData }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formErrors, setFormErrors] = useState({});

    // In a real app, user ID comes from auth context
    const { user } = useAuth ? useAuth() : { user: { id: 1 } };

    const [formData, setFormData] = useState({
        // Basic Information
        venueName: '',
        venueType: '',

        // Capacity & Location
        capacity: '',
        city: '',
        address: '',
        description: '',
        photos: [], // Stores File objects or URLs

        // Facilities & Amenities
        facilities: [], // Stores facility IDs

        // Pricing & Payment
        pricingSlots: [],
        selectedSlot: '',
        price: '',
        accountNumber: '',
        accountHolderName: '',
        contactNumber: '',
        termsAccepted: false
    });

    // Populate form if initialData provided (Edit Mode)
    React.useEffect(() => {
        if (isOpen && initialData) {
            setFormData(prev => ({
                ...prev,
                venueName: initialData.name || '',
                venueType: initialData.type || '',
                capacity: initialData.capacity || '',
                city: initialData.city || '',
                address: initialData.address || '',
                description: initialData.description || '',
                price: initialData.base_price || '',
                // Note: Other fields (account, facilities) might be missing in list view data
                // Ideally fetch full details here. For now, we map what we have.
            }));
        } else if (isOpen && !initialData) {
            // Reset if opening in Add mode
            setFormData({
                venueName: '',
                venueType: '',
                capacity: '',
                city: '',
                address: '',
                description: '',
                photos: [],
                facilities: [],
                pricingSlots: [],
                selectedSlot: '',
                price: '',
                accountNumber: '',
                accountHolderName: '',
                contactNumber: '',
                termsAccepted: false
            });
            setCurrentStep(1);
        }
    }, [isOpen, initialData]);

    // ... (keep constants venueTypes etc.)

    // ... (keep helper functions)

    const handleSubmit = async (e) => {
        e.preventDefault();

        // If editing, custom validation or skip some steps if partial update?
        // Reuse validation for now
        if (!validateStep(4)) return;

        setLoading(true);
        setError(null);

        try {
            // Create FormData object
            const payload = new FormData();

            // Append basic fields
            payload.append('venueName', formData.venueName);
            payload.append('venueType', formData.venueType);
            payload.append('capacity', formData.capacity);
            payload.append('city', formData.city);
            payload.append('address', formData.address);
            payload.append('description', formData.description);
            payload.append('price', formData.price || 0);
            payload.append('ownerId', user?.user_id || user?.id || 1);

            // Append facilities (if changed, logic needed, but sending anyway)
            payload.append('facilities', JSON.stringify(formData.facilities));

            // Append photos (Only new files)
            formData.photos.forEach((photo) => {
                if (photo instanceof File) {
                    payload.append('photos', photo);
                }
            });

            const method = initialData ? 'PUT' : 'POST';
            const url = initialData
                ? `http://localhost:5000/api/venues/${initialData.venue_id}`
                : 'http://localhost:5000/api/venues';

            const response = await fetch(url, {
                method: method,
                // Remove Content-Type header to let browser set boundary
                body: payload
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Failed to ${initialData ? 'update' : 'create'} venue`);
            }

            // Success
            if (onAddVenue) onAddVenue(data); // Notify parent
            onClose();

            // Reset form
            // ... (Reset handled by effect on open/close mostly, but good to explicit)

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const venueTypes = [
        'Banquet Hall', 'Garden', 'Hotel', 'Convention Center',
        'Farmhouse', 'Marquee', 'Resort', 'Other'
    ];

    const cities = [
        'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi',
        'Faisalabad', 'Multan', 'Peshawar', 'Quetta',
        'Hyderabad', 'Gujranwala'
    ];

    const facilitiesList = [
        { id: 'air_conditioning', label: 'Air Conditioning' },
        { id: 'sound_system', label: 'Sound System' },
        { id: 'stage_lighting', label: 'Stage & Lighting' },
        { id: 'parking', label: 'Parking Space' },
        { id: 'decoration', label: 'Decoration' },
        { id: 'photography', label: 'Photography' },
        { id: 'security', label: 'Security' },
        { id: 'projector', label: 'Projector & Screen' },
        { id: 'generator', label: 'Generator Backup' }
    ];

    const pricingSlots = [
        { id: 'morning', label: 'Morning (8 AM - 2 PM)', price: '' },
        { id: 'evening', label: 'Evening (2 PM - 10 PM)', price: '' },
        { id: 'full_day', label: 'Full Day (8 AM - 10 PM)', price: '' },
        { id: 'custom', label: 'Custom Hours', price: '' }
    ];

    const handleInputChange = (field, value) => {
        setFormData({
            ...formData,
            [field]: value
        });
        // Clear error when field changes
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const handleFacilityToggle = (facilityId) => {
        setFormData(prev => ({
            ...prev,
            facilities: prev.facilities.includes(facilityId)
                ? prev.facilities.filter(id => id !== facilityId)
                : [...prev.facilities, facilityId]
        }));
    };

    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files);
        // For this demo, we'll convert files to object URLs for preview 
        // In real app, we might upload to S3 here or sending formData

        // Since backend expects image_url string for venues.py logic we wrote, 
        // we will mock it by using placeholder URLs if passing to backend, 
        // OR we should have implemented file upload. 
        // Given constraints, I'll keep the object URL for preview but 
        // send a placeholder string to backend if it's a File object.

        setFormData(prev => ({
            ...prev,
            photos: [...prev.photos, ...files]
        }));

        if (formErrors.photos) {
            setFormErrors(prev => ({ ...prev, photos: null }));
        }
    };

    const handleRemovePhoto = (index) => {
        setFormData(prev => ({
            ...prev,
            photos: prev.photos.filter((_, i) => i !== index)
        }));
    };

    const validateStep = (step) => {
        const errors = {};
        let isValid = true;

        if (step === 1) {
            if (!formData.venueName.trim()) errors.venueName = "Venue name is required";
            if (!formData.venueType) errors.venueType = "Please select a venue type";
        }

        if (step === 2) {
            if (!formData.capacity) errors.capacity = "Capacity is required";
            else if (parseInt(formData.capacity) <= 0) errors.capacity = "Capacity must be positive";

            if (!formData.city) errors.city = "Please select a city";
            if (!formData.address.trim()) errors.address = "Address is required";
            if (!formData.description.trim()) errors.description = "Description is required";

            if (formData.photos.length === 0) errors.photos = "At least one photo is required";
        }

        // Step 3 (Facilities) is optional mostly, or we assume at least one? Let's leave optional.

        if (step === 4) {
            if (!formData.selectedSlot) errors.selectedSlot = "Please select a pricing slot";

            // Check if price is set for selected slot? 
            // The UI has price input inside the slot map logic which updates 'pricingSlots' array?
            // Actually the current UI code for price input wasn't connected to state properly in the view I saw earlier.
            // It was: <input placeholder="Price" ... /> without value binding. 
            // I need to fix that binding too.
            // Assuming we use formData.price for simplicity as per state definition
            if (!formData.price) errors.price = "Price is required";

            if (!formData.accountNumber.trim()) errors.accountNumber = "Account number is required";
            if (!formData.accountHolderName.trim()) errors.accountHolderName = "Account holder name is required";
            if (!formData.contactNumber.trim()) errors.contactNumber = "Contact number is required";
            if (!formData.termsAccepted) errors.termsAccepted = "You must accept the terms";
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            isValid = false;
        }

        return isValid;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            if (currentStep < 4) setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };


    const steps = [
        { number: 1, title: 'Basic Info' },
        { number: 2, title: 'Details' },
        { number: 3, title: 'Facilities' },
        { number: 4, title: 'Pricing' }
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Add New Venue</h2>
                        <p className="text-gray-600 text-sm mt-1">
                            Complete all steps to add your venue
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Progress Steps */}
                <div className="px-6 py-4 border-b">
                    <div className="flex justify-between items-center">
                        {steps.map((step, index) => (
                            <div key={step.number} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${currentStep >= step.number
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'border-gray-300 text-gray-400'
                                        }`}>
                                        {step.number}
                                    </div>
                                    <span className={`text-sm mt-2 ${currentStep >= step.number ? 'text-blue-600 font-medium' : 'text-gray-500'
                                        }`}>
                                        {step.title}
                                    </span>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`w-16 h-0.5 mx-4 ${currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
                            <AlertCircle size={20} className="mr-2" />
                            {error}
                        </div>
                    )}

                    {/* Step 1: Basic Information */}
                    {currentStep === 1 && (
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-6">Basic Information</h3>

                            {/* Venue Name */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Venue Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.venueName}
                                    onChange={(e) => handleInputChange('venueName', e.target.value)}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.venueName ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter Your Venue Name"
                                />
                                {formErrors.venueName && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.venueName}</p>
                                )}
                            </div>

                            {/* Venue Type */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Venue Type *
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {venueTypes.map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => handleInputChange('venueType', type)}
                                            className={`p-4 border rounded-lg text-center transition-colors ${formData.venueType === type
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                                {formErrors.venueType && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.venueType}</p>
                                )}
                            </div>

                            {/* Navigation Buttons */}
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                >
                                    Next
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Capacity & Details */}
                    {currentStep === 2 && (
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-6">Venue Details</h3>

                            <div className="space-y-6">
                                {/* Capacity */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Capacity (Guests) *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.capacity}
                                        onChange={(e) => handleInputChange('capacity', e.target.value)}
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.capacity ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="e.g. 500 (Write in Numbers)"
                                    />
                                    {formErrors.capacity && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.capacity}</p>
                                    )}
                                </div>

                                {/* City */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        City *
                                    </label>
                                    <select
                                        value={formData.city}
                                        onChange={(e) => handleInputChange('city', e.target.value)}
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.city ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    >
                                        <option value="">Select City</option>
                                        {cities.map(city => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </select>
                                    {formErrors.city && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.city}</p>
                                    )}
                                </div>

                                {/* Complete Address */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Complete Address *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => handleInputChange('address', e.target.value)}
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.address ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Plot number, street, block, area"
                                    />
                                    {formErrors.address && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.address}</p>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description *
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        rows="4"
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.description ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Describe your venue, its features and what makes it special for events"
                                    />
                                    {formErrors.description && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
                                    )}
                                </div>

                                {/* Photos Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Photos *
                                    </label>
                                    <div className={`border-2 border-dashed rounded-lg p-8 text-center ${formErrors.photos ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                        }`}>
                                        <Upload className="mx-auto text-gray-400 mb-3" size={48} />
                                        <p className="text-gray-600 mb-2">Drag & drop photos here or click to browse</p>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handlePhotoUpload}
                                            className="hidden"
                                            id="photo-upload"
                                        />
                                        <label
                                            htmlFor="photo-upload"
                                            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                                        >
                                            Browse Photos
                                        </label>
                                        <p className="text-gray-500 text-sm mt-2">Supported formats: JPG, PNG, WebP</p>
                                    </div>
                                    {formErrors.photos && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.photos}</p>
                                    )}

                                    {/* Preview Uploaded Photos */}
                                    {formData.photos.length > 0 && (
                                        <div className="mt-4">
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Photos ({formData.photos.length})</h4>
                                            <div className="grid grid-cols-4 gap-2">
                                                {formData.photos.map((photo, index) => (
                                                    <div key={index} className="relative group">
                                                        <img
                                                            src={URL.createObjectURL(photo)}
                                                            alt={`Preview ${index + 1}`}
                                                            className="w-full h-24 object-cover rounded-lg"
                                                            onLoad={() => {
                                                                // Revoke URL to free memory if needed, but keeping for render
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemovePhoto(index)}
                                                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Navigation Buttons */}
                            <div className="flex justify-between mt-8">
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <ArrowLeft size={18} />
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                >
                                    Next
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Facilities & Amenities */}
                    {currentStep === 3 && (
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-6">Facilities & Amenities</h3>

                            <div className="mb-6">
                                <p className="text-gray-600 mb-4">
                                    Select all facilities and amenities available at your venue.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {facilitiesList.map(facility => (
                                        <div key={facility.id} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={facility.id}
                                                checked={formData.facilities.includes(facility.id)}
                                                onChange={() => handleFacilityToggle(facility.id)}
                                                className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                            />
                                            <label htmlFor={facility.id} className="ml-3 text-gray-700">
                                                {facility.label}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Navigation Buttons */}
                            <div className="flex justify-between mt-8">
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <ArrowLeft size={18} />
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                >
                                    Next
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Pricing & Payment Information */}
                    {currentStep === 4 && (
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-6">Pricing & Payment Information</h3>

                            <div className="space-y-6">
                                {/* Pricing Cards */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Pricing Slots *
                                    </label>
                                    <p className="text-gray-600 mb-4 text-sm">
                                        Select any one slot from the drop down menu and set the price for each slot
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {pricingSlots.map(slot => (
                                            <div
                                                key={slot.id}
                                                className={`border rounded-lg p-4 cursor-pointer ${formData.selectedSlot === slot.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                                    }`}
                                                onClick={() => handleInputChange('selectedSlot', slot.id)}
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <h4 className="font-medium text-gray-800">{slot.label}</h4>
                                                    <div className="flex items-center">
                                                        <input
                                                            type="radio"
                                                            checked={formData.selectedSlot === slot.id}
                                                            onChange={() => handleInputChange('selectedSlot', slot.id)}
                                                            className="h-4 w-4 text-blue-600"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                    <span className="text-gray-500">Rs.</span>
                                                    <input
                                                        type="number"
                                                        placeholder="Price"
                                                        value={formData.selectedSlot === slot.id ? formData.price : ''}
                                                        onChange={(e) => {
                                                            if (formData.selectedSlot === slot.id) {
                                                                handleInputChange('price', e.target.value);
                                                            }
                                                        }}
                                                        disabled={formData.selectedSlot !== slot.id}
                                                        className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        min="0"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {formErrors.selectedSlot && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.selectedSlot}</p>
                                    )}
                                    {formErrors.price && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.price}</p>
                                    )}
                                </div>

                                {/* Account Information */}
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <h4 className="font-medium text-gray-700 mb-4">Bank Account Information</h4>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Account Number *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.accountNumber}
                                                onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.accountNumber ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                            />
                                            {formErrors.accountNumber && (
                                                <p className="text-red-500 text-sm mt-1">{formErrors.accountNumber}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Account Holder Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.accountHolderName}
                                                onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.accountHolderName ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                            />
                                            {formErrors.accountHolderName && (
                                                <p className="text-red-500 text-sm mt-1">{formErrors.accountHolderName}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Contact Number *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.contactNumber}
                                                onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.contactNumber ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                            />
                                            {formErrors.contactNumber && (
                                                <p className="text-red-500 text-sm mt-1">{formErrors.contactNumber}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Terms & Conditions */}
                                <div>
                                    <div className="flex items-start">
                                        <input
                                            type="checkbox"
                                            id="terms"
                                            checked={formData.termsAccepted}
                                            onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
                                            className="h-5 w-5 text-blue-600 rounded border-gray-300 mt-1"
                                        />
                                        <label htmlFor="terms" className="ml-3 text-gray-700">
                                            By checking this checkbox, I accept all the Terms & Conditions
                                        </label>
                                    </div>
                                    {formErrors.termsAccepted && (
                                        <p className="text-red-500 text-sm mt-1 ml-8">{formErrors.termsAccepted}</p>
                                    )}
                                </div>
                            </div>

                            {/* Navigation Buttons */}
                            <div className="flex justify-between mt-8">
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                                    disabled={loading}
                                >
                                    <ArrowLeft size={18} />
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <span>Submitting...</span>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Submit Request
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </form>

                {/* Step Indicator */}
                <div className="p-4 border-t bg-gray-50 text-center text-sm text-gray-500">
                    Step {currentStep} of {steps.length}
                </div>
            </div>
        </div>
    );
};

export default AddVenueForm;