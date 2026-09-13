import type { ReactNode } from "react";

export function ReadyNotice({
  title,
  copy,
  children,
  waiting = false,
}: {
  title: string;
  copy: string;
  children?: ReactNode;
  waiting?: boolean;
}) {
  return (
    <section
      className={waiting ? "status-page-card ready-notice ready-notice-wait" : "plain-notice ready-notice"}
      role="status"
      aria-busy={waiting || undefined}
      aria-live="polite"
    >
      {waiting ? (
        <span className="ready-notice-mark" aria-hidden="true">
          <img src="/putduk-mark.svg" alt="" />
        </span>
      ) : null}
      <strong>{title}</strong>
      <p>{copy}</p>
      {waiting ? (
        <>
          <span className="ready-notice-dots" aria-hidden="true">
            <i></i>
            <i></i>
            <i></i>
          </span>
          <span className="ready-notice-bar" aria-hidden="true">
            <i></i>
          </span>
        </>
      ) : null}
      {children}
    </section>
  );
}
