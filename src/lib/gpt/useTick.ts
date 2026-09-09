"use client";

import { useEffect, useState } from "react";

// 일정 간격으로 현재 시각을 갱신해 "N초 전 확인" 같은 상대 시간 표시를 새로 그린다.
// Date.now()는 렌더 중이 아니라 effect의 setInterval 콜백 안에서만 호출한다.
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
