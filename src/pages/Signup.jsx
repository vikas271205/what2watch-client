import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  sendEmailVerification,
} from "firebase/auth";
import { auth, provider } from "../firebase";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", isError: false });
  const [cooldown, setCooldown] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && user.emailVerified) {
        navigate("/");
      }
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const showToast = (message, isError = false) => {
    setToast({ show: true, message, isError });
    setTimeout(() => setToast({ show: false, message: "", isError: false }), 3000);
  };

  const evaluateStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    setPasswordStrength(score);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCred.user);
      showToast("Verification email sent. Please verify your email.");
      setCooldown(60);
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      if (!result.user.emailVerified) {
        await sendEmailVerification(result.user);
        showToast("Verification email sent to your Google account.");
        setCooldown(60);
      }
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleResendVerification = async () => {
    if (cooldown > 0) return;
    try {
      const user = auth.currentUser;
      if (user && !user.emailVerified) {
        await sendEmailVerification(user);
        showToast("Verification email resent.");
        setCooldown(60);
      }
    } catch (err) {
      showToast(err.message, true);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black px-4 text-black dark:text-white">
      <div className="w-full max-w-md bg-gray-100 dark:bg-gray-900 p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Create Account
        </h1>

        {toast.show && (
          <div className={`mb-4 px-4 py-2 rounded text-sm font-medium ${toast.isError ? "bg-red-600" : "bg-green-600"}`}>
            {toast.message}
          </div>
        )}

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block mb-1 text-sm text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              className="w-full p-3 rounded bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-1 text-sm text-gray-700 dark:text-gray-300">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Create a password"
                className="w-full p-3 rounded bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                onChange={(e) => {
                  setPassword(e.target.value);
                  evaluateStrength(e.target.value);
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-2 flex items-center text-sm text-blue-500"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <div className="h-2 mt-2 rounded bg-gray-300 dark:bg-gray-700 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  passwordStrength === 0
                    ? "w-0"
                    : passwordStrength === 1
                    ? "w-1/4 bg-red-500"
                    : passwordStrength === 2
                    ? "w-1/2 bg-yellow-500"
                    : passwordStrength === 3
                    ? "w-3/4 bg-blue-500"
                    : "w-full bg-green-500"
                }`}
              />
            </div>
            <p className="text-xs mt-1 text-gray-400">
              Password must be at least 8 characters, include a number, uppercase letter, and special character.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`bg-blue-600 hover:bg-blue-700 text-white transition font-semibold py-3 rounded ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        <div className="mt-3 text-center">
          <button
            onClick={handleResendVerification}
            disabled={cooldown > 0}
            className={`text-sm text-blue-500 hover:underline disabled:text-gray-500`}
          >
            Resend verification email {cooldown > 0 ? `(${cooldown}s)` : ""}
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-100 text-black py-2 px-4 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>
        </div>

        <p className="mt-4 text-sm text-center text-gray-500 dark:text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-500 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
