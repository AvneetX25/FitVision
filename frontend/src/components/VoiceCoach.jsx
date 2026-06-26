import { useEffect, useRef } from 'react';

export default function VoiceCoach({ cue }) {
  const lastCueRef   = useRef('');
  const voicesRef    = useRef([]);
  const keepAliveRef = useRef(null);

  // ── Load voices (Chrome loads them async) ─────────────────────────────────
  useEffect(() => {
    function loadVoices() {
      voicesRef.current = window.speechSynthesis?.getVoices() || [];
    }

    loadVoices(); // works immediately in Firefox
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices); // needed for Chrome

    return () => {
      window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  // ── Chrome keep-alive: ping every 10s so engine doesn't go idle ───────────
  useEffect(() => {
    function startKeepAlive() {
      keepAliveRef.current = setInterval(() => {
        if (window.speechSynthesis?.speaking) return; // already active, skip
        // Speak a silent utterance to keep the engine warm
        const silent = new SpeechSynthesisUtterance(' ');
        silent.volume = 0;
        window.speechSynthesis.speak(silent);
      }, 10_000);
    }

    startKeepAlive();
    return () => clearInterval(keepAliveRef.current);
  }, []);

  // ── Speak on new cue ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!cue || cue === lastCueRef.current) return;
    lastCueRef.current = cue;

    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utterance   = new SpeechSynthesisUtterance(cue);
    utterance.rate    = 1.05;
    utterance.pitch   = 1.0;
    utterance.volume  = 1.0;

    // Prefer a natural English voice; fall back to whatever is available
    const voices      = voicesRef.current;
    const preferred   = voices.find(v =>
      v.name.includes('Google US English') ||
      v.name.includes('Samantha') ||          // macOS
      v.name.includes('Daniel')               // macOS UK
    );
    utterance.voice   = preferred || voices[0] || null;

    utterance.onerror = (e) => console.warn('SpeechSynthesis error:', e.error);

    window.speechSynthesis.speak(utterance);
  }, [cue]);

  return null;
}