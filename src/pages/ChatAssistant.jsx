import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import MovieCard from "../components/MovieCard";

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

  const sendMessage = async userMessage => {
    if (!userMessage || userMessage.trim() === "") return;

    setMessages(prev => [...prev, { text: userMessage, sender: "user" }]);
    setLoading(true);

    try {




const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/chat`, {




        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, sessionId })
      });
      const data = await res.json();

      const botReply = Array.isArray(data.reply)
        ? { text: data.reply, sender: "bot", isMovieList: true }
        : { text: data.reply, sender: "bot" };

      setMessages(prev => [...prev, botReply]);
    } catch {
      setMessages(prev => [
        ...prev,
        { text: "❌ Sorry, something went wrong.", sender: "bot" }
      ]);
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-black via-zinc-900 to-zinc-800 p-4">
      {/* star BG */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div
          className="w-[200%] h-[200%] bg-repeat opacity-10 animate-moveStars"
          style={{ backgroundImage: "url('/stars.svg')" }}
        />
      </div>

      {/* chat container */}
      <div className="relative z-10 max-w-3xl mx-auto bg-black/50 backdrop-blur-md border border-zinc-700 rounded-2xl p-6 shadow-xl text-white">
        <h2 className="text-3xl font-bold mb-6 text-center">
          🎬 AI Movie Assistant
        </h2>

        {/* message list */}
        <div className="flex flex-col gap-4 mb-6 max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`w-fit max-w-[90%] animate-fadeIn ${
                msg.sender === "user" ? "self-end" : "self-start"
              }`}
            >
              {msg.isMovieList ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
                <div
                  className={`px-4 py-2 rounded-xl shadow-md ${
                    msg.sender === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-700 text-white"
                  }`}
                >
                  {msg.text}
                </div>
              )}
            </div>
          ))}

          {/* typing animation */}
          {loading && (
            <div className="px-4 py-2 bg-zinc-700 text-white rounded-xl self-start animate-pulse">
              <span className="inline-block w-2 h-2 bg-white rounded-full animate-bounce mr-1" />
              <span className="inline-block w-2 h-2 bg-white rounded-full animate-bounce mr-1 delay-150" />
              <span className="inline-block w-2 h-2 bg-white rounded-full animate-bounce delay-300" />
            </div>
          )}

          {/* dummy scroll anchor */}
          <div ref={chatEndRef} />
        </div>

        {/* input row */}
        <div className="flex gap-2 mt-4">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage(input)}
            placeholder="Ask me anything like 'Suggest a Hindi thriller from 2023'"
            className="flex-1 px-4 py-2 rounded-xl bg-zinc-900 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-lg transition"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatAssistant;
