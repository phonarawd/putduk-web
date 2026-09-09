import type { ReactNode } from "react";

export function ReadyNotice({ title, copy, children }: { title: string; copy: string; children?: ReactNode }) {
  return (
    <section className="plain-notice ready-notice" role="status">
      <strong>{title}</strong>
      <p>{copy}</p>
      {children}
    </section>
  );
}
