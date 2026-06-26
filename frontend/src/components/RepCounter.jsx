// RepCounter.jsx — Displays a large animated rep count
import React, { useEffect, useRef } from 'react';

export default function RepCounter({ count }) {
  const prevRef = useRef(count);
  const numRef = useRef(null);

  useEffect(() => {
    if (count !== prevRef.current && numRef.current) {
      numRef.current.classList.remove('rep-pop');
      // Force reflow to restart animation
      void numRef.current.offsetWidth;
      numRef.current.classList.add('rep-pop');
      prevRef.current = count;
    }
  }, [count]);

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <style>{`
        @keyframes repPop {
          0%   { transform: scale(1); }
          30%  { transform: scale(1.35); color: #38bdf8; }
          60%  { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        .rep-pop { animation: repPop 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97); }
      `}</style>
      <span
        ref={numRef}
        className="text-[7rem] font-black leading-none tracking-tighter text-white drop-shadow-[0_0_30px_rgba(56,189,248,0.5)]"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {String(count).padStart(2, '0')}
      </span>
      <span className="text-sky-400 text-xl font-bold tracking-[0.4em] mt-1 uppercase">
        Reps
      </span>
    </div>
  );
}
