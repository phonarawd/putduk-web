"use client";

import { useGpt } from "@/lib/gpt/GptContext";

export function Toast() {
  const { toast } = useGpt();
  const className = "toast" + (toast ? " is-visible" + (toast.type === "error" ? " is-error" : "") : "");
  return (
    <div id="toast" className={className} role="status" aria-live="polite">
      {toast?.message}
    </div>
  );
}
