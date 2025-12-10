// components/AccountTypeCard.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, X, Shield, Calendar, User } from 'lucide-react';

const AccountTypeCard = ({ user }) => {
  const [showDetails, setShowDetails] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const accountType = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Customer';

  return (
    <>
      <div className="bg-white rounded-lg border shadow-sm p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Status</h3>

        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded border border-purple-200"
          >
            <div>
              <div className="font-medium text-gray-700">{accountType} Account</div>
              <div className="text-sm text-gray-500">Primary</div>
            </div>
            <CheckCircle className="text-green-500" size={20} />
          </motion.div>

          <div className="space-y-3">
            <div className="p-3 border rounded">
              <div className="text-sm text-gray-500">Member Since</div>
              <div className="font-medium text-gray-800">{formatDate(user?.created_at)}</div>
            </div>

            <div className="p-3 border rounded bg-blue-50 border-blue-100">
              <div className="text-sm text-gray-500">Status</div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <span className="font-medium text-gray-800">Active</span>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowDetails(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2.5 rounded hover:from-purple-700 hover:to-blue-700 transition-all text-sm font-medium shadow-md"
          >
            View Details
          </motion.button>
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Account Details</h3>
              <button onClick={() => setShowDetails(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <User className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-800">Account Type</div>
                  <div className="text-sm text-gray-600">{accountType} Account</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border">
                <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-800">Account Status</div>
                  <div className="text-sm text-gray-600 flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                    Active & Verified
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border">
                <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-800">Member Since</div>
                  <div className="text-sm text-gray-600">{formatDate(user?.created_at)}</div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm font-medium text-blue-800 mb-1">User ID</div>
                <div className="text-xs text-blue-600 font-mono">{user?.user_id || 'N/A'}</div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-sm font-medium text-yellow-800 mb-1">Account Privileges</div>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>• Book venues and events</li>
                  <li>• Manage bookings</li>
                  <li>• Leave reviews</li>
                  {user?.role === 'owner' && <li>• Manage owned venues</li>}
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowDetails(false)}
              className="w-full mt-6 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default AccountTypeCard;