import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function ParallaxMovieStack({
  items,
  activeIndex,
  setActiveIndex,
}) {
  return (
    <div className="relative h-[420px] overflow-hidden">
      {/* Parallax background */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center blur-xl scale-110"
        animate={{
          backgroundImage: `url(https://image.tmdb.org/t/p/w1280${items[activeIndex]?.backdrop_path})`,
        }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ opacity: 0.35 }}
      />

      <div className="relative flex items-center h-full px-20">
        {items.map((item, i) => {
          const offset = i - activeIndex;
          const isActive = offset === 0;

          return (
            <motion.div
              key={item.id}
              className="absolute"
              animate={{
                x: offset * 160,
                scale: isActive ? 1 : 0.85,
                y: isActive ? -20 : 0,
                opacity: Math.abs(offset) > 2 ? 0 : isActive ? 1 : 0.5,
                zIndex: isActive ? 10 : 5 - Math.abs(offset),
              }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              onClick={() => setActiveIndex(i)}
            >
              <Link to={`/movie/${item.id}`}>
                <img
                  src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                  alt={item.title}
                  className="w-[220px] aspect-[2/3] rounded-xl shadow-2xl"
                />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
