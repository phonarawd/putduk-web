"use client";

import { useEffect, useState } from "react";
import { ReadyNotice } from "@/components/gpt/ReadyNotice";
import { getPublishedCms, readPublishedCms, type PublishedCmsItem } from "@/lib/api";
import { MSG } from "@/lib/messages";

export function PublishedCmsList({
  kind,
  emptyTitle,
  emptyCopy,
}: {
  kind: "notice" | "event" | "benefit" | "banner" | "notification";
  emptyTitle: string;
  emptyCopy: string;
}) {
  const [items, setItems] = useState<PublishedCmsItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    void getPublishedCms(kind)
      .then((data) => {
        if (!alive) return;
        setFailed(false);
        setItems(readPublishedCms(data));
      })
      .catch(() => {
        if (!alive) return;
        setItems([]);
        setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [kind]);

  function retry() {
    setFailed(false);
    void getPublishedCms(kind)
      .then((data) => {
        setFailed(false);
        setItems(readPublishedCms(data));
      })
      .catch(() => {
        setItems([]);
        setFailed(true);
      });
  }

  if (items == null) {
    return <ReadyNotice waiting title={MSG.cmsChecking} copy={MSG.screenWait} />;
  }
  if (failed) {
    return (
      <ReadyNotice title={MSG.cmsLoadFail} copy={MSG.genericError}>
        <button className="text-action" type="button" onClick={retry}>
          {MSG.withdrawPolicyRetry}
        </button>
      </ReadyNotice>
    );
  }
  if (items.length === 0) {
    return <ReadyNotice title={emptyTitle} copy={emptyCopy} />;
  }
  return (
    <section className="ledger-card" data-testid={`cms-${kind}-list`}>
      {items.map((item) => (
        <article className="ledger-row" key={item.id}>
          <div>
            <strong>{item.title}</strong>
            {item.body ? <small>{item.body}</small> : null}
          </div>
        </article>
      ))}
    </section>
  );
}

export function HomeBanners() {
  const [items, setItems] = useState<PublishedCmsItem[] | null>(null);

  useEffect(() => {
    let alive = true;
    void getPublishedCms("banner")
      .then((data) => {
        if (!alive) return;
        setItems(readPublishedCms(data));
      })
      .catch(() => {
        if (!alive) return;
        setItems([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!items?.length) return null;
  return (
    <section className="ledger-card" aria-label="안내 배너" data-testid="cms-banner-list">
      {items.map((item) => (
        <article className="ledger-row" key={item.id}>
          <div>
            <strong>{item.title}</strong>
            {item.body ? <small>{item.body}</small> : null}
          </div>
        </article>
      ))}
    </section>
  );
}
