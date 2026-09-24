"use client";

import Link from "next/link";
import { MineCatalog } from "@/components/mining/MineCatalog";
import { WorkspaceView } from "@/components/gpt/WorkspaceView";

export default function WorkPage() {
  return (
    <WorkspaceView>
      <section className="app-view is-active" data-view="work">
        <div className="mx-auto flex w-full max-w-[1180px] justify-end px-4 pt-4 sm:px-6 lg:px-8">
          <Link
            href="/activity"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm"
          >
            채굴 활동 보기
          </Link>
        </div>
        <MineCatalog />
      </section>
    </WorkspaceView>
  );
}
