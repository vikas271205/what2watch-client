import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import MovieCard from "../components/MovieCard";
import { SendHorizontal, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";

const API_URL = process.env.REACT_APP_API_BASE_URL || "https://your-backend.onrender.com";

function BotAvatar() {
  return (
    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center mr-3">
      <Bot size={20} />
    </div>
  );
}

function ChatAssistant() {
  const [messages, setMessages] = useState([
    {
      text: "👋 Hi! I'm Uncle Film Finder. How can I help you find a movie today?",
      sender: "bot"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (userMessage) => {
    if (!userMessage || userMessage.trim() === "" || loading) return;

    setMessages((prev) => [...prev, { text: userMessage, sender: "user" }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage })
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();

      if (data.type === "movieList" && Array.isArray(data.movies)) {
        setMessages((prev) => [
          ...prev,
          { text: data.commentary, sender: "bot" },
          { movies: data.movies, sender: "bot", isMovieList: true }
        ]);
      } else {
        setMessages((prev) => [...prev, { text: data.commentary || data.reply, sender: "bot" }]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        { text: "❌ Sorry, something went wrong.", sender: "bot" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-1 flex-col bg-white dark:bg-gray-900 overflow-hidden">
      <header className="flex-shrink-0 bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm border-b p-4 flex items-center justify-center shadow-md">
        <h2 className="text-xl sm:text-2xl font-bold text-indigo-600">🎬 AI Movie Assistant</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} items-start`}>
            {msg.sender === "bot" && <BotAvatar />}
            <div className={`p-3 rounded-2xl shadow-md max-w-xl ${msg.sender === "user" ? "bg-indigo-600 text-white rounded-br-none" : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none"}`}>
              {msg.isMovieList ? (
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  {msg.movies.map((movie) => (
                    <MovieCard key={movie.id} {...movie} showUncleScore size="small" />
                  ))}
                </div>
              ) : (
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start">
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

      <footer className="flex-shrink-0 bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm border-t p-2 sm:p-4">
        <div className="flex max-w-4xl mx-auto gap-2 sm:gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Suggest a Hindi thriller..."
            className="flex-1 px-4 py-2 sm:py-3 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black dark:text-white transition-all duration-300"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading}
            className="p-2 sm:p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition-all duration-300"
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

