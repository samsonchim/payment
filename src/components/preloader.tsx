'use client';

import { useState, useEffect } from 'react';

interface PreloaderProps {
  onComplete?: () => void;
  duration?: number;
}

export function Preloader({ onComplete, duration = 2000 }: PreloaderProps) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsVisible(false);
            onComplete?.();
          }, 300);
          return 100;
        }
        return prev + (100 / (duration / 50));
      });
    }, 50);

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ backgroundColor: 'hsl(0, 0%, 94%)' }}>
      {/* Main Logo/Icon */}
      <div className="mb-8 animate-pulse">
        <div className="relative">
          {/* Outer ring with spin animation */}
          <div 
            className="w-20 h-20 border-4 rounded-full animate-spin"
            style={{ 
              borderColor: 'hsl(181, 39%, 80%)', 
              borderTopColor: 'hsl(181, 39%, 45%)' 
            }}
          ></div>
          {/* Inner payment icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'hsl(181, 39%, 45%)' }}
            >
              <svg 
                className="w-4 h-4 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" 
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* App Title */}
      <div className="text-center mb-6">
        <h1 
          className="text-3xl font-bold mb-2 opacity-0 animate-[fadeIn_0.8s_ease-out_forwards]"
          style={{ color: 'hsl(181, 39%, 35%)' }}
        >
          Payment Confirmation
        </h1>
        <p 
          className="text-sm opacity-0 animate-[fadeIn_0.8s_ease-out_0.3s_forwards]"
          style={{ color: 'hsl(181, 39%, 25%)' }}
        >
          CSC Student Payment System
        </p>
      </div>

      {/* Progress Bar */}
      <div 
        className="w-64 h-2 rounded-full overflow-hidden mb-8"
        style={{ backgroundColor: 'hsl(181, 39%, 80%)' }}
      >
        <div 
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{ 
            width: `${progress}%`,
            background: `linear-gradient(to right, hsl(181, 39%, 45%), hsl(181, 39%, 35%))`
          }}
        ></div>
      </div>

      {/* Loading text */}
      <p 
        className="text-sm mb-2 animate-pulse"
        style={{ color: 'hsl(181, 39%, 30%)' }}
      >
        Loading your dashboard...
      </p>

      {/* Progress percentage */}
      <p 
        className="text-xs mb-8 font-mono"
        style={{ color: 'hsl(181, 39%, 40%)' }}
      >
        {Math.round(progress)}%
      </p>

      {/* Developer credit */}
      <div className="absolute bottom-8 text-center">
        <p style={{ color: 'hsl(181, 39%, 30%)' }} className="text-sm">
          Developed by{' '}
          <a 
            href="https://github.com/samsonchim/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-semibold hover:underline transition-colors"
            style={{ color: 'hsl(181, 39%, 45%)' }}
          >
            Samson Chi
          </a>
        </p>
      </div>
    </div>
  );
}
