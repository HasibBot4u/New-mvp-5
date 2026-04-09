import React, { useState, useEffect } from 'react';
import { ServerCrash, RefreshCw } from 'lucide-react';

interface WakeUpCountdownProps {
  onRetry: () => void;
}

export const WakeUpCountdown: React.FC<WakeUpCountdownProps> = ({ onRetry }) => {
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (countdown <= 0) {
      onRetry();
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, onRetry]);

  return (
    <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center text-white p-6 text-center backdrop-blur-sm">
      <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
        <ServerCrash className="w-8 h-8 text-primary-light animate-pulse" />
      </div>
      
      <h3 className="text-2xl font-bold bangla mb-2">সার্ভার চালু হচ্ছে...</h3>
      <p className="text-gray-400 bangla mb-8 max-w-md">
        আমাদের ভিডিও সার্ভারটি স্লিপ মোডে ছিল। এটি চালু হতে প্রায় ৩০ সেকেন্ড সময় লাগতে পারে। অনুগ্রহ করে অপেক্ষা করুন।
      </p>

      <div className="relative w-24 h-24 mb-8">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="44"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-gray-800"
          />
          <circle
            cx="48"
            cy="48"
            r="44"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={2 * Math.PI * 44}
            strokeDashoffset={2 * Math.PI * 44 * (1 - countdown / 30)}
            className="text-primary transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold">{countdown}</span>
        </div>
      </div>

      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors bangla font-medium"
      >
        <RefreshCw className="w-4 h-4" />
        এখনই আবার চেষ্টা করুন
      </button>
    </div>
  );
};
