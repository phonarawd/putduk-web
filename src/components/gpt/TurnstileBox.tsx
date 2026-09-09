"use client";

import { useEffect, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (
    host: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type Props = {
  action: "signup" | "login";
  onToken: (token: string) => void;
  resetNonce?: number;
};

function ensureTurnstileScript() {
  if (typeof document === "undefined") return;
  if (document.getElementById(SCRIPT_ID)) return;
  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.src = SCRIPT_SRC;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

if (typeof document !== "undefined") {
  ensureTurnstileScript();
}

export function preloadTurnstile() {
  ensureTurnstileScript();
}

export function TurnstileBox({ action, onToken, resetNonce = 0 }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    ensureTurnstileScript();
    if (!SITE_KEY) return;
    const host = hostRef.current;
    if (!host) return;

    function resetWidget() {
      onTokenRef.current("");
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
    }

    function mount() {
      if (!host || !window.turnstile || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(host, {
        sitekey: SITE_KEY,
        action,
        callback: (token) => onTokenRef.current(token),
        "expired-callback": resetWidget,
        "error-callback": resetWidget,
      });
    }

    if (window.turnstile) {
      mount();
    } else {
      const script = document.getElementById(SCRIPT_ID);
      script?.addEventListener("load", mount);
      if (window.turnstile) mount();
    }

    return () => {
      const script = document.getElementById(SCRIPT_ID);
      script?.removeEventListener("load", mount);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [action]);

  useEffect(() => {
    if (!resetNonce) return;
    onTokenRef.current("");
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [resetNonce]);

  if (!SITE_KEY) return null;
  return <div ref={hostRef} className="challenge-box" />;
}

export function hasTurnstileSiteKey() {
  return SITE_KEY.length > 0;
}
