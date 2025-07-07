const API_BASE =
  process.env.REACT_APP_NODE_ENV === "production"
    ? "https://what2watch-server.onrender.com"
    : "http://localhost:5000";

export default API_BASE;
