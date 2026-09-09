"use client";

import { useState } from "react";
import { useGpt } from "./GptContext";

// 저장되지 않는 화면 전용 토글(정산 알림/입출금 알림/큰 금액 먼저 보기/짧은 축하 연출).
// 원본도 이 값들을 state에 저장하지 않고 매번 true로만 보여 준다.
export function useVisualToggle(initial: boolean) {
  const { showToast } = useGpt();
  const [checked, setChecked] = useState(initial);

  function toggle() {
    setChecked((prev) => {
      const next = !prev;
      showToast(next ? "😊 알림을 켰어요" : "알림을 껐어요");
      return next;
    });
  }

  return [checked, toggle] as const;
}
