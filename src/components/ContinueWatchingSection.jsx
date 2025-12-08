// src/components/ContinueWatchingSection.jsx

import React from "react";
import { getWatchHistory, removeFromWatchHistory, clearWatchHistory } from "../utils/watchHistory";
import { useNavigate } from "react-router-dom";

export default function ContinueWatchingSection({ maxItems = 6 }) {
  const navigate = useNavigate();

  const items = getWatchHistory().slice(0, maxItems);

  if (items.length === 0) return null;

  return (
    <section className="my-6 px-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">Continue Watching</h2>

        <button
          className="text-sm text-red-400 hover:text-red-500"
          onClick={() => {
            if (window.confirm("Clear continue watching history?")) {
              clearWatchHistory();
              window.location.reload();
            }
          }}
        >
          Clear All
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="flex space-x-4">
          {items.map((item) => (
            <div key={`${item.type}-${item.id}`} className="w-36 flex-shrink-0">
              <div
                className="rounded-md overflow-hidden cursor-pointer"
                onClick={() => navigate(`/${item.type}/${item.id}`)}
              >
                {item.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                    alt={item.title}
                    className="w-full h-52 object-cover"
                  />
                ) : (
                  <div className="w-full h-52 bg-gray-700" />
                )}
              </div>

              <div className="mt-2 flex items-center justify-between">
                <p className="text-sm truncate w-28">{item.title}</p>

                <button
                  className="text-xs text-red-400 ml-2"
                  onClick={() => {
                    removeFromWatchHistory(item.id, item.type);
                    window.location.reload();
                  }}
                >
                  X
                </button>
              </div>

              <p className="text-xs text-gray-400">
                {new Date(item.timestamp).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
