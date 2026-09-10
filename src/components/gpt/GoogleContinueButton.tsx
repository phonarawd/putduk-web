"use client";

import { useState } from "react";
import { googleAuthorizeUrl, startGoogle } from "@/lib/api";
import { useGpt } from "@/lib/gpt/GptContext";
import { MSG, toastFromError } from "@/lib/messages";

export function GoogleContinueButton({ disabled = false }: { disabled?: boolean }) {
  const { showToast } = useGpt();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (busy || disabled) return;
    setBusy(true);
    try {
      const data = await startGoogle();
      const url = googleAuthorizeUrl(data);
      if (!url) {
        showToast(MSG.googleUrlFail, "error");
        return;
      }
      window.location.assign(url);
    } catch (error: unknown) {
      const payload = toastFromError(error, MSG.googleStartFail);
      showToast(payload.message, payload.kind);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="google-button" type="button" disabled={busy || disabled} onClick={onClick}>
      <span aria-hidden="true">G</span>
      구글로 계속하기
    </button>
  );
}
