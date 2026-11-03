/**
 * Chrome & Browser Extension Security Detector
 * Precision detection targeted strictly at automated solvers, AI copilots,
 * userscripts, screen recorders, and grammar enhancers.
 * Excludes developer tools, internal React hooks, and benign system extensions.
 */

export interface DetectedExtension {
  name: string;
  signature: string;
  detail: string;
}

export interface ExtensionScanResult {
  hasExtensions: boolean;
  extensions: DetectedExtension[];
}

// Strictly targeted cheating/AI/recorder extension selectors
const KNOWN_EXTENSION_SELECTORS: Array<{ name: string; selector: string; detail: string }> = [
  // AI Helpers, Chatbots & Examination Solvers
  {
    name: 'ChatGPT Sidebar / Solver',
    selector: 'chatgpt-sidebar, [data-chatgpt-extension], #chatgpt-sidebar-container',
    detail: 'AI copilot sidebar extension active',
  },
  {
    name: 'Monica AI Copilot',
    selector: 'monica-root, #monica-root',
    detail: 'Monica AI assistant active',
  },
  {
    name: 'Sider AI Assistant',
    selector: 'sider-root, #sider-root',
    detail: 'Sider AI copilot active',
  },
  {
    name: 'Merlin AI',
    selector: 'merlin-container, [data-merlin-container]',
    detail: 'Merlin AI assistant active',
  },
  {
    name: 'Harpa AI Automation',
    selector: 'harpa-app, #harpa-app',
    detail: 'Harpa web automation extension active',
  },
  {
    name: 'Tampermonkey / Userscript Injector',
    selector: '#tampermonkey-root, [data-tampermonkey]',
    detail: 'Userscript injector active',
  },

  // Screen Recorders & Video Capture Extensions
  {
    name: 'Loom Screen Recorder',
    selector: 'loom-companion-mv3, [data-loom-blur-type], loom-container',
    detail: 'Loom background screen recorder active',
  },
  {
    name: 'Awesome Screenshot',
    selector: '#as-root, [data-as-installed]',
    detail: 'Screen capture extension active',
  },
  {
    name: 'Nimbus Capture',
    selector: '#nimbus-capture-root',
    detail: 'Nimbus screenshot tool active',
  },

  // Writing & Grammar Assistants (Often used to rephrase questions)
  {
    name: 'Grammarly',
    selector: 'grammarly-extension, grammarly-popups, [data-grammarly-shadow-root]',
    detail: 'Grammarly inline injection active',
  },
  {
    name: 'LanguageTool',
    selector: '[data-lt-installed], [data-lt-tmp-id]',
    detail: 'LanguageTool proofreader active',
  },
  {
    name: 'QuillBot',
    selector: 'quillbot-extension, [data-quillbot-installed]',
    detail: 'QuillBot paraphrasing tool active',
  },
];

// Global window properties strictly for injection scripts & userscript managers
const KNOWN_GLOBAL_POLLUTION: Array<{ name: string; check: () => boolean; detail: string }> = [
  {
    name: 'Tampermonkey / Violentmonkey',
    check: () => typeof window !== 'undefined' && Boolean((window as any).tampermonkey || (window as any).GM_info),
    detail: 'Userscript execution engine active',
  },
  {
    name: 'Loom Screen Recorder Companion',
    check: () => typeof window !== 'undefined' && Boolean((window as any)._loom),
    detail: 'Loom screen recorder service active',
  },
];

/**
 * Scan DOM and environment for suspicious/prohibited extensions.
 */
export function detectActiveExtensions(): ExtensionScanResult {
  if (typeof document === 'undefined') {
    return { hasExtensions: false, extensions: [] };
  }

  const detected: DetectedExtension[] = [];
  const seenSignatures = new Set<string>();

  // 1. Check verified DOM selectors
  for (const item of KNOWN_EXTENSION_SELECTORS) {
    try {
      const el = document.querySelector(item.selector);
      if (el && !seenSignatures.has(item.name)) {
        seenSignatures.add(item.name);
        detected.push({
          name: item.name,
          signature: item.selector,
          detail: item.detail,
        });
      }
    } catch {
      // Safe ignore
    }
  }

  // 2. Check window global pollution (Tampermonkey, Loom)
  for (const item of KNOWN_GLOBAL_POLLUTION) {
    try {
      if (item.check() && !seenSignatures.has(item.name)) {
        seenSignatures.add(item.name);
        detected.push({
          name: item.name,
          signature: `window.${item.name}`,
          detail: item.detail,
        });
      }
    } catch {
      // Safe ignore
    }
  }

  // 3. Check for specific prohibited root attributes
  try {
    const rootAttrs = document.documentElement.getAttributeNames();
    for (const attr of rootAttrs) {
      if (/data-grammarly-shadow-root|data-lt-installed|data-loom-blur-type|data-chatgpt-extension/i.test(attr) && !seenSignatures.has(attr)) {
        seenSignatures.add(attr);
        detected.push({
          name: `Injected DOM Attribute [${attr}]`,
          signature: attr,
          detail: `Extension modified HTML root attributes with '${attr}'`,
        });
      }
    }
  } catch {
    // Safe ignore
  }

  return {
    hasExtensions: detected.length > 0,
    extensions: detected,
  };
}

/**
 * Real-time watcher that continuously listens for extensions injecting nodes or attributes.
 */
export function startExtensionWatcher(
  onDetected: (ext: DetectedExtension) => void
): () => void {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') {
    return () => {};
  }

  const detectedNames = new Set<string>();

  // Immediate initial scan
  const initial = detectActiveExtensions();
  for (const ext of initial.extensions) {
    detectedNames.add(ext.name);
    onDetected(ext);
  }

  // MutationObserver for asynchronous injections
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        for (let i = 0; i < mutation.addedNodes.length; i++) {
          const node = mutation.addedNodes[i];
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            const tagName = el.tagName.toLowerCase();
            const id = el.id || '';
            const className = typeof el.className === 'string' ? el.className : '';

            for (const item of KNOWN_EXTENSION_SELECTORS) {
              if (
                item.selector.includes(tagName) ||
                (id && item.selector.includes(`#${id}`)) ||
                (className && item.selector.includes(`.${className}`))
              ) {
                if (!detectedNames.has(item.name)) {
                  detectedNames.add(item.name);
                  onDetected({
                    name: item.name,
                    signature: `<${tagName} id="${id}">`,
                    detail: `Extension dynamically injected <${tagName}> element into DOM.`,
                  });
                }
              }
            }
          }
        }
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  return () => {
    observer.disconnect();
  };
}
