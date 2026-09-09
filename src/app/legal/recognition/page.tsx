"use client";

import { Suspense } from "react";
import { RecognitionView } from "@/components/gpt/RecognitionView";

function RecognitionFallback() {
  return (
    <section className="route-screen shell" aria-live="polite">
      <div className="plain-notice">
        <strong>잠시만 기다려 주세요</strong>
        <p>확인서 화면을 준비하고 있어요.</p>
      </div>
    </section>
  );
}

export default function LegalRecognitionPage() {
  return (
    <Suspense fallback={<RecognitionFallback />}>
      <RecognitionView />
    </Suspense>
  );
}
