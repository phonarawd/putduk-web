"use client";

import { useParams } from "next/navigation";
import { MineDetail } from "@/components/mining/MineDetail";
import { WorkspaceView } from "@/components/gpt/WorkspaceView";

export default function MineDetailPage() {
  const params = useParams<{ mineId: string }>();
  const mineId = params.mineId;

  return (
    <WorkspaceView>
      <section className="app-view is-active" data-view="work">
        <MineDetail mineId={mineId} />
      </section>
    </WorkspaceView>
  );
}
