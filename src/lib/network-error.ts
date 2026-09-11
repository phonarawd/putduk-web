export function isNetworkFailure(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const row = error as { code?: string; status?: number; message?: string };
  if (row.code === "NETWORK") return true;
  if (row.status != null && row.status !== 0) return false;
  return typeof row.message === "string" && /연결이 원활하지 않아요/.test(row.message);
}
