"use client";

import { useEffect, useRef, type RefObject } from "react";

// 모달이 열릴 때 포커스를 옮기고 body 스크롤을 잠그며, 닫히면 이전 포커스로 되돌린다. (원본 openModal/closeModal 그대로)
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
    return () => window.clearTimeout(id);
  }, [open, containerRef]);

  useEffect(() => {
    if (open) return;
    document.body.classList.remove("modal-open");
    lastFocused.current?.focus?.({ preventScroll: true });
  }, [open]);
}
