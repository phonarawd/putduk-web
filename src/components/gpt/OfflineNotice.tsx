import { MSG } from "@/lib/messages";

export function OfflineNotice() {
  return (
    <section className="status-page-card">
      <span className="view-kicker">연결</span>
      <h1>{MSG.offlineFinance}</h1>
      <p>금액이나 신청 상태는 연결이 돌아온 뒤에만 보여 드려요.</p>
    </section>
  );
}
