const EXERCISES = [
  {
    id: 'squat',
    label: 'Squat',
    icon: '🦵',
    description: 'Full body — quads, glutes, hamstrings',
    tip: 'Stand 2–3m from camera, full body visible',
  },
  {
    id: 'pushup',
    label: 'Push-Up',
    icon: '💪',
    description: 'Upper body — chest, shoulders, triceps',
    tip: 'Side-on to camera works best',
  },
  {
    id: 'curl',
    label: 'Bicep Curl',
    icon: '🏋️',
    description: 'Arms — biceps, forearms',
    tip: 'Face camera, keep elbows close to body',
  },
];

export default function ExerciseSelector({ selected, onChange, disabled }) {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
      <div className="text-xs font-semibold tracking-widest uppercase 
                      text-slate-400 mb-4">
        Choose Exercise
      </div>

      <div className="flex flex-col gap-3">
        {EXERCISES.map((ex) => {
          const isSelected = selected === ex.id;
          return (
            <button
              key={ex.id}
              onClick={() => onChange(ex.id)}
              disabled={disabled}
              className={`
                w-full text-left rounded-xl border p-4 transition-all duration-200
                disabled:opacity-40 disabled:cursor-not-allowed
                ${isSelected
                  ? 'border-sky-500 bg-sky-500/10 shadow-[0_0_15px_rgba(14,165,233,0.15)]'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{ex.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className={`font-bold text-sm
                    ${isSelected ? 'text-sky-400' : 'text-slate-200'}`}>
                    {ex.label}
                  </div>
                  <div className="text-slate-500 text-xs mt-0.5 truncate">
                    {ex.description}
                  </div>
                </div>
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                )}
              </div>

              {/* Camera tip — only show on selected card */}
              {isSelected && (
                <div className="mt-3 pt-3 border-t border-sky-500/20">
                  <p className="text-xs text-sky-400/70">
                    📷 {ex.tip}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}