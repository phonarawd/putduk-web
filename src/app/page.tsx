"use client";

import { useRouter } from "next/navigation";
import { MiningHome } from "@/components/mining/MiningHome";
import { MineCatalog } from "@/components/mining/MineCatalog";
import { ReadyNotice } from "@/components/gpt/ReadyNotice";
import { WorkspaceView } from "@/components/gpt/WorkspaceView";
import { useGptSession } from "@/lib/gpt/GptScopes";
import { MSG } from "@/lib/messages";

function PublicMineCatalog() {
  return (
    <WorkspaceView>
      <section className="app-view is-active" data-view="work">
        <MineCatalog />
      </section>
    </WorkspaceView>
  );
}

function HomeWorkspace() {
  return (
    <WorkspaceView>
      <section className="app-view is-active" data-view="home">
        <MiningHome />
      </section>
    </WorkspaceView>
  );
}

export default function HomePage() {
  const { sessionReady, loggedIn } = useGptSession();

  if (!sessionReady) {
    return (
      <section className="route-screen shell" aria-live="polite">
        <ReadyNotice waiting title={MSG.screenWait} copy={MSG.screenWaitCopy} />
      </section>
    );
  }

  return loggedIn ? <HomeWorkspace /> : <PublicMineCatalog />;
}
