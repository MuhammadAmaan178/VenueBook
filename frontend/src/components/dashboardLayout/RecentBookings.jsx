// components/RecentBookings.jsx
import React from 'react';
import { Eye, CheckCircle } from 'lucide-react';

const RecentBookings = ({ bookings }) => {
  const columns = [
    "Booking ID", "Customer", "Venue", "Date", "Amount", "Status", "Actions"
  ];

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Recent Bookings</h2>
        <button className="text-blue-600 hover:text-blue-800 font-medium">
          View All →
        </button>
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
            {bookings.map((booking, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="py-4 px-4 font-medium">{booking.id}</td>
                <td className="py-4 px-4">{booking.customer}</td>
                <td className="py-4 px-4">{booking.venue}</td>
                <td className="py-4 px-4 text-gray-600">{booking.date}</td>
                <td className="py-4 px-4 font-medium text-green-600">
                  {booking.amount}
                </td>
                <td className="py-4 px-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex gap-2">
                    <button className="p-1 text-gray-600 hover:text-blue-600">
                      <Eye size={18} />
                    </button>
                    <button className="p-1 text-gray-600 hover:text-green-600">
                      <CheckCircle size={18} />
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

export default RecentBookings;