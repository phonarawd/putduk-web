"use client";

import { useEffect, useState } from "react";
import { ReadyNotice } from "@/components/gpt/ReadyNotice";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";
import { getMembership, readMembershipView, type MembershipView } from "@/lib/api";
import { MSG } from "@/lib/messages";

export default function MeMembershipPage() {
  const [view, setView] = useState<MembershipView | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getMembership()
      .then((data) => {
        setView(readMembershipView(data));
        setFailed(false);
        setReady(true);
      })
      .catch(() => {
        setView(null);
        setFailed(true);
        setReady(true);
      });
  }, []);

  const empty = !view || (!view.labelKo && view.dailyUserMatchCap == null && view.dailyMatchesUsed == null);

  return (
    <RouteScreen>
      <RouteTop kicker="내 활동 기준" title="내 등급" copy="계정에 정해진 등급과 횟수만 보여 드려요." backPath="/me" />
      {!ready ? (
        <ReadyNotice waiting title={MSG.membershipChecking} copy={MSG.screenWait} />
      ) : failed ? (
        <ReadyNotice title={MSG.membershipLoadFail} copy={MSG.genericError} />
      ) : empty ? (
        <ReadyNotice title={MSG.membershipEmpty} copy="계정에 정해진 값이 있으면 여기에 보여 드려요." />
      ) : (
        <section className="level-card">
          <span>현재 등급</span>
          <h2>{view.labelKo || MSG.membershipEmpty}</h2>
          {view.dailyUserMatchCap != null ? <strong>정해진 횟수 {view.dailyUserMatchCap}번</strong> : <strong>{MSG.membershipCapEmpty}</strong>}
          {view.dailyMatchesUsed != null ? <small>사용한 횟수 {view.dailyMatchesUsed}번</small> : null}
        </section>
      )}
    </RouteScreen>
  );
}
