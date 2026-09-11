"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], summary, [tabindex]:not([tabindex="-1"])';

// 모달이 열릴 때 포커스를 옮기고 body 스크롤을 잠그며, Tab이 모달 밖으로 나가지 않게 가두고,
// 닫히면 이전 포커스로 되돌린다. (원본 openModal/closeModal 그대로 + 포커스 트랩 보강)
export function useModalFocus(open: boolean, containerRef: RefObject<HTMLElement | null>) {
  const lastFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    lastFocused.current = document.activeElement as HTMLElement | null;
    document.body.classList.add("modal-open");
    const id = window.setTimeout(() => {
      const focusable = containerRef.current?.querySelector<HTMLElement>(
        "button:not([disabled]), input:not([disabled]), summary",
      );
      focusable?.focus({ preventScroll: true });
    }, 30);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Tab") return;
      const container = containerRef.current;
      if (!container) return;
      const focusables = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null,
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (!container.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);

    // 정리 함수를 "open이 true였던 효과"의 return으로 둔다. open이 false로 바뀌어 컴포넌트가
    // 계속 떠 있는 경우는 물론, 부모가 open 여부로 아예 마운트/언마운트할 때도(모달 3개 지연 로드)
    // 이 return이 그대로 호출되므로 body 스크롤 잠금 해제·초점 복귀가 두 경우 모두 확실히 실행된다.
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("modal-open");
      lastFocused.current?.focus?.({ preventScroll: true });
    };
  }, [open, containerRef]);
}
