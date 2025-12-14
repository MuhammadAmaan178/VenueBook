import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer';
import {
    Building2, LayoutDashboard, Calendar, Star, Settings, LogOut, Shield,
    CheckCircle, XCircle, User, Mail, Phone, CalendarDays, MapPin, Edit2, Camera, AlertCircle
} from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

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
                const response = await fetch(`${API_BASE_URL}/api/users/${userId}/profile`, {
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
            admin: 'bg-red-50 text-red-700 border-red-200 ring-red-100',
            owner: 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-100',
            user: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-100'
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

            <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-12">
                {/* Profile Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                        {/* Avatar */}
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-5xl font-bold shadow-xl ring-4 ring-white">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.name || 'User'}</h1>
                            <div className="flex flex-col md:flex-row items-center gap-4 text-gray-600 mb-4 justify-center md:justify-start">
                                <span className="flex items-center gap-2">
                                    <Mail size={18} /> {user.email}
                                </span>
                            </div>
                            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold border ring-1 ${getRoleBadge()}`}>
                                {user.role === 'admin' ? '⚙️ Administrator' : user.role === 'owner' ? '🏢 Venue Owner' : '👤 Customer'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - User Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Account Information */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <User size={20} className="text-blue-600" />
                                    Account Information
                                </h2>
                            </div>

                            <div className="p-6">
                                {loading ? (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-gray-500">Full Name</label>
                                                <div className="text-gray-900 font-medium">{profileData?.name || user.name || 'Not set'}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-gray-500">Email Address</label>
                                                <div className="text-gray-900 font-medium">{profileData?.email || user.email}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-gray-500">Phone Number</label>
                                                <div className="text-gray-900 font-medium flex items-center gap-2">
                                                    <Phone size={16} className="text-gray-400" />
                                                    {profileData?.phone || 'Not provided'}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-gray-500">Member Since</label>
                                                <div className="text-gray-900 font-medium flex items-center gap-2">
                                                    <CalendarDays size={16} className="text-gray-400" />
                                                    {formatDate(profileData?.created_at)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Owner Specific Info */}
                                        {user.role === 'owner' && profileData && (
                                            <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100 mt-6">
                                                <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-4 border-b border-blue-200 pb-2">Business Details</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-500">Business Name</label>
                                                        <div className="text-gray-900 font-medium mt-1">{profileData.business_name || 'Not set'}</div>
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-500">CNIC Number</label>
                                                        <div className="text-gray-900 font-medium mt-1 font-mono text-sm">{profileData.cnic || 'Not set'}</div>
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className="text-sm font-medium text-gray-500">Verification Status</label>
                                                        <div className="mt-1">
                                                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${profileData.verification_status === 'verified' ? 'bg-green-100 text-green-700' :
                                                                profileData.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-red-100 text-red-700'
                                                                }`}>
                                                                {profileData.verification_status === 'verified' && <CheckCircle size={14} />}
                                                                {profileData.verification_status === 'rejected' && <XCircle size={14} />}
                                                                {profileData.verification_status === 'pending' && <Shield size={14} />}
                                                                <span className="capitalize">{profileData.verification_status || 'Not verified'}</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Actions */}
                    <div className="space-y-6">
                        {/* Quick Actions Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <LayoutDashboard size={20} className="text-blue-600" />
                                    Quick Actions
                                </h2>
                            </div>
                            <div className="p-6 space-y-3">
                                {/* Role Specific Actions */}
                                {user.role === 'owner' && (
                                    <button
                                        onClick={() => navigate('/owner/dashboard')}
                                        className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <Building2 size={20} />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-semibold text-gray-900">Owner Dashboard</div>
                                                <div className="text-xs text-gray-500">Manage your venues</div>
                                            </div>
                                        </div>
                                        <span className="text-gray-300 group-hover:text-blue-500 transition-colors">→</span>
                                    </button>
                                )}

                                {user.role === 'admin' && (
                                    <button
                                        onClick={() => navigate('/admin/dashboard')}
                                        className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-red-500 hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-colors">
                                                <Shield size={20} />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-semibold text-gray-900">Admin Panel</div>
                                                <div className="text-xs text-gray-500">System management</div>
                                            </div>
                                        </div>
                                        <span className="text-gray-300 group-hover:text-red-500 transition-colors">→</span>
                                    </button>
                                )}

                                {user.role !== 'owner' && user.role !== 'admin' && (
                                    <>
                                        <button
                                            onClick={() => navigate('/my-bookings')}
                                            className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                    <Calendar size={20} />
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-semibold text-gray-900">My Bookings</div>
                                                    <div className="text-xs text-gray-500">View reservations</div>
                                                </div>
                                            </div>
                                            <span className="text-gray-300 group-hover:text-blue-500 transition-colors">→</span>
                                        </button>

                                        <button
                                            onClick={() => navigate('/venues')}
                                            className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-500 hover:shadow-md transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                    <Building2 size={20} />
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-semibold text-gray-900">Browse Venues</div>
                                                    <div className="text-xs text-gray-500">Explore places</div>
                                                </div>
                                            </div>
                                            <span className="text-gray-300 group-hover:text-indigo-500 transition-colors">→</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Logout Section */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-red-100 text-red-600 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all font-semibold"
                            >
                                <LogOut size={20} />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default UserProfile;
