// components/Footer.jsx
export default function Footer() {
  return (
    <footer id="footer" className="bg-gray-900 text-gray-300 py-4">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top Section - Flex with space-between */}
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-4">
          {/* Left Side - Developers Team */}
          <div>
            <h2 className="text-xl font-bold text-white mb-3">👨‍💻 Developers Team</h2>
            <p className="text-gray-400">1. Muhammad Amaan</p>
            <p className="text-gray-400">2. Muhammad Nihal Sheikh</p>
            <p className="text-gray-400">3. Saad Baseer</p>
          </div>

          {/* Right Side - Contact Info */}
          <div>
            <h2 className="text-xl font-bold text-white mb-3">📞 Contact Us</h2>
            <p className="text-gray-400">Email: support@venuefinder.com</p>
            <p className="text-gray-400">Phone: +92-300-1234567</p>
          </div>
        </div>

        {/* Bottom Section - Copyright (Centered) */}
        <div className="border-t border-gray-700 pt-4">
          <p className="text-sm text-center text-gray-500">
            © 2025 Venue Finder | All Rights Reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
