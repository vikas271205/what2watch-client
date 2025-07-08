import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

return (
  <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black px-4 text-black dark:text-white">
    <div className="w-full max-w-md bg-gray-100 dark:bg-gray-900 p-8 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
        Create Account
      </h1>

      <form onSubmit={handleSignup} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="block mb-1 text-sm text-gray-700 dark:text-gray-300">
            Email
          </label>
          <input
            type="email"
            id="email"
            placeholder="Enter your email"
            className="w-full p-3 rounded bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block mb-1 text-sm text-gray-700 dark:text-gray-300">
            Password
          </label>
          <input
            type="password"
            id="password"
            placeholder="Create a password"
            className="w-full p-3 rounded bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`bg-indigo-600 hover:bg-indigo-700 transition font-semibold py-3 rounded ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>
      </form>

      <p className="mt-4 text-sm text-center text-gray-600 dark:text-gray-400">
        Already have an account?{" "}
        <Link to="/login" className="text-indigo-500 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  </div>
);

}

export default Signup;
