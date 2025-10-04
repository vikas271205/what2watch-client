import React from 'react';

function ScoreCircle({ score }) {
  const scoreValue = Math.round(score * 10);
  if (isNaN(scoreValue) || scoreValue <= 0) {
    return null; // Don't render if score is invalid
  }

  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (scoreValue / 100) * circumference;

  let strokeColor = "stroke-green-500";
  if (scoreValue < 70) strokeColor = "stroke-yellow-500";
  if (scoreValue < 40) strokeColor = "stroke-red-500";
  
  return (
    <div className="relative w-10 h-10">
      <svg className="w-full h-full" viewBox="0 0 36 36">
        {/* Background Circle */}
        <circle
          className="stroke-current text-gray-700/50"
          strokeWidth="3"
          fill="none"
          cx="18"
          cy="18"
          r={radius}
        />
        {/* Progress Circle */}
        <circle
          className={`stroke-current ${strokeColor} origin-center -rotate-90`}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          cx="18"
          cy="18"
          r={radius}
        />
      </svg>
      {/* Text in the Center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white text-xs font-bold">{score.toFixed(1)}</span>
      </div>
    </div>
  );
}

export default ScoreCircle;