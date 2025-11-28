import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useAnimation } from "framer-motion";
import ButtonNav from "./ButtonNav";

const Navbar = () => {
  const controls = useAnimation();
  const [lastScrollY, setLastScrollY] = useState(0);

  const handleScroll = () => {
    if (window.scrollY > lastScrollY) {
      // Scroll Down → Hide
      controls.start({
        y: -80,
        opacity: 0,
        transition: { duration: 0.4, ease: "easeInOut" },
      });
    } else {
      // Scroll Up → Show
      controls.start({
        y: 0,
        opacity: 1,
        transition: { duration: 0.4, ease: "easeInOut" },
      });
    }

    setLastScrollY(window.scrollY);
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <motion.nav
      animate={controls}
      initial={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 w-full bg-white/90 backdrop-blur-lg shadow-md z-50"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <h1 className="text-2xl font-bold text-purple-700">Venue Finder</h1>

        {/* Menu Items */}
        <div className="flex gap-6 text-gray-700 font-medium">
          <Link to="/" className="hover:text-purple-600 transition">
            Home
          </Link>
          <Link to="/venues" className="hover:text-purple-600 transition">
            Browse Venues
          </Link>
          <Link to="/about" className="hover:text-purple-600 transition">
            About
          </Link>

          <Link to="/signin">
            <ButtonNav name="Sign Up" />
          </Link>

          <Link to="/login">
            <ButtonNav name="Log In" />
          </Link>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
