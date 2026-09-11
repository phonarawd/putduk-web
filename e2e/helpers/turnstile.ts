import type { Page } from "@playwright/test";

export const QA_TURNSTILE = "qa-turnstile-token";

export async function installTurnstile(page: Page) {
  await page.route("https://challenges.cloudflare.com/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: "window.turnstile=window.turnstile||{};",
    }),
  );
  await page.addInitScript((token) => {
    const api = {
      render(_host: HTMLElement, options: { callback: (value: string) => void }) {
        options.callback(token);
        return "qa-widget";
      },
      reset() {},
      remove() {},
    };
    Object.defineProperty(window, "turnstile", {
      configurable: true,
      get() {
        return api;
      },
      set() {
        /* 테스트 목은 덮어쓰지 않는다 */
      },
    });
  }, QA_TURNSTILE);
}
