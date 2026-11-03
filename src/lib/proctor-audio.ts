/**
 * Web Audio API Synthesizer for AI Proctoring Warning Alerts
 * Adapted from mukulpandey220/aiproctor
 * Generates clear, audible, multi-frequency alert tones without external audio assets.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playProctorWarningBeep(
  severity: "low" | "medium" | "high" | "technical" = "high"
): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx
        .resume()
        .then(() => playBeepSequence(ctx, severity))
        .catch(() => {});
    } else {
      playBeepSequence(ctx, severity);
    }
  } catch (err) {
    console.warn("Proctor audio warning tone blocked or delayed by browser policy:", err);
  }
}

function playBeepSequence(
  ctx: AudioContext,
  severity: "low" | "medium" | "high" | "technical"
): void {
  const now = ctx.currentTime;

  if (severity === "high") {
    // Sharp dual-pulse alert (880Hz -> 988Hz) for critical violations (tab switch, window blur, multi-face)
    createTone(ctx, now, 880, 0.12, 0.25);
    createTone(ctx, now + 0.16, 988, 0.15, 0.3);
  } else if (severity === "technical") {
    // Single subtle reminder tone (520Hz) for lighting or edge proximity
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

  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, startTime);

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(maxGain, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}
