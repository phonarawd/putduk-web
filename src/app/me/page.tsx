"use client";

import { useRouter } from "next/navigation";
import { GenderSelect } from "@/components/gpt/GenderSelect";
import { WorkspaceView } from "@/components/gpt/WorkspaceView";
import { formatMoneyPrimary, formatMoneySecondary, formatSignedMoneyPrimary } from "@/lib/gpt/format";
import { useCommonUi, useGptSession } from "@/lib/gpt/GptScopes";
import { useWallet } from "@/lib/wallet/WalletContext";
import { MSG } from "@/lib/messages";

const MENU_ITEMS = [
  { icon: "₩", title: "입금", small: "광산 운용 자본 넣기", path: "/wallet/deposit" },
  { icon: "↗", title: "출금", small: "출금 가능한 수익", path: "/wallet/withdraw" },
  { icon: "≡", title: "입출금 내역", small: "신청과 반영 기록", path: "/wallet/history" },
  { icon: "✓", title: "채굴 활동", small: "채굴 운용과 정산", path: "/activity" },
  { icon: "✓", title: "본인확인", small: "출금 전 확인", path: "/me/kyc" },
  { icon: "♢", title: "알림", small: "광산과 정산 소식", path: "/me/inbox" },
  { icon: "📢", title: "공지사항", small: "퍼뜩의 새 소식", path: "/me/notices" },
  { icon: "⚙", title: "설정", small: "내 계정 환경", path: "/me/settings" },
  { icon: "◎", title: "계정 기준", small: "계정에 정해진 기준", path: "/me/membership" },
  { icon: "★", title: "혜택", small: "현재 받을 혜택", path: "/me/benefits" },
  { icon: "🎉", title: "이벤트", small: "지금 진행 중인 이벤트", path: "/me/events" },
  { icon: "?", title: "고객지원", small: "도움이 필요할 때", path: "/me/support" },
  { icon: "§", title: "약관과 정보", small: "정책과 고지", path: "/legal" },
  { icon: "₮", title: "테더 준비", small: "트론 전송 안내", path: "/wallet/usdt-guide" },
] as const;

