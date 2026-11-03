import React, { useState } from 'react';
import {
  Code,
  Copy,
  Check,
  Play,
  Square,
  Globe,
  Settings,
  Shield,
  Layers,
  Terminal,
  ExternalLink,
} from 'lucide-react';

export const EmbedPlayground: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'script' | 'react' | 'api'>('script');
  const [backendUrl, setBackendUrl] = useState<string>(() => {
    return typeof window !== 'undefined' ? window.location.origin.replace(':5173', ':3001') : 'http://localhost:3001';
  });
  const [examTitle, setExamTitle] = useState('My Online Exam');
  const [candidateName, setCandidateName] = useState('Student Candidate');
  const [enforceFullscreen, setEnforceFullscreen] = useState(true);
  const [blockShortcuts, setBlockShortcuts] = useState(true);
  const [enableBeep, setEnableBeep] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isTestRunning, setIsTestRunning] = useState(false);

  const scriptSnippet = `<!-- Add this single script to any of your other websites -->
<script 
  src="${typeof window !== 'undefined' ? window.location.origin : 'https://your-proctor.vercel.app'}/proctor.js"
  data-api-key="pk_live_your_secret_key"
  data-candidate-name="${candidateName}"
  data-exam-title="${examTitle}"
  data-backend-url="${backendUrl}"
  data-enforce-fullscreen="${enforceFullscreen}"
  data-block-shortcuts="${blockShortcuts}"
  data-beep="${enableBeep}">
</script>`;

  const reactSnippet = `import { useEffect } from 'react';

export function ExamPage() {
  useEffect(() => {
    // 1. Dynamically load the standalone proctor script
    const script = document.createElement('script');
    script.src = '${typeof window !== 'undefined' ? window.location.origin : 'https://your-proctor.vercel.app'}/proctor.js';
    script.async = true;
    script.onload = () => {
      // 2. Initialize proctor with your custom settings & callbacks
      if (window.AIProctor) {
        window.AIProctor.init({
          candidateName: '${candidateName}',
          examTitle: '${examTitle}',
          backendUrl: '${backendUrl}',
          enforceFullscreen: ${enforceFullscreen},
          blockShortcuts: ${blockShortcuts},
          enableBeep: ${enableBeep},
          onViolation: (violation) => {
            console.warn('Proctoring Violation:', violation);
            // e.g. alert candidate or track total strikes
          }
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      if (window.AIProctor) window.AIProctor.stop();
      script.remove();
    };
  }, []);

  return (
    <div>
      <h1>Your Exam Content Here</h1>
    </div>
  );
}`;

  const apiSnippet = `# 1. Create a proctoring session from your backend
curl -X POST "${backendUrl}/api/proctoring/sessions/external" \\
  -H "Content-Type: application/json" \\
  -d '{
    "candidateName": "${candidateName}",
    "examTitle": "${examTitle}",
    "webhookUrl": "https://your-website.com/api/proctor-webhook",
    "metadata": { "studentId": "STU-9901" }
  }'

# 2. Response will return:
# {
#   "success": true,
#   "sessionId": "e81d7f45-...",
#   "embedCode": "<script src=\\".../proctor.js\\" data-session-id=\\"...\\"></script>",
#   "widgetUrl": "https://your-proctor.vercel.app/session?sessionId=..."
# }`;

  const currentSnippet = activeTab === 'script' ? scriptSnippet : activeTab === 'react' ? reactSnippet : apiSnippet;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleTest = () => {
    if (typeof window === 'undefined') return;
    if (isTestRunning) {
      if ((window as any).AIProctor) {
        (window as any).AIProctor.stop();
      }
      setIsTestRunning(false);
    } else {
      if ((window as any).AIProctor) {
        (window as any).AIProctor.init({
          candidateName,
          examTitle,
          backendUrl,
          enforceFullscreen,
          blockShortcuts,
          enableBeep,
          onViolation: (v: any) => {
            console.log('[Playground Test Violation]:', v);
          },
        });
        setIsTestRunning(true);
      } else {
        // Load proctor.js dynamically
        const s = document.createElement('script');
        s.src = '/proctor.js';
        s.onload = () => {
          if ((window as any).AIProctor) {
            (window as any).AIProctor.init({
              candidateName,
              examTitle,
              backendUrl,
              enforceFullscreen,
              blockShortcuts,
              enableBeep,
            });
            setIsTestRunning(true);
          }
        };
        document.body.appendChild(s);
      }
    }
  };

  return (
    <div className="mx-auto max-w-5xl py-8 px-4 sm:px-6">
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            Developer Integration Hub
          </span>
          <span className="text-xs text-slate-400 font-mono">v1.2.0 Universal SDK</span>
        </div>
        <h1 className="mt-3 text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Use AI Proctor on Your Other Websites
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          Embed the complete proctoring shield into any of your own websites, LMS systems, or portals with a single snippet. Fully standalone with zero dependencies on your host application.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Configuration Controls */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Settings className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Proctor Configuration</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Backend API / Gateway URL
              </label>
              <input
                type="text"
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                placeholder="http://localhost:3001"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Where telemetry and AI inference frames are sent.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Examination Title
              </label>
              <input
                type="text"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                placeholder="CS-402 Final Examination"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Candidate Name
              </label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="Candidate Name"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Enforce Fullscreen
                </span>
                <input
                  type="checkbox"
                  checked={enforceFullscreen}
                  onChange={(e) => setEnforceFullscreen(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Block Shortcuts (F1–F12, DevTools)
                </span>
                <input
                  type="checkbox"
                  checked={blockShortcuts}
                  onChange={(e) => setBlockShortcuts(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Audible Warning Beeps (880Hz)
                </span>
                <input
                  type="checkbox"
                  checked={enableBeep}
                  onChange={(e) => setEnableBeep(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
              </label>
            </div>

            {/* Test Drive Button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleToggleTest}
                className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold text-white shadow-lg transition-all ${
                  isTestRunning
                    ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                    : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
                }`}
              >
                {isTestRunning ? (
                  <>
                    <Square className="h-4 w-4" /> Stop Live Test Proctor
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" /> Test Proctor on this Page
                  </>
                )}
              </button>
              <span className="text-[11px] text-center text-slate-400 mt-1 block">
                {isTestRunning
                  ? 'Testing active! Look at bottom right corner.'
                  : 'Spawns the floating widget directly on this tab.'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Code Snippets & Copy */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            {/* Tab Selectors */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('script')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'script'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" /> HTML Drop-in &lt;script&gt;
                </button>

                <button
                  onClick={() => setActiveTab('react')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'react'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Code className="h-3.5 w-3.5" /> React / Next.js
                </button>

                <button
                  onClick={() => setActiveTab('api')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'api'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Terminal className="h-3.5 w-3.5" /> REST API + Webhooks
                </button>
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Code Block Container */}
            <div className="relative rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-200 border border-slate-800 overflow-x-auto shadow-inner leading-relaxed">
              <pre>{currentSnippet}</pre>
            </div>
          </div>

          {/* Feature Highlights Grid */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Zero external CSS or UI conflicts</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-500 shrink-0" />
              <span>Works with React, Vue, PHP, HTML</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-purple-500 shrink-0" />
              <span>Invigilator live updates in real time</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

