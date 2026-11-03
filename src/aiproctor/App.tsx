import React, { useState, useEffect } from 'react';
import { Examination, ExamAttempt, ProctoringSession } from './types/index.js';
import { api } from './services/api.js';
import { Navbar, AppView } from './components/common/Navbar.js';
import { SystemCheck } from './components/exam/SystemCheck.js';
import { ConsentModal } from './components/exam/ConsentModal.js';
import { StandaloneProctorRoom } from './components/exam/StandaloneProctorRoom.js';
import { WebcamMonitor } from './components/exam/WebcamMonitor.js';
import { AdminDashboard } from './components/admin/AdminDashboard.js';
import { EmbedPlayground } from './components/embed/EmbedPlayground.js';
import { useWebcam } from './hooks/useWebcam.js';
import { useProctoringStream } from './hooks/useProctoringStream.js';
import { useScreenShare } from './hooks/useScreenShare.js';

type StudentExamStep = 'SYSTEM_CHECK' | 'CONSENT' | 'EXAM_ROOM';

export function App() {
  const [currentView, setCurrentView] = useState<AppView>('candidate');
  const [studentStep, setStudentStep] = useState<StudentExamStep>('SYSTEM_CHECK');
  const [examination, setExamination] = useState<Examination | null>(null);
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [session, setSession] = useState<ProctoringSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize camera hook
  const {
    videoRef,
    stream,
    isReady: isCameraReady,
    error: cameraError,
    startCamera,
  } = useWebcam({ requireAudio: true });

  // Initialize screen sharing & process defense hook
  const {
    screenStream,
    isScreenSharing,
    displaySurface,
    isDisplaySurfaceValid,
    isEntireScreen,
    hasVirtualDevice,
    virtualDevices,
    isMultiMonitor,
    isScreenTerminated,
    screenLogs,
    error: screenError,
    advisory: screenAdvisory,
    startScreenShare,
    stopScreenShare,
    recheckDevices,
    resetTermination,
    captureScreenLog,
  } = useScreenShare();

  // Initialize real-time proctoring stream hook
  const {
    latestAiResponse,
    suspectDeviceAlert,
    dismissDeviceAlert,
    warnings,
    latencyMs,
    fps,
    tabSwitchCount,
    windowSwitchCount,
    fullscreenExitCount,
    isWindowFocused,
    isTabVisible,
    isFullscreen,
    enterFullscreen,
    dismissWarning,
  } = useProctoringStream(
    session?.id || null,
    examination?.id || null,
    videoRef,
    isCameraReady && studentStep === 'EXAM_ROOM',
    1500,
    isScreenTerminated
  );

  // Load examination data on mount
  useEffect(() => {
    const init = async () => {
      try {
        const exams = await api.getExaminations();
        if (exams.length > 0) {
          const defaultExam = exams[0];
          setExamination(defaultExam);
        }
      } catch (err) {
        console.error('Failed to initialize examination data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
    startCamera();
  }, [startCamera]);

  // Ensure camera is active if student lands or refreshes directly in EXAM_ROOM
  useEffect(() => {
    if (studentStep === 'EXAM_ROOM' && !stream && !cameraError) {
      startCamera();
    }
  }, [studentStep, stream, cameraError, startCamera]);

  // Handle student consent agreement -> start attempt & session (Policy: Allow all candidates in, log all telemetry)
  const handleAgreeAndEnterExam = async () => {
    if (!examination) return;

    try {
      // 1. Immediately request Fullscreen on user agreement gesture
      enterFullscreen();

      setIsLoading(true);
      const res = await api.startAttempt(examination.id, {
        browser: navigator.userAgent,
        screen: `${window.innerWidth}x${window.innerHeight}`,
      });
      setAttempt(res.attempt);
      setSession(res.session);

      // Capture initial screen log if active
      if (isScreenSharing && res.session?.id) {
        captureScreenLog(res.session.id);
      }

      setStudentStep('EXAM_ROOM');
    } catch (err: any) {
      alert(`Failed to start attempt: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConcludeSession = async () => {
    if (confirm('Conclude active proctoring session?')) {
      stopScreenShare();
      setStudentStep('SYSTEM_CHECK');
    }
  };

  if (isLoading && !examination) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Initializing AI Proctor Secure Session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      {/* Top Universal Navbar */}
      <Navbar
        currentView={currentView}
        onViewChange={(view) => setCurrentView(view)}
        examTitle={examination?.title}
      />

      {/* Main Views */}
      <main>
        {currentView === 'embed' ? (
          /* Developer Embed & Integration Playground */
          <EmbedPlayground />
        ) : currentView === 'invigilator' ? (
          /* Invigilator Command Center */
          <AdminDashboard />
        ) : (
          /* Candidate Standalone Proctoring Room */
          <div>
            {studentStep === 'SYSTEM_CHECK' && (
              <SystemCheck
                videoRef={videoRef}
                stream={stream}
                isCameraReady={isCameraReady}
                cameraError={cameraError}
                onRetryCamera={startCamera}
                screenStream={screenStream}
                isScreenSharing={isScreenSharing}
                isDisplaySurfaceValid={isDisplaySurfaceValid}
                isEntireScreen={isEntireScreen}
                hasVirtualDevice={hasVirtualDevice}
                virtualDevices={virtualDevices}
                screenError={screenError}
                advisory={screenAdvisory}
                onStartScreenShare={startScreenShare}
                onRecheckDevices={recheckDevices}
                onPassed={() => setStudentStep('CONSENT')}
              />
            )}

            {studentStep === 'CONSENT' && examination && (
              <ConsentModal
                examTitle={examination.title}
                durationMinutes={examination.duration_minutes}
                onAgreeAndStart={handleAgreeAndEnterExam}
              />
            )}

            {studentStep === 'EXAM_ROOM' && examination && attempt && (
              <>
                {/* Fullscreen Alert Banner when candidate exits fullscreen */}
                {!isFullscreen && (
                  <div className="fixed top-14 left-0 right-0 z-40 bg-gradient-to-r from-red-600 to-amber-600 text-white px-4 py-2 shadow-xl flex items-center justify-between border-b border-red-700">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
                      <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                      <span>⚠️ Fullscreen Mode Required: Fullscreen is mandatory throughout the examination.</span>
                    </div>
                    <button
                      onClick={enterFullscreen}
                      className="rounded-lg bg-white px-3 py-1 text-xs font-bold text-red-700 shadow hover:bg-slate-100 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      Enter Fullscreen ⛶
                    </button>
                  </div>
                )}

                {/* Standalone Proctor Workspace (No mock questions!) */}
                <StandaloneProctorRoom
                  examination={examination}
                  attempt={attempt}
                  session={session}
                  isFullscreen={isFullscreen}
                  onEnterFullscreen={enterFullscreen}
                  onConcludeSession={handleConcludeSession}
                  tabSwitchCount={tabSwitchCount}
                  windowSwitchCount={windowSwitchCount}
                  fullscreenExitCount={fullscreenExitCount}
                  suspectDeviceAlert={suspectDeviceAlert}
                  onDismissDeviceAlert={dismissDeviceAlert}
                  isScreenSharing={isScreenSharing}
                  isScreenTerminated={isScreenTerminated}
                  onReStartScreenShare={startScreenShare}
                />

                {/* Floating Real-Time Webcam Monitor & AI Status Overlay */}
                <WebcamMonitor
                  videoRef={videoRef}
                  stream={stream}
                  isCameraReady={isCameraReady}
                  aiResponse={latestAiResponse}
                  warnings={warnings}
                  onDismissWarning={dismissWarning}
                  latencyMs={latencyMs}
                  fps={fps}
                  tabSwitchCount={tabSwitchCount}
                  windowSwitchCount={windowSwitchCount}
                  isWindowFocused={isWindowFocused}
                  isTabVisible={isTabVisible}
                />
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

