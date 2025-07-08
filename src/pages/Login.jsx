import { useEffect, useState } from "react";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  sendEmailVerification
} from "firebase/auth";
import { auth, provider } from "../firebase";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", isError: false });
  const [cooldown, setCooldown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.emailVerified) navigate("/");
    });
    return () => unsubscribe();
  }, [navigate]);

  const showToast = (message, isError = false) => {
    setToast({ show: true, message, isError });
    setTimeout(() => setToast({ show: false, message: "", isError: false }), 3000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      if (!result.user.emailVerified) {
        showToast("Email not verified. Check your inbox.", true);
        if (!cooldown) {
          await sendEmailVerification(result.user);
          setCooldown(true);
          setTimeout(() => setCooldown(false), 60000);
        }
        return;
      }
      navigate("/");
    } catch (error) {
      showToast(error.message, true);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
      navigate("/");
    } catch (error) {
      showToast(error.message, true);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) return showToast("Please enter your email to reset password", true);
    try {
      await sendPasswordResetEmail(auth, email);
      showToast("Password reset email sent");
    } catch (error) {
      showToast(error.message, true);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black px-4">
      <div className="bg-gray-100 dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-sm text-black dark:text-white">
        <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
          Login to UncleFilmFinder
        </h1>

        {toast.show && (
          <div
            className={`mb-4 px-4 py-2 rounded text-sm font-medium text-white ${
              toast.isError ? "bg-red-600" : "bg-green-600"
            }`}
          >
            {toast.message}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            required
          />

          <div className="text-right">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-indigo-500 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 transition py-2 rounded-lg font-semibold text-white"
          >
            Log In
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={handleGoogleLogin}
            className="bg-white dark:bg-gray-100 text-black px-4 py-2 rounded-lg font-semibold w-full hover:bg-gray-200 transition"
          >
            Continue with Google
          </button>
        </div>

        <p className="mt-4 text-sm text-center text-gray-500 dark:text-gray-400">
          Don't have an account?{" "}
          <Link to="/signup" className="text-blue-500 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
