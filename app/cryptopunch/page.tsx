'use client';

import React, { useState, useEffect } from 'react';
import { FaFistRaised } from 'react-icons/fa';

export default function PunchGame() {
  const [score, setScore] = useState(0);
  const [showPunch, setShowPunch] = useState(false);
  const [glovePosition, setGlovePosition] = useState({ x: 0, y: 0 });

  const handlePunch = () => {
    setScore(score + 1);
    setShowPunch(true);
    setGlovePosition({ x: Math.random() * 20 - 10, y: Math.random() * 20 - 10 });
    setTimeout(() => {
      setShowPunch(false);
      setGlovePosition({ x: 0, y: 0 });
    }, 300);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-8 text-center">Punch the Glove!</h1>
      <div className="text-xl sm:text-2xl mb-4">Score: {score}</div>
      <div className="relative w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80">
        <svg
          viewBox="0 0 200 200"
          className={`w-full h-full cursor-pointer transform transition-transform duration-300 ${showPunch ? 'scale-95' : 'hover:scale-105'}`}
          style={{
            transform: `translate(${glovePosition.x}px, ${glovePosition.y}px)`,
          }}
          onClick={handlePunch}
        >
          <path
            d="M100 180c-44.183 0-80-35.817-80-80s35.817-80 80-80 80 35.817 80 80-35.817 80-80 80z"
            fill="#d25627"
          />
          <path
            d="M100 30c38.66 0 70 31.34 70 70s-31.34 70-70 70-70-31.34-70-70 31.34-70 70-70z"
            fill="#e64c3c"
          />
          <rect x="70" y="20" width="60" height="40" fill="#c03a2b" />
        </svg>
        {showPunch && (
          <FaFistRaised
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-4xl"
          />
        )}
      </div>
      <p className="mt-4 text-lg sm:text-xl text-center">Click or tap the glove to punch!</p>
    </div>
  );
}
