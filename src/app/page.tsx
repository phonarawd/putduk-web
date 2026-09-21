"use client";

import { useRouter } from "next/navigation";
import { MiningHome } from "@/components/mining/MiningHome";
import { ReadyNotice } from "@/components/gpt/ReadyNotice";
import { WorkspaceView } from "@/components/gpt/WorkspaceView";
import { useGptSession } from "@/lib/gpt/GptScopes";
import { MSG } from "@/lib/messages";

function IntroScreen() {
  const router = useRouter();

  return (
    <main className="min-h-[calc(100vh-72px)] bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.14),_transparent_34%),linear-gradient(180deg,#f8fbff_0%,#ffffff_70%)]">
      <section className="mx-auto grid w-full max-w-[1180px] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
        <div>
          <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black tracking-[0.14em] text-blue-700">
            PUTDUK MINING
          </span>
          <h1 className="mt-5 text-4xl font-black leading-[1.08] tracking-[-0.055em] text-slate-950 sm:text-6xl">
            내 자산의 운용과 채굴을
            <br />
            한곳에서 확인하세요.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            퍼뜩은 서버에 반영된 광산 운용 상태, 채굴 수익, 출금 가능 금액과 정산 내역을 한 화면에서 보여 드립니다.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 text-sm font-black text-white shadow-lg shadow-slate-300 transition hover:bg-slate-800"
            >
              로그인하고 채굴 홈 열기
            </button>
            <button
              type="button"
              onClick={() => router.push("/signup")}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-black text-slate-700 transition hover:border-slate-300"
            >
              회원가입
            </button>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-[0_30px_80px_rgba(15,23,42,0.12)] sm:p-7">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div>
              <p className="text-xs font-black tracking-[0.14em] text-blue-600">MINING OVERVIEW</p>
              <strong className="mt-1 block text-xl font-black tracking-[-0.04em] text-slate-950">채굴 현황을 빠르게</strong>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-lg font-black text-white" aria-hidden="true">
              P
            </span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {[
              ["오늘 채굴", "서버 집계 수익"],
              ["운용 중", "현재 운용 자산"],
              ["출금 가능", "확정 수익"],
            ].map(([label, detail]) => (
              <div key={label} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-500">{label}</p>
                <strong className="mt-2 block text-sm font-black text-slate-900">{detail}</strong>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
            금융 상태는 브라우저가 계산해 만들지 않고 서버 권위값을 기준으로 표시합니다.
          </div>
        </div>
      </section>
    </main>
  );
}

function HomeWorkspace() {
  return (
    <WorkspaceView>
      <section className="app-view is-active" data-view="home">
        <MiningHome />
      </section>
    </WorkspaceView>
  );
}

export default function HomePage() {
  const { sessionReady, loggedIn } = useGptSession();

  if (!sessionReady) {
    return (
      <section className="route-screen shell" aria-live="polite">
        <ReadyNotice waiting title={MSG.screenWait} copy={MSG.screenWaitCopy} />
      </section>
    );
  }

  return loggedIn ? <HomeWorkspace /> : <IntroScreen />;
}
