import { useState } from "react";
import { useForm } from "react-hook-form";

export default function Signup() {
  const [isOwner, setIsOwner] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    data.role = isOwner ? "owner" : "user";
    console.log("FORM SUBMITTED:", data);
  };

  return (
    <div className="flex justify-center mt-10">
      <div className="w-full max-w-xl bg-white shadow-lg rounded-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Signup for Wanderlust
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* USERNAME */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              placeholder="Enter username"
              className="w-full border px-4 py-2 rounded-lg outline-none 
              focus:ring-2 focus:ring-blue-500"
              {...register("username", {
                required: "Username is required",
                minLength: { value: 3, message: "Min 3 characters required" },
              })}
            />
            {errors.username && (
              <p className="text-red-600 text-sm">{errors.username.message}</p>
            )}
          </div>

          {/* EMAIL */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter email"
              className="w-full border px-4 py-2 rounded-lg outline-none 
              focus:ring-2 focus:ring-blue-500"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: "Invalid email format",
                },
              })}
            />
            {errors.email && (
              <p className="text-red-600 text-sm">{errors.email.message}</p>
            )}
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter password"
              className="w-full border px-4 py-2 rounded-lg outline-none 
              focus:ring-2 focus:ring-blue-500"
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "Min 6 characters required" },
              })}
            />
            {errors.password && (
              <p className="text-red-600 text-sm">{errors.password.message}</p>
            )}
          </div>

          {/* PHONE */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Phone (Optional)
            </label>
            <input
              type="text"
              placeholder="03XXXXXXXXX"
              className="w-full border px-4 py-2 rounded-lg outline-none 
              focus:ring-2 focus:ring-blue-500"
              {...register("phone", {
                pattern: {
                  value: /^03\d{9}$/,
                  message: "Phone must be like 03XXXXXXXXX",
                },
              })}
            />
            {errors.phone && (
              <p className="text-red-600 text-sm">{errors.phone.message}</p>
            )}
          </div>

          {/* OWNER CHECKBOX */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={isOwner}
              onChange={() => setIsOwner(!isOwner)}
            />
            <label className="text-gray-700 font-medium">
              Register as a <b>Venue Owner</b>
            </label>
          </div>

          {/* OWNER FIELDS (ONLY IF CHECKED) */}
          {isOwner && (
            <div className="border border-gray-300 p-5 rounded-xl bg-gray-50">
              <h2 className="text-xl font-semibold mb-3 text-gray-800">
                Owner Details
              </h2>

              {/* BUSINESS NAME */}
              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  placeholder="Business name"
                  className="w-full border px-4 py-2 rounded-lg outline-none 
                  focus:ring-2 focus:ring-blue-500"
                  {...register("business_name", {
                    required: isOwner ? "Business name required" : false,
                  })}
                />
                {errors.business_name && (
                  <p className="text-red-600 text-sm">
                    {errors.business_name.message}
                  </p>
                )}
              </div>

              {/* CNIC */}
              <div className="mt-4">
                <label className="block font-medium text-gray-700 mb-1">
                  CNIC / Registration No.
                </label>
                <input
                  type="text"
                  placeholder="12345-1234567-1"
                  className="w-full border px-4 py-2 rounded-lg outline-none 
                  focus:ring-2 focus:ring-blue-500"
                  {...register("cnic", {
                    required: isOwner ? "CNIC is required" : false,
                    pattern: {
                      value: /^\d{5}-\d{7}-\d{1}$/,
                      message: "CNIC must be like 12345-1234567-1",
                    },
                  })}
                />
                {errors.cnic && (
                  <p className="text-red-600 text-sm">{errors.cnic.message}</p>
                )}
              </div>
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 
            rounded-lg transition duration-200"
          >
            Register Account
          </button>
        </form>
      </div>
    </div>
  );
}
