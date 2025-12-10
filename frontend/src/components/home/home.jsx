import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Button from "./Button.jsx";
import CardHome from "./CardHome.jsx";
import Footer from "../Footer.jsx";
import Navbar from "../Navbar/Navbar.jsx";

const Home = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.state?.scrollToFooter) {
      const footer = document.getElementById('footer');
      if (footer) {
        footer.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]);

  return (
    <div className="w-full">
      <Navbar />
      {/* Hero Section */}
      <div className="bg-purple-300 py-20 text-center">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-4">
          FIND YOUR PERFECT VENUE
        </h1>
        <p className="text-gray-700 text-lg mb-6">
          Discover and book amazing venues for your special events in Karachi
        </p>

        <Link to="/venues">
          <Button />
        </Link>
      </div>

      {/* Why Choose Us */}
      <section className="py-16">
        <h2 className="text-center text-3xl font-bold text-gray-800 mb-12">
          Why Choose Us?
        </h2>

        <div className="max-w-3xl flex gap-8 flex-wrap justify-center mx-auto">
          {/* Easy Search */}
          <CardHome
            icon="🔍"
            title="Easy Search"
            description="Find venues quickly with our user-friendly search and filter options"
          />
          {/* Best Prices */}
          <CardHome
            icon="💰"
            title="Best Prices"
            description="Compare prices and facilities to get the best deal for your event"
          />

          {/* Quick Booking */}
          <CardHome
            icon="⚡"
            title="Quick Booking"
            description="Book your venue online in just a few clicks with instant
              confirmation"
          />

          {/* Verified Reviews */}
          <CardHome
            icon="⭐"
            title="Verified Reviews"
            description="Read authentic reviews from real customers to make informed
              decisions"
          />
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
