"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ReadyNotice } from "@/components/gpt/ReadyNotice";
import { RouteScreen } from "@/components/gpt/RouteScreen";
import { RouteTop } from "@/components/gpt/RouteTop";
import { getBenefits, readBenefitItems, type BenefitItemView } from "@/lib/api";
import { MSG } from "@/lib/messages";

export default function MeBenefitsPage() {
  const router = useRouter();
  const [items, setItems] = useState<BenefitItemView[] | null>(null);
  const [failed, setFailed] = useState(false);

  function fetchItems() {
    return getBenefits()
      .then((data) => {
        setFailed(false);
        setItems(readBenefitItems(data));
      })
      .catch(() => {
        setItems([]);
        setFailed(true);
      });
  }

  function loadItems() {
    setItems(null);
    setFailed(false);
    void fetchItems();
  }

  useEffect(() => {
    void fetchItems();
  }, []);

  return (
    <RouteScreen>
      <RouteTop kicker="받을 수 있는 혜택" title="혜택" copy="지금 내 계정에서 확인되는 혜택만 보여 드려요." backPath="/me" />
      {items == null ? (
        <ReadyNotice title="혜택을 확인하고 있어요." copy="잠시만 기다려 주세요." />
      ) : failed ? (
        <ReadyNotice title={MSG.benefitsLoadFail} copy={MSG.genericError}>
          <button className="text-action" type="button" onClick={loadItems}>
            {MSG.withdrawPolicyRetry}
          </button>
        </ReadyNotice>
      ) : items.length === 0 ? (
        <ReadyNotice title={MSG.benefitsEmpty} copy="계정에 정해진 값이 있으면 여기에 보여 드려요." />
      ) : (
        <section className="ledger-card">
          {items.map((item) => (
            <article className="ledger-row" key={item.missionId}>
              <div>
                <strong>{item.titleKo}</strong>
                {item.bodyKo ? <small>{item.bodyKo}</small> : null}
              </div>
            </article>
          ))}
        </section>
      )}
      <button className="form-primary route-cta" type="button" onClick={() => router.push("/invite")}>
        친구 초대하기
      </button>
    </RouteScreen>
  );
}
