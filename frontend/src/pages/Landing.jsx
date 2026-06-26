// Landing.jsx — High-quality animated landing page
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/* ── Floating particle background ── */
function ParticleField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let raf;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const COUNT = 60;
    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56,189,248,${p.alpha})`;
        ctx.fill();
      });

      // Draw lines between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(56,189,248,${0.08 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}

/* ── Animated counter ── */
function AnimCounter({ target, duration = 1800, suffix = '' }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      obs.disconnect();
      const start = performance.now();
      function tick(now) {
        const t = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        setVal(Math.round(ease * target));
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    if (el) obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ── Feature card ── */
function FeatureCard({ icon, title, desc, delay }) {
  return (
    <div
      className="group relative p-6 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm hover:border-sky-500/40 transition-all duration-500 hover:shadow-[0_0_40px_rgba(14,165,233,0.12)] overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Corner glow on hover */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative">
        <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* ── Skeleton animation SVG ── */
function SkeletonDemo() {
  return (
    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900 border border-slate-800">
      {/* Simulated video feed bg */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-950" />

      {/* Skeleton overlay SVG */}
      <svg viewBox="0 0 320 240" className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {/* Body skeleton - squatting pose */}
        <style>{`
          @keyframes skel-pulse { 0%,100% { opacity:0.7; } 50% { opacity:1; } }
          @keyframes skel-move {
            0%   { transform: translateY(0px); }
            25%  { transform: translateY(-8px); }
            50%  { transform: translateY(0px); }
            75%  { transform: translateY(-4px); }
            100% { transform: translateY(0px); }
          }
          .skel { animation: skel-pulse 2s ease-in-out infinite; stroke: #38bdf8; stroke-width: 3; fill: none; stroke-linecap: round; }
          .skel-group { animation: skel-move 3s ease-in-out infinite; transform-origin: 160px 120px; }
        `}</style>

        <g className="skel-group">
          {/* Head */}
          <circle className="skel" cx="160" cy="60" r="18" />
          {/* Neck to torso */}
          <line className="skel" x1="160" y1="78" x2="160" y2="130" />
          {/* Shoulders */}
          <line className="skel" x1="160" y1="90" x2="120" y2="105" />
          <line className="skel" x1="160" y1="90" x2="200" y2="105" />
          {/* Left arm */}
          <line className="skel" x1="120" y1="105" x2="100" y2="140" />
          <line className="skel" x1="100" y1="140" x2="95" y2="168" />
          {/* Right arm */}
          <line className="skel" x1="200" y1="105" x2="220" y2="140" />
          <line className="skel" x1="220" y1="140" x2="225" y2="168" />
          {/* Hips */}
          <line className="skel" x1="160" y1="130" x2="135" y2="145" />
          <line className="skel" x1="160" y1="130" x2="185" y2="145" />
          {/* Left leg */}
          <line className="skel" x1="135" y1="145" x2="118" y2="185" />
          <line className="skel" x1="118" y1="185" x2="112" y2="215" />
          {/* Right leg */}
          <line className="skel" x1="185" y1="145" x2="202" y2="185" />
          <line className="skel" x1="202" y1="185" x2="208" y2="215" />
          {/* Joint dots */}
          {[[160,60],[160,90],[120,105],[200,105],[100,140],[220,140],[95,168],[225,168],[160,130],[135,145],[185,145],[118,185],[202,185],[112,215],[208,215]].map(([x,y],i) => (
            <circle key={i} className="skel" cx={x} cy={y} r="4" fill="#38bdf8" />
          ))}
        </g>
      </svg>

      {/* HUD overlays */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-slate-950/70 backdrop-blur px-2.5 py-1 rounded-full">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-green-400 text-xs font-bold">LIVE</span>
      </div>
      <div className="absolute top-3 right-3 bg-slate-950/70 backdrop-blur px-2.5 py-1 rounded-full">
        <span className="text-sky-400 text-xs font-mono font-bold">AI TRACKING</span>
      </div>
      <div className="absolute bottom-3 left-3 right-3 bg-slate-950/80 backdrop-blur rounded-xl p-3">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-white text-2xl font-black">12 <span className="text-sky-400 text-xs font-bold tracking-widest">REPS</span></div>
            <div className="text-slate-400 text-xs">Form Score</div>
          </div>
          <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full w-[88%] bg-green-400 rounded-full" style={{boxShadow:'0 0 8px rgba(34,197,94,0.8)'}} />
          </div>
          <div className="text-green-400 font-black text-xl">88%</div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Landing Component ── */
export default function Landing() {
  const features = [
    {
      icon: <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82V15.18a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>,
      title: 'Real-Time AI Vision',
      desc: 'Computer vision tracks every joint, every movement at 30fps — no wearables needed. Just your camera.',
    },
    {
      icon: <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z" /></svg>,
      title: 'Voice Coaching via LLM',
      desc: 'An AI coach powered by large language models speaks to you mid-rep. Instant, context-aware corrections.',
    },
    {
      icon: <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
      title: 'Session Analytics',
      desc: 'Every workout logged. Track form scores, rep counts, and progress trends over time with rich dashboards.',
    },
    {
      icon: <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      title: 'Leaderboard & Competition',
      desc: 'Compete globally or with friends. Weekly challenges, personal bests, and real-time rankings keep you motivated.',
    },
    {
      icon: <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
      title: 'Zero Setup Required',
      desc: 'Open your browser, hit Start Session. The AI calibrates instantly — no apps to install, no hardware to buy.',
    },
    {
      icon: <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
      title: 'Form Safety Scoring',
      desc: 'A live 0–100 form score warns you before injury happens. Green means go, red means stop and adjust.',
    },
  ];

  const stats = [
    { value: 50000, suffix: '+', label: 'Sessions Tracked' },
    { value: 98, suffix: '%', label: 'Form Accuracy' },
    { value: 120, suffix: '+', label: 'Exercises Supported' },
    { value: 4.9, suffix: '★', label: 'User Rating', fixed: 1 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-16">
        <ParticleField />

        {/* Radial gradient behind hero text */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(14,165,233,0.12),transparent)] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400 text-sm font-semibold mb-8 mt-12 animate-[fadeInDown_0.8s_ease_forwards]">
            <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            Powered by Computer Vision + LLM Voice Coaching
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight mb-6">
            <span className="block text-white" style={{animation:'fadeInUp 0.8s ease 0.1s both'}}>
              Your AI Gym
            </span>
            <span
              className="block"
              style={{
                animation:'fadeInUp 0.8s ease 0.25s both',
                background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 40%, #7dd3fc 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Coach. Live.
            </span>
          </h1>

          <p
            className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10"
            style={{animation:'fadeInUp 0.8s ease 0.4s both'}}
          >
            FitVision watches your movements in real time, counts your reps, scores your form, and speaks corrections
            directly to you ,like a personal trainer who never sleeps.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            style={{animation:'fadeInUp 0.8s ease 0.55s both'}}
          >
            <Link
              to="/register"
              className="px-8 py-4 rounded-xl font-bold text-lg bg-sky-500 hover:bg-sky-400 text-white shadow-[0_0_30px_rgba(14,165,233,0.5)] hover:shadow-[0_0_50px_rgba(14,165,233,0.8)] transition-all duration-300 hover:-translate-y-0.5"
            >
              Start Training Free
            </Link>
            <Link
              to="/workout"
              className="px-8 py-4 rounded-xl font-bold text-lg border border-slate-700 text-slate-300 hover:border-sky-500 hover:text-white transition-all duration-300 hover:-translate-y-0.5"
            >
              Watch Demo →
            </Link>
          </div>
        </div>

        {/* Hero visual */}
        <div
          className="relative z-10 mt-16 w-full max-w-3xl mx-auto px-4"
          style={{animation:'fadeInUp 0.8s ease 0.7s both'}}
        >
          <div className="relative">
            {/* Glow behind the demo */}
            <div className="absolute -inset-4 bg-sky-500/10 rounded-3xl blur-2xl" />
            <SkeletonDemo />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-50">
          <span className="text-xs text-slate-500 tracking-widest uppercase">Scroll</span>
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        <style>{`
          @keyframes fadeInDown { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }
          @keyframes fadeInUp   { from { opacity:0; transform:translateY(30px);  } to { opacity:1; transform:translateY(0); } }
        `}</style>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 border-y border-slate-800 bg-slate-900/30">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ value, suffix, label, fixed }) => (
            <div key={label} className="text-center">
              <div className="text-4xl font-black text-sky-400 mb-1">
                {fixed ? value.toFixed(fixed) : <AnimCounter target={value} />}
                {suffix}
              </div>
              <div className="text-slate-400 text-sm font-medium">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sky-400 text-sm font-bold tracking-widest uppercase">Everything You Need</span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mt-3 mb-4">
              The Complete AI Fitness Stack
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              We built the gym coach that doesn't exist yet one that sees you, hears your needs, and adapts in milliseconds.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <FeatureCard key={f.title} {...f} delay={i * 80} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-4 bg-slate-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-sky-400 text-sm font-bold tracking-widest uppercase">How It Works</span>
            <h2 className="text-4xl font-black text-white mt-3">Three Steps to Better Form</h2>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden md:block absolute left-[50%] top-8 bottom-8 w-px bg-gradient-to-b from-sky-500/50 to-transparent" />

            <div className="space-y-12">
              {[
                { step: '01', title: 'Enable Camera', desc: 'Grant camera access. FitAI initialises pose detection instantly — all processing happens client-side.' },
                { step: '02', title: 'Start Session', desc: 'Hit Start. The AI begins tracking your body, counting reps, and scoring your form in real time.' },
                { step: '03', title: 'Get Coached', desc: 'Your AI coach speaks to you between reps using LLM-generated, context-aware instructions. Correct and improve.' },
              ].map(({ step, title, desc }, i) => (
                <div
                  key={step}
                  className={`flex items-center gap-8 ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
                >
                  <div className="flex-1 p-6 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur">
                    <div className="text-sky-500/30 text-6xl font-black leading-none mb-2">{step}</div>
                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                  </div>
                  <div className="hidden md:flex w-8 h-8 rounded-full bg-sky-500 items-center justify-center shadow-[0_0_20px_rgba(14,165,233,0.6)] shrink-0 z-10">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  <div className="hidden md:block flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4 ">
        <div className="max-w-2xl mx-auto text-center relative rounded-xl border border-slate-700 px-10 py-4">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,rgba(14,165,233,0.15),transparent)] pointer-events-none" />
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 relative">
            Ready to train smarter?
          </h2>
          <p className="text-slate-400 text-lg mb-8 relative">
            Join thousands already training with AI-powered coaching. No gym membership. No hardware. Just results.
          </p>
          <Link
            to="/register"
            className="inline-block px-10 py-4 rounded-xl font-bold text-lg bg-sky-500 hover:bg-sky-400 text-white shadow-[0_0_40px_rgba(14,165,233,0.5)] hover:shadow-[0_0_60px_rgba(14,165,233,0.8)] transition-all duration-300 hover:-translate-y-1"
          >
            Create Free Account →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800 py-8 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-md bg-sky-500 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth="2.5">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinejoin="round" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-black text-white">FIT<span className="text-sky-400">VISION</span></span>
        </div>
        <p className="text-slate-600 text-sm">© 2026 FitVision. All rights reserved.</p>
      </footer>
    </div>
  );
}
