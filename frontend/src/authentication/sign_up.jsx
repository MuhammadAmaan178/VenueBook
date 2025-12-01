import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

export default function Signup() {
  const [userType, setUserType] = useState("customer");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    data.role = userType;
    console.log("FORM SUBMITTED:", data);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Back to Home Link */}
      <div className="absolute top-6 left-6">
        <Link 
          to="/" 
          className="text-gray-600 hover:text-gray-900 font-medium flex items-center"
        >
          ← Back to home
        </Link>
      </div>

      <div className="max-w-md w-full mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Account
          </h1>
          <p className="text-gray-600">
            Join us to find and book amazing venues
          </p>
        </div>

        {/* Signup Form */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                placeholder="Enter your full name"
                className="w-full border border-gray-300 px-4 py-3 rounded-lg 
                outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                transition duration-200"
                {...register("fullName", {
                  required: "Full name is required",
                  minLength: { value: 2, message: "Minimum 2 characters required" },
                })}
              />
              {errors.fullName && (
                <p className="text-red-600 text-sm mt-1">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full border border-gray-300 px-4 py-3 rounded-lg 
                outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                transition duration-200"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^\S+@\S+\.\S+$/,
                    message: "Invalid email format",
                  },
                })}
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full border border-gray-300 px-4 py-3 rounded-lg 
                outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                transition duration-200"
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 6, message: "Minimum 6 characters required" },
                })}
              />
              {errors.password && (
                <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="Enter your phone number"
                className="w-full border border-gray-300 px-4 py-3 rounded-lg 
                outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                transition duration-200"
                {...register("phone", {
                  pattern: {
                    value: /^03\d{9}$/,
                    message: "Phone must be like 03XXXXXXXXX",
                  },
                })}
              />
              {errors.phone && (
                <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>
              )}
            </div>

            {/* Register As */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Register As *
              </label>
              <div className="space-y-3">
                {/* Venue Owner Option */}
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="userType"
                    value="owner"
                    checked={userType === "owner"}
                    onChange={(e) => setUserType(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">
                    Venue Owner (List Venues)
                  </span>
                </label>

                {/* Customer Option */}
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="userType"
                    value="customer"
                    checked={userType === "customer"}
                    onChange={(e) => setUserType(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">
                    Customer (Book Venues)
                  </span>
                </label>
              </div>
            </div>

            {/* Business Information (Only for Venue Owners) */}
            {userType === "owner" && (
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Business Information
                </h3>
                
                {/* Business Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter business name"
                    className="w-full border border-gray-300 px-4 py-3 rounded-lg 
                    outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition duration-200"
                    {...register("businessName", {
                      required: userType === "owner" ? "Business name is required" : false,
                    })}
                  />
                  {errors.businessName && (
                    <p className="text-red-600 text-sm mt-1">{errors.businessName.message}</p>
                  )}
                </div>

                {/* CNIC Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CNIC Number *
                  </label>
                  <input
                    type="text"
                    placeholder="12345-1234567-1"
                    className="w-full border border-gray-300 px-4 py-3 rounded-lg 
                    outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition duration-200"
                    {...register("cnic", {
                      required: userType === "owner" ? "CNIC is required" : false,
                      pattern: {
                        value: /^\d{5}-\d{7}-\d{1}$/,
                        message: "CNIC must be like 12345-1234567-1",
                      },
                    })}
                  />
                  {errors.cnic && (
                    <p className="text-red-600 text-sm mt-1">{errors.cnic.message}</p>
                  )}
                </div>
              </div>
            )}

            {/* Create Account Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold 
              py-3 px-4 rounded-lg transition duration-200 focus:ring-2 focus:ring-blue-500 
              focus:ring-offset-2"
            >
              Create Account
            </button>
          </form>

          {/* Login Link */}
          <div className="text-center mt-6 pt-6 border-t border-gray-200">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link 
                to="/login" 
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Login Here
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>© 2025 Venue Finder | All Rights Reserved</p>
        </div>
      </div>
    </div>
  );
}

// In your Signup component
const onSubmit = async (data) => {
  try {
    const userData = {
      name: data.fullName,
      email: data.email,
      password: data.password,
      phone: data.phone,
      role: userType, // 'customer' or 'owner'
      business_name: userType === 'owner' ? data.businessName : null,
      cnic: userType === 'owner' ? data.cnic : null
    };

    const response = await authAPI.register(userData);
    console.log('Registration successful:', response);
    
    // Store token and redirect
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    // Redirect based on role
    if (response.user.role === 'owner') {
      window.location.href = '/owner/dashboard';
    } else {
      window.location.href = '/';
    }
  } catch (error) {
    console.error('Registration failed:', error.message);
    alert(error.message);
  }
};