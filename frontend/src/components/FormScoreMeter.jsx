// FormScoreMeter.jsx — Colored progress bar 0–100
import React from 'react';

function getColor(score) {
  if (score >= 80) return { bar: '#22c55e', glow: 'rgba(34,197,94,0.5)', label: 'Excellent' };
  if (score >= 60) return { bar: '#eab308', glow: 'rgba(234,179,8,0.5)', label: 'Good' };
  return { bar: '#ef4444', glow: 'rgba(239,68,68,0.5)', label: 'Fix Form' };
}

export default function FormScoreMeter({ score }) {
  const clamped = Math.max(0, Math.min(100, score));
  const { bar, glow, label } = getColor(clamped);

  return (
    <div className="w-full">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-xs font-semibold tracking-widest uppercase text-slate-400">
          Form Score
        </span>
        <div className="flex items-baseline gap-1">
          <span
            className="text-2xl font-black tabular-nums transition-all duration-500"
            style={{ color: bar, textShadow: `0 0 12px ${glow}` }}
          >
            {clamped}
          </span>
          <span className="text-slate-400 text-sm">/ 100</span>
          <span
            className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${bar}22`, color: bar, border: `1px solid ${bar}44` }}
          >
            {label}
          </span>
        </div>
      </div>

      {/* Track */}
      <div className="relative h-3 rounded-full bg-slate-800 overflow-hidden">
        {/* Segmented ticks */}
        {[20, 40, 60, 80].map((tick) => (
          <div
            key={tick}
            className="absolute top-0 bottom-0 w-px bg-slate-700 z-10"
            style={{ left: `${tick}%` }}
          />
        ))}
        {/* Fill */}
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${clamped}%`,
            background: `linear-gradient(90deg, ${bar}88, ${bar})`,
            boxShadow: `0 0 10px ${glow}`,
          }}
        />
      </div>

      {/* Threshold labels */}
      <div className="flex justify-between mt-1 px-0.5">
        <span className="text-[10px] text-slate-600">0</span>
        <span className="text-[10px] text-slate-600" style={{ marginLeft: '58%' }}>60</span>
        <span className="text-[10px] text-slate-600">80</span>
        <span className="text-[10px] text-slate-600">100</span>
      </div>
    </div>
  );
}
