// components/OwnerPanel.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer';
import UserHeader from './UserHeader';
import AccountTypeCard from './AccountTypeCard';
import PersonalInfoTable from './PersonalInfoTable';

const OwnerPanel = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Redirect if not authenticated
  if (!isAuthenticated || !user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 pt-20 pb-12">
        <div className="max-w-5xl mx-auto px-4">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="mb-6 text-blue-600 hover:text-blue-800 font-medium flex items-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </button>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <UserHeader user={user} />
          </motion.div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="lg:col-span-2"
            >
              <PersonalInfoTable user={user} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              <AccountTypeCard user={user} />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="mt-6 bg-white rounded-lg border p-6"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Bookings Information</h2>
            <div className="text-gray-500 text-center py-6">
              <p>No bookings information available</p>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OwnerPanel;