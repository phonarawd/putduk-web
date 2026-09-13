import { expect, test } from "@playwright/test";
import { MSG } from "../../src/lib/messages.ts";
import { AUTHORIZE_URL, USER_A, sessionDto } from "../fixtures/dto.ts";
import { loginThroughForm, openPage, resetRoutes, waitChallenge } from "../helpers/auth.ts";
import { QA_TURNSTILE } from "../helpers/turnstile.ts";

test.describe("인증 1-12", () => {
  test("1. 로그아웃에서 내 기록은 로그인으로 보낸다", async ({ page }) => {
    await openPage(page, { user: "none" });
    await page.goto("/me/records");
    await expect(page).toHaveURL(/\/login/);
  });

  test("2. Google start는 검증된 authorizeUrl로만 옮긴다", async ({ page }) => {
    await openPage(page, { user: "none", googleStart: "ok" });
    await page.route("https://accounts.google.com/**", (route) =>
      route.fulfill({ status: 200, contentType: "text/html", body: "google-qa" }),
    );
    await page.goto("/login");
    await page.getByRole("button", { name: "구글로 계속하기" }).click();
    await expect(page).toHaveURL((url) => url.href.startsWith("https://accounts.google.com/"));
    expect(page.url()).toBe(AUTHORIZE_URL);
  });

  test("3. 위험 프로토콜과 잘못된 URL은 거절한다", async ({ page }) => {
    const { mock } = await openPage(page, { user: "none", googleStart: "javascript" });
    await page.goto("/login");
    await page.getByRole("button", { name: "구글로 계속하기" }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(MSG.googleUrlFail)).toBeVisible();

    await resetRoutes(page);
    await openPage(page, { user: "none", googleStart: "invalid" });
    await page.goto("/login");
    await page.getByRole("button", { name: "구글로 계속하기" }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(MSG.googleUrlFail)).toBeVisible();
    expect(mock.captured.callbackCount).toBe(0);
  });

  test("4. Google callback에서 code/state가 없으면 API를 부르지 않는다", async ({ page }) => {
    const { mock } = await openPage(page, { user: "none" });
    await page.goto("/auth/oauth/google/callback");
    await expect(page.getByText(MSG.googleCallbackNeed)).toBeVisible();
    expect(mock.captured.callbackCount).toBe(0);
  });

  test("5. callback 중복 호출을 막는다", async ({ page }) => {
    const { mock } = await openPage(page, { user: "none", googleCallback: "existing" });
    await page.goto("/auth/oauth/google/callback?code=qa-code&state=qa-state");
    await expect(page.locator('form[data-form="google-complete"]')).toBeVisible();
    expect(mock.captured.callbackCount).toBe(0);
    await page.locator('input[name="requiredTerms"]').check();
    await page.getByRole("button", { name: "약관에 동의하고 계속" }).click();
    await expect(page).not.toHaveURL(/\/auth\/oauth\/google\/callback/);
    expect(mock.captured.callbackCount).toBe(1);
    expect(mock.captured.callbackBodies[0]).toMatchObject({ code: "qa-code", state: "qa-state" });
  });

  test("6. 기존 사용자 callback 후 홈", async ({ page }) => {
    await openPage(page, { user: "a", googleCallback: "existing" });
    await page.goto("/auth/oauth/google/callback?code=qa-code&state=qa-state");
    await page.locator('input[name="requiredTerms"]').check();
    await page.getByRole("button", { name: "약관에 동의하고 계속" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("button", { name: /로그인하고 데스크 열기/ })).toHaveCount(0);
  });

  test("7. 신규 사용자 callback 후 약관 확정", async ({ page }) => {
    const { mock } = await openPage(page, { user: "none", googleCallback: "new-terms" });
    await page.goto("/auth/oauth/google/callback?code=qa-code&state=qa-state");
    await expect(page.locator('form[data-form="google-complete"]')).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/oauth\/google\/callback/);
    expect(mock.captured.callbackCount).toBe(0);
    await page.locator('input[name="requiredTerms"]').check();
    await page.getByRole("button", { name: "약관에 동의하고 계속" }).click();
    await expect(page).toHaveURL(/\/$/);
    expect(mock.captured.callbackCount).toBe(1);
    const callback = mock.captured.callbackBodies[0] as Record<string, unknown>;
    expect(callback).toMatchObject({ code: "qa-code", state: "qa-state" });
    expect(typeof callback.termsAcceptedAt).toBe("string");
    expect(typeof callback.privacyAcceptedAt).toBe("string");
    expect(callback).not.toHaveProperty("pendingToken");
  });

  test("8. 필수정보 입력 후 홈", async ({ page }) => {
    const { mock } = await openPage(page, { user: "a", onboarding: "incomplete" });
    await page.goto("/");
    await expect(page).toHaveURL(/\/auth\/complete-profile/);
    await page.locator('input[name="email"]').fill("qa-account-a@putduk.test");
    await page.locator('input[name="displayName"]').fill("테스터갑");
    await page.locator('input[name="birthday"]').fill("900101");
    await page.locator('input[name="phone"]').fill("01000000001");
    await page.getByRole("button", { name: "내 데스크 준비하기" }).click();
    await expect(page).toHaveURL(/\/$/);
    expect(mock.captured.profileBodies[0]).toMatchObject({
      displayName: "테스터갑",
      phoneE164: "+821000000001",
      birthDate: "1990-01-01",
    });
    expect(JSON.stringify(mock.captured.profileBodies[0])).not.toMatch(/gender/);
  });

  test("9. complete-profile 필수 입력", async ({ page }) => {
    await openPage(page, { user: "a", onboarding: "incomplete" });
    await page.goto("/auth/complete-profile");
    await page.getByRole("button", { name: "내 데스크 준비하기" }).click();
    await expect(page.getByText(MSG.profileNeed)).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/complete-profile/);
  });

  test("10. email-resend는 Turnstile 토큰을 포함한다", async ({ page }) => {
    const { mock } = await openPage(page, { user: "none" });
    await page.goto("/signup");
    await page.locator('input[name="username"]').fill("qaaccounta");
    await page.locator('input[name="email"]').fill("qa-account-a@putduk.test");
    await page.locator('input[name="password"]').fill("password1");
    await page.locator('input[name="passwordConfirm"]').fill("password1");
    await page.locator('input[name="displayName"]').fill("테스터갑");
    await page.locator('input[name="birthday"]').fill("900101");
    await page.locator('input[name="phone"]').fill("01000000001");
    await page.getByRole("button", { name: /남성/ }).click();
    await page.locator('input[name="requiredTerms"]').check();
    await waitChallenge(page);
    await page.getByRole("button", { name: "회원가입", exact: true }).click();
    await expect(page).toHaveURL(/\/auth\/verify-email/);
    await waitChallenge(page);
    await page.getByRole("button", { name: "인증 메일 다시 받기" }).click();
    await expect.poll(() => mock.captured.resendBodies.length).toBe(1);
    expect(mock.captured.resendBodies[0]).toMatchObject({
      email: "qa-account-a@putduk.test",
      turnstileToken: QA_TURNSTILE,
    });
  });

  test("11. Turnstile 위젯이 로그인·가입·찾기·재설정에 있다", async ({ page }) => {
    await openPage(page, { user: "none" });
    for (const path of ["/login", "/signup", "/auth/find-id", "/auth/reset-password"]) {
      await page.goto(path);
      await expect(page.locator(".challenge-box")).toHaveCount(1);
    }
  });

  test("12. 로그인 Turnstile 회면과 토큰 전송", async ({ page }) => {
    const { mock } = await openPage(page, { user: "a" });
    await loginThroughForm(page, "a");
    expect(mock.captured.loginBodies[0]).toMatchObject({ turnstileToken: QA_TURNSTILE });
  });

  // 백엔드 PR #222 (phonarawd/AI-Profit-OS, SHA 0fa38d77a4a461ae1b20eb81d7f5a2380a9fbaf3, 2026-09-11 재확인:
  // OPEN, MERGED:false)의 schemas/auth-session.v1.json, schemas/user-profile.v1.json 정식 스키마와
  // 우리 mock fixture(dto.ts)가 어긋나면 잡는다. 백엔드가 머지되기 전에도 계약 오타·enum 실수를 잡는 목적이라
  // additionalProperties:false까지 흉내내지는 않는다(우리 세션 목은 편의상 email/username 등을 더 얹어 두는데
  // 실제 응답이 user/profile로 감싸 보낼 수도 있어 sessionUser()가 두 형태 다 읽게 이미 방어돼 있다 - api.ts 참고).
  test("13. 세션·프로필 목 데이터가 백엔드 공식 스키마(enum·패턴)와 어긋나지 않는다", () => {
    const session = sessionDto(USER_A, "complete", "male");
    expect(["sessionId", "userId", "issuer", "issuedAt", "expiresAt", "revoked"].every((key) => key in session)).toBeTruthy();
    expect(session.issuer).toBe("ai-profit-os-nest");
    expect(["A", "B_incomplete", "B_complete"]).toContain(session.onboardingStage);
    expect([null, "male", "female"]).toContain(session.gender);
    expect(typeof session.issuedAt).toBe("string");
    expect(typeof session.expiresAt).toBe("string");
    expect(typeof session.revoked).toBe("boolean");

    // user-profile.v1.json: phoneE164 패턴, displayName 길이, gender는 male/female/null만.
    const phoneE164 = "+821000000001";
    expect(phoneE164).toMatch(/^\+[1-9][0-9]{7,14}$/);
    expect(USER_A.declaredName.length).toBeGreaterThanOrEqual(2);
    expect(USER_A.declaredName.length).toBeLessThanOrEqual(40);
    expect(["male", "female", null]).toContain(USER_A.gender);
    // 스키마가 명시적으로 금지하는 필드는 우리 fixture 어디에도 없어야 한다(주민번호 전체·자유 문자열 성별·주소 필수).
    const serialized = JSON.stringify(session);
    expect(serialized).not.toMatch(/rrnFull/);
    expect(serialized).not.toMatch(/addressRequired/);
  });
});
