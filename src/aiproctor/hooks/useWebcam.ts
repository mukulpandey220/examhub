import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseWebcamOptions {
  requireAudio?: boolean;
  onTrackEnded?: () => void;
}

export function useWebcam(options: UseWebcamOptions = {}) {
  const { requireAudio = false, onTrackEnded } = options;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Directly derive readiness from whether the stream is active and has a live video track
  const isReady = Boolean(
    stream &&
    stream.active &&
    stream.getVideoTracks().some((t) => t.readyState === 'live')
  );

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam mediaDevices API is not supported in this browser.');
      }

      // If existing stream is active and alive, reuse it and bind immediately
      const activeStream = streamRef.current || stream;
      if (activeStream && activeStream.active && activeStream.getVideoTracks().some((t) => t.readyState === 'live')) {
        setHasPermission(true);
        if (videoRef.current) {
          videoRef.current.muted = true;
          if (videoRef.current.srcObject !== activeStream) {
            videoRef.current.srcObject = activeStream;
          }
          videoRef.current.play().catch(console.warn);
        }
        return;
      }

      // Request media with audio fallback so missing/denied microphone does not block the webcam
      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 15, max: 30 },
            facingMode: 'user',
          },
          audio: requireAudio,
        });
      } catch (errWithAudio) {
        if (requireAudio) {
          console.warn('Audio+Video request failed, falling back to camera-only:', errWithAudio);
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 15, max: 30 },
              facingMode: 'user',
            },
            audio: false,
          });
        } else {
          throw errWithAudio;
        }
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.muted = true;
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(console.warn);
      }

      // Track listener for hardware disconnect
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          setError('Camera video track disconnected.');
          if (onTrackEnded) onTrackEnded();
        };
      }
    } catch (err: any) {
      setHasPermission(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission was denied. Please grant webcam access in your browser settings to continue.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No webcam device detected on your computer.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Webcam is currently locked by another application (e.g., Zoom, Teams, or FaceTime). Please close other apps and retry.');
      } else {
        setError(err.message || 'Failed to initialize webcam.');
      }
    }
  }, [requireAudio, onTrackEnded, stream]);

  // Synchronize stream with whatever video element videoRef currently points to whenever rendered
  useEffect(() => {
    const video = videoRef.current;
    const currentStream = streamRef.current || stream;
    if (video && currentStream) {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      if (video.srcObject !== currentStream) {
        video.srcObject = currentStream;
        video.play().catch(console.warn);
      } else if (video.paused) {
        video.play().catch(console.warn);
      }
    }
  });

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStream(null);
  }, []);

  // Teardown hardware tracks ONLY when the hook unmounts entirely (prevent StrictMode kills)
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    stream,
    isReady,
    hasPermission,
    error,
    startCamera,
    stopCamera,
  };
}
