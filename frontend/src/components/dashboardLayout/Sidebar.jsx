// components/dashboardLayout/Sidebar.jsx
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
  User,
  Activity,
  Users,
  FileText
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const roleTitle = user?.role === 'admin' ? 'Admin Panel' : 'Owner Panel';

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const menuItems = [
    // Owner Items
    { icon: <Home size={20} />, label: "Dashboard", path: "/owner/dashboard", roles: ['owner'] },
    { icon: <Building2 size={20} />, label: "My Venues", path: "/owner/venues", roles: ['owner'] },
    { icon: <Calendar size={20} />, label: "Bookings", path: "/owner/bookings", roles: ['owner'] },
    { icon: <CreditCard size={20} />, label: "Payments", path: "/owner/payments", roles: ['owner'] },
    { icon: <Star size={20} />, label: "Reviews", path: "/owner/reviews", roles: ['owner'] },
    { icon: <BarChart3 size={20} />, label: "Analytics", path: "/owner/analytics", roles: ['owner'] },

    // Admin Items
    { icon: <Home size={20} />, label: "Dashboard", path: "/admin/dashboard", roles: ['admin'] },
    { icon: <Users size={20} />, label: "All Users", path: "/admin/users", roles: ['admin'] },
    { icon: <User size={20} />, label: "All Owners", path: "/admin/owners", roles: ['admin'] },
    { icon: <Building2 size={20} />, label: "Venues", path: "/admin/venues", roles: ['admin'] },
    { icon: <Calendar size={20} />, label: "Bookings", path: "/admin/bookings", roles: ['admin'] },
    { icon: <CreditCard size={20} />, label: "Payments", path: "/admin/payments", roles: ['admin'] },
    { icon: <Star size={20} />, label: "Reviews", path: "/admin/reviews", roles: ['admin'] },
    { icon: <BarChart3 size={20} />, label: "Analytics", path: "/admin/analytics", roles: ['admin'] },
    { icon: <FileText size={20} />, label: "System Logs", path: "/admin/logs", roles: ['admin'] },
  ];

  const userRole = user?.role || 'owner';
  const filteredMenu = menuItems.filter(item => item.roles.includes(userRole));

  // Define theme colors based on role
  const isOwner = userRole === 'owner';
  const theme = {
    gradientStart: isOwner ? 'from-blue-500/10' : 'from-red-500/10',
    textGradient: isOwner ? 'from-blue-400' : 'from-red-400',
    activeBg: isOwner ? 'bg-blue-600' : 'bg-red-600',
    activeShadow: isOwner ? 'shadow-blue-900/50' : 'shadow-red-900/50',
    hoverText: isOwner ? 'group-hover:text-blue-400' : 'group-hover:text-red-400',
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-72 bg-[#0f172a] text-white min-h-screen p-6 flex flex-col shadow-2xl relative overflow-hidden">
      {/* Subtle decorative glow */}
      <div className={`absolute top-0 left-0 w-full h-32 bg-gradient-to-b ${theme.gradientStart} to-transparent pointer-events-none`}></div>

      <div className="mb-10 relative z-10 pl-2">
        <h1 className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${theme.textGradient} to-white`}>
          {roleTitle}
        </h1>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">Management Console</p>
      </div>

      <nav className="space-y-1.5 flex-1 relative z-10 overflow-y-auto mb-6 pr-2 custom-scrollbar">
        {filteredMenu.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className={`flex items-center gap-3.5 p-3.5 rounded-xl transition-all duration-200 group ${isActive(item.path)
              ? `${theme.activeBg} text-white shadow-lg ${theme.activeShadow} translate-x-1`
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-white hover:translate-x-1'
              }`}
          >
            <div className={`${isActive(item.path) ? 'text-white' : `text-slate-500 ${theme.hoverText}`} transition-colors`}>
              {item.icon}
            </div>
            <span className="font-medium text-sm">{item.label}</span>
            {isActive(item.path) && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
            )}
          </Link>
        ))}
      </nav>

      <div className="pt-6 border-t border-slate-800 space-y-2 relative z-10">
        <button
          onClick={() => navigate('/venues')}
          className="flex items-center gap-3 p-3 text-slate-400 hover:bg-slate-800 rounded-xl transition-all w-full group hover:text-white"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium text-sm">Back to Venues</span>
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 p-3 text-slate-400 hover:bg-red-900/20 hover:text-red-400 rounded-xl transition-all w-full group"
        >
          <LogOut size={18} className="group-hover:rotate-12 transition-transform" />
          <span className="font-medium text-sm">Log out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;