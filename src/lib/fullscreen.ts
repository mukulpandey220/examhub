"use client";

import { useState, useEffect, useCallback } from "react";

// Cross-device & Cross-browser Fullscreen Engine
// Supports standard W3C, WebKit (Safari / iPadOS), Mozilla, Microsoft, and iOS Mobile Safari Immersive Fallback

interface VendorDocument extends Document {
  webkitFullscreenElement?: Element;
  mozFullScreenElement?: Element;
  msFullscreenElement?: Element;
  webkitExitFullscreen?: () => Promise<void> | void;
  mozCancelFullScreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenEnabled?: boolean;
  mozFullScreenEnabled?: boolean;
  msFullscreenEnabled?: boolean;
}

interface VendorHTMLElement extends HTMLElement {
  webkitRequestFullscreen?: (options?: FullscreenOptions) => Promise<void> | void;
  webkitRequestFullScreen?: () => Promise<void> | void;
  mozRequestFullScreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
}

let isFallbackFullscreenActive = false;

/**
 * Checks if the browser natively supports the Fullscreen API.
 */
export function isNativeFullscreenSupported(): boolean {
  if (typeof document === "undefined") return false;
  const doc = document as VendorDocument;
  return !!(
    doc.fullscreenEnabled ||
    doc.webkitFullscreenEnabled ||
    doc.mozFullScreenEnabled ||
    doc.msFullscreenEnabled ||
    document.documentElement.requestFullscreen ||
    (document.documentElement as VendorHTMLElement).webkitRequestFullscreen
  );
}

/**
 * Checks if the client device is iOS (iPhone, iPad, iPod) where Fullscreen API is restricted.
 */
export function isIOSDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/**
 * Returns true if the page or an element is currently in fullscreen mode (native or fallback).
 */
export function isFullscreenActive(): boolean {
  if (typeof document === "undefined") return false;
  const doc = document as VendorDocument;
  const nativeActive = !!(
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  );
  if (nativeActive) return true;
  return isFallbackFullscreenActive || document.documentElement.classList.contains("fullscreen-mode-active");
}

/**
 * Requests fullscreen across all devices and browsers.
 */
export async function requestFullscreen(targetElement?: HTMLElement): Promise<boolean> {
  if (typeof window === "undefined" || typeof document === "undefined") return false;

  const element = (targetElement || document.documentElement) as VendorHTMLElement;

  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen({ navigationUI: "hide" } as any);
      notifyFullscreenChange(true);
      return true;
    } else if (element.webkitRequestFullscreen) {
      await (element.webkitRequestFullscreen() as any);
      notifyFullscreenChange(true);
      return true;
    } else if (element.webkitRequestFullScreen) {
      await (element.webkitRequestFullScreen() as any);
      notifyFullscreenChange(true);
      return true;
    } else if (element.mozRequestFullScreen) {
      await (element.mozRequestFullScreen() as any);
      notifyFullscreenChange(true);
      return true;
    } else if (element.msRequestFullscreen) {
      await (element.msRequestFullscreen() as any);
      notifyFullscreenChange(true);
      return true;
    }
  } catch (error) {
    console.warn("Native fullscreen request rejected or not permitted; activating immersive fallback:", error);
  }

  // Immersive fallback for iOS Safari or environments blocking Fullscreen API
  activateFallbackFullscreen();
  return true;
}

/**
 * Exits fullscreen across all devices.
 */
export async function exitFullscreen(): Promise<boolean> {
  if (typeof window === "undefined" || typeof document === "undefined") return false;

  const doc = document as VendorDocument;

  try {
    if (doc.fullscreenElement && doc.exitFullscreen) {
      await doc.exitFullscreen();
    } else if (doc.webkitFullscreenElement && doc.webkitExitFullscreen) {
      await (doc.webkitExitFullscreen() as any);
    } else if (doc.mozFullScreenElement && doc.mozCancelFullScreen) {
      await (doc.mozCancelFullScreen() as any);
    } else if (doc.msFullscreenElement && doc.msExitFullscreen) {
      await (doc.msExitFullscreen() as any);
    }
  } catch (error) {
    console.warn("Native exit fullscreen error:", error);
  }

  deactivateFallbackFullscreen();
  return true;
}

/**
 * Toggles fullscreen mode on or off.
 */
export async function toggleFullscreen(targetElement?: HTMLElement): Promise<boolean> {
  if (isFullscreenActive()) {
    return await exitFullscreen();
  } else {
    return await requestFullscreen(targetElement);
  }
}

function activateFallbackFullscreen() {
  if (typeof document === "undefined") return;
  isFallbackFullscreenActive = true;
  document.documentElement.classList.add("fullscreen-mode-active");
  document.body.classList.add("fullscreen-mode-active");
  if (typeof window !== "undefined") {
    try {
      window.scrollTo(0, 1);
    } catch (e) {}
  }
  notifyFullscreenChange(true);
}

function deactivateFallbackFullscreen() {
  if (typeof document === "undefined") return;
  isFallbackFullscreenActive = false;
  document.documentElement.classList.remove("fullscreen-mode-active");
  document.body.classList.remove("fullscreen-mode-active");
  notifyFullscreenChange(false);
}

function notifyFullscreenChange(state: boolean) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("appfullscreenchange", { detail: { isFullscreen: state } }));
}

/**
 * Subscribes to all vendor fullscreen change events plus fallback events.
 */
export function addFullscreenListener(callback: (active: boolean) => void): () => void {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return () => {};
  }

  const handler = () => {
    callback(isFullscreenActive());
  };

  const appHandler = (e: any) => {
    if (e?.detail && typeof e.detail.isFullscreen === "boolean") {
      callback(e.detail.isFullscreen);
    } else {
      callback(isFullscreenActive());
    }
  };

  document.addEventListener("fullscreenchange", handler);
  document.addEventListener("webkitfullscreenchange", handler);
  document.addEventListener("mozfullscreenchange", handler);
  document.addEventListener("MSFullscreenChange", handler);
  window.addEventListener("appfullscreenchange", appHandler);

  return () => {
    document.removeEventListener("fullscreenchange", handler);
    document.removeEventListener("webkitfullscreenchange", handler);
    document.removeEventListener("mozfullscreenchange", handler);
    document.removeEventListener("MSFullscreenChange", handler);
    window.removeEventListener("appfullscreenchange", appHandler);
  };
}

/**
 * React hook to observe and toggle fullscreen status across all devices.
 */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  useEffect(() => {
    setIsFullscreen(isFullscreenActive());
    setIsSupported(isNativeFullscreenSupported() || isIOSDevice());

    const cleanup = addFullscreenListener((active) => {
      setIsFullscreen(active);
    });

    return cleanup;
  }, []);

  const toggle = useCallback(async (target?: HTMLElement) => {
    return await toggleFullscreen(target);
  }, []);

  const enter = useCallback(async (target?: HTMLElement) => {
    return await requestFullscreen(target);
  }, []);

  const exit = useCallback(async () => {
    return await exitFullscreen();
  }, []);

  return {
    isFullscreen,
    isSupported,
    toggleFullscreen: toggle,
    enterFullscreen: enter,
    exitFullscreen: exit,
  };
}

