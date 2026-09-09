"use client";

import { useEffect, useState } from "react";
import { ReadyNotice } from "@/components/gpt/ReadyNotice";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";
import { getMembership, readMembershipCap, readMembershipDisplayName } from "@/lib/api";
import { MSG } from "@/lib/messages";

export default function MeMembershipPage() {
  const [name, setName] = useState("");
  const [cap, setCap] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getMembership()
      .then((data) => {
        setName(readMembershipDisplayName(data));
        setCap(readMembershipCap(data));
        setFailed(false);
        setReady(true);
      })
      .catch(() => {
        setName("");
        setCap(null);
        setFailed(true);
        setReady(true);
      });
  }, []);

  return (
    <RouteScreen>
      <RouteTop kicker="내 활동 기준" title="내 등급" copy="계정에 정해진 하루 기회와 다음 조건을 확인하세요." backPath="/me" />
      {!ready ? (
        <ReadyNotice title="등급을 확인하고 있어요." copy="잠시만 기다려 주세요." />
      ) : failed ? (
        <ReadyNotice title={MSG.genericError} copy={MSG.featureSoon} />
      ) : !name && cap == null ? (
        <ReadyNotice title={MSG.membershipEmpty} copy="계정에 정해진 값이 있으면 여기에 보여 드려요." />
      ) : (
        <section className="level-card">
          <span>현재 등급</span>
          <h2>{name || MSG.membershipEmpty}</h2>
          {cap != null ? <strong>하루 기회 {cap}번</strong> : <strong>{MSG.membershipCapEmpty}</strong>}
        </section>
      )}
    </RouteScreen>
  );
}
