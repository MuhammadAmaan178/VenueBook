// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Homepage from "./components/home/home.jsx";
import Login from "./authentication/log_in.jsx";
import Signup from "./authentication/sign_up.jsx";
import Venues from "./components/venues/Venues.jsx";
import VenueDetails from "./components/DetailsVenue/Detailsvenue.jsx";
import VenueBookingForm from "./components/VenueBookingForm/VenueBookingForm.jsx";
import VenueBookingRequest from "./components/VenueBookingRequest/VenueBookingRequest.jsx";
import OwnerPanel from "./components/Profile/OwnerPanel.jsx";
import AdminDashboard from "./components/dashboardLayout/AdminDashboard";
import Dashboard from "./components/dashboardLayout/Dashboard";
import DashboardLayout from "./components/dashboardLayout/DashboardLayout";
import VenuesPage from "./components/dashboardLayout/My_venues/VenuesPage";
import BookingsPage from "./components/dashboardLayout/Bookings/BookingsPage";
import PaymentsPage from "./components/dashboardLayout/Payments/PaymentsPage";
import ReviewsPage from "./components/dashboardLayout/Reviews/ReviewsPage";
import AnalyticsPage from "./components/dashboardLayout/Analytics/AnalyticsPage";
import OwnersPage from "./components/dashboardLayout/Owners/OwnersPage";
import AdminVenuesPage from "./components/dashboardLayout/Admin/AdminVenuesPage";
import AdminBookingsPage from "./components/dashboardLayout/Admin/AdminBookingsPage";
import AdminPaymentsPage from "./components/dashboardLayout/Admin/AdminPaymentsPage";
import AdminReviewsPage from "./components/dashboardLayout/Admin/AdminReviewsPage";
import AdminAnalyticsPage from "./components/dashboardLayout/Admin/AdminAnalyticsPage";
import AdminLogsPage from "./components/dashboardLayout/Admin/AdminLogsPage";
import AdminUsersPage from "./components/dashboardLayout/Admin/AdminUsersPage";
import UserProfile from "./components/Profile/UserProfile";
import UserBookingsPage from "./components/Profile/UserBookingsPage";








import { SocketProvider } from "./contexts/SocketContext";

import FloatingChat from "./components/Chat/ChatComponent";

const App = () => {
  return (
    <BrowserRouter>
      <SocketProvider>
        <FloatingChat />
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/venues" element={<Venues />} />
          <Route path="/venues/:id" element={<VenueDetails />} />
          <Route path="/details" element={<VenueDetails />} />
          <Route path="/booking-form" element={<VenueBookingForm />} />
          <Route path="/booking-request" element={<VenueBookingRequest />} />
          <Route path="/owner" element={<OwnerPanel />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/my-bookings" element={<UserBookingsPage />} />
          <Route path="/owner/dashboard" element={<Dashboard />} />
          <Route path="/owner/venues" element={<DashboardLayout><VenuesPage /></DashboardLayout>} />
          <Route path="/owner/bookings" element={<DashboardLayout><BookingsPage /></DashboardLayout>} />
          <Route path="/owner/payments" element={<DashboardLayout><PaymentsPage /></DashboardLayout>} />
          <Route path="/owner/reviews" element={<DashboardLayout><ReviewsPage /></DashboardLayout>} />
          <Route path="/owner/analytics" element={<DashboardLayout><AnalyticsPage /></DashboardLayout>} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<DashboardLayout><AdminDashboard /></DashboardLayout>} />
          <Route path="/admin/users" element={<DashboardLayout><AdminUsersPage /></DashboardLayout>} />
          <Route path="/admin/venues" element={<DashboardLayout><AdminVenuesPage /></DashboardLayout>} />
          <Route path="/admin/bookings" element={<DashboardLayout><AdminBookingsPage /></DashboardLayout>} />
          <Route path="/admin/payments" element={<DashboardLayout><AdminPaymentsPage /></DashboardLayout>} />
          <Route path="/admin/reviews" element={<DashboardLayout><AdminReviewsPage /></DashboardLayout>} />
          <Route path="/admin/analytics" element={<DashboardLayout><AdminAnalyticsPage /></DashboardLayout>} />
          <Route path="/admin/owners" element={<DashboardLayout><OwnersPage /></DashboardLayout>} />
          <Route path="/admin/logs" element={<DashboardLayout><AdminLogsPage /></DashboardLayout>} />

          {/* Redirects for legacy/short routes */}
          <Route path="/bookings" element={<Navigate to="/owner/bookings" replace />} />
          <Route path="/payments" element={<Navigate to="/owner/payments" replace />} />
          <Route path="/reviews" element={<Navigate to="/owner/reviews" replace />} />
          <Route path="/analytics" element={<Navigate to="/owner/analytics" replace />} />

          <Route path="/my-venues" element={<Navigate to="/owner/venues" replace />} />
        </Routes>
      </SocketProvider>
    </BrowserRouter>
  );
};

export default App;