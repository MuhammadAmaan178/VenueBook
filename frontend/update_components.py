"""
Script to update frontend dashboard components to use correct API routes
"""
import os
import re

# Define the updates needed for each file
updates = {
    'src/components/dashboardLayout/Bookings/BookingsPage.jsx': {
        'import_add': "import { ownerService, adminService } from '../../../services/api';",
        'fetch_replace': {
            'old': """                const ownerId = user?.role === 'admin' ? null : (user?.user_id || user?.id || 1);
                const query = ownerId ? `?owner_id=${ownerId}` : '';
                const response = await fetch(`http://localhost:5000/api/bookings${query}`);
                const data = await response.json();

                if (response.ok) {
                    setBookings(data.bookings || []);
                }""",
            'new': """                const token = localStorage.getItem('token');
                
                if (!token || !user) {
                    console.error('No authentication token or user found');
                    setLoading(false);
                    return;
                }

                let data;
                if (user.role === 'admin') {
                    data = await adminService.getBookings({}, token);
                } else if (user.role === 'owner') {
                    const ownerId = user.owner_id || user.user_id;
                    data = await ownerService.getBookings(ownerId, {}, token);
                } else {
                    console.error('Invalid user role');
                    setLoading(false);
                    return;
                }

                setBookings(data.bookings || []);"""
        }
    }
}

print("Frontend update script created. Run with Python to update files.")
print("Note: This is a template. Actual updates will be done via file edits.")
