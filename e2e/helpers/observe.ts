import type { Page } from "@playwright/test";

export type PageSignals = {
  consoles: Array<{ type: string; text: string }>;
  pageErrors: string[];
  failed: Array<{ url: string; status: number | null }>;
};

const SECRET = /(token|password|authorization|cookie|secret|stepUp|challenge)/i;

export function mask(value: string): string {
  return value.replace(SECRET, "[redacted]");
}

export function attachSignals(page: Page): PageSignals {
  const signals: PageSignals = { consoles: [], pageErrors: [], failed: [] };
  page.on("console", (msg) => {
    signals.consoles.push({ type: msg.type(), text: mask(msg.text()) });
  });
  page.on("pageerror", (error) => {
    signals.pageErrors.push(mask(error.message));
  });
  page.on("requestfailed", (request) => {
    const url = request.url();
    if (url.includes("challenges.cloudflare.com")) return;
    signals.failed.push({ url: mask(url), status: request.failure()?.errorText ? null : null });
  });
  return signals;
}

export function consoleErrors(signals: PageSignals): string[] {
  return [
    ...signals.pageErrors,
    ...signals.consoles.filter((item) => item.type === "error").map((item) => item.text),
  ].filter((text) => !/favicon|Download the React DevTools|third-party/i.test(text));
}
