import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Button from "./Button.jsx";
import CardHome from "./CardHome.jsx";
import StatCard from "./StatCard.jsx";
import TestimonialCard from "./TestimonialCard.jsx";
import Footer from "../Footer.jsx";
import Navbar from "../Navbar/Navbar.jsx";
import api from "../../services/api";

const Home = () => {
  const location = useLocation();
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [stats, setStats] = useState({});
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (location.state?.scrollToFooter) {
      const footer = document.getElementById('footer');
      if (footer) {
        footer.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        ('Fetching reviews from API...');
        const response = await api.get('/api/venues/reviews/recent');
        ('Full API response:', response);
        ('Reviews array:', response.reviews);
        ('Reviews count:', response.count);
        setReviews(response.reviews || []);
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, []);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/api/venues/stats/public');
        setStats(response);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

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

      {/* Statistics Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          {loadingStats ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <StatCard
                icon="🏢"
                number={stats.total_venues || 0}
                label="Active Venues"
              />
              <StatCard
                icon="👥"
                number={stats.total_users || 0}
                label="Happy Users"
              />
              <StatCard
                icon="🤝"
                number={stats.total_owners || 0}
                label="Venue Owners"
              />
              <StatCard
                icon="⭐"
                number={stats.average_rating || 0}
                label="Average Rating"
              />
            </div>
          )}
        </div>
      </section>

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

      {/* What Customers Say */}
      <section className="py-16 bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              What Customers Say
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Don't just take our word for it - hear from our satisfied customers
            </p>
          </div>

          {loadingReviews ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {reviews.map((review, index) => (
                <TestimonialCard key={index} review={review} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No reviews available yet. Be the first to share your experience!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
