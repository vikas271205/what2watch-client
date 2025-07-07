const API_BASE =
  process.env.NODE_ENV === "production"
    ? "https://what2watch-server.onrender.com"
    : "http://localhost:5000";

export default API_BASE;
