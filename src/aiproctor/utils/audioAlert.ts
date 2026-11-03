// Web Audio API Synthesizer for Proctoring Warning Bleeps
// Generates clear, audible, non-harsh alert tones across all modern browsers without external audio assets.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playWarningBeep(severity: 'low' | 'medium' | 'high' | 'technical' = 'high'): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().then(() => playBeepSequence(ctx, severity)).catch(() => {});
    } else {
      playBeepSequence(ctx, severity);
    }
  } catch (err) {
    console.warn('Audio alert warning sound blocked or delayed by browser policy:', err);
  }
}

function playBeepSequence(ctx: AudioContext, severity: 'low' | 'medium' | 'high' | 'technical'): void {
  const now = ctx.currentTime;

  if (severity === 'high') {
    // Sharp dual-pulse alert (880Hz -> 880Hz) for critical violations (tab switch, window blur, prohibited key)
    createTone(ctx, now, 880, 0.12, 0.25);
    createTone(ctx, now + 0.16, 988, 0.15, 0.3);
  } else if (severity === 'technical') {
    // Single subtle reminder tone (520Hz)
    createTone(ctx, now, 520, 0.18, 0.15);
  } else {
    // Standard single alert tone (740Hz)
    createTone(ctx, now, 740, 0.15, 0.2);
  }
}

function createTone(
  ctx: AudioContext,
  startTime: number,
  freq: number,
  duration: number,
  maxGain: number
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, startTime);

  // Soft attack and decay to prevent acoustic speaker clicking
  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.exponentialRampToValueAtTime(maxGain, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

