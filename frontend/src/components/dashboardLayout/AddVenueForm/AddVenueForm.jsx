// components/AddVenueForm.jsx
import React, { useState } from 'react';
import { Crown, MapPin, DollarSign, Users, Building, Image as ImageIcon, Plus, X, Loader, Upload, ArrowLeft, ArrowRight, Save, AlertCircle, Check, Grid, Briefcase, Calendar } from 'lucide-react';
import { API_BASE_URL } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import AvailabilityCalendar from '../../common/AvailabilityCalendar';
import PhoneInput from '../../common/PhoneInput';

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

const AddVenueForm = ({ isOpen, onClose, onAddVenue, initialData }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formErrors, setFormErrors] = useState({});

    const { user } = useAuth ? useAuth() : { user: { id: 1 } };

    const lastLoadedIdRef = React.useRef(null);

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
        price: '',
        availability: [], // Array of { date: 'YYYY-MM-DD', slots: [] }
        accountNumber: '',
        accountHolderName: '',
        contactNumber: '',
        termsAccepted: false
    });

    // Populate form if initialData provided (Edit Mode)
    React.useEffect(() => {
        if (!isOpen) {
            lastLoadedIdRef.current = null;
            return;
        }

        if (initialData) {
            // Edit Mode Check - Only populate if venue ID changed or uninitialized
            if (lastLoadedIdRef.current !== initialData.venue_id) {
                // Clear errors
                setError(null);
                setFormErrors({});
                setCurrentStep(1);

                setFormData(prev => ({
                    ...prev,
                    venueName: initialData.name || '',
                    venueType: initialData.type || '',
                    capacity: initialData.capacity || '',
                    city: initialData.city || '',
                    address: initialData.address || '',
                    description: initialData.description || '',
                    price: initialData.base_price || '',

                    // Map photos
                    photos: initialData.images ? initialData.images.map(img => img.image_url) : [],

                    // Map facilities with safety checks
                    facilities: initialData.facilities ? initialData.facilities.map(f => {
                        if (!f.facility_name) return null;
                        const match = facilitiesList.find(item => item.label.toLowerCase() === f.facility_name.toLowerCase());
                        return match ? match.id : null;
                    }).filter(id => id !== null) : [],

                    // Map availability
                    availability: initialData.availability ? Object.entries(
                        initialData.availability.reduce((acc, curr) => {
                            if (!curr.date) return acc;
                            const dateObj = new Date(curr.date);
                            if (isNaN(dateObj.getTime())) return acc;
                            const dateKey = `${dateObj.getFullYear()} -${String(dateObj.getMonth() + 1).padStart(2, '0')} -${String(dateObj.getDate()).padStart(2, '0')} `;
                            if (!acc[dateKey]) acc[dateKey] = [];
                            if (curr.is_available) acc[dateKey].push(curr.slot);
                            return acc;
                        }, {})
                    ).map(([date, slots]) => ({ date, slots })) : [],

                    // Map payment info
                    accountNumber: initialData.payment_info?.account_number || '',
                    // Safe mapping with type check to prevent crash on objects/invalid types
                    accountHolderName: (() => {
                        const val = initialData.payment_info?.account_holder_name || initialData.payment_info?.account_holder;
                        if (typeof val === 'string' || typeof val === 'number') return String(val);
                        return '';
                    })(),
                    contactNumber: initialData.payment_info?.contact_number || '',
                    termsAccepted: false // User requested to uncheck this by default on edit
                }));

                lastLoadedIdRef.current = initialData.venue_id;
            }
        } else {
            // Add Mode Check
            if (lastLoadedIdRef.current !== 'add_mode') {
                setError(null);
                setFormErrors({});
                setFormData({
                    venueName: '',
                    venueType: '',
                    capacity: '',
                    city: '',
                    address: '',
                    description: '',
                    photos: [],
                    facilities: [],
                    availability: [],
                    price: '',
                    accountNumber: '',
                    accountHolderName: '',
                    contactNumber: '',
                    termsAccepted: false
                });
                setCurrentStep(1);
                lastLoadedIdRef.current = 'add_mode';
            }
        }
    }, [isOpen, initialData]);


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
            payload.append('ownerId', user?.owner_id || user?.user_id || 1);

            // Append facilities (if changed, logic needed, but sending anyway)
            payload.append('facilities', JSON.stringify(formData.facilities));

            // Append availability
            payload.append('availability', JSON.stringify(formData.availability));

            // Append photos (Only new files)
            formData.photos.forEach((photo) => {
                if (photo instanceof File) {
                    payload.append('photos', photo);
                }
            });

            const ownerId = user?.owner_id || user?.user_id || 1;
            // Append ownerId to payload if not already correct (already appended above)

            const method = initialData ? 'PUT' : 'POST';
            const url = initialData
                ? `${API_BASE_URL}/api/owner/${ownerId}/venues/${initialData.venue_id}`
                : `${API_BASE_URL}/api/owner/${ownerId}/venues`;

            // Get token for authentication
            const token = localStorage.getItem('token');

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                // Remove Content-Type header to let browser set boundary for FormData
                body: payload
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Failed to ${initialData ? 'update' : 'create'} venue`);
            }

            // Success
            if (onAddVenue) onAddVenue(data); // Notify parent
            onClose();

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };



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

        if (step === 4) {
            if (!formData.price) errors.price = "Price is required";
            else if (Number(formData.price) <= 0) errors.price = "Price must be greater than 0";
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
        { number: 1, title: 'Basic Info', icon: Briefcase },
        { number: 2, title: 'Details', icon: MapPin },
        { number: 3, title: 'Facilities', icon: Grid },
        { number: 4, title: 'Pricing', icon: DollarSign }
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
                {/* Header */}
                <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-100 p-6 flex justify-between items-center z-20">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{initialData ? 'Edit Venue' : 'Add New Venue'}</h2>
                        <p className="text-gray-500 text-sm mt-1">
                            Complete all steps to {initialData ? 'update your' : 'list a new'} property
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Progress Steps */}
                <div className="px-6 py-6 border-b border-gray-50 bg-gray-50/50">
                    <div className="flex justify-between items-center relative">
                        {/* Connecting Line - Background */}
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 rounded-full -z-0 -translate-y-4"></div>

                        {/* Connecting Line - Progress (Simplified logic for visual) */}
                        <div
                            className="absolute top-1/2 left-0 h-1 bg-blue-600 rounded-full -z-0 -translate-y-4 transition-all duration-500"
                            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                        ></div>


                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            const isActive = currentStep >= step.number;
                            const isCompleted = currentStep > step.number;

                            return (
                                <div key={step.number} className="flex flex-col items-center z-10 relative">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-4 transition-all duration-300 shadow-sm ${isActive
                                        ? 'bg-blue-600 border-white text-white shadow-blue-200'
                                        : 'bg-white border-gray-100 text-gray-400'
                                        }`}>
                                        {isCompleted ? <Check size={20} /> : <Icon size={20} />}
                                    </div>
                                    <span className={`text-xs font-bold mt-2 uppercase tracking-wide transition-colors ${isActive ? 'text-blue-700' : 'text-gray-400'
                                        }`}>
                                        {step.title}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    {error && (
                        <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center shadow-sm animate-pulse-once">
                            <AlertCircle size={20} className="mr-3" />
                            {error}
                        </div>
                    )}

                    {/* Step 1: Basic Information */}
                    {currentStep === 1 && (
                        <div className="animate-in slide-in-from-right-4 duration-300">
                            <div className="mb-8 text-center pb-6 border-b border-gray-100">
                                <h3 className="text-xl font-bold text-gray-900">Let's start with the basics</h3>
                                <p className="text-gray-500 mt-1">What is the name and type of your venue?</p>
                            </div>

                            <div className="max-w-2xl mx-auto space-y-8">
                                {/* Venue Name */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Venue Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.venueName}
                                        onChange={(e) => handleInputChange('venueName', e.target.value)}
                                        className={`w-full px-5 py-4 bg-gray-50 border rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium ${formErrors.venueName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                                            }`}
                                        placeholder="e.g. Royal Palace Banquet"
                                    />
                                    {formErrors.venueName && (
                                        <p className="text-red-500 text-sm mt-2 font-medium flex items-center gap-1"><AlertCircle size={14} /> {formErrors.venueName}</p>
                                    )}
                                </div>

                                {/* Venue Type */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3">
                                        Venue Type <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {venueTypes.map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => handleInputChange('venueType', type)}
                                                className={`p-4 border rounded-2xl text-left transition-all hover:-translate-y-0.5 ${formData.venueType === type
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200 ring-offset-1 font-bold shadow-md'
                                                    : 'border-gray-200 hover:bg-gray-50 text-gray-600 hover:border-gray-300 font-medium'
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                    {formErrors.venueType && (
                                        <p className="text-red-500 text-sm mt-2 font-medium flex items-center gap-1"><AlertCircle size={14} /> {formErrors.venueType}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Capacity & Details */}
                    {currentStep === 2 && (
                        <div className="animate-in slide-in-from-right-4 duration-300">
                            <div className="mb-8 text-center pb-6 border-b border-gray-100">
                                <h3 className="text-xl font-bold text-gray-900">Tell us more details</h3>
                                <p className="text-gray-500 mt-1">Location, capacity, and what makes it special.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Left Column */}
                                <div className="space-y-6">
                                    {/* Capacity */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Capacity (Guests) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData.capacity}
                                            onChange={(e) => handleInputChange('capacity', e.target.value)}
                                            className={`w-full px-5 py-3.5 bg-gray-50 border rounded-xl focus:ring-4 focus:ring-blue-100 outline-none transition-all ${formErrors.capacity ? 'border-red-300' : 'border-gray-200 focus:border-blue-500'}`}
                                            placeholder="e.g. 500"
                                        />
                                        {formErrors.capacity && <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.capacity}</p>}
                                    </div>

                                    {/* City */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            City <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.city}
                                            onChange={(e) => handleInputChange('city', e.target.value)}
                                            className={`w-full px-5 py-3.5 bg-gray-50 border rounded-xl focus:ring-4 focus:ring-blue-100 outline-none transition-all cursor-pointer ${formErrors.city ? 'border-red-300' : 'border-gray-200 focus:border-blue-500'}`}
                                        >
                                            <option value="">Select City</option>
                                            {cities.map(city => (
                                                <option key={city} value={city}>{city}</option>
                                            ))}
                                        </select>
                                        {formErrors.city && <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.city}</p>}
                                    </div>

                                    {/* Address */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Complete Address <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            rows="3"
                                            value={formData.address}
                                            onChange={(e) => handleInputChange('address', e.target.value)}
                                            className={`w-full px-5 py-3.5 bg-gray-50 border rounded-xl focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none ${formErrors.address ? 'border-red-300' : 'border-gray-200 focus:border-blue-500'}`}
                                            placeholder="Plot number, street, block..."
                                        />
                                        {formErrors.address && <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.address}</p>}
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-6">
                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Description <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => handleInputChange('description', e.target.value)}
                                            rows="4"
                                            className={`w-full px-5 py-3.5 bg-gray-50 border rounded-xl focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none ${formErrors.description ? 'border-red-300' : 'border-gray-200 focus:border-blue-500'}`}
                                            placeholder="Describe venue features, ambiance, and suitability..."
                                        />
                                        {formErrors.description && <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.description}</p>}
                                    </div>

                                    {/* Photos Upload */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Photos <span className="text-red-500">*</span>
                                        </label>
                                        <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${formErrors.photos ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
                                            }`}>
                                            <Upload className="mx-auto text-blue-500 mb-3" size={32} />
                                            <p className="text-gray-900 font-medium mb-1">Click to upload photos</p>
                                            <p className="text-gray-500 text-xs mb-4">JPG, PNG, WebP up to 5MB</p>
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
                                                className="inline-block px-5 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 cursor-pointer text-sm font-bold shadow-sm transition-all"
                                            >
                                                Browse Files
                                            </label>
                                        </div>
                                        {formErrors.photos && <p className="text-red-500 text-xs mt-2 font-medium">{formErrors.photos}</p>}

                                        {/* Preview Uploaded Photos */}
                                        {formData.photos.length > 0 && (
                                            <div className="mt-4 grid grid-cols-4 gap-2">
                                                {formData.photos.map((photo, index) => (
                                                    <div key={index} className="relative group aspect-square rounded-xl overflow-hidden shadow-sm border border-gray-100">
                                                        <img
                                                            src={photo instanceof File ? URL.createObjectURL(photo) : photo}
                                                            alt={`Preview ${index + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemovePhoto(index)}
                                                                className="bg-white/20 hover:bg-red-500/80 p-1.5 rounded-full text-white backdrop-blur-sm transition-colors"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Facilities & Amenities */}
                    {currentStep === 3 && (
                        <div className="animate-in slide-in-from-right-4 duration-300">
                            <div className="mb-8 text-center pb-6 border-b border-gray-100">
                                <h3 className="text-xl font-bold text-gray-900">What facilities do you offer?</h3>
                                <p className="text-gray-500 mt-1">Select all expected amenities.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {facilitiesList.map(facility => (
                                    <div key={facility.id}
                                        onClick={() => handleFacilityToggle(facility.id)}
                                        className={`flex items-center p-4 border rounded-2xl cursor-pointer transition-all ${formData.facilities.includes(facility.id)
                                            ? 'bg-blue-50 border-blue-500 shadow-sm ring-1 ring-blue-500'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}>
                                        <div className={`w-6 h-6 rounded-md border flex items-center justify-center mr-3 transition-colors ${formData.facilities.includes(facility.id)
                                            ? 'bg-blue-600 border-blue-600 text-white'
                                            : 'border-gray-300 bg-white'
                                            }`}>
                                            {formData.facilities.includes(facility.id) && <Check size={14} strokeWidth={3} />}
                                        </div>
                                        <label className="cursor-pointer font-medium text-gray-700 select-none">
                                            {facility.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 4: Pricing & Payment Information */}
                    {currentStep === 4 && (
                        <div className="animate-in slide-in-from-right-4 duration-300">
                            <div className="mb-8 text-center pb-6 border-b border-gray-100">
                                <h3 className="text-xl font-bold text-gray-900">Final Details</h3>
                                <p className="text-gray-500 mt-1">Set your pricing and account info.</p>
                            </div>

                            <div className="space-y-8">
                                {/* Pricing Cards */}
                                {/* Pricing & Availability */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                                <DollarSign size={20} />
                                            </div>
                                            Pricing & Availability
                                        </h4>
                                    </div>

                                    {/* Base Price Input */}
                                    <div className="mb-8">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">
                                            Base Price (per booking) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rs.</span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.price}
                                                onChange={(e) => handleInputChange('price', e.target.value)}
                                                className={`w-full pl-12 pr-4 py-4 bg-white border rounded-xl focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold text-lg ${formErrors.price ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'}`}
                                                placeholder="0.00"
                                            />
                                        </div>
                                        {formErrors.price && <p className="text-red-500 text-sm mt-2 font-medium">{formErrors.price}</p>}
                                    </div>

                                    {/* Calendar Section */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-4 flex items-center justify-between">
                                            <span>Manage Availability <span className="text-red-500">*</span></span>
                                            <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                                Select dates to set open slots
                                            </span>
                                        </label>

                                        <AvailabilityCalendar
                                            availability={formData.availability}
                                            onChange={(newAvailability) => handleInputChange('availability', newAvailability)}
                                        />
                                        <p className="text-xs text-gray-500 mt-3 ml-1">
                                            * Default: All dates are unavailable until you enable slots. Click a date to add slots (Morning/Evening/Full Day).
                                        </p>
                                    </div>
                                </div>

                                {/* Account Information */}
                                <div className="bg-gray-50/80 rounded-3xl p-6 border border-gray-200">
                                    <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <Briefcase size={20} className="text-gray-500" />
                                        Bank Account Details
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">
                                                Account Number
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.accountNumber}
                                                onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                                                className={`w-full px-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-blue-200 outline-none font-medium ${formErrors.accountNumber ? 'border-red-300' : 'border-gray-200'}`}
                                                placeholder="XXXX-XXXX-XXXX-XXXX"
                                            />
                                            {formErrors.accountNumber && <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.accountNumber}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-xs uppercase tracking-wider font-bold text-gray-500 mb-2">
                                                Account Holder
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.accountHolderName}
                                                onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                                                className={`w-full px-4 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-blue-200 outline-none font-medium ${formErrors.accountHolderName ? 'border-red-300' : 'border-gray-200'}`}
                                                placeholder="Name on account"
                                            />
                                            {formErrors.accountHolderName && <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.accountHolderName}</p>}
                                        </div>

                                        <div className="md:col-span-2">
                                            <PhoneInput
                                                value={formData.contactNumber}
                                                onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                                                error={formErrors.contactNumber}
                                                label="Contact Number"
                                                className={`bg-white focus:ring-2 focus:ring-blue-200 ${formErrors.contactNumber ? 'border-red-300' : 'border-gray-200'}`}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Terms & Conditions */}
                                <div className="pt-4 border-t border-gray-100">
                                    <label className="flex items-center cursor-pointer group">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={formData.termsAccepted}
                                                onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
                                                className="peer sr-only"
                                            />
                                            <div className="w-6 h-6 border-2 border-gray-300 rounded md:rounded-md peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all"></div>
                                            <Check size={16} className="absolute top-0.5 left-0.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" strokeWidth={3} />
                                        </div>
                                        <span className="ml-3 text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                                            I verify that all information provided is accurate and I accept the <span className="text-blue-600 font-bold underline">Terms & Conditions</span>.
                                        </span>
                                    </label>
                                    {formErrors.termsAccepted && <p className="text-red-500 text-xs mt-2 ml-9 font-medium">{formErrors.termsAccepted}</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer Navigation */}
                    <div className="mt-10 pt-6 border-t border-gray-100 flex justify-between items-center">
                        <div>
                            {currentStep > 1 && (
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="px-6 py-3 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition-all flex items-center gap-2 group"
                                    disabled={loading}
                                >
                                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                                    Back
                                </button>
                            )}
                        </div>

                        {currentStep < 4 ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                className="px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
                            >
                                Next Step
                                <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 hover:-translate-y-0.5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Submit Venue
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddVenueForm;