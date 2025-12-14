import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useAnimation } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";
import ButtonNav from "./ButtonNav";
import { Bell, Check, X, BellOff, MessageSquare } from 'lucide-react';
import { notificationService } from "../../services/api";

import ReviewSubmissionModal from "../dashboardLayout/modals/ReviewSubmissionModal";

const Navbar = () => {
  const controls = useAnimation();
  const [lastScrollY, setLastScrollY] = useState(0);
  const { user, logout, isAuthenticated } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  // Notification States
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef(null);

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedReviewBooking, setSelectedReviewBooking] = useState(null);

  const handleScroll = () => {
    // Only animate if the difference is significant to avoid thrashing
    if (Math.abs(window.scrollY - lastScrollY) < 5) return;

    if (window.scrollY > lastScrollY && window.scrollY > 80) {
      controls.start({ y: -80, opacity: 0, transition: { duration: 0.4 } });
    } else {
      controls.start({ y: 0, opacity: 1, transition: { duration: 0.4 } });
    }
    setLastScrollY(window.scrollY);
  };

  useEffect(() => {
    // Ensure animation is reset on mount
    controls.set({ y: 0, opacity: 1 });

    const onScroll = () => requestAnimationFrame(handleScroll);

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [lastScrollY, controls]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
    }
  }, [isAuthenticated, user]);

  // Real-time Notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (newNotification) => {
      // Add new notification to top of list
      setNotifications(prev => [newNotification, ...prev]);
      // Increment unread count
      setUnreadCount(prev => prev + 1);

      // Optional: Play sound or show toast
      // const audio = new Audio('/notification.mp3');
      // audio.play().catch(e => ('Audio play failed', e));
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = user.user_id || user.id; // handle inconsistency
      if (!userId) return;

      const data = await notificationService.getAll(userId, token);
      if (data && data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.notifications.filter(n => !n.is_read).length);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const handleMarkRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      await notificationService.markAsRead(id, token);
      // Optimistic update
      setNotifications(prev => prev.map(n =>
        n.id === id ? { ...n, is_read: 1 } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking read:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = user.user_id || user.id;
      await notificationService.markAllAsRead(userId, token);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all read:", error);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read first
    if (!notification.is_read) {
      handleMarkRead(notification.id);
    }

    // Check if it's a review request
    if (notification.booking_id && (
      notification.message.toLowerCase().includes('review') ||
      notification.title.toLowerCase().includes('experience')
    )) {
      setSelectedReviewBooking({
        booking_id: notification.booking_id,
        venue_name: notification.message.split(' at ')[1]?.split('?')[0] || 'Venue' // Robust extraction
      });
      setIsReviewModalOpen(true);
      setShowNotifications(false);
    }
    // Handle Venue Verification (Admin)
    else if (notification.type === 'verification' && notification.venue_id) {
      navigate('/admin/venues');
      setShowNotifications(false);
    }
    // Handle other types if needed (e.g., navigate to booking details)
    else if (notification.booking_id) {
      // navigate(`/bookings/${notification.booking_id}`); // Example
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <motion.nav
        animate={controls}
        initial={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 w-full bg-white/90 backdrop-blur-lg shadow-sm z-50 border-b border-gray-100"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2">
          {/* Logo with Profile Image */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user && (
              <button
                onClick={() => navigate('/profile')}
                className="group flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all hover:scale-105"
                title={`${user.name}'s Profile`}
              >
                <span className="group-hover:hidden">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                <span className="hidden group-hover:block text-[10px] uppercase">View</span>
              </button>
            )}
            <Link to="/" className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-blue-700">
              Venue Finder
            </Link>
          </div>

          {/* Menu Items */}
          <div className="flex gap-6 items-center text-gray-600 font-medium">
            <Link to="/" className="hover:text-purple-700 transition-colors">Home</Link>
            <Link to="/venues" className="hover:text-purple-700 transition-colors">Browse Venues</Link>
            <button
              onClick={() => {
                const footer = document.getElementById('footer');
                if (footer) {
                  footer.scrollIntoView({ behavior: 'smooth' });
                } else {
                  navigate('/', { state: { scrollToFooter: true } });
                }
              }}
              className="hover:text-purple-700 transition-colors cursor-pointer font-medium bg-transparent border-none p-0"
            >
              About
            </button>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-4">
                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`relative p-2 rounded-full transition-all duration-200 ${showNotifications ? 'bg-purple-50 text-purple-600' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    <Bell size={22} className={showNotifications ? 'fill-current' : ''} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                      <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-white/50 backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-800 text-sm">Notifications</h3>
                          {unreadCount > 0 && <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount} new</span>}
                        </div>

                        {unreadCount > 0 && (
                          <button onClick={handleMarkAllRead} className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors">
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                              <BellOff size={20} className="text-gray-400" />
                            </div>
                            <p className="text-gray-500 text-sm font-medium">No updates yet</p>
                            <p className="text-gray-400 text-xs mt-1">We'll let you know when something arrives.</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-50">
                            {notifications.map(n => (
                              <div
                                key={n.id}
                                onClick={() => handleNotificationClick(n)}
                                className={`p-4 hover:bg-gray-50/80 transition-colors cursor-pointer group relative ${!n.is_read ? 'bg-blue-50/40' : ''}`}
                              >
                                <div className="flex gap-3">
                                  <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${!n.is_read ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                    <MessageSquare size={14} className={!n.is_read ? 'fill-current' : ''} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-0.5">
                                      <h4 className={`text-sm truncate pr-6 ${!n.is_read ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                                        {n.title}
                                      </h4>
                                      <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2 flex-shrink-0">{formatDate(n.created_at)}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{n.message}</p>
                                  </div>
                                </div>

                                {!n.is_read && (
                                  <button
                                    onClick={(e) => handleMarkRead(n.id, e)}
                                    className="absolute top-4 right-3 p-1.5 rounded-full text-blue-500 hover:bg-blue-100 opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                                    title="Mark as read"
                                  >
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Footer decoration */}
                      <div className="h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 opacity-80"></div>
                    </div>
                  )}
                </div>

                <div onClick={handleLogout} className="cursor-pointer">
                  <ButtonNav name="Logout" />
                </div>
              </div>
            ) : (
              <>
                <Link to="/signup">
                  <ButtonNav name="Sign Up" />
                </Link>
                <Link to="/login">
                  <ButtonNav name="Log In" />
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Global Review Modal */}
      <ReviewSubmissionModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        bookingId={selectedReviewBooking?.booking_id}
        venueName={selectedReviewBooking?.venue_name}
        onSuccess={() => {
          // Optional: Refresh notifications or show success message
        }}
      />
    </>
  );
};

export default Navbar;
