import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer';
import { Building2, LayoutDashboard, Calendar, Star, Settings, LogOut, Shield, CheckCircle, XCircle } from 'lucide-react';

const UserProfile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token || !user) return;

                const userId = user.user_id || user.id;
                const response = await fetch(`http://localhost:5000/api/users/${userId}/profile`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setProfileData(data);
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchProfileData();
        }
    }, [user]);

    if (!user) {
        navigate('/login');
        return null;
    }

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    // Role badge styling
    const getRoleBadge = () => {
        const badges = {
            admin: 'bg-red-100 text-red-800 border-red-200',
            owner: 'bg-purple-100 text-purple-800 border-purple-200',
            user: 'bg-blue-100 text-blue-800 border-blue-200'
        };
        return badges[user.role] || badges.user;
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />

            <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-24">
                {/* Profile Header */}
                <div className="bg-white rounded-xl shadow-sm border p-8 mb-6">
                    <div className="flex items-center gap-6">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>

                        {/* User Info */}
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.name || 'User'}</h1>
                            <p className="text-gray-600 mb-3">📧 {user.email}</p>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getRoleBadge()}`}>
                                {user.role === 'admin' ? '⚙️ Administrator' : user.role === 'owner' ? '🏢 Venue Owner' : '👤 User'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions - Role-Based */}
                <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Owner Dashboard Button - Owner Only */}
                        {user.role === 'owner' && (
                            <button
                                onClick={() => navigate('/owner/dashboard')}
                                className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                            >
                                <Building2 size={24} />
                                <div className="text-left">
                                    <div className="font-semibold">Owner Dashboard</div>
                                    <div className="text-sm text-purple-100">Manage your venues</div>
                                </div>
                            </button>
                        )}

                        {/* Admin Panel Button - Admin Only */}
                        {user.role === 'admin' && (
                            <button
                                onClick={() => navigate('/admin/dashboard')}
                                className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg"
                            >
                                <LayoutDashboard size={24} />
                                <div className="text-left">
                                    <div className="font-semibold">Admin Panel</div>
                                    <div className="text-sm text-red-100">Manage platform</div>
                                </div>
                            </button>
                        )}

                        {/* Regular User - Show My Bookings and Browse Venues */}
                        {user.role !== 'owner' && user.role !== 'admin' && (
                            <>
                                <button
                                    onClick={() => navigate('/booking-request')}
                                    className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all"
                                >
                                    <Calendar size={24} className="text-purple-600" />
                                    <div className="text-left">
                                        <div className="font-semibold text-gray-900">My Bookings</div>
                                        <div className="text-sm text-gray-600">View your reservations</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => navigate('/venues')}
                                    className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
                                >
                                    <Building2 size={24} className="text-blue-600" />
                                    <div className="text-left">
                                        <div className="font-semibold text-gray-900">Browse Venues</div>
                                        <div className="text-sm text-gray-600">Find perfect venues</div>
                                    </div>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Account Information */}
                <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Account Information</h2>

                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading profile...</div>
                    ) : (
                        <div className="space-y-4">
                            {/* Common fields for all users */}
                            <div className="flex justify-between items-center py-3 border-b">
                                <span className="text-gray-600">Name</span>
                                <span className="font-semibold text-gray-900">{profileData?.name || user.name || 'Not set'}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b">
                                <span className="text-gray-600">Email</span>
                                <span className="font-semibold text-gray-900">{profileData?.email || user.email}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b">
                                <span className="text-gray-600">Phone</span>
                                <span className="font-semibold text-gray-900">{profileData?.phone || 'Not set'}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b">
                                <span className="text-gray-600">Role</span>
                                <span className="font-semibold text-gray-900 capitalize">{user.role}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b">
                                <span className="text-gray-600">Member Since</span>
                                <span className="font-semibold text-gray-900">{formatDate(profileData?.created_at)}</span>
                            </div>

                            {/* Owner-specific fields */}
                            {user.role === 'owner' && profileData && (
                                <>
                                    <div className="pt-4 border-t-2 border-purple-200">
                                        <h3 className="text-lg font-bold text-purple-900 mb-3">Business Information</h3>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b">
                                        <span className="text-gray-600">Business Name</span>
                                        <span className="font-semibold text-gray-900">{profileData.business_name || 'Not set'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b">
                                        <span className="text-gray-600">CNIC</span>
                                        <span className="font-semibold text-gray-900">{profileData.cnic || 'Not set'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3">
                                        <span className="text-gray-600">Verification Status</span>
                                        <span className={`flex items-center gap-2 font-semibold ${profileData.verification_status === 'verified'
                                            ? 'text-green-600'
                                            : profileData.verification_status === 'pending'
                                                ? 'text-yellow-600'
                                                : 'text-red-600'
                                            }`}>
                                            {profileData.verification_status === 'verified' && <CheckCircle size={18} />}
                                            {profileData.verification_status === 'rejected' && <XCircle size={18} />}
                                            {profileData.verification_status === 'pending' && <Shield size={18} />}
                                            <span className="capitalize">{profileData.verification_status || 'Not verified'}</span>
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Account Actions */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Account Actions</h2>
                    <div className="space-y-3">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                            <LogOut size={20} />
                            Logout
                        </button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default UserProfile;
