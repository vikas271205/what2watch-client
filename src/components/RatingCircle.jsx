// src/components/RatingCircle.jsx
import { motion } from "framer-motion";
import { getWorthItColor } from "../utils/worthItDisplay";

const RatingCircle = ({
  score,
  maxValue = 10,
  label,
  useAutoColor = false
}) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / maxValue) * circumference;

  const color = useAutoColor ? getWorthItColor(score) : "#f59e0b";

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full" viewBox="0 0 70 70">
          <circle
            cx="35"
            cy="35"
            r={radius}
            strokeWidth="5"
            className="stroke-gray-700"
            fill="transparent"
          />

          <motion.circle
            cx="35"
            cy="35"
            r={radius}
            strokeWidth="5"
            fill="transparent"
            strokeLinecap="round"
            transform="rotate(-90 35 35)"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{ stroke: color }}
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-white">
            {score}
          </span>
        </div>
      </div>

      {label && (
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {label}
        </span>
      )}
    </div>
  );
};

export default RatingCircle;
