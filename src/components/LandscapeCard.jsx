import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

function LandscapeCard({ id, title, backdropUrl, isTV = false }) {
  const cardRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }
    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  const linkTo = isTV ? `/tv/${id}` : `/movie/${id}`;

  return (
    <Link
      to={linkTo}
      ref={cardRef}
      aria-label={`View details for ${title}`}
      className={`shrink-0 aspect-video rounded-xl overflow-hidden shadow-lg group transition-transform duration-300 hover:scale-105 hover:shadow-2xl block ${isVisible ? "animate-fadeInUp" : "opacity-0"}`}
    >
      <div className="relative w-full h-full bg-slate-200 dark:bg-gray-800">
        <img
          src={backdropUrl || "https://via.placeholder.com/780x439/e2e8f0/9ca3af?text=No+Image"}
          alt={`Backdrop for ${title}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 p-4 text-white">
          <h3 className="font-bold text-sm sm:text-base drop-shadow-lg">{title}</h3>
        </div>
      </div>
    </Link>
  );
}

export default React.memo(LandscapeCard);