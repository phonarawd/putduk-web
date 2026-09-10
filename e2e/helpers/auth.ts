import { expect, type Page } from "@playwright/test";
import { installApiMock, seedAccountSlice, type MockOptions } from "../fixtures/mock-api.ts";
import { USER_A, USER_B } from "../fixtures/dto.ts";
import { installTurnstile } from "./turnstile.ts";
import { attachSignals } from "./observe.ts";

export async function openPage(page: Page, options: MockOptions = {}) {
  const signals = attachSignals(page);
  await installTurnstile(page);
  const mock = await installApiMock(page, options);
  return { signals, mock };
}

export async function waitChallenge(page: Page) {
  await expect(page.locator('.challenge-box[data-challenge-ready="true"]')).toBeVisible({ timeout: 10_000 });
}

export async function resetRoutes(page: Page) {
  await page.unrouteAll({ behavior: "ignoreErrors" });
  await page.context().unrouteAll({ behavior: "ignoreErrors" });
}

export async function becomeUser(page: Page) {
  const seen: string[] = [];
  const onRequest = (request: { method: () => string; url: () => string }) => {
    const url = request.url();
    if (url.includes("/api/v1/")) seen.push(`${request.method()} ${url}`);
  };
  page.on("request", onRequest);
  try {
    await page.goto("/me");
    await expect(page.locator("#logoutButton")).toBeVisible({ timeout: 15_000 });
  } catch (error) {
    throw new Error(`becomeUser url=${page.url()} api=[${seen.join("; ")}] ${(error as Error).message}`);
  } finally {
    page.off("request", onRequest);
  }
}

export async function loginThroughForm(page: Page, who: "a" | "b" = "a") {
  const user = who === "b" ? USER_B : USER_A;
  await page.goto("/login");
  await waitChallenge(page);
  await page.locator('input[name="identifier"]').fill(user.email);
  await page.locator('input[name="password"]').fill("password1");
  await page.locator('form[data-form="login"] button[type="submit"]').click();
  await expect(page).not.toHaveURL(/\/login$/, { timeout: 15_000 });
}

export async function loginSeeded(page: Page, who: "a" | "b", conversationTitle?: string) {
  const user = who === "b" ? USER_B : USER_A;
  await page.goto("/");
  await seedAccountSlice(page, user, conversationTitle ? { conversationTitle } : undefined);
  await becomeUser(page);
}

export { USER_A, USER_B };
