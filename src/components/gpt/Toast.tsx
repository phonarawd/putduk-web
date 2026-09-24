"use client";

import { useCommonUi } from "@/lib/gpt/GptScopes";

const KIND_CLASS: Record<string, string> = {
  success: " is-success",
  info: " is-info",
  warning: " is-warning",
  error: " is-error",
  security: " is-security",
};

export function Toast() {
  const { toast } = useCommonUi();
  const kindClass = toast ? KIND_CLASS[toast.kind] || "" : "";
  const className = "toast" + (toast ? " is-visible" + kindClass : "");
  return (
    <div id="toast" className={className} role="status" aria-live="polite">
      {toast?.message}
    </div>
  );
}
