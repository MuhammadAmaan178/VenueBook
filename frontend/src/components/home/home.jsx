import React from "react";
import { Link } from "react-router-dom";
import Button from "./Button.jsx";
import CardHome from "./CardHome.jsx";

const Home = () => {
  return (
    <div className="w-full">
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
      <footer className="bg-gray-900 text-gray-300 text-center py-10">
        <p>📞 Contact Us</p>
        <p>Email: support@venuefinder.com</p>
        <p>Phone: +92-300-1234567</p>

        <div className="mt-5">
          <p className="font-semibold">👨‍💻 Developers Team</p>
          <p>1. Muhammad Amaan</p>
          <p>2. Muhammad Nihal Sheikh</p>
          <p>3. Saad Baseer</p>
        </div>

        <p className="text-sm mt-6">
          © 2025 Venue Finder | All Rights Reserved
        </p>
      </footer>
    </div>
  );
};

export default Home;
