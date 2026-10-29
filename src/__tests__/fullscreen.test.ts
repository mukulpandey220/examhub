import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  isNativeFullscreenSupported,
  isFullscreenActive,
  requestFullscreen,
  exitFullscreen,
  toggleFullscreen,
  addFullscreenListener,
} from "../lib/fullscreen";

describe("Cross-Device Fullscreen Manager", () => {
  it("should safely handle SSR / node environments where window and document are undefined", async () => {
    expect(isNativeFullscreenSupported()).toBe(false);
    expect(isFullscreenActive()).toBe(false);
    expect(await requestFullscreen()).toBe(false);
    expect(await exitFullscreen()).toBe(false);
    expect(await toggleFullscreen()).toBe(false);
    const unsub = addFullscreenListener(() => {});
    expect(typeof unsub).toBe("function");
    unsub();
  });

  describe("Browser Environment Simulation", () => {
    let mockElement: any;
    let mockDocument: any;
    let mockWindow: any;
    let listeners: Record<string, Function[]> = {};

    beforeEach(() => {
      listeners = {};

      mockElement = {
        classList: {
          classes: new Set<string>(),
          add(c: string) { this.classes.add(c); },
          remove(c: string) { this.classes.delete(c); },
          contains(c: string) { return this.classes.has(c); },
        },
      };

      mockDocument = {
        documentElement: mockElement,
        body: mockElement,
        fullscreenEnabled: true,
        fullscreenElement: null,
        addEventListener: (event: string, fn: Function) => {
          if (!listeners[event]) listeners[event] = [];
          listeners[event].push(fn);
        },
        removeEventListener: (event: string, fn: Function) => {
          if (listeners[event]) {
            listeners[event] = listeners[event].filter(f => f !== fn);
          }
        },
      };

      mockWindow = {
        scrollTo: vi.fn(),
        addEventListener: (event: string, fn: Function) => {
          if (!listeners[event]) listeners[event] = [];
          listeners[event].push(fn);
        },
        removeEventListener: (event: string, fn: Function) => {
          if (listeners[event]) {
            listeners[event] = listeners[event].filter(f => f !== fn);
          }
        },
        dispatchEvent: (event: any) => {
          const fns = listeners[event.type] || [];
          fns.forEach(fn => fn(event));
        },
      };

      (global as any).document = mockDocument;
      (global as any).window = mockWindow;
      (global as any).CustomEvent = class CustomEvent {
        type: string;
        detail: any;
        constructor(type: string, params: any) {
          this.type = type;
          this.detail = params?.detail;
        }
      };
    });

    afterEach(() => {
      delete (global as any).document;
      delete (global as any).window;
      delete (global as any).CustomEvent;
    });

    it("should detect native fullscreen support when document has fullscreenEnabled", () => {
      expect(isNativeFullscreenSupported()).toBe(true);
    });

    it("should activate fallback fullscreen on devices without native requestFullscreen", async () => {
      expect(isFullscreenActive()).toBe(false);

      await requestFullscreen();
      expect(isFullscreenActive()).toBe(true);
      expect(mockElement.classList.contains("fullscreen-mode-active")).toBe(true);

      await exitFullscreen();
      expect(isFullscreenActive()).toBe(false);
      expect(mockElement.classList.contains("fullscreen-mode-active")).toBe(false);
    });

    it("should toggle fullscreen back and forth", async () => {
      expect(isFullscreenActive()).toBe(false);

      await toggleFullscreen();
      expect(isFullscreenActive()).toBe(true);

      await toggleFullscreen();
      expect(isFullscreenActive()).toBe(false);
    });

    it("should notify subscribed listeners when fullscreen toggles", async () => {
      const stateHistory: boolean[] = [];
      const unsubscribe = addFullscreenListener((active) => {
        stateHistory.push(active);
      });

      await requestFullscreen();
      await exitFullscreen();

      unsubscribe();
      expect(stateHistory).toEqual([true, false]);
    });
  });
});
