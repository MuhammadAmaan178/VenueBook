import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../contexts/AuthContext';

const DashboardLayout = ({ children }) => {
    // Fallback if useAuth is not defined or user is not logged in
    const auth = useAuth ? useAuth() : {};
    const user = auth.user || { name: 'Owner' };

    return (
        <div className="flex">
            <Sidebar />
            <div className="flex-1 p-6 bg-gray-50 min-h-screen">
                <Header userName={user.name || 'Owner'} />
                <div className="mt-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;
