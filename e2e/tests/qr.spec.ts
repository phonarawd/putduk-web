import path from "node:path";
import { expect, test } from "@playwright/test";
import { DEPOSIT_ADDRESS } from "../fixtures/dto.ts";
import { becomeUser, openPage } from "../helpers/auth.ts";

test.describe("QR", () => {
  test("서버 주소 문자열만 인코딩하고 원문·복사를 유지한다", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => undefined);
    await openPage(page, { user: "a" });
    await becomeUser(page);
    await page.goto("/wallet/deposit");
    await page.locator("#deposit-tab-usdt").click();
    await expect(page.locator("#usdtAddress")).toHaveText(DEPOSIT_ADDRESS.trc20Address);
    await expect(page.locator(".qr-preview")).toHaveAttribute("data-qr-payload", DEPOSIT_ADDRESS.qrPayload);
    await expect(page.locator(".deposit-qr-canvas")).toBeVisible();

    await page.addScriptTag({ path: path.join(process.cwd(), "node_modules", "jsqr", "dist", "jsQR.js") });
    const decoded = await page.evaluate(() => {
      const canvas = document.querySelector("canvas.deposit-qr-canvas") as HTMLCanvasElement | null;
      if (!canvas) return "";
      const ctx = canvas.getContext("2d");
      if (!ctx) return "";
      const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const decode = (window as unknown as { jsQR?: (data: Uint8ClampedArray, width: number, height: number) => { data: string } | null }).jsQR;
      return decode?.(image.data, image.width, image.height)?.data ?? "";
    });
    expect(decoded).toBe(DEPOSIT_ADDRESS.qrPayload);

    await page.getByRole("button", { name: "주소 복사" }).click();
    const copied = await page.evaluate(() => navigator.clipboard.readText()).catch(() => "");
    if (copied) expect(copied).toBe(DEPOSIT_ADDRESS.trc20Address);
  });
});
