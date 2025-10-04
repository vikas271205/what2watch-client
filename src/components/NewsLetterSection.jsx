import { useState } from "react";
import { motion } from "framer-motion";

function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState("");

  const handleSubscribe = (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    // TODO: Integrate with backend/Mailchimp/Firebase here
    setSubscribed(true);
    setError("");
    setEmail("");
  };

  return (
    // Relative container with negative top margin to overlap the footer
    <section className="relative -mt-16 md:-mt-24 z-20 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl
                   bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900
                   relative p-8 md:p-12 text-white flex flex-col items-center justify-center"
      >
        {/* Subtle background pattern/texture for visual interest */}
        <div 
          className="absolute inset-0 opacity-10" 
          style={{ backgroundImage: "url(/path/to/your/abstract-pattern.svg)", backgroundSize: "cover" }}
          aria-hidden="true"
        />
        
        <div className="relative z-10 text-center">
          <h2 className="text-4xl font-extrabold mb-4 leading-tight">
            Unlock <span className="text-indigo-300">Exclusive Updates</span>
          </h2>
          <p className="text-lg text-gray-200 mb-8 max-w-xl mx-auto">
            Join our community for hand-picked recommendations, early access to features, and much more.
          </p>

          <form
            onSubmit={handleSubscribe}
            className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto"
            aria-label="Newsletter subscription form"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-5 py-3 rounded-xl w-full sm:w-auto flex-grow bg-white/15 text-white placeholder-gray-300
                         backdrop-blur-md border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-400
                         transition-all duration-300 shadow-md hover:bg-white/20"
              required
            />
            <button
              type="submit"
              className="bg-indigo-500 hover:bg-indigo-400 px-7 py-3 rounded-xl text-white font-semibold text-lg
                         transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-60 disabled:hover:scale-100"
              disabled={subscribed}
            >
              {subscribed ? "Subscribed!" : "Subscribe Now"}
            </button>
          </form>

          {subscribed && (
            <p className="mt-6 text-green-300 font-medium text-base">🎉 Thank you for joining!</p>
          )}
          {error && (
            <p className="mt-6 text-red-300 font-medium text-base">{error}</p>
          )}
        </div>
      </motion.div>
    </section>
  );
}

export default NewsletterSection;