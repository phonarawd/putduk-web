"use client";

import { useEffect, useState } from "react";
import { WorkspaceView } from "@/components/gpt/WorkspaceView";
import { copyTextToClipboard } from "@/lib/gpt/clipboard";
import { useCommonUi } from "@/lib/gpt/GptScopes";
import { getReferralMe, readReferral } from "@/lib/api";
import { MSG } from "@/lib/messages";

export default function InvitePage() {
  const { showToast } = useCommonUi();
  const [code, setCode] = useState<string | null>(null);
  const [referralLink, setReferralLink] = useState("");
  const [inviteCountUnlimited, setInviteCountUnlimited] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getReferralMe()
      .then((data) => {
        const found = readReferral(data);
        setCode(found?.code ?? null);
        setReferralLink(found?.link ?? "");
        setInviteCountUnlimited(found?.inviteCountUnlimited ?? null);
        setFailed(false);
        setReady(true);
      })
      .catch(() => {
        setCode(null);
        setReferralLink("");
        setInviteCountUnlimited(null);
        setFailed(true);
        setReady(true);
      });
  }, []);

  async function copyReferral() {
    if (!referralLink) return;
    const ok = await copyTextToClipboard(referralLink);
    showToast(ok ? MSG.inviteCopy : MSG.copyFail, ok ? "success" : "warning");
  }

  async function shareReferral() {
    if (!referralLink) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "퍼뜩 초대", text: "퍼뜩 리셀러 데스크에서 함께 시작해요.", url: referralLink });
        showToast(MSG.inviteShare, "success");
        return;
      } catch {
        // 공유 시트를 닫으면 복사로 대신한다.
      }
    }
    copyReferral();
  }

  return (
    <WorkspaceView>
      <section className="app-view is-active" data-view="invite" aria-labelledby="invite-title">
        <div className="view-intro">
          <div>
            <span className="view-kicker">추천 코드</span>
            <h1 id="invite-title">초대</h1>
            <p>계정에 있는 추천 코드만 보여 드려요. 횟수와 금액은 화면에서 더하지 않아요.</p>
          </div>
        </div>
        <section className="referral-hero">
          <div className="referral-copy">
            <span className="referral-kicker">나의 추천 코드</span>
            {failed ? (
              <>
                <strong id="referralResellerId">{MSG.inviteLoadFail}</strong>
                <p>{MSG.genericError}</p>
              </>
            ) : ready && (code || referralLink) ? (
              <>
                <strong id="referralResellerId">{code || "초대 코드"}</strong>
                <p>
                  {inviteCountUnlimited === true
                    ? "부를 수 있는 친구 수에는 제한이 없어요. 혜택 숫자는 화면에서 더하지 않아요."
                    : "계정에 있는 추천 코드만 보여 드려요. 혜택 숫자는 화면에서 더하지 않아요."}
                </p>
                {referralLink ? (
                  <label className="referral-link-box">
                    <span className="sr-only">추천 링크</span>
                    <input id="referralLink" type="text" readOnly value={referralLink} />
                    <button id="copyReferral" type="button" onClick={copyReferral}>
                      링크 복사
                    </button>
                  </label>
                ) : null}
              </>
            ) : (
              <>
                <strong id="referralResellerId">아직 초대 정보가 없어요</strong>
                <p>로그인 후 초대 코드가 있으면 여기에 보여 드려요. 횟수는 화면에서 더하지 않아요.</p>
              </>
            )}
          </div>
        </section>
        <section className="referral-how">
          <article>
            <span>1</span>
            <div>
              <strong>친구가 코드로 가입</strong>
              <small>추천 코드가 연결돼요</small>
            </div>
          </article>
          <article>
            <span>2</span>
            <div>
              <strong>친구가 시작을 이어가요</strong>
              <small>화면에서 단계를 완료 처리하지 않아요</small>
            </div>
          </article>
          <article>
            <span>3</span>
            <div>
              <strong>혜택 숫자는 여기에서 확정하지 않아요</strong>
              <small>첫 수익이 났다고 보너스를 더하지 않아요</small>
            </div>
          </article>
        </section>
        <section className="referral-demo-card invite-trust-card">
          <div>
            <span>혜택 안내</span>
            <strong id="referralStateText">추천 혜택은 바로 큰돈이 들어오는 구조가 아니에요.</strong>
            <small>첫 체험만 마쳤다고 매칭 횟수가 생기지 않아요.</small>
          </div>
          {referralLink ? (
            <button id="shareReferral" className="secondary-accent-button" type="button" onClick={shareReferral}>
              추천 링크 공유
            </button>
          ) : null}
        </section>
      </section>
    </WorkspaceView>
  );
}
