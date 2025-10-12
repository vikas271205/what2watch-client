import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import MovieCard from "../components/MovieCard";
import { useLoading } from "../context/LoadingContext";
import ReactMarkdown from "react-markdown";
import { SendHorizontal, Bot } from "lucide-react";

// --- FIX: Use an environment variable for the API URL ---
const API_URL = process.env.REACT_APP_API_BASE_URL || "https://what2watch-server.onrender.com";

function BotAvatar() {
  return (
    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center mr-3">
      <Bot size={20} />
    </div>
  );
}

function ChatAssistant() {
  const [messages, setMessages] = useState([
    { text: "👋 Hi! I'm Uncle Film Finder. How can I help you find a movie today?", sender: "bot" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(uuidv4());
  const chatEndRef = useRef(null);
  const { setIsLoading } = useLoading();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (userMessage) => {
    if (!userMessage || userMessage.trim() === "" || loading) return;

    setMessages((prev) => [...prev, { text: userMessage, sender: "user" }]);
    setInput("");
    setLoading(true);
    setIsLoading(true);

    try {
      // --- FIX: The fetch call now uses the API_URL variable ---
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, sessionId }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();
      const botReply = Array.isArray(data.reply)
        ? { text: data.reply, sender: "bot", isMovieList: true }
        : { text: data.reply, sender: "bot" };

      setMessages((prev) => [...prev, botReply]);
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => [
        ...prev,
        { text: "❌ Sorry, something went wrong.", sender: "bot" },
      ]);
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  // --- FIX: Corrected the overall layout structure and removed old styles ---
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-1 flex-col bg-white dark:bg-gray-900 overflow-hidden">
      <header className="relative z-10 flex-shrink-0 bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm border-b border-gray-300 dark:border-gray-800 p-4 flex items-center justify-center shadow-md">
        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-600 bg-clip-text text-transparent">
          🎬 AI Movie Assistant
        </h2>
      </header>

      <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex items-start max-w-2xl animate-fadeInUp ${msg.sender === "user" ? "ml-auto justify-end" : "mr-auto justify-start"}`}>
            {msg.sender === "bot" && <BotAvatar />}
            <div className={`px-4 py-3 rounded-2xl shadow-md border ${msg.sender === "user"
              ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-br-none border-transparent"
              : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none border-gray-200 dark:border-gray-700"
              }`}>
              {msg.isMovieList ? (
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  {msg.text.map(movie => <MovieCard key={movie.id} {...movie} showUncleScore size="small" />)}
                </div>
              ) : (
                <div className="prose prose-sm sm:prose-base dark:prose-invert prose-p:my-0">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start animate-fadeInUp">
            <BotAvatar />
            <div className="px-4 py-3 bg-gray-200 dark:bg-gray-800 rounded-2xl shadow-md">
              <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full animate-bounce mr-1" />
              <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150 mr-1" />
              <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-300" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <footer className="relative z-10 flex-shrink-0 bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm border-t border-gray-300 dark:border-gray-800 p-2 sm:p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-4">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage(input)}
            placeholder="Suggest a Hindi thriller..."
            className="flex-1 w-full px-4 py-2 sm:py-3 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-transparent text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading}
            className="p-2 sm:p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition-all duration-300 transform hover:scale-110 disabled:opacity-50 disabled:scale-100 flex-shrink-0"
            aria-label="Send message"
          >
            <SendHorizontal size={24} />
          </button>
        </div>
      </footer>
    </div>
  );
}

export default ChatAssistant;
