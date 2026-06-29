import { useEffect, useRef } from 'react';
import { speakText } from '../utils/speech';

export default function VoiceCoach({ cue }) {
  const lastCueRef = useRef(cue);
  const voicesRef  = useRef([]);

  useEffect(() => {
    function loadVoices() {
      voicesRef.current = window.speechSynthesis?.getVoices() || [];
    }
    loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
  }, []);

  useEffect(() => {
    if (!cue || cue === lastCueRef.current) return;
    lastCueRef.current = cue;
    speakText(cue, voicesRef.current);
  }, [cue]);

  return null;
}