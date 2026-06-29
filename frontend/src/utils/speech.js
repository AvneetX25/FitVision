let keepAliveTimer = null;

export function speakText(text, voices = []) {
  if (!text || !window.speechSynthesis) return;

  // Cancel anything playing + clear old keep-alive
  window.speechSynthesis.cancel();
  clearInterval(keepAliveTimer);

  const utterance  = new SpeechSynthesisUtterance(text);
  utterance.rate   = 1.05;
  utterance.pitch  = 1.0;
  utterance.volume = 1.0;

  const preferred  = voices.find(v =>
    v.name.includes('Google US English') ||
    v.name.includes('Samantha') ||
    v.name.includes('Daniel')
  );
  utterance.voice  = preferred || voices[0] || null;

  // Chrome 15s stall fix — only runs while actively speaking
  utterance.onstart = () => {
    keepAliveTimer = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        clearInterval(keepAliveTimer);
        return;
      }
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }, 10_000);
  };

  utterance.onend   = () => clearInterval(keepAliveTimer);
  utterance.onerror = (e) => {
    clearInterval(keepAliveTimer);
    console.warn('SpeechSynthesis error:', e.error);
  };

  // 50ms delay — fixes Chrome first-call silence
  setTimeout(() => window.speechSynthesis.speak(utterance), 50);
}