import React, { useRef, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../hooks/useAuth';
import { Actions } from '../store/workoutStore';
import RepCounter from '../components/RepCounter';
import FormScoreMeter from '../components/FormScoreMeter';
import VoiceCoach from '../components/VoiceCoach';
import CoachCard from '../components/CoachCard';
import api from '../services/api';
import ExerciseSelector from '../components/ExerciseSelector';


const CONNECTIONS = [
  [11,12],[11,13],[13,15],[12,14],[14,16],
  [11,23],[12,24],[23,24],
  [23,25],[25,27],[24,26],[26,28]
];

function drawSkeleton(canvas, landmarks) {
  if (!canvas || !landmarks?.length) return;
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  ctx.strokeStyle = '#14FFEC';
  ctx.lineWidth = 3;
  CONNECTIONS.forEach(([i, j]) => {
    const a = landmarks[i], b = landmarks[j];
    if (!a || !b) return;
    ctx.beginPath();
    ctx.moveTo(a.x * width, a.y * height);
    ctx.lineTo(b.x * width, b.y * height);
    ctx.stroke();
  });

  landmarks.forEach(lm => {
    if (!lm) return;
    ctx.beginPath();
    ctx.arc(lm.x * width, lm.y * height, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#FF6B6B';
    ctx.fill();
  });
}

/* ── Status Badge ── */
function StatusBadge({ status }) {
  const config = {
    connecting:   { label: 'Connecting...', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30', dot: 'bg-yellow-400 animate-pulse' },
    connected:    { label: 'Live',          color: 'text-green-400',  bg: 'bg-green-400/10  border-green-400/30',  dot: 'bg-green-400  animate-pulse' },
    disconnected: { label: 'Stopped',       color: 'text-slate-400',  bg: 'bg-slate-800     border-slate-700',     dot: 'bg-slate-500' },
  };
  const { label, color, bg, dot } = config[status] || config.disconnected;
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold ${bg} ${color}`}>
      <div className={`w-2 h-2 rounded-full ${dot}`} />
      {label}
    </div>
  );
}


export default function Workout() {
  const { workoutState, dispatch } = useApp();
  const { token } = useAuth();
  const { repCount, formScore, lastCue, sessionActive, wsStatus, coachingText, coachingLoading, selectedExercise } = workoutState;

  const videoRef       = useRef(null);
  const frameRef       = useRef(null);
  const skeletonRef    = useRef(null);
  const wsRef          = useRef(null);
  const streamRef      = useRef(null);
  const intervalRef    = useRef(null);
  // Accumulates streaming tokens — useReducer dispatch doesn't support updater fns
  const coachingAccRef = useRef('');
  const selectedExerciseRef = useRef(selectedExercise);
  
  const isStoppingRef  = useRef(false);
  const repCountRef    = useRef(0);
  const formScoreRef   = useRef(100);
  const sessionIdRef   = useRef(null);

  // Sync skeleton canvas size to the rendered video element size
  useEffect(() => {
    function syncCanvasSize() {
      const video  = videoRef.current;
      const canvas = skeletonRef.current;
      if (!video || !canvas) return;
      const { offsetWidth, offsetHeight } = video;
      if (canvas.width !== offsetWidth || canvas.height !== offsetHeight) {
        canvas.width  = offsetWidth;
        canvas.height = offsetHeight;
      }
    }

    syncCanvasSize();
    window.addEventListener('resize', syncCanvasSize);
    return () => window.removeEventListener('resize', syncCanvasSize);
  }, [sessionActive]);

  useEffect(() => {
  selectedExerciseRef.current = selectedExercise;
}, [selectedExercise]);

  function speak(text) {
  if (!text || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate   = 1.05;
  utterance.pitch  = 1.0;
  utterance.volume = 1.0;
  const voices   = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    v.name.includes('Google US English') ||
    v.name.includes('Samantha') ||
    v.name.includes('Daniel')
  );
  utterance.voice = preferred || voices[0] || null;
  utterance.onerror = (e) => console.warn('SpeechSynthesis error:', e.error);
  window.speechSynthesis.speak(utterance);
}

  // ── Camera ─────────────────────────────────────────────────────────────────
  async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width:       { ideal: 1280 },
        height:      { ideal: 720 },
        aspectRatio: { ideal: 16 / 9 },
        facingMode:  'user',
      }
    });

    streamRef.current = stream;

    // Disable zoom if the browser supports it
    const track = stream.getVideoTracks()[0];
    const capabilities = track.getCapabilities?.();
    if (capabilities?.zoom) {
      await track.applyConstraints({ advanced: [{ zoom: capabilities.zoom.min }] });
    }

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
    return true;
  } catch (err) {
    console.error('Camera access denied:', err);
    return false;
  }
}

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  // ── Frame loop ─────────────────────────────────────────────────────────────
  function startFrameLoop() {
    intervalRef.current = setInterval(() => {
      const video  = videoRef.current;
      const canvas = frameRef.current;
      const ws     = wsRef.current;

      if (!video || !canvas || !ws || ws.readyState !== WebSocket.OPEN) return;
      if (video.readyState < 2) return;

      const ctx = canvas.getContext('2d');
      canvas.width  = video.videoWidth  || 1280;
      canvas.height = video.videoHeight || 720;
      ctx.drawImage(video, 0, 0);

      canvas.toBlob(blob => {
        if (blob && ws.readyState === WebSocket.OPEN) ws.send(blob);
      }, 'image/jpeg', 0.7);
    }, 100); // 10fps
  }

  function stopFrameLoop() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  // ── WebSocket message handler ──────────────────────────────────────────────
  function handleMessage(data) {
  if (data.landmarks?.length) {
    drawSkeleton(skeletonRef.current, data.landmarks);
  }

  if (data.rep_count !== undefined) {
    repCountRef.current = data.rep_count;                          // ← keep ref in sync
    dispatch({ type: Actions.SET_REP_COUNT, payload: data.rep_count });
  }
  if (data.form_score !== undefined && data.form_score !== null) {
    formScoreRef.current = Math.round(data.form_score * 100);
    dispatch({ type: Actions.SET_FORM_SCORE, payload: Math.round(data.form_score * 100) });
  }
  
  if (data.voice_cue) {
    dispatch({ type: Actions.SET_CUE, payload: data.voice_cue });
  }
}
  const triggerPostSetCoaching = useCallback(async (exercise, reps, avgFormScore, issues) => {
    coachingAccRef.current = '';
    dispatch({ type: Actions.SET_COACHING_TEXT,    payload: '' });
    dispatch({ type: Actions.SET_COACHING_LOADING, payload: true });

    try {
      const savedToken = sessionStorage.getItem('gym_token');

      const response = await fetch('/api/coaching/post-set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${savedToken}`,
        },
        body: JSON.stringify({
          exercise,
          reps,
          avg_form_score: avgFormScore,
          issues: issues || [],
        }),
      });

      if (!response.ok) {
        console.error('Coaching endpoint error:', response.status);
        dispatch({ type: Actions.SET_COACHING_LOADING, payload: false });
        return;
      }

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const text = line.slice(6);
          if (text === '[DONE]') {
            dispatch({ type: Actions.SET_COACHING_LOADING, payload: false });
            speak(coachingAccRef.current);   // ← speak full text here
            return;
          }
          coachingAccRef.current += text;
          dispatch({ type: Actions.SET_COACHING_TEXT, payload: coachingAccRef.current });
        }
      }

      // Fallback: if stream ends without [DONE], still speak whatever was accumulated
      speak(coachingAccRef.current);

    } catch (err) {
      console.error('Post-set coaching failed:', err);
    } finally {
      dispatch({ type: Actions.SET_COACHING_LOADING, payload: false });
    }
  }, [dispatch]);

  const handleExerciseChange = useCallback((exercise) => {
  dispatch({ type: Actions.SET_EXERCISE, payload: exercise });
}, [dispatch]);

  // ── Start session ──────────────────────────────────────────────────────────
  const startSession = useCallback(async () => {
    dispatch({ type: Actions.SET_WS_STATUS,  payload: 'connecting' });
    dispatch({ type: Actions.SET_REP_COUNT,  payload: 0 });
    dispatch({ type: Actions.SET_FORM_SCORE, payload: 100 });
    // Clear any previous coaching card
    dispatch({ type: Actions.SET_COACHING_TEXT,    payload: '' });
    dispatch({ type: Actions.SET_COACHING_LOADING, payload: false });

    // 1. Start camera
    const cameraOk = await startCamera();
    if (!cameraOk) {
      dispatch({ type: Actions.SET_WS_STATUS, payload: 'disconnected' });
      return;
    }

    // 2. Fetch LLM start line — non-fatal if it fails
    let startLine = "Come on, let's gym!";
    try {
      const res = await api.get('/workout/voice/start');
      startLine = res.data.line;
    } catch (err) {
      console.warn('Could not fetch start line:', err);
    }

    // 3. Create session in DB
    let sessionId = null;
    try {
      
      const res = await api.post('/workout/sessions', { exercise: selectedExercise });
      sessionId = res.data.id;
      sessionIdRef.current = sessionId;
      dispatch({ type: Actions.SET_SESSION_ID, payload: sessionId });
    } catch (err) {
      console.error('Failed to create session:', err);
    }

    // 4. Open WebSocket
    dispatch({ type: Actions.SET_SESSION_ACTIVE, payload: true });
    const wsBase = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
    const wsUrl = sessionId
      ? `${wsBase}/ws/pose?exercise=${selectedExercise}&session_id=${sessionId}`
      : `${wsBase}/ws/pose?exercise=${selectedExercise}`;
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => {
      dispatch({ type: Actions.SET_WS_STATUS, payload: 'connected' });
      startFrameLoop();
      speak(startLine);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleMessage(data);
      } catch (e) {
        console.error('Bad WS message:', e);
      }
    };

    ws.onclose = () => {
      dispatch({ type: Actions.SET_WS_STATUS, payload: 'disconnected' });
      stopFrameLoop();
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      dispatch({ type: Actions.SET_WS_STATUS, payload: 'disconnected' });
    };
  }, [dispatch,selectedExercise]);

  const stopSession = useCallback(async () => {
  // ── Guard: prevent double-fire ──────────────────────────────────────────
  if (isStoppingRef.current) return;
  isStoppingRef.current = true;

  stopFrameLoop();
  stopCamera();

  if (wsRef.current) {
    wsRef.current.close();
    wsRef.current = null;
  }

  if (skeletonRef.current) {
    const ctx = skeletonRef.current.getContext('2d');
    ctx.clearRect(0, 0, skeletonRef.current.width, skeletonRef.current.height);
  }

  // ── Read from refs — always current, no stale closure ───────────────────
  const reps      = repCountRef.current;
  const scoreRaw  = formScoreRef.current;   // 0–100
  const sessionId = sessionIdRef.current;

  // ── Save session to DB ───────────────────────────────────────────────────
  if (sessionId) {
    try {
      await api.patch(`/workout/sessions/${sessionId}/end`, {
        total_reps:     reps,
        avg_form_score: scoreRaw / 100,
      });
    } catch (err) {
      console.error('Failed to end session:', err);
    }
  }

  dispatch({ type: Actions.SET_SESSION_ACTIVE, payload: false });
  dispatch({ type: Actions.SET_WS_STATUS,      payload: 'disconnected' });

  // ── Groq post-set coaching — streams into card AND speaks when done ──────
  if (reps > 0) {
  triggerPostSetCoaching(selectedExercise, reps, scoreRaw / 100, []);
  }

  // ── Reset refs for next session ──────────────────────────────────────────
  repCountRef.current   = 0;
  formScoreRef.current  = 100;
  sessionIdRef.current  = null;
  isStoppingRef.current = false;

}, [dispatch, selectedExercise, triggerPostSetCoaching]);
// ↑ No more workoutState.* in deps — reads from refs instead

  
  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-white pt-16">
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-black text-white">Training Session</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {sessionActive
                ? `Tracking: ${selectedExercise.charAt(0).toUpperCase() + selectedExercise.slice(1)}`
                : 'AI-powered real-time coaching'}
            </p>
          </div>
          <StatusBadge status={wsStatus} />
        </div>

        {/* ── 3-column grid: [left | video | right] ── */}
        <div className="grid grid-cols-[240px_1fr_240px] gap-4 items-start">

          {/* ══ LEFT COLUMN — Exercise Selector ══ */}
          <div className="flex flex-col gap-4">
            <ExerciseSelector
              selected={selectedExercise}
              onChange={handleExerciseChange}
              disabled={sessionActive}
            />
            {/* Tip box */}
            <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
              <p className="text-sky-400/80 text-xs leading-relaxed">
                <span className="font-bold text-sky-400">Tip:</span> Position
                yourself 2–3 metres from the camera so your full body is visible.
              </p>
            </div>
          </div>

          {/* ══ CENTER COLUMN — Video + Buttons + CoachCard ══ */}
          <div className="flex flex-col gap-4">

            {/* Video */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 aspect-video">
              {!sessionActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-slate-950/80 backdrop-blur-sm">
                  <div className="w-16 h-16 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 10l4.553-2.069A1 1 0 0121 8.82V15.18a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                    </svg>
                  </div>
                  <p className="text-slate-300 font-semibold">Camera inactive</p>
                  <p className="text-slate-500 text-sm mt-1">Press Start Session to begin</p>
                </div>
              )}

              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
  
  {/* Camera feed */}
  <video
    ref={videoRef}
    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
    muted
    playsInline
    autoPlay
  />

  {/* Hidden canvas for capturing frames to send to WebSocket */}
  <canvas
    ref={frameRef}
    style={{ display: 'none' }}
    aria-hidden="true"
  />

  {/* Skeleton overlay */}
  <canvas
    ref={skeletonRef}
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      background: 'transparent',
    }}
    aria-hidden="true"
  />

</div>

              {sessionActive && wsStatus === 'connected' && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-slate-950/70 backdrop-blur px-2.5 py-1 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-400 text-xs font-bold">LIVE</span>
                </div>
              )}
            </div>

            {/* Start / Stop buttons */}
            <div className="flex gap-3">
              <button onClick={startSession} disabled={sessionActive}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-sky-500 hover:bg-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.4)] hover:shadow-[0_0_30px_rgba(14,165,233,0.7)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Start Session
              </button>

              <button onClick={stopSession} disabled={!sessionActive}
                className="flex-1 py-3 rounded-xl font-bold text-slate-300 border border-slate-700 hover:border-red-500/50 hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
                Stop Session
              </button>
            </div>

            
            
          </div>

          {/* ══ RIGHT COLUMN — Reps + Form + Coach + Status ══ */}
          <div className="flex flex-col gap-4">

            {/* Rep Counter */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(14,165,233,0.05)]">
              <RepCounter count={repCount} />
            </div>

            {/* Form Score */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
              <FormScoreMeter score={formScore} />
            </div>

            {/* AI Coach Says */}
<div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
  <div className="text-xs font-semibold tracking-widest uppercase text-slate-400 mb-3">
    AI Coach Says
  </div>
  <div className="min-h-[56px] flex items-center">
    {coachingLoading && !coachingText ? (
      <p className="text-slate-400 text-sm italic animate-pulse">
        Analysing your set…
      </p>
    ) : coachingText ? (
      <p className="text-sky-300 text-sm font-medium leading-relaxed">
        {coachingText}
        {coachingLoading && (
          <span className="inline-block w-1.5 h-4 bg-sky-400 ml-0.5 animate-pulse align-middle" />
        )}
      </p>
    ) : lastCue ? (
      <p className="text-sky-300 text-sm font-medium leading-relaxed italic">"{lastCue}"</p>
    ) : (
      <p className="text-slate-600 text-sm italic">
        {sessionActive ? 'Listening for cues…' : 'Start a session to hear coaching tips.'}
      </p>
    )}
  </div>
</div>
            

            {/* Status + Mode */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-center">
                <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Status</div>
                <div className="text-sm font-bold text-sky-400">
                  {wsStatus === 'connected' ? 'Tracking' : wsStatus === 'connecting' ? 'Starting…' : 'Idle'}
                </div>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-center">
                <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Mode</div>
                <div className="text-sm font-bold text-sky-400">Real-time</div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <VoiceCoach cue={lastCue} />
    </div>
  );
}