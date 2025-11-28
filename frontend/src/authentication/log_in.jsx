import { useForm } from "react-hook-form";

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
    <div className="flex justify-center mt-10">
      <div className="w-full max-w-lg bg-white p-8 rounded-xl shadow-xl">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Login for Wanderlust
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* USERNAME */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Username
            </label>

            <input
              type="text"
              placeholder="Enter your name"
              className="w-full border px-4 py-2 rounded-lg 
              outline-none focus:ring-2 focus:ring-green-500"
              {...register("username", {
                required: "Username is required",
                minLength: {
                  value: 3,
                  message: "Minimum 3 characters required",
                },
              })}
            />

            {errors.username && (
              <p className="text-red-600 text-sm">{errors.username.message}</p>
            )}
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              className="w-full border px-4 py-2 rounded-lg
              outline-none focus:ring-2 focus:ring-green-500"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
            />

            {errors.password && (
              <p className="text-red-600 text-sm">{errors.password.message}</p>
            )}
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-lg
            font-semibold hover:bg-green-700 transition duration-200"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
