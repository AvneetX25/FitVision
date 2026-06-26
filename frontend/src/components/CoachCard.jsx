import React from 'react'

export default function CoachCard({ text, loading, exercise }) {
  if (!loading && !text) return null   // hidden until End Set is clicked

  return (
    <div className="coach-card">
      <div className="coach-card__header">
        <span className="coach-card__icon">🤖</span>
        <span className="coach-card__title">Coach Says</span>
        {exercise && <span className="coach-card__exercise">{exercise}</span>}
      </div>

      <div className="coach-card__body">
        {loading && !text ? (
          <span className="coach-card__thinking">Analysing your set…</span>
        ) : (
          <p className="coach-card__text">
            {text}
            {/* blinking cursor while still streaming */}
            {loading && <span className="coach-card__cursor">▋</span>}
          </p>
        )}
      </div>
    </div>
  )
}