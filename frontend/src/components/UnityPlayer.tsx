'use client';

import React, { useRef, useEffect } from 'react';

export default function UnityPlayer() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const focusIframe = () => {
    if (iframeRef.current) {
      iframeRef.current.focus();
      try {
        iframeRef.current.contentWindow?.focus();
      } catch {
        // Ignore cross-origin focus errors if any
      }
    }
  };

  useEffect(() => {
    // Focus the iframe when mounted so keyboard controls (WASD) work immediately
    const timer = setTimeout(() => {
      focusIframe();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-3">
      <div
        onClick={focusIframe}
        onMouseEnter={focusIframe}
        className="rounded-xl border border-slate-800 bg-black overflow-hidden flex items-center justify-center relative shadow-inner"
      >
        <iframe
          ref={iframeRef}
          src="/unity/index.html"
          title="DisasterReady Earthquake Simulation"
          className="w-full h-[650px] border-0 block"
          tabIndex={0}
          allow="fullscreen; autoplay; pointer-lock; keyboard-map; gamepad"
          allowFullScreen
          onLoad={focusIframe}
        />
      </div>
      <p className="text-sm text-slate-600">
        Use your keyboard and mouse to interact with the earthquake simulation. Click the fullscreen control inside the game for a larger view.
      </p>
    </div>
  );
}
