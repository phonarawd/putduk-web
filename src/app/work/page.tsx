"use client";

import { MineCatalog } from "@/components/mining/MineCatalog";
import { WorkspaceView } from "@/components/gpt/WorkspaceView";

export default function WorkPage() {
  return (
    <WorkspaceView>
      <section className="app-view is-active" data-view="work">
        <MineCatalog />
      </section>
    </WorkspaceView>
  );
}
