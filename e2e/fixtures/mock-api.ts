import type { Page, Route } from "@playwright/test";
import {
  AUTHORIZE_URL,
  BENEFITS,
  DEPOSIT_ADDRESS,
  EBAY_LEGACY_70,
  HOME_MONEY,
  KRW_GUIDE,
  LEDGER,
  MEMBERSHIP,
  OPPORTUNITY_LIST,
  TRIAL_NONE,
  USER_A,
  USER_B,
  googleCallbackDto,
  googleStartDto,
  kycDto,
  sessionDto,
} from "./dto.ts";

export type MockUser = "a" | "b" | "none";
export type KycMode = "none" | "pending" | "approved" | "rejected" | "error" | "slow";
export type KycSubmitMode = "ok" | "conflict-pending" | "conflict-approved";
export type LedgerMode = "full" | "empty" | "error";
export type GoogleStartMode = "ok" | "javascript" | "invalid";
export type GoogleCallbackMode = "existing" | "new-terms" | "incomplete" | "missing-skip";
export type WithdrawPolicyMode = "ok" | "fail" | "fail-once";
export type KrwMode = "ok" | "empty" | "error";

export type MockOptions = {
  user?: MockUser;
  onboarding?: "complete" | "incomplete";
  kyc?: KycMode;
  kycSubmit?: KycSubmitMode;
  ledger?: LedgerMode;
  googleStart?: GoogleStartMode;
  googleCallback?: GoogleCallbackMode;
  withdrawPolicy?: WithdrawPolicyMode;
  krw?: KrwMode;
  depositAddress?: boolean;
  withdrawFailOnce?: boolean;
  withdrawFailCount?: number;
  opportunities?: "default" | "empty" | "mixed-legacy" | "selected-a";
  homeReadLegacy?: boolean;
  opportunityDetail?: "ok" | "404";
  participate?: "ok" | "daily-cap" | "daily-cap-code" | "blocked";
};

type Captured = {
  loginBodies: unknown[];
  resendBodies: unknown[];
  callbackBodies: unknown[];
  callbackCount: number;
  withdrawBodies: unknown[];
  profileBodies: unknown[];
  kycSubmits: number;
};

export type ApiMock = {
  captured: Captured;
};

function corsHeaders(request: { headers: () => Record<string, string> }) {
  const headers = request.headers();
  const origin = headers.origin || "http://127.0.0.1:4173";
  const requested = headers["access-control-request-headers"];
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-credentials": "true",
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers": requested || "content-type",
    vary: "Origin",
  };
}

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    headers: corsHeaders(route.request()),
    body: JSON.stringify(body),
  });
}

function userOf(key: MockUser) {
  if (key === "b") return USER_B;
  return USER_A;
}

