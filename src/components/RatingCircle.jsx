// src/components/RatingCircle.jsx

import { motion } from "framer-motion";

const RatingCircle = ({
  score,
  maxValue = 10,
  label,
  color = "#f59e0b", // Default to yellow
}) => {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / maxValue) * circumference;

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full" viewBox="0 0 70 70">
          {/* Background Circle */}
          <circle
            cx="35"
            cy="35"
            r={radius}
            strokeWidth="5"
            className="stroke-gray-700"
            fill="transparent"
          />
          {/* Progress Circle */}
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
          <span className="text-xl font-bold text-white">{score}</span>
          {maxValue === 100 && <span className="text-xs">%</span>}
        </div>
      </div>
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
    </div>
  );
};

export default RatingCircle;
