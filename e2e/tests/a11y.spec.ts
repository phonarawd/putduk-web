import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { becomeUser, openPage } from "../helpers/auth.ts";
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
];

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
      const results = await new AxeBuilder({ page }).analyze();
      const blocking = results.violations.filter((item) => item.impact === "critical" || item.impact === "serious");
      const dir = path.join("quality", "artifacts", "axe");
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, `${screen.name}.json`), JSON.stringify({ url: page.url(), blocking, violations: results.violations }, null, 2), "utf8");
      expect(blocking, blocking.map((item) => item.id).join(", ")).toEqual([]);
    });
  }
});