export async function installApiMock(page: Page, options: MockOptions = {}): Promise<ApiMock> {
  const captured: Captured = {
    loginBodies: [],
    resendBodies: [],
    callbackBodies: [],
    callbackCount: 0,
    withdrawBodies: [],
    profileBodies: [],
    kycSubmits: 0,
  };
  let withdrawFails = options.withdrawFailCount ?? (options.withdrawFailOnce ? 8 : 0);
  let policyFails = options.withdrawPolicy === "fail-once" ? 1 : options.withdrawPolicy === "fail" ? 99 : 0;
  const sessionGender = new Map<string, "male" | "female">();
  let kycLive: Exclude<KycMode, "error" | "slow"> = options.kyc === "error" || options.kyc === "slow" || !options.kyc ? "none" : options.kyc;

  await page.context().route(
    (url) => url.hostname === "api.hiptk.app" || url.pathname.startsWith("/api/v1/"),
    async (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") {
      return route.fulfill({
        status: 204,
        headers: corsHeaders(request),
      });
    }

    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    let body: Record<string, unknown> = {};
    try {
      body = request.postDataJSON() as Record<string, unknown>;
    } catch {
      body = {};
    }

    if (path === "/api/v1/auth/session" && method === "GET") {
      if (!options.user || options.user === "none") return json(route, { message: "AUTH_REQUIRED" }, 401);
      const user = userOf(options.user);
      return json(route, sessionDto(user, options.onboarding ?? "complete", sessionGender.get(user.userId) ?? null));
    }

    if (path === "/api/v1/auth/login" && method === "POST") {
      captured.loginBodies.push(body);
      await new Promise((resolve) => setTimeout(resolve, 400));
      return json(route, { ok: true });
    }

    if (path === "/api/v1/auth/logout" && method === "POST") return json(route, { ok: true });
    if (path === "/api/v1/auth/refresh" && method === "POST") return json(route, { ok: true });

    if (path === "/api/v1/auth/signup/classic" && method === "POST") return json(route, { ok: true });
    if (path === "/api/v1/auth/signup/classic/verify" && method === "POST") return json(route, { ok: true });

    if (path === "/api/v1/auth/email/resend" && method === "POST") {
      captured.resendBodies.push(body);
      return json(route, { ok: true });
    }

    if (path === "/api/v1/auth/find-id" && method === "POST") return json(route, { username: USER_A.username });
    if (path === "/api/v1/auth/password-reset/request" && method === "POST") return json(route, { ok: true });
    if (path === "/api/v1/auth/password-reset/complete" && method === "POST") return json(route, { ok: true });

    if (path === "/api/v1/auth/oauth/google/start" && method === "POST") {
      if (options.googleStart === "javascript") return json(route, googleStartDto("javascript:alert(1)"));
      if (options.googleStart === "invalid") return json(route, { ok: true, url: AUTHORIZE_URL });
      return json(route, googleStartDto());
    }

    if (path === "/api/v1/auth/oauth/google/callback" && method === "POST") {
      captured.callbackCount += 1;
      captured.callbackBodies.push(body);
      const termsOk = typeof body.termsAcceptedAt === "string" && typeof body.privacyAcceptedAt === "string";
      if (!termsOk) {
        return json(route, { code: "TERMS_REQUIRED", message: "TERMS_REQUIRED" }, 400);
      }
      if (options.googleCallback === "incomplete") return json(route, googleCallbackDto("incomplete"));
      return json(route, googleCallbackDto("complete"));
    }

    if (path === "/api/v1/auth/profile" && method === "PATCH") {
      captured.profileBodies.push(body);
      const gender = body.gender === "male" || body.gender === "female" ? body.gender : undefined;
      if (gender && options.user && options.user !== "none") {
        sessionGender.set(userOf(options.user).userId, gender);
      }
      const stored =
        gender ??
        (options.user && options.user !== "none" ? sessionGender.get(userOf(options.user).userId) ?? null : null);
      return json(route, { ok: true, onboarding: "complete", onboardingStage: "B_complete", gender: stored ?? null });
    }

    if (path === "/api/v1/me/home-read" && method === "GET") {
      if (options.homeReadLegacy) return json(route, { listFeed: EBAY_LEGACY_70 });
      return json(route, { opportunity: { itemCount: options.opportunities === "empty" ? 0 : 1 } });
    }
    if (path === "/api/v1/me/home-money-read" && method === "GET") return json(route, HOME_MONEY);
    if (path === "/api/v1/me/trial-state" && method === "GET") return json(route, TRIAL_NONE);
    if (path === "/api/v1/me/current-fx/approx" && method === "POST") {
      return json(route, { principalKrwApprox: 18000, withdrawableProfitKrwApprox: 4700 });
    }
    if (path === "/api/v1/opportunities" && method === "GET") {
      if (options.opportunities === "empty") return json(route, { items: [] });
      if (options.opportunities === "selected-a" && options.user !== "a") {
        return json(route, { items: [] });
      }
      if (options.opportunities === "mixed-legacy") {
        return json(route, { items: [...OPPORTUNITY_LIST.items, ...EBAY_LEGACY_70] });
      }
      return json(route, OPPORTUNITY_LIST);
    }
    if (path.startsWith("/api/v1/opportunities/") && path.endsWith("/preflight") && method === "POST") {
      return json(route, { preflightToken: "qa-preflight-token" });
    }
    if (path.startsWith("/api/v1/opportunities/") && path.endsWith("/participate") && method === "POST") {
      if (options.participate === "daily-cap") {
        return json(
          route,
          {
            code: "DAILY_MATCH_CAP",
            toastCode: "DAILY_MATCH_CAP",
            message: "오늘 참여 횟수를 모두 썼어요.",
            statusCode: 403,
          },
          403,
        );
      }
      if (options.participate === "daily-cap-code") {
        return json(
          route,
          {
            code: "DAILY_MATCH_CAP",
            toastCode: "DAILY_MATCH_CAP",
            message: "dailyUserMatchCap reached",
            statusCode: 403,
          },
          403,
        );
      }
      if (options.participate === "blocked") {
        return json(
          route,
          {
            message: {
              code: "MATCH_BLOCKED",
              toastCode: "MATCH_BLOCKED",
              message: "지금은 매칭을 진행할 수 없어요. 고객센터에 문의해 주세요",
              statusCode: 403,
            },
            error: "Forbidden",
            statusCode: 403,
          },
          403,
        );
      }
      return json(route, { ok: true, status: "accepted", tradeId: null });
    }
    if (path.startsWith("/api/v1/opportunities/") && method === "GET") {
      if (options.opportunityDetail === "404") {
        return json(route, { message: "opportunity not found", error: "Not Found", statusCode: 404 }, 404);
      }
      return json(route, { item: OPPORTUNITY_LIST.items[0] });
    }
    if (path === "/api/v1/trades" && method === "GET") return json(route, { items: [] });
    if (path === "/api/v1/wallet/buckets" && method === "GET") return json(route, { items: [] });

    if (path === "/api/v1/wallet/my-deposit-address" && method === "GET") {
      if (options.depositAddress === false) return json(route, { message: "NOT_FOUND" }, 404);
      return json(route, DEPOSIT_ADDRESS);
    }

    if (path === "/api/v1/wallet/krw-deposit-instructions" && method === "GET") {
      if (options.krw === "empty") return json(route, { message: "CONFIG_NOT_READY" }, 503);
      if (options.krw === "error") return json(route, { message: "TEMP_FAIL" }, 500);
      return json(route, KRW_GUIDE);
    }
    if (path === "/api/v1/wallet/krw-deposit-requests" && method === "POST") return json(route, { ok: true });

    if (path === "/api/v1/me/ledger/journals" && method === "GET") {
      if (options.ledger === "error") return json(route, { message: "TEMP_FAIL" }, 500);
      if (options.ledger === "empty") return json(route, { items: [], total: 0, limit: 20, offset: 0 });
      return json(route, LEDGER);
    }

    if (path === "/api/v1/wallet/withdraw/step-up/policy" && method === "GET") {
      if (policyFails > 0) {
        policyFails -= 1;
        return json(route, { message: "TEMP_FAIL" }, 500);
      }
      return json(route, { priority: ["email_otp"] });
    }
    if (path === "/api/v1/wallet/withdraw/step-up/challenge" && method === "POST") {
      return json(route, { challengeId: "qa-challenge-1" });
    }
    if (path === "/api/v1/wallet/withdraw/step-up/verify" && method === "POST") {
      return json(route, { stepUpToken: "qa-step-up-token" });
    }
    if (path === "/api/v1/wallet/withdraw" && method === "POST") {
      captured.withdrawBodies.push(body);
      if (withdrawFails > 0) {
        withdrawFails -= 1;
        return json(route, { message: "timeout" }, 504);
      }
      return json(route, { ok: true });
    }

    if (path === "/api/v1/compliance/kyc/status" && method === "GET") {
      if (options.kyc === "error") return json(route, { message: "TEMP_FAIL" }, 500);
      if (options.kyc === "slow") {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        return json(route, kycDto("none"));
      }
      return json(route, kycDto(kycLive));
    }
    if (path === "/api/v1/compliance/kyc/submit" && method === "POST") {
      captured.kycSubmits += 1;
      if (options.kycSubmit === "conflict-pending") {
        kycLive = "pending";
        return json(route, { message: "pending" }, 409);
      }
      if (options.kycSubmit === "conflict-approved") {
        kycLive = "approved";
        return json(route, { message: "approved" }, 409);
      }
      kycLive = "pending";
      return json(route, { ok: true });
    }

    if (path === "/api/v1/me/membership" && method === "GET") return json(route, MEMBERSHIP);
    if (path === "/api/v1/me/benefits" && method === "GET") return json(route, BENEFITS);
    if (path === "/api/v1/referral/me" && method === "GET") {
      return json(route, { referralCode: "QA-REF", inviteCountUnlimited: true, rewardsEnabled: false });
    }

    return json(route, { message: "NOT_FOUND" }, 404);
  });

  return { captured };
}

export async function seedAccountSlice(
  page: import("@playwright/test").Page,
  user: typeof USER_A | typeof USER_B,
  extra?: { conversationTitle?: string },
) {
  await page.evaluate(
    ({ prefix, userId, slice }) => {
      window.localStorage.setItem(prefix + userId, JSON.stringify(slice));
    },
    {
      prefix: "putduk-web-account-v1:",
      userId: user.userId,
      slice: {
        displayName: user.declaredName,
        email: user.email,
        birthday: user.birthday,
        gender: user.gender,
        phone: user.phone,
        conversations: extra?.conversationTitle
          ? [
              {
                id: `talk-${user.userId.slice(-1)}`,
                title: extra.conversationTitle,
                updatedAt: "2026-09-10T00:00:00.000Z",
                messages: [{ role: "assistant", text: extra.conversationTitle, createdAt: "2026-09-10T00:00:00.000Z" }],
              },
            ]
          : [],
        activeConversationId: extra?.conversationTitle ? `talk-${user.userId.slice(-1)}` : "",
        pendingAiQuestion: "",
        pendingRoute: "",
      },
    },
  );
}

export { AUTHORIZE_URL, DEPOSIT_ADDRESS, USER_A, USER_B };
