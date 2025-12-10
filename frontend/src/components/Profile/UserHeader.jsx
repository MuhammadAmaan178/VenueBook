// components/UserHeader.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, Calendar, User } from 'lucide-react';

const UserHeader = ({ user }) => {
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-start gap-4">
          {/* Profile Avatar */}
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold text-2xl shadow-lg">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div>
            <motion.h1
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold text-gray-900 mb-2"
            >
              {user?.name || 'User'}
            </motion.h1>

            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-1.5"
              >
                <Mail size={16} className="text-gray-400" />
                <span>{user?.email || 'N/A'}</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="flex items-center gap-1.5"
              >
                <Phone size={16} className="text-gray-400" />
                <span>{user?.phone || 'N/A'}</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-1.5"
              >
                <Calendar size={16} className="text-gray-400" />
                <span>Member since: {formatDate(user?.created_at)}</span>
              </motion.div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-md px-4 py-2"
        >
          <div className="flex items-center gap-2">
            <User size={16} className="text-purple-600" />
            <span className="font-medium text-purple-700 capitalize">{user?.role || 'Customer'}</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UserHeader;