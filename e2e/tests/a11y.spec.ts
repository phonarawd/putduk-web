import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { becomeUser, openPage, waitChallenge } from "../helpers/auth.ts";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const SCREENS: Array<{ name: string; path: string; auth?: boolean; extra?: Record<string, unknown> }> = [
  { name: "login", path: "/login" },
  { name: "signup", path: "/signup" },
  { name: "google-callback", path: "/auth/oauth/google/callback" },
  { name: "complete-profile", path: "/auth/complete-profile", auth: true, extra: { onboarding: "incomplete" } },
  { name: "home", path: "/", auth: true },
  { name: "work", path: "/work", auth: true },
  { name: "deposit", path: "/wallet/deposit", auth: true },
  { name: "withdraw", path: "/wallet/withdraw", auth: true },
  { name: "ledger", path: "/wallet/history", auth: true },
  { name: "kyc", path: "/me/kyc", auth: true },
  { name: "me", path: "/me", auth: true },
  { name: "membership", path: "/me/membership", auth: true },
  { name: "benefits", path: "/me/benefits", auth: true },
  { name: "ai", path: "/ai", auth: true },
  // /me/peotteok는 /ai와 같은 PeotteokAiView라 중복 스캔하지 않는다.
  { name: "invite", path: "/invite", auth: true },
  { name: "find-id", path: "/auth/find-id" },
  { name: "reset-password", path: "/auth/reset-password" },
  { name: "verify-email", path: "/auth/verify-email" },
  { name: "legal", path: "/legal" },
  { name: "legal-privacy", path: "/legal/privacy" },
  { name: "legal-terms", path: "/legal/terms" },
  { name: "legal-license", path: "/legal/license" },
  { name: "legal-oss", path: "/legal/oss" },
  { name: "legal-recognition", path: "/legal/recognition" },
  { name: "me-inbox", path: "/me/inbox", auth: true },
  { name: "me-settings", path: "/me/settings", auth: true },
  { name: "me-support", path: "/me/support", auth: true },
  { name: "me-notices", path: "/me/notices", auth: true },
  { name: "me-events", path: "/me/events", auth: true },
  { name: "me-records", path: "/me/records", auth: true },
  { name: "usdt-guide", path: "/wallet/usdt-guide", auth: true },
  { name: "offline", path: "/offline" },
  { name: "not-found", path: "/putduk-qa-no-such-route" },
];

test.describe("접근성 확장", () => {
  test("prefers-reduced-motion: reduce면 진입 애니메이션과 전환이 사실상 즉시 끝난다", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openPage(page, { user: "none" });
    await page.goto("/login");
    const duration = await page.locator(".route-screen, .auth-layout").first().evaluate((el) => getComputedStyle(el).animationDuration);
    expect(duration.split(",").every((value) => parseFloat(value) <= 0.01)).toBeTruthy();
  });

  test("로그인 폼은 Tab 순서가 화면에 보이는 순서(아이디→비밀번호→로그인→구글)와 같다", async ({ page }) => {
    await openPage(page, { user: "none" });
    await page.goto("/login");
    await waitChallenge(page);
    await page.locator('input[name="identifier"]').focus();
    const order: string[] = [];
    for (let i = 0; i < 5; i += 1) {
      const tag = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        return el ? `${el.tagName}#${el.id || el.getAttribute("name") || el.textContent?.trim().slice(0, 12)}` : "none";
      });
      order.push(tag);
      await page.keyboard.press("Tab");
    }
    expect(order[0]).toContain("identifier");
    expect(order[1]).toContain("password");
    const submitIndex = order.findIndex((item) => item.includes("로그인"));
    expect(submitIndex).toBeGreaterThan(1);
  });

  test("입금 탭바는 role=tablist·tab으로 스크린리더에 목록임을 알린다", async ({ page }) => {
    await openPage(page, { user: "a" });
    await becomeUser(page);
    await page.goto("/wallet/deposit");
    await expect(page.getByRole("tablist")).toBeVisible();
    const tabs = page.getByRole("tab");
    expect(await tabs.count()).toBeGreaterThanOrEqual(2);
  });
});

test.describe("접근성 axe", () => {
  for (const screen of SCREENS) {
    test(`${screen.name} critical/serious 0`, async ({ page }) => {
      await openPage(page, {
        user: screen.auth ? "a" : "none",
        onboarding: (screen.extra?.onboarding as "incomplete") || "complete",
        kyc: "none",
      });
      if (screen.auth && screen.path !== "/auth/complete-profile") {
        await becomeUser(page);
      }
      await page.goto(screen.path);
      if (screen.path === "/") {
        await expect(page.locator("#availableCapital, #beginExperience")).toBeVisible();
      } else if (screen.auth) {
        await expect(page.locator("h1, h2, .route-screen, .plain-notice").first()).toBeVisible();
      }
      // .route-screen/.app-view/.ask-ai-card 진입 애니메이션(최대 420ms)이 opacity를 0→1로 올린다.
      // 애니메이션 도중 스캔하면 배경과 섞인 순간 색이 잡혀 axe가 일시적인 명암비 미달을 보고한다.
      // 실제 명암 대비 기준을 낮추는 게 아니라, 자리 잡은 최종 상태를 스캔하도록 기다린다.
      await page.waitForTimeout(600);
      const results = await new AxeBuilder({ page }).analyze();
      const blocking = results.violations.filter((item) => item.impact === "critical" || item.impact === "serious");
      const dir = path.join("quality", "artifacts", "axe");
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, `${screen.name}.json`), JSON.stringify({ url: page.url(), blocking, violations: results.violations }, null, 2), "utf8");
      expect(blocking, blocking.map((item) => item.id).join(", ")).toEqual([]);
    });
  }
});