export default function MePage() {
  const router = useRouter();
  const { issuedAt, displayName, gender, logout } = useGptSession();
  const { chooseProfileGender } = useCommonUi();
  const wallet = useWallet();

  const moneyReady = wallet.ready;
  const principalUsdt = wallet.balance.principalUsdt;
  const principalKrw = wallet.balance.principalKrw;
  const profitUsdt = wallet.withdrawable.profitUsdt;
  const profitKrw = wallet.withdrawable.profitKrw;
  const practiceUsdt = wallet.deposit.practiceUsdt;
  const practiceKrw = wallet.deposit.practiceKrw;
  const trialVisible = wallet.trial.principalUsdt != null || wallet.trial.principalKrw != null;

  return (
    <WorkspaceView>
      <section className="app-view is-active" data-view="me" aria-labelledby="me-title">
        <div className="view-intro">
          <div>
            <span className="view-kicker">PUTDUK MINE OS</span>
            <h1 id="me-title">나</h1>
            <p>내 계정, 운용 자본, 출금과 설정을 한곳에서 확인하세요.</p>
          </div>
        </div>

        <section className="profile-grid">
          <article className="profile-pass">
            <div className="pass-top">
              <span>PUTDUK MINE OS</span>
              <i></i>
            </div>
            <div className="profile-pass-main">
              <small>광산 계정</small>
              <strong id="profileMineAccount">{displayName || "광산 계정"}</strong>
              <span id="profileIssued">{issuedAt ? new Date(issuedAt).toLocaleDateString("ko-KR") : ""}</span>
            </div>
            <div className="pass-bottom">
              <span>MINE OS</span>
              <span>활동 중</span>
            </div>
          </article>

          <article className="wallet-overview">
            <div className="wallet-overview-head">
              <div>
                <span>내 운용 지갑</span>
                <strong id="profileTotal">{moneyReady ? formatMoneyPrimary(principalUsdt, principalKrw) ?? "아직 표시할 금액이 없어요" : ""}</strong>
              </div>
            </div>
            {moneyReady && wallet.hasValues ? (
              <>
                <div className="wallet-lines wallet-lines-four">
                  <div>
                    <span>내 예치</span>
                    <b id="profileCapital">{formatMoneyPrimary(principalUsdt, principalKrw)}</b>
                    {formatMoneySecondary(principalUsdt, principalKrw) ? <small>{formatMoneySecondary(principalUsdt, principalKrw)}</small> : null}
                  </div>
                  {trialVisible ? (
                    <div>
                      <span>체험 원금 · 출금 불가</span>
                      <b>
                        {formatMoneyPrimary(wallet.trial.principalUsdt, wallet.trial.principalKrw) ?? "아직 표시할 금액이 없어요"}
                        {formatMoneySecondary(wallet.trial.principalUsdt, wallet.trial.principalKrw)
                          ? ` · ${formatMoneySecondary(wallet.trial.principalUsdt, wallet.trial.principalKrw)}`
                          : ""}
                      </b>
                    </div>
                  ) : null}
                  <div>
                    <span>출금 가능 수익</span>
                    <b id="profileProfit">{formatSignedMoneyPrimary(profitUsdt, profitKrw) ?? "아직 표시할 금액이 없어요"}</b>
                    {formatMoneySecondary(profitUsdt, profitKrw) ? <small>{formatMoneySecondary(profitUsdt, profitKrw)}</small> : null}
                  </div>
                  {wallet.balance.lockedUsdt != null || wallet.balance.lockedKrw != null ? (
                    <div>
                      <span>진행 중 잠금</span>
                      <b id="profileLocked">{formatMoneyPrimary(wallet.balance.lockedUsdt, wallet.balance.lockedKrw)}</b>
                    </div>
                  ) : null}
                  {wallet.trial.lockedUsdt != null ? (
                    <div>
                      <span>체험 진행 중 잠금 · 출금 불가</span>
                      <b>{formatMoneyPrimary(wallet.trial.lockedUsdt, null)}</b>
                    </div>
                  ) : null}
                  {practiceUsdt != null || practiceKrw != null ? (
                    <div>
                      <span>연습 · 사용 불가</span>
                      <b id="profilePractice">{formatMoneyPrimary(practiceUsdt, practiceKrw)}</b>
                    </div>
                  ) : null}
                </div>
                <p id="profileCapitalHint">예치·진행 중 잠금·출금 가능 수익은 서버 지갑 기준으로 각각 표시해요. 체험 원금과 연습 잔액은 출금할 수 없어요.</p>
              </>
            ) : moneyReady ? (
              <p id="profileCapitalHint">로그인 후 지갑 정보가 있으면 여기에 보여 드려요.</p>
            ) : null}
          </article>
        </section>

        <button className="text-action route-wide-action" type="button" onClick={() => router.push("/activity")}>
          채굴 활동 보기
        </button>

        <section className="me-menu" aria-label="나의 메뉴">
          {MENU_ITEMS.map((item) => (
            <button key={item.path} type="button" onClick={() => router.push(item.path)}>
              <span>{item.icon}</span>
              <div>
                <strong>{item.title}</strong>
                <small>{item.small}</small>
              </div>
              <i>→</i>
            </button>
          ))}
          <button type="button" onClick={() => router.push("/ai")}>
            <span className="menu-logo">
              <img src="/putduk-mark.svg" alt="" />
            </span>
            <div>
              <strong>퍼뜩에게 묻기</strong>
              <small>내 상황으로 질문</small>
            </div>
            <i>→</i>
          </button>
        </section>

        <section className="profile-edit-card">
          <div>
            <span className="view-kicker">내 표시 정보</span>
            <h2 id="profileDisplayName">{displayName || "광산 계정"}</h2>
            <p>이름은 화면에 보이는 표시 이름이며 본인확인 실명이 아니에요.</p>
          </div>
          <GenderSelect
            variant="compact"
            group="profile"
            value={gender}
            onChange={(value) => chooseProfileGender(value)}
          />
        </section>

        <section className="profile-network">
          <div>
            <span className="view-kicker">MINE OS 운영</span>
            <h2>광산 운용 상태는 서버 기준입니다.</h2>
            <p>광산 운용, 채굴 결과, 정산과 출금 가능 금액은 연결된 서버 응답을 기준으로 표시합니다.</p>
          </div>
        </section>

        <button id="logoutButton" className="logout-button" type="button" onClick={logout}>
          로그아웃
        </button>
      </section>
    </WorkspaceView>
  );
}
