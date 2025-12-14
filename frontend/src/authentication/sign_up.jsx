import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from '../services/api';

export default function Signup() {
  const [userType, setUserType] = useState("user");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      const userData = {
        name: data.fullName,
        email: data.email,
        password: data.password,
        phone: data.phone ? `+92${data.phone.slice(1)}` : null,
        role: userType,
      };

      if (userType === 'owner') {
        userData.business_name = data.businessName;
        userData.cnic = data.cnic;
      }

      const response = await authAPI.signup(userData);
      const loginResponse = await authAPI.login({
        email: data.email,
        password: data.password
      });

      localStorage.setItem('token', loginResponse.token);
      localStorage.setItem('user', JSON.stringify(loginResponse.user));

      window.location.href = '/venues';

    } catch (error) {
      console.error('Registration failed:', error.message);

      if (error.message.toLowerCase().includes('email already exists')) {
        const goToLogin = window.confirm(
          '⚠️ This email is already registered!\n\nWould you like to go to the login page instead?'
        );
        if (goToLogin) {
          navigate('/login');
        }
      } else {
        alert('Registration failed: ' + error.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Back to Home Link */}
      <div className="absolute top-6 left-6">
        <Link
          to="/"
          className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to home
        </Link>
      </div>

      <div className="max-w-md w-full mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Account
          </h1>
          <p className="text-gray-600">
            Join us to find and book amazing venues
          </p>
        </div>

        {/* Signup Form */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 pl-10 pr-4 py-3 rounded-lg 
                  outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition duration-200"
                  {...register("fullName", {
                    required: "Full name is required",
                    minLength: { value: 2, message: "Minimum 2 characters required" },
                  })}
                />
              </div>
              {errors.fullName && (
                <p className="text-red-600 text-sm mt-1">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 pl-10 pr-4 py-3 rounded-lg 
                  outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition duration-200"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^\S+@\S+\.\S+$/,
                      message: "Invalid email format",
                    },
                  })}
                />
              </div>
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 pl-10 pr-12 py-3 rounded-lg 
                  outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition duration-200"
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 6, message: "Minimum 6 characters required" },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="03XXXXXXXXX"
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 pl-10 pr-4 py-3 rounded-lg 
                  outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition duration-200"
                  {...register("phone", {
                    pattern: {
                      value: /^03\d{9}$/,
                      message: "Phone must be like 03XXXXXXXXX",
                    },
                  })}
                />
              </div>
              {errors.phone && (
                <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>
              )}
            </div>

            {/* Register As */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Register As *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label
                  className={`relative flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${userType === "owner"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-blue-300"
                    }`}
                >
                  <input
                    type="radio"
                    name="userType"
                    value="owner"
                    checked={userType === "owner"}
                    onChange={(e) => setUserType(e.target.value)}
                    className="sr-only"
                  />
                  <svg className={`w-8 h-8 mb-2 ${userType === "owner" ? "text-blue-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className={`text-sm font-semibold text-center ${userType === "owner" ? "text-blue-700" : "text-gray-700"}`}>
                    Venue Owner
                  </span>
                  <span className="text-xs text-gray-500 mt-1">List Venues</span>
                  {userType === "owner" && (
                    <div className="absolute top-2 right-2">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </label>

                <label
                  className={`relative flex flex-col items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${userType === "user"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-blue-300"
                    }`}
                >
                  <input
                    type="radio"
                    name="userType"
                    value="user"
                    checked={userType === "user"}
                    onChange={(e) => setUserType(e.target.value)}
                    className="sr-only"
                  />
                  <svg className={`w-8 h-8 mb-2 ${userType === "user" ? "text-blue-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className={`text-sm font-semibold text-center ${userType === "user" ? "text-blue-700" : "text-gray-700"}`}>
                    Customer
                  </span>
                  <span className="text-xs text-gray-500 mt-1">Book Venues</span>
                  {userType === "user" && (
                    <div className="absolute top-2 right-2">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Business Information */}
            {userType === "owner" && (
              <div className="border border-gray-300 rounded-xl p-5 bg-gray-50 space-y-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  Business Information
                </h3>

                {/* Business Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Business Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Enter business name"
                      className="w-full bg-white border border-gray-300 text-gray-900 pl-10 pr-4 py-3 rounded-lg 
                      outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                      {...register("businessName", {
                        required: userType === "owner" ? "Business name is required" : false,
                      })}
                    />
                  </div>
                  {errors.businessName && (
                    <p className="text-red-600 text-sm mt-1">{errors.businessName.message}</p>
                  )}
                </div>

                {/* CNIC Number */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    CNIC Number *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="12345-1234567-1"
                      className="w-full bg-white border border-gray-300 text-gray-900 pl-10 pr-4 py-3 rounded-lg 
                      outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                      {...register("cnic", {
                        required: userType === "owner" ? "CNIC is required" : false,
                        pattern: {
                          value: /^\d{5}-\d{7}-\d{1}$/,
                          message: "CNIC must be like 12345-1234567-1",
                        },
                      })}
                    />
                  </div>
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
              py-3 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
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
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
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
