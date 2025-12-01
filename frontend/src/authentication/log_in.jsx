import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { authAPI } from '../services/api';


export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    console.log("LOGIN DATA:", data);
    // API call to /login can be added here
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
            Welcome Back
          </h1>
          <p className="text-gray-600">
            Login to access your account
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
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
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full border border-gray-300 px-4 py-3 rounded-lg 
                outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                transition duration-200"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
              />
              {errors.password && (
                <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold 
              py-3 px-4 rounded-lg transition duration-200 focus:ring-2 focus:ring-blue-500 
              focus:ring-offset-2"
            >
              Login
            </button>
          </form>

          {/* Sign-up Link */}
          <div className="text-center mt-6 pt-6 border-t border-gray-200">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link 
                to="/signup" 
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Sign-up Here
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

// In your Login component
const onSubmit = async (data) => {
  try {
    const response = await authAPI.login(data.email, data.password);
    console.log('Login successful:', response);
    
    // Store token in localStorage
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    // Redirect based on role
    if (response.user.role === 'owner') {
      window.location.href = '/owner/dashboard';
    } else {
      window.location.href = '/';
    }
  } catch (error) {
    console.error('Login failed:', error.message);
    // Show error to user
    alert(error.message);
  }
};