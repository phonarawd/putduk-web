import type { Page } from "@playwright/test";

export type PageSignals = {
  consoles: Array<{ type: string; text: string }>;
  pageErrors: string[];
  failed: Array<{ url: string; errorText: string | null }>;
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
    signals.failed.push({ url: mask(url), errorText: request.failure()?.errorText ?? null });
  });
  return signals;
}

export function consoleErrors(signals: PageSignals): string[] {
  return [
    ...signals.pageErrors,
    ...signals.consoles.filter((item) => item.type === "error").map((item) => item.text),
  ].filter((text) => !/favicon|Download the React DevTools|third-party/i.test(text));
}

// 페이지를 떠나면 아직 안 끝난 요청(특히 폰트 조각처럼 unicode-range로 필요 없어진 것)이
// 브라우저에 의해 정상적으로 취소된다 - 이건 실패가 아니라 정상적인 내비게이션 동작이다.
export function unexpectedFailedRequests(signals: PageSignals): Array<{ url: string; errorText: string | null }> {
  return signals.failed.filter((item) => !/aborted/i.test(item.errorText ?? ""));
}
