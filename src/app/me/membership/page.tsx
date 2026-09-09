"use client";

import { useEffect, useState } from "react";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";
import { getMembership, readMembershipCap } from "@/lib/api";

export default function MeMembershipPage() {
  const [cap, setCap] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getMembership()
      .then((data) => {
        setCap(readMembershipCap(data));
        setReady(true);
      })
      .catch(() => {
        setCap(null);
        setReady(true);
      });
  }, []);

  return (
    <RouteScreen>
      <RouteTop kicker="내 활동 기준" title="내 등급" copy="계정에 정해진 하루 기회와 다음 조건을 확인하세요." backPath="/me" />
      <section className="level-card">
        <div className="level-emblem">P</div>
        <span>현재 등급</span>
        <h2>퍼뜩 리셀러</h2>
        {ready && cap != null ? <strong>하루 기회 {cap}번</strong> : <strong>하루 기회 n번</strong>}
        <p>정확한 횟수는 계정에 정해진 값으로 표시돼요.</p>
      </section>
      <section className="level-points">
        <article>
          <span>✓</span>
          <div>
            <strong>조건에 맞는 기회 확인</strong>
            <p>내 자본과 오늘 남은 횟수에 맞춰 보여 드려요.</p>
          </div>
        </article>
        <article>
          <span>✓</span>
          <div>
            <strong>안전 중단 보호</strong>
            <p>조건이 달라지면 잠근 금액이 돌아와요.</p>
          </div>
        </article>
        <article>
          <span>✓</span>
          <div>
            <strong>활동 기록 보관</strong>
            <p>정산과 중단 결과를 기록에서 확인해요.</p>
          </div>
        </article>
      </section>
    </RouteScreen>
  );
}
