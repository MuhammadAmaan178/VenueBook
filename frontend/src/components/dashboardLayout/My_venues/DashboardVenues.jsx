import React from 'react';
import Sidebar from '../Sidebar';
import Header from '../Header';
import VenuesPage from './VenuesPage';
import { useAuth } from '../../../contexts/AuthContext';

const DashboardVenues = () => {
    const auth = useAuth ? useAuth() : {};
    const user = auth.user || { name: 'Owner' };

    return (
        <div className="flex">
            <Sidebar />
            <div className="flex-1 p-6 bg-gray-50 min-h-screen">
                <Header userName={user.name || 'Owner'} />
                <div className="mt-6">
                    <VenuesPage />
                </div>
            </div>
        </div>
    );
};

export default DashboardVenues;
