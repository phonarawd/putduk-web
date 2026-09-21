import { WorkspaceView } from "@/components/gpt/WorkspaceView";
import { MiningActivity } from "@/components/mining/MiningActivity";

export default function ActivityPage() {
  return (
    <WorkspaceView>
      <section className="app-view is-active" data-view="work">
        <MiningActivity />
      </section>
    </WorkspaceView>
  );
}
