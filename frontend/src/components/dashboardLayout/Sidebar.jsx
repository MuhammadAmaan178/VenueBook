// components/Sidebar.jsx (updated)
import React from 'react';
import {
  Home,
  Calendar,
  CreditCard,
  Star,
  BarChart3,
  LogOut,
  Building2,
  ArrowLeft,
  User
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth(); // Destruct user from useAuth
  const roleTitle = user?.role === 'admin' ? 'Admin Panel' : 'Owners Panel';

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const menuItems = [
    { icon: <Home size={20} />, label: "Dashboard", path: "/owner/dashboard", roles: ['owner'] },
    { icon: <Home size={20} />, label: "Dashboard", path: "/admin/dashboard", roles: ['admin'] },
    { icon: <Building2 size={20} />, label: "My Venues", path: "/owner/venues", roles: ['owner'] },
    { icon: <Calendar size={20} />, label: "Bookings", path: "/owner/bookings", roles: ['owner'] },
    { icon: <CreditCard size={20} />, label: "Payments", path: "/owner/payments", roles: ['owner'] },
    { icon: <Star size={20} />, label: "Reviews", path: "/owner/reviews", roles: ['owner'] },
    { icon: <BarChart3 size={20} />, label: "Analytics", path: "/owner/analytics", roles: ['owner'] },
    // Admin Only Items
    { icon: <User size={20} />, label: "All Users", path: "/admin/users", roles: ['admin'] },
    { icon: <Building2 size={20} />, label: "All Owners", path: "/admin/owners", roles: ['admin'] },
    { icon: <BarChart3 size={20} />, label: "Analytics", path: "/admin/analytics", roles: ['admin'] },
    { icon: <LogOut size={20} />, label: "System Logs", path: "/admin/logs", roles: ['admin'] },
  ];

  const userRole = user?.role || 'owner';
  const filteredMenu = menuItems.filter(item => item.roles.includes(userRole));

  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-8">{roleTitle}</h1>

      <nav className="space-y-2">
        {filteredMenu.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive(item.path)
              ? 'bg-gray-800 text-white'
              : 'hover:bg-gray-800 text-gray-300'
              }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-gray-700 space-y-2">
        <button
          onClick={() => navigate('/venues')}
          className="flex items-center gap-3 p-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors w-full"
        >
          <ArrowLeft size={20} />
          <span>Back to Venues</span>
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 p-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors w-full"
        >
          <LogOut size={20} />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;