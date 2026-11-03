/**
 * AI Proctor Standalone Embeddable SDK v1.2.0
 * Universal drop-in proctoring shield for any website, LMS, or examination platform.
 * (C) 2026 AI Proctor Platform
 */
(function (global) {
  'use strict';

  // Prevent multiple instantiations
  if (global.AIProctor && global.AIProctor.initialized) {
    return;
  }

  const STATE = {
    initialized: false,
    active: false,
    config: {
      apiKey: '',
      sessionId: '',
      examId: 'default-exam',
      candidateName: 'Candidate',
      backendUrl: '',
      enforceFullscreen: true,
      blockShortcuts: true,
      enableBeep: true,
      sampleIntervalMs: 1500,
    },
    stream: null,
    videoEl: null,
    audioCtx: null,
    sampleTimer: null,
    tabSwitchCount: 0,
    windowSwitchCount: 0,
    fullscreenExitCount: 0,
    lastDeviceAlert: 0,
    noFaceStartTime: null,
    noFaceAlertDispatched: false,
    isTabVisible: true,
    isWindowFocused: true,
    violations: [],
    listeners: [],
    callbacks: {
      onViolation: null,
      onReady: null,
    },
  };

  // --- Web Audio API Warning Tone Synthesizer ---
  function playWarningBeep(severity) {
    if (!STATE.config.enableBeep) return;
    try {
      if (!STATE.audioCtx) {
        const AudioContextClass = global.AudioContext || global.webkitAudioContext;
        if (AudioContextClass) {
          STATE.audioCtx = new AudioContextClass();
        }
      }
      if (!STATE.audioCtx) return;
      if (STATE.audioCtx.state === 'suspended') {
        STATE.audioCtx.resume();
      }

      const now = STATE.audioCtx.currentTime;
      const osc = STATE.audioCtx.createOscillator();
      const gain = STATE.audioCtx.createGain();

      osc.connect(gain);
      gain.connect(STATE.audioCtx.destination);

      if (severity === 'high') {
        // High severity: Sharp dual-pulse 880Hz alert
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(880, now + 0.1);
        osc.frequency.setValueAtTime(880, now + 0.2);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        gain.gain.setValueAtTime(0.4, now + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.start(now);
        osc.stop(now + 0.3);
      } else {
        // Medium severity: Single softer 520Hz pulse
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.22);
      }
    } catch (e) {
      // Audio play blocked by policy
    }
  }

  // --- Scoped CSS Styles Injection ---
  function injectStyles() {
    if (document.getElementById('aiproctor-styles')) return;
    const style = document.createElement('style');
    style.id = 'aiproctor-styles';
    style.textContent = `
      #aiproctor-root {
        all: initial;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        box-sizing: border-box;
      }
      #aiproctor-root *, #aiproctor-root *::before, #aiproctor-root *::after {
        box-sizing: border-box;
      }
      .aiproctor-widget-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 2147483640;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 8px;
        pointer-events: none;
      }
      .aiproctor-toast-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        width: 320px;
        pointer-events: auto;
      }
      .aiproctor-toast {
        background: rgba(220, 38, 38, 0.95);
        color: #ffffff;
        padding: 10px 14px;
        border-radius: 10px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        font-size: 12px;
        line-height: 1.4;
        animation: aiproctor-slidein 0.25s ease-out;
        backdrop-filter: blur(8px);
      }
      .aiproctor-toast.medium {
        background: rgba(217, 119, 6, 0.95);
      }
      .aiproctor-toast-btn {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.8);
        cursor: pointer;
        font-weight: bold;
        font-size: 13px;
        margin-left: 8px;
      }
      .aiproctor-card {
        width: 290px;
        background: rgba(15, 23, 42, 0.94);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 16px;
        padding: 8px;
        box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(12px);
        pointer-events: auto;
        color: #f8fafc;
        transition: all 0.2s ease;
      }
      .aiproctor-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 8px 6px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        margin-bottom: 6px;
      }
      .aiproctor-title {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.3px;
      }
      .aiproctor-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #10b981;
        box-shadow: 0 0 8px #10b981;
      }
      .aiproctor-toggle {
        background: transparent;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 2px 4px;
        font-size: 11px;
      }
      .aiproctor-video-box {
        position: relative;
        width: 100%;
        aspect-ratio: 4/3;
        background: #000;
        border-radius: 12px;
        overflow: hidden;
      }
      .aiproctor-video {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transform: scaleX(-1);
      }
      .aiproctor-chip-box {
        position: absolute;
        top: 6px;
        left: 6px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .aiproctor-chip {
        background: rgba(16, 185, 129, 0.85);
        color: #fff;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 700;
      }
      .aiproctor-chip.warn {
        background: rgba(239, 68, 68, 0.88);
      }
      .aiproctor-chip.pulse {
        animation: aiproctor-pulse 1s infinite alternate;
      }
      @keyframes aiproctor-pulse {
        from { opacity: 0.85; transform: scale(0.98); }
        to { opacity: 1; transform: scale(1.02); }
      }
      .aiproctor-chip.amber {
        background: rgba(245, 158, 11, 0.88);
      }
      .aiproctor-chip.blue {
        background: rgba(59, 130, 246, 0.85);
      }
      .aiproctor-footer {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 4px;
        margin-top: 6px;
        text-align: center;
        font-size: 9px;
        color: #94a3b8;
      }
      .aiproctor-stat-box {
        background: rgba(255, 255, 255, 0.05);
        padding: 3px 2px;
        border-radius: 4px;
      }
      .aiproctor-stat-val {
        font-weight: 700;
        color: #f1f5f9;
        font-size: 10px;
        display: block;
      }
      .aiproctor-fullscreen-banner {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 2147483647;
        background: linear-gradient(90deg, #dc2626 0%, #d97706 100%);
        color: #ffffff;
        padding: 10px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 4px 15px rgba(0,0,0,0.4);
        font-size: 13px;
        font-weight: 600;
      }
      .aiproctor-fs-btn {
        background: #ffffff;
        color: #b91c1c;
        border: none;
        padding: 5px 12px;
        border-radius: 6px;
        font-weight: bold;
        cursor: pointer;
        font-size: 12px;
        transition: transform 0.1s;
      }
      .aiproctor-fs-btn:active {
        transform: scale(0.96);
      }
      .aiproctor-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(2, 6, 23, 0.85);
        backdrop-filter: blur(8px);
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        box-sizing: border-box;
      }
      .aiproctor-modal-card {
        background: #0f172a;
        color: #ffffff;
        border: 2px solid #ef4444;
        border-radius: 20px;
        max-width: 480px;
        width: 100%;
        padding: 24px;
        text-align: center;
        box-shadow: 0 25px 50px -12px rgba(239, 68, 68, 0.35);
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .aiproctor-modal-icon {
        width: 60px;
        height: 60px;
        margin: 0 auto 14px auto;
        background: rgba(239, 68, 68, 0.15);
        border: 2px solid #ef4444;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 30px;
      }
      .aiproctor-modal-title {
        font-size: 20px;
        font-weight: 800;
        margin-bottom: 8px;
        color: #ffffff;
      }
      .aiproctor-modal-desc {
        font-size: 13px;
        color: #cbd5e1;
        line-height: 1.5;
        margin-bottom: 16px;
      }
      .aiproctor-modal-box {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 12px;
        padding: 12px;
        font-size: 11px;
        color: #fca5a5;
        text-align: left;
        margin-bottom: 20px;
        line-height: 1.5;
      }
      .aiproctor-modal-btn {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: #ffffff;
        border: none;
        width: 100%;
        padding: 12px 20px;
        border-radius: 12px;
        font-weight: 700;
        font-size: 13px;
        cursor: pointer;
        transition: transform 0.1s;
      }
      .aiproctor-modal-btn:active {
        transform: scale(0.98);
      }
      @keyframes aiproctor-slidein {
        from { transform: translateX(20px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  // --- Push Warning UI & Audio ---
  function pushViolation(violation) {
    STATE.violations.unshift(violation);
    if (STATE.violations.length > 50) STATE.violations.pop();

    // Sound alert
    playWarningBeep(violation.severity || 'high');

    // Invoke user callback if registered
    if (typeof STATE.callbacks.onViolation === 'function') {
      try {
        STATE.callbacks.onViolation(violation);
      } catch (err) {
        console.warn('[AIProctor] onViolation callback error:', err);
      }
    }

    // Render Toast on host DOM
    const toastList = document.getElementById('aiproctor-toasts');
    if (toastList) {
      const toast = document.createElement('div');
      toast.className = `aiproctor-toast ${violation.severity || 'high'}`;
      toast.innerHTML = `
        <div>
          <div style="font-weight: bold; font-size: 11px; text-transform: uppercase; opacity: 0.9;">
            ${(violation.eventType || 'PROCTOR ALERT').replace(/_/g, ' ')}
          </div>
          <div style="margin-top: 2px;">${violation.message || 'Violation recorded.'}</div>
        </div>
        <button class="aiproctor-toast-btn">✕</button>
      `;

      toast.querySelector('.aiproctor-toast-btn').onclick = () => {
        toast.remove();
      };

      toastList.prepend(toast);
      setTimeout(() => {
        if (toast.parentNode) toast.remove();
      }, 7000);
    }
  }

  // --- Suspicious Device Detected Modal Overlay ---
  function showDeviceModal(devLabel, confidence) {
    if (document.getElementById('aiproctor-device-modal')) return;
    const overlay = document.createElement('div');
    overlay.id = 'aiproctor-device-modal';
    overlay.className = 'aiproctor-modal-overlay';
    const confPercent = Math.round((confidence || 0.5) * 100);
    overlay.innerHTML = `
      <div class="aiproctor-modal-card">
        <div class="aiproctor-modal-icon">🚨</div>
        <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #f87171; margin-bottom: 6px;">Security Violation Alert</div>
        <div class="aiproctor-modal-title">Suspicious Device Detected!</div>
        <div class="aiproctor-modal-desc">
          The AI Proctor computer vision engine has identified an unauthorized electronic device (<strong style="color: #ef4444; text-transform: capitalize;">${devLabel}</strong>, confidence: <strong>${confPercent}%</strong>) in your camera field of view.
        </div>
        <div class="aiproctor-modal-box">
          <div style="font-weight: bold; margin-bottom: 4px; color: #fca5a5;">Immediate Corrective Actions Required:</div>
          • Remove all mobile phones, cameras, smartwatches, or tablets from the exam area immediately.<br/>
          • Ensure both hands remain on desk and forward gaze is maintained.<br/>
          • This security event and camera snapshot have been relayed to the exam audit trail.
        </div>
        <button id="aiproctor-modal-dismiss-btn" class="aiproctor-modal-btn">I Have Removed the Device</button>
      </div>
    `;
    document.body.appendChild(overlay);

    const dismissBtn = document.getElementById('aiproctor-modal-dismiss-btn');
    if (dismissBtn) {
      dismissBtn.onclick = () => {
        overlay.remove();
      };
    }
  }

  // --- Build Floating UI Widget ---
  function buildWidget() {
    let root = document.getElementById('aiproctor-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'aiproctor-root';
      document.body.appendChild(root);
    }

    root.innerHTML = `
      <div id="aiproctor-fs-banner" style="display: none;" class="aiproctor-fullscreen-banner">
        <div>⚠️ Fullscreen Mode Required: Please keep the examination in full screen mode.</div>
        <button id="aiproctor-enter-fs-btn" class="aiproctor-fs-btn">Enter Fullscreen ⛶</button>
      </div>

      <div class="aiproctor-widget-container">
        <div id="aiproctor-toasts" class="aiproctor-toast-list"></div>

        <div id="aiproctor-card" class="aiproctor-card">
          <div class="aiproctor-header">
            <div class="aiproctor-title">
              <span class="aiproctor-dot"></span>
              <span>AI Proctor Feed</span>
            </div>
            <button id="aiproctor-toggle-btn" class="aiproctor-toggle" title="Toggle Size">─</button>
          </div>

          <div id="aiproctor-body">
            <div class="aiproctor-video-box">
              <video id="aiproctor-video" class="aiproctor-video" autoplay playsinline muted></video>

              <div class="aiproctor-chip-box">
                <span id="aiproctor-face-chip" class="aiproctor-chip">Camera Connecting...</span>
                <span id="aiproctor-gaze-chip" class="aiproctor-chip blue" style="display: none;">Gaze Centered</span>
                <span id="aiproctor-device-chip" class="aiproctor-chip warn" style="display: none;">🚨 Phone Detected</span>
              </div>
            </div>

            <div class="aiproctor-footer">
              <div class="aiproctor-stat-box">
                <span>Rate</span>
                <span id="aiproctor-rate-stat" class="aiproctor-stat-val">1.0 FPS</span>
              </div>
              <div class="aiproctor-stat-box">
                <span>Focus</span>
                <span id="aiproctor-focus-stat" class="aiproctor-stat-val" style="color: #10b981;">Active</span>
              </div>
              <div class="aiproctor-stat-box">
                <span>Switches</span>
                <span id="aiproctor-switches-stat" class="aiproctor-stat-val">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Toggle minimize
    const toggleBtn = document.getElementById('aiproctor-toggle-btn');
    const bodyEl = document.getElementById('aiproctor-body');
    let isMinimized = false;
    toggleBtn.onclick = () => {
      isMinimized = !isMinimized;
      bodyEl.style.display = isMinimized ? 'none' : 'block';
      toggleBtn.textContent = isMinimized ? '▢' : '─';
    };

    // Fullscreen enter trigger
    const enterFsBtn = document.getElementById('aiproctor-enter-fs-btn');
    enterFsBtn.onclick = () => {
      enterFullscreen();
    };

    STATE.videoEl = document.getElementById('aiproctor-video');
  }

  // --- Fullscreen Manager ---
  function enterFullscreen() {
    try {
      const doc = document.documentElement;
      if (!document.fullscreenElement) {
        if (doc.requestFullscreen) doc.requestFullscreen();
        else if (doc.webkitRequestFullscreen) doc.webkitRequestFullscreen();
      }
      const banner = document.getElementById('aiproctor-fs-banner');
      if (banner) banner.style.display = 'none';
    } catch (err) {
      console.warn('[AIProctor] Fullscreen request prevented:', err);
    }
  }

  // --- Keyboard & Function Key Shield ---
  function getRestrictedKeyPurpose(key, e) {
    if (/^F[1-9]$|^F1[0-2]$/i.test(key)) {
      if (key === 'F12') return 'Developer Tools';
      if (key === 'F5') return 'Page Refresh';
      if (key === 'F11') return 'Fullscreen Toggle';
      return `Function Key ${key}`;
    }
    const isCmdOrCtrl = e.ctrlKey || e.metaKey;
    if (isCmdOrCtrl && e.shiftKey && (e.key === 'I' || e.key === 'i')) return 'Developer Tools';
    if (isCmdOrCtrl && e.shiftKey && (e.key === 'J' || e.key === 'j')) return 'Console Inspector';
    if (isCmdOrCtrl && e.shiftKey && (e.key === 'C' || e.key === 'c')) return 'Element Inspector';
    if (isCmdOrCtrl && (e.key === 'u' || e.key === 'U')) return 'View Source';
    if (isCmdOrCtrl && (e.key === 'r' || e.key === 'R')) return 'Page Refresh';
    if (key === 'PrintScreen') return 'Screen Capture';
    if (key === 'Escape' && document.fullscreenElement) return 'Escape Fullscreen';
    return null;
  }

  // --- Initialize Event Listeners on Host Page ---
  function setupSecurityGuards() {
    // 1. Tab Switching
    const onVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      STATE.isTabVisible = isVisible;
      const focusStat = document.getElementById('aiproctor-focus-stat');

      if (!isVisible) {
        STATE.tabSwitchCount += 1;
        updateSwitchesStat();
        if (focusStat) {
          focusStat.textContent = 'Tab Left';
          focusStat.style.color = '#ef4444';
        }

        const violation = {
          eventType: 'TAB_SWITCH_DETECTED',
          severity: 'high',
          message: `⚠️ Tab Switch #${STATE.tabSwitchCount}: Leaving the examination tab is strictly prohibited.`,
          timestamp: Date.now(),
        };
        pushViolation(violation);
        sendTelemetryEvent('tab_switch', { count: STATE.tabSwitchCount });
      } else {
        if (focusStat) {
          focusStat.textContent = 'Active';
          focusStat.style.color = '#10b981';
        }
      }
    };

    // 2. Window Blur (External application focus)
    const onWindowBlur = () => {
      STATE.isWindowFocused = false;
      if (document.visibilityState === 'visible') {
        STATE.windowSwitchCount += 1;
        updateSwitchesStat();
        const focusStat = document.getElementById('aiproctor-focus-stat');
        if (focusStat) {
          focusStat.textContent = 'Blur';
          focusStat.style.color = '#f59e0b';
        }

        const violation = {
          eventType: 'WINDOW_SWITCH_DETECTED',
          severity: 'high',
          message: `⚠️ Window Switch #${STATE.windowSwitchCount}: Lost focus from examination window.`,
          timestamp: Date.now(),
        };
        pushViolation(violation);
        sendTelemetryEvent('window_switch', { count: STATE.windowSwitchCount });
      }
    };

    const onWindowFocus = () => {
      STATE.isWindowFocused = true;
      const focusStat = document.getElementById('aiproctor-focus-stat');
      if (focusStat && STATE.isTabVisible) {
        focusStat.textContent = 'Active';
        focusStat.style.color = '#10b981';
      }
    };

    // 3. Fullscreen Exit Guard
    const onFullscreenChange = () => {
      const isFs = Boolean(document.fullscreenElement);
      const banner = document.getElementById('aiproctor-fs-banner');
      if (STATE.config.enforceFullscreen) {
        if (!isFs) {
          STATE.fullscreenExitCount += 1;
          if (banner) banner.style.display = 'flex';
          const violation = {
            eventType: 'FULLSCREEN_EXITED',
            severity: 'high',
            message: `⚠️ Fullscreen Exited (#${STATE.fullscreenExitCount}): Mandatory full screen was cancelled.`,
            timestamp: Date.now(),
          };
          pushViolation(violation);
          sendTelemetryEvent('fullscreen_exit', { count: STATE.fullscreenExitCount });
        } else {
          if (banner) banner.style.display = 'none';
        }
      }
    };

    // 4. Function Key & Shortcut Interceptor
    const onKeyDown = (e) => {
      if (!STATE.config.blockShortcuts) return;
      const purpose = getRestrictedKeyPurpose(e.key, e);
      if (purpose) {
        e.preventDefault();
        e.stopPropagation();

        const violation = {
          eventType: 'FUNCTION_KEY_PRESSED',
          severity: 'high',
          message: `⚠️ Prohibited Shortcut: Key "${e.key}" (${purpose}) is locked during the exam.`,
          timestamp: Date.now(),
          key: e.key,
          purpose,
        };
        pushViolation(violation);
        sendTelemetryEvent('function_key', { key: e.key, purpose });
      }
    };

    // 5. Context Menu Blocking
    const onContextMenu = (e) => {
      e.preventDefault();
      pushViolation({
        eventType: 'FUNCTION_KEY_PRESSED',
        severity: 'medium',
        message: '⚠️ Right-click context menu is restricted during the examination.',
        timestamp: Date.now(),
      });
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onWindowBlur);
    window.addEventListener('focus', onWindowFocus);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    window.addEventListener('keydown', onKeyDown, { capture: true });
    window.addEventListener('contextmenu', onContextMenu);

    // 6. Active Browser Extension Security Scanner & Watcher
    const extensionSignatures = [
      { name: 'Grammarly', sel: 'grammarly-extension, grammarly-popups, [data-grammarly-shadow-root]' },
      { name: 'LanguageTool', sel: '[data-lt-installed], [data-lt-tmp-id]' },
      { name: 'Loom Screen Recorder', sel: 'loom-companion-mv3, [data-loom-blur-type], loom-container' },
      { name: 'ChatGPT Sidebar / AI Solver', sel: 'chatgpt-sidebar, [data-chatgpt-extension], #chatgpt-sidebar-container, monica-root, sider-root' },
      { name: 'Tampermonkey', sel: '#tampermonkey-root, [data-tampermonkey]' },
      { name: 'LastPass', sel: '#lastpass-notification, [data-lastpass-root]' },
      { name: 'Bitwarden', sel: '#bitwarden-inline-menu, [data-bitwarden-watching]' },
      { name: 'Extension Script Injection', sel: 'script[src^="chrome-extension://"], link[href^="chrome-extension://"]' },
    ];

    const detectedExts = new Set();
    const scanExtensions = () => {
      for (const item of extensionSignatures) {
        try {
          if (document.querySelector(item.sel) && !detectedExts.has(item.name)) {
            detectedExts.add(item.name);
            pushViolation({
              eventType: 'EXTENSION_DETECTED',
              severity: 'high',
              message: `⚠️ Prohibited Extension Active: "${item.name}" was identified. Please turn off all Chrome extensions.`,
              timestamp: Date.now(),
            });
          }
        } catch (e) {}
      }

      // Check global pollution
      if (global.__REACT_DEVTOOLS_GLOBAL_HOOK__ && !detectedExts.has('React DevTools')) {
        detectedExts.add('React DevTools');
        pushViolation({
          eventType: 'EXTENSION_DETECTED',
          severity: 'high',
          message: '⚠️ Developer Tools Extension active. Please disable extensions.',
          timestamp: Date.now(),
        });
      }
      if (global._loom && !detectedExts.has('Loom')) {
        detectedExts.add('Loom');
        pushViolation({
          eventType: 'EXTENSION_DETECTED',
          severity: 'high',
          message: '⚠️ Loom screen recorder extension detected running in background.',
          timestamp: Date.now(),
        });
      }
    };

    scanExtensions();

    // Real-time MutationObserver
    let extensionObserver = null;
    if (typeof MutationObserver !== 'undefined') {
      extensionObserver = new MutationObserver(() => scanExtensions());
      extensionObserver.observe(document.documentElement, { childList: true, subtree: true });
    }

    // 7. Virtual Capture & Spoofing Devices Check
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const keywords = ['obs', 'virtual', 'manycam', 'epoccam', 'screen capture', 'ndi', 'splitcam', 'blackhole', 'loopback'];
        for (const dev of devices) {
          const lbl = (dev.label || '').toLowerCase();
          for (const kw of keywords) {
            if (lbl.includes(kw)) {
              pushViolation({
                eventType: 'VIRTUAL_DEVICE_DETECTED',
                severity: 'high',
                message: `⚠️ Background Virtual Capture Process: "${dev.label}". Close OBS, ManyCam, or virtual capture software.`,
                timestamp: Date.now(),
              });
              break;
            }
          }
        }
      }).catch(() => {});
    }

    STATE.listeners.push(
      () => document.removeEventListener('visibilitychange', onVisibilityChange),
      () => window.removeEventListener('blur', onWindowBlur),
      () => window.removeEventListener('focus', onWindowFocus),
      () => document.removeEventListener('fullscreenchange', onFullscreenChange),
      () => document.removeEventListener('webkitfullscreenchange', onFullscreenChange),
      () => window.removeEventListener('keydown', onKeyDown, { capture: true }),
      () => window.removeEventListener('contextmenu', onContextMenu),
      () => { if (extensionObserver) extensionObserver.disconnect(); }
    );
  }

  function updateSwitchesStat() {
    const el = document.getElementById('aiproctor-switches-stat');
    if (el) {
      const total = STATE.tabSwitchCount + STATE.windowSwitchCount;
      el.textContent = total;
      el.style.color = total > 0 ? '#f59e0b' : '#f1f5f9';
    }
  }

  // --- Backend Telemetry Dispatcher ---
  function sendTelemetryEvent(type, payload) {
    if (!STATE.config.backendUrl || !STATE.config.sessionId) return;
    const url = `${STATE.config.backendUrl}/api/proctoring/telemetry/frame`;

    const body = {
      sessionId: STATE.config.sessionId,
      timestamp: Date.now(),
      [type === 'tab_switch' ? 'tabSwitch' : type === 'window_switch' ? 'windowSwitch' : type === 'function_key' ? 'functionKey' : 'fullscreenExited']:
        type === 'fullscreen_exit' ? true : { isHidden: true, isBlurred: true, ...payload },
    };

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': STATE.config.apiKey,
      },
      body: JSON.stringify(body),
    }).catch(() => {});
  }

  // --- Camera Frame Capture Loop ---
  let canvas = null;
  function startFrameCapture() {
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
    }
    const ctx = canvas.getContext('2d');

    const capture = async () => {
      if (!STATE.active || !STATE.videoEl) return;
      const video = STATE.videoEl;

      if (video.videoWidth === 0 || video.videoHeight === 0) return;
      ctx.drawImage(video, 0, 0, 640, 480);
      const jpeg = canvas.toDataURL('image/jpeg', 0.7);

      if (STATE.config.backendUrl) {
        try {
          const res = await fetch(`${STATE.config.backendUrl}/api/proctoring/analyze/frame`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': STATE.config.apiKey,
            },
            body: JSON.stringify({
              image_base64: jpeg,
              session_id: STATE.config.sessionId,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            updateAIChips(data);

            // 15-second Face Absence Tracking
            const hasFace = Boolean(data.is_face_present && data.face_count > 0);
            if (!hasFace) {
              if (!STATE.noFaceStartTime) {
                STATE.noFaceStartTime = Date.now();
              } else if (Date.now() - STATE.noFaceStartTime >= 15000 && !STATE.noFaceAlertDispatched) {
                STATE.noFaceAlertDispatched = true;
                pushViolation({
                  eventType: 'NO_FACE_DETECTED',
                  severity: 'high',
                  message: '⚠️ Suspicious Activity Detected: Face not detected for more than 15 seconds. Please return to camera view immediately.',
                  timestamp: Date.now(),
                });
              }
            } else {
              STATE.noFaceStartTime = null;
              STATE.noFaceAlertDispatched = false;
            }

            if (data.objects && data.objects.length > 0) {
              const dev = data.objects[0];
              const devName = dev.label ? dev.label.replace(/_/g, ' ') : 'suspicious device';
              const now = Date.now();
              if (!STATE.lastDeviceAlert || now - STATE.lastDeviceAlert > 5000) {
                STATE.lastDeviceAlert = now;
                showDeviceModal(devName, dev.confidence);
                pushViolation({
                  eventType: 'SUSPICIOUS_DEVICE_DETECTED',
                  severity: 'high',
                  message: `🚨 Suspicious Device Detected: ${devName.toUpperCase()} identified in camera frame. Remove immediately!`,
                  timestamp: now,
                });
              }
            }
          }
        } catch (e) {
          // Fallback gracefully
        }
      }
    };

    STATE.sampleTimer = setInterval(capture, STATE.config.sampleIntervalMs);
  }

  function updateAIChips(aiData) {
    const faceChip = document.getElementById('aiproctor-face-chip');
    const gazeChip = document.getElementById('aiproctor-gaze-chip');
    const deviceChip = document.getElementById('aiproctor-device-chip');

    if (faceChip) {
      if (aiData.face_count === 1) {
        faceChip.textContent = '1 Face Visible';
        faceChip.className = 'aiproctor-chip';
      } else if (aiData.face_count === 0) {
        if (STATE.noFaceStartTime && Date.now() - STATE.noFaceStartTime >= 15000) {
          faceChip.textContent = '⚠️ Suspicious: No Face (>15s)';
          faceChip.className = 'aiproctor-chip warn pulse';
        } else {
          faceChip.textContent = 'No Face Detected';
          faceChip.className = 'aiproctor-chip warn';
        }
      } else {
        faceChip.textContent = `${aiData.face_count} Faces Detected`;
        faceChip.className = 'aiproctor-chip amber';
      }
    }

    if (gazeChip) {
      if (aiData.head_pose && aiData.head_pose.is_deviated) {
        gazeChip.style.display = 'inline-block';
        gazeChip.textContent = `Looking ${aiData.head_pose.deviation_direction || 'Away'}`;
        gazeChip.className = 'aiproctor-chip amber';
      } else if (aiData.face_count > 0) {
        gazeChip.style.display = 'inline-block';
        gazeChip.textContent = 'Gaze Centered';
        gazeChip.className = 'aiproctor-chip blue';
      } else {
        gazeChip.style.display = 'none';
      }
    }

    if (deviceChip) {
      if (aiData.objects && aiData.objects.length > 0) {
        const obj = aiData.objects[0];
        const label = obj.label ? obj.label.replace(/_/g, ' ') : 'device';
        deviceChip.style.display = 'inline-block';
        deviceChip.textContent = `🚨 ${label.toUpperCase()}`;
      } else {
        deviceChip.style.display = 'none';
      }
    }
  }

  // --- Start Webcam Hardware ---
  async function startCamera() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam mediaDevices API is not supported (requires HTTPS or secure origin).');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15, max: 30 }, facingMode: 'user' },
        audio: false,
      });

      STATE.stream = stream;
      if (STATE.videoEl) {
        STATE.videoEl.muted = true;
        STATE.videoEl.defaultMuted = true;
        STATE.videoEl.playsInline = true;
        STATE.videoEl.srcObject = stream;
        STATE.videoEl.onloadedmetadata = () => {
          STATE.videoEl.play().catch(() => {});
        };
        STATE.videoEl.play().catch(() => {});
      }

      // Hardware disconnect listener
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          const faceChip = document.getElementById('aiproctor-face-chip');
          if (faceChip) {
            faceChip.textContent = 'Camera Disconnected';
            faceChip.className = 'aiproctor-chip warn pulse';
          }
          pushViolation({
            eventType: 'CAMERA_DISCONNECTED',
            severity: 'high',
            message: '🚨 Camera Disconnected: Video stream ended. Please reconnect your webcam.',
          });
        };
      }

      const faceChip = document.getElementById('aiproctor-face-chip');
      if (faceChip) {
        faceChip.textContent = 'Tracking Active';
        faceChip.className = 'aiproctor-chip';
      }

      startFrameCapture();
    } catch (err) {
      const faceChip = document.getElementById('aiproctor-face-chip');
      if (faceChip) {
        faceChip.textContent = 'Camera Blocked';
        faceChip.className = 'aiproctor-chip warn';
      }
      let msg = '⚠️ Camera access was denied or device is not available.';
      if (err && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
        msg = '⚠️ Camera permission was denied. Please allow camera access in browser permissions.';
      } else if (err && (err.name === 'NotReadableError' || err.name === 'TrackStartError')) {
        msg = '⚠️ Camera is currently locked by another application (Zoom, Teams, etc.). Please close conflicting apps.';
      } else if (err && (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError')) {
        msg = '⚠️ No webcam device detected on your system.';
      }
      pushViolation({
        eventType: 'CAMERA_DISCONNECTED',
        severity: 'high',
        message: msg,
      });
    }
  }

  // --- Public API ---
  const AIProctor = {
    initialized: false,

    init(userConfig) {
      if (STATE.active) return this;

      injectStyles();
      Object.assign(STATE.config, userConfig || {});

      // Auto-fallback backend URL to current domain if empty
      if (!STATE.config.backendUrl && typeof window !== 'undefined') {
        STATE.config.backendUrl = window.location.origin;
      }

      buildWidget();
      setupSecurityGuards();

      if (STATE.config.enforceFullscreen) {
        // Show fullscreen prompt if not yet fullscreen
        const banner = document.getElementById('aiproctor-fs-banner');
        if (!document.fullscreenElement && banner) {
          banner.style.display = 'flex';
        }
      }

      startCamera();
      STATE.active = true;
      this.initialized = true;

      if (typeof STATE.callbacks.onReady === 'function') {
        STATE.callbacks.onReady();
      }

      console.log('🛡️ AI Proctor initialized with session:', STATE.config.sessionId);
      return this;
    },

    onViolation(callback) {
      STATE.callbacks.onViolation = callback;
      return this;
    },

    onReady(callback) {
      STATE.callbacks.onReady = callback;
      return this;
    },

    enterFullscreen() {
      enterFullscreen();
    },

    getViolations() {
      return [...STATE.violations];
    },

    stop() {
      if (!STATE.active) return;
      STATE.active = false;
      this.initialized = false;

      if (STATE.sampleTimer) {
        clearInterval(STATE.sampleTimer);
        STATE.sampleTimer = null;
      }

      if (STATE.stream) {
        STATE.stream.getTracks().forEach((t) => t.stop());
        STATE.stream = null;
      }

      STATE.listeners.forEach((remove) => remove());
      STATE.listeners = [];

      const root = document.getElementById('aiproctor-root');
      if (root) root.remove();

      const styles = document.getElementById('aiproctor-styles');
      if (styles) styles.remove();

      console.log('🛑 AI Proctor session stopped.');
    },
  };

  // --- Auto-Initialization via <script> tag attributes ---
  if (typeof document !== 'undefined') {
    const currentScript =
      document.currentScript ||
      document.querySelector('script[src*="proctor.js"]');

    if (currentScript) {
      const apiKey = currentScript.getAttribute('data-api-key') || '';
      const sessionId = currentScript.getAttribute('data-session-id') || '';
      const backendUrl = currentScript.getAttribute('data-backend-url') || '';
      const enforceFs = currentScript.getAttribute('data-enforce-fullscreen');
      const blockKeys = currentScript.getAttribute('data-block-shortcuts');
      const beep = currentScript.getAttribute('data-beep');

      if (apiKey || sessionId || backendUrl) {
        document.addEventListener('DOMContentLoaded', () => {
          AIProctor.init({
            apiKey,
            sessionId: sessionId || `ext-${Date.now()}`,
            backendUrl,
            enforceFullscreen: enforceFs !== 'false',
            blockShortcuts: blockKeys !== 'false',
            enableBeep: beep !== 'false',
          });
        });
      }
    }
  }

  global.AIProctor = AIProctor;
})(typeof window !== 'undefined' ? window : this);

