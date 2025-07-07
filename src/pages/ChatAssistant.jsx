import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import MovieCard from "../components/MovieCard";
import { useLoading } from "../context/LoadingContext";

function ChatAssistant() {
  const [messages, setMessages] = useState([
    { text: "👋 Hi! I'm your movie assistant. Ask me anything!", sender: "bot" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(uuidv4());
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

const { setIsLoading } = useLoading();

const sendMessage = async (userMessage) => {
  if (!userMessage || userMessage.trim() === "") return;

  setMessages((prev) => [...prev, { text: userMessage, sender: "user" }]);
  setLoading(true);
  setIsLoading(true); // Start global shimmer

  try {
    const res = await fetch(`https://what2watch-server.onrender.com/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage, sessionId }),
    });
    const data = await res.json();

    const botReply = Array.isArray(data.reply)
      ? { text: data.reply, sender: "bot", isMovieList: true }
      : { text: data.reply, sender: "bot" };

    setMessages((prev) => [...prev, botReply]);
  } catch {
    setMessages((prev) => [
      ...prev,
      { text: "❌ Sorry, something went wrong.", sender: "bot" },
    ]);
  } finally {
    setLoading(false);
    setIsLoading(false); // End shimmer
    setInput("");
  }
};


  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-800 p-2 sm:p-4">
      {/* Starry Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div
          className="w-[200%] h-[200%] bg-repeat opacity-15 animate-moveStarsSlow"
          style={{ backgroundImage: "url('/stars.svg')" }}
        />
      </div>

      {/* Chat Container */}
      <div className="relative z-10 max-w-full sm:max-w-4xl mx-auto bg-gray-900/70 backdrop-blur-sm border border-gray-800 rounded-2xl p-3 sm:p-6 shadow-2xl text-white">
        <h2 className="text-2xl sm:text-4xl font-bold mb-4 sm:mb-6 text-center bg-gradient-to-r from-indigo-400 to-purple-600 bg-clip-text text-transparent animate-pulseSlow">
          🎬 AI Movie Assistant
        </h2>

        {/* Message List */}
        <div className="flex flex-col gap-2 sm:gap-3 mb-4 sm:mb-6 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`w-fit max-w-[90%] sm:max-w-[85%] p-2 sm:p-3 rounded-xl shadow-lg animate-fadeInUp ${
                msg.sender === "user" ? "self-end bg-blue-700/80" : "self-start bg-gray-800/80"
              }`}
            >
              {msg.isMovieList ? (
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  {msg.text.map(movie => (
                    <MovieCard
                      key={movie.id}
                      id={movie.id}
                      title={movie.title}
                      imageUrl={movie.imageUrl}
                      publicRating={movie.rating}
                      genres={movie.genres}
                      language={movie.language}
                      showUncleScore
                      size="small"
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm sm:text-md">{msg.text}</p>
              )}
            </div>
          ))}

          {/* Typing Animation */}
          {loading && (
            <div className="self-start p-2 sm:p-3 bg-gray-800/80 rounded-xl shadow-lg animate-pulse">
              <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full animate-bounce mr-1" />
              <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150 mr-1" />
              <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-300" />
            </div>
          )}

          {/* Dummy Scroll Anchor */}
          <div ref={chatEndRef} />
        </div>

        {/* Input Row */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage(input)}
            placeholder="Ask me anything like 'Suggest a Hindi thriller from 2023'"
            className="flex-1 px-3 sm:px-5 py-2 sm:py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner transition-all duration-300 hover:bg-gray-700 text-sm sm:text-md"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 w-full sm:w-auto"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatAssistant;