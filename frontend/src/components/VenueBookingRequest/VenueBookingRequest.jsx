import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  MoreVertical
} from 'lucide-react';

// ===== SUBCOMPONENTS =====

// User Avatar Component
const UserAvatar = ({ initials }) => (
  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
    <span className="text-blue-600 font-bold text-lg">{initials}</span>
  </div>
);

// Info Row Component
const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 py-2">
    <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg">
      <Icon className="w-4 h-4 text-gray-600" />
    </div>
    <div className="flex-1">
      <span className="text-sm text-gray-500">{label}</span>
      <p className="font-medium text-gray-800">{value}</p>
    </div>
  </div>
);

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
    approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
    rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' }
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

// Action Button Component
const ActionButton = ({
  variant = 'primary',
  icon: Icon,
  label,
  onClick
}) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${variants[variant]}`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {label}
    </motion.button>
  );
};

// Contact Info Component
const ContactInfo = ({ email, phone }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 text-sm">
      <Mail className="w-4 h-4 text-gray-500" />
      <a href={`mailto:${email}`} className="text-blue-600 hover:underline">
        {email}
      </a>
    </div>
    <div className="flex items-center gap-2 text-sm">
      <Phone className="w-4 h-4 text-gray-500" />
      <a href={`tel:${phone}`} className="text-blue-600 hover:underline">
        {phone}
      </a>
    </div>
  </div>
);

// Additional Services Component
const AdditionalServices = ({ services }) => (
  <div className="mt-4">
    <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Services</h4>
    <div className="flex flex-wrap gap-2">
      {services.map((service, index) => (
        <span
          key={index}
          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
        >
          {service}
        </span>
      ))}
    </div>
  </div>
);

// ===== MAIN COMPONENT =====
const VenueBookingRequest = () => {
  const [bookingStatus, setBookingStatus] = useState('pending');
  const [showDetails, setShowDetails] = useState(false);

  // Booking data
  const bookingData = {
    venueName: "Royal Banquet Hall",
    customer: {
      name: "Ahmed Khan",
      initials: "AK",
      email: "ahmed@example.com",
      phone: "+92-300-1234567"
    },
    eventDetails: {
      type: "Wedding",
      date: "December 25, 2024",
      timeSlot: "Full Day (8 AM - 12 AM)",
      guests: "400 people",
      amount: "Rs. 225,000",
      services: ["Catering", "Stage & Lighting", "Decoration"]
    },
    timestamp: "2 minutes ago"
  };

  // Handle booking approval
  const handleApprove = () => {
    setBookingStatus('approved');
    // In a real app, you would make an API call here
    ('Booking approved');
  };

  // Handle booking rejection
  const handleReject = () => {
    setBookingStatus('rejected');
    // In a real app, you would make an API call here
    ('Booking rejected');
  };

  // Handle contact customer
  const handleContact = () => {
    // In a real app, this would trigger email/phone functionality
    ('Contact customer');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-lg"
    >
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Venue Finder</h1>
        <p className="text-gray-600">Manage your booking requests and updates</p>
      </div>

      {/* Main Card */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {/* Card Header */}
        <div className="bg-blue-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800">BOOKING REQUEST</h2>
              <h3 className="text-xl font-bold text-blue-700">{bookingData.venueName}</h3>
            </div>
            <div className="text-sm text-gray-500">{bookingData.timestamp}</div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6">
          {/* Notification Banner */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-800 mb-2">
              New Booking Request from {bookingData.customer.name}
            </h4>
            <p className="text-gray-600">
              A customer has requested to book your venue for their wedding event.
              Please review the details and respond within 24 hours.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Customer Info */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="lg:col-span-1 space-y-4"
            >
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <UserAvatar initials={bookingData.customer.initials} />
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-800">
                    {bookingData.customer.name}
                  </h3>
                  <ContactInfo
                    email={bookingData.customer.email}
                    phone={bookingData.customer.phone}
                  />
                </div>
                <StatusBadge status={bookingStatus} />
              </div>
            </motion.div>

            {/* Middle Column - Event Details */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow
                  icon={Calendar}
                  label="Event Type"
                  value={bookingData.eventDetails.type}
                />
                <InfoRow
                  icon={Calendar}
                  label="Event Date"
                  value={bookingData.eventDetails.date}
                />
                <InfoRow
                  icon={Clock}
                  label="Time Slot"
                  value={bookingData.eventDetails.timeSlot}
                />
                <InfoRow
                  icon={Users}
                  label="Expected Guests"
                  value={bookingData.eventDetails.guests}
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <InfoRow
                  icon={DollarSign}
                  label="Total Amount"
                  value={
                    <span className="text-2xl font-bold text-blue-700">
                      {bookingData.eventDetails.amount}
                    </span>
                  }
                />
              </div>

              <AdditionalServices services={bookingData.eventDetails.services} />
            </div>
          </div>

          {/* Action Buttons */}
          <motion.div
            className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-gray-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <ActionButton
              variant="danger"
              icon={XCircle}
              label="Reject Request"
              onClick={handleReject}
            />

            <div className="flex-1"></div>

            <ActionButton
              variant="outline"
              label="Contact Customer"
              onClick={handleContact}
            />

            <ActionButton
              variant="primary"
              icon={CheckCircle}
              label="Approve Booking"
              onClick={handleApprove}
            />
          </motion.div>

          {/* View Details Toggle */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              <MoreVertical className="w-4 h-4" />
              {showDetails ? 'Hide Full Details' : 'View Full Details'}
            </button>

            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-600"
              >
                <p>Additional booking details, terms & conditions, and venue specifications would appear here.</p>
                <p className="mt-2">Review all details carefully before approving the booking.</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-4 text-center text-sm text-gray-500">
        <p>Please respond to booking requests within 24 hours to maintain good customer service.</p>
      </div>
    </motion.div>
  );
};

export default VenueBookingRequest;