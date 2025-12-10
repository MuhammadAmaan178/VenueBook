import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useAnimation } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import ButtonNav from "./ButtonNav";
import { Bell, Check, X } from 'lucide-react';
import { notificationService } from "../../services/api";

const Navbar = () => {
  const controls = useAnimation();
  const [lastScrollY, setLastScrollY] = useState(0);
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Notification States
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef(null);

  const handleScroll = () => {
    if (window.scrollY > lastScrollY) {
      controls.start({ y: -80, opacity: 0, transition: { duration: 0.4 } });
    } else {
      controls.start({ y: 0, opacity: 1, transition: { duration: 0.4 } });
    }
    setLastScrollY(window.scrollY);
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Fetch Notifications
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
    }
  }, [isAuthenticated, user]);

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

  const handleMarkRead = async (id) => {
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

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <motion.nav
      animate={controls}
      initial={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 w-full bg-white/90 backdrop-blur-lg shadow-md z-50"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2">
        {/* Logo with Profile Image */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user && (
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold text-sm hover:scale-110 transition-transform shadow-md"
              title={`${user.name}'s Profile`}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </button>
          )}
          <h1 className="text-2xl font-bold text-purple-700">Venue Finder</h1>
        </div>

        {/* Menu Items */}
        <div className="flex gap-6 items-center text-gray-700 font-medium">
          <Link to="/" className="hover:text-purple-600 transition">Home</Link>
          <Link to="/venues" className="hover:text-purple-600 transition">Browse Venues</Link>
          <button
            onClick={() => {
              const footer = document.getElementById('footer');
              if (footer) {
                footer.scrollIntoView({ behavior: 'smooth' });
              } else {
                navigate('/', { state: { scrollToFooter: true } });
              }
            }}
            className="hover:text-purple-600 transition cursor-pointer font-medium bg-transparent border-none p-0"
          >
            About
          </button>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <Bell size={24} className="text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    <div className="p-3 border-b flex justify-between items-center bg-gray-50">
                      <h3 className="font-semibold text-gray-700">Notifications</h3>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:underline">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 text-sm">No notifications</div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            className={`p-4 border-b hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h4 className={`text-sm ${!n.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                  {n.title}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                                <p className="text-xs text-gray-400 mt-2">{formatDate(n.created_at)}</p>
                              </div>
                              {!n.is_read && (
                                <button
                                  onClick={() => handleMarkRead(n.id)}
                                  className="p-1 hover:bg-blue-100 rounded text-blue-600"
                                  title="Mark as read"
                                >
                                  <Check size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button onClick={handleLogout}>
                <ButtonNav name="Logout" />
              </button>
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
  );
};

export default Navbar;
