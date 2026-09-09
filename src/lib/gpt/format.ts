// 서버가 준 숫자만 보여 준다. 환율을 여기서 만들지 않는다.

export function roundKrw(value: number, unit?: number): number {
  const actualUnit = unit || 100;
  const safe = Number.isFinite(Number(value)) ? Number(value) : 0;
  return Math.max(0, Math.round(safe / actualUnit) * actualUnit);
}

export function formatKrw(value: number): string {
  return roundKrw(value, 1).toLocaleString("ko-KR") + "원";
}

export function formatSignedKrw(value: number): string {
  const safe = roundKrw(value, 1);
  return "+" + safe.toLocaleString("ko-KR") + "원";
}

export function formatUsdt(value: number): string {
  const safe = Number.isFinite(Number(value)) ? Number(value) : 0;
  return (
    safe.toLocaleString("ko-KR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " USDT"
  );
}

export function formatSignedUsdt(value: number): string {
  return "+" + formatUsdt(value);
}

export function formatMoneyPrimary(usdt: number | null, krw: number | null): string | null {
  if (krw != null) return formatKrw(krw);
  return null;
}

export function formatMoneySecondary(usdt: number | null, _krw: number | null): string | null {
  if (usdt != null) return formatUsdt(usdt);
  return null;
}

export function formatSignedMoneyPrimary(usdt: number | null, krw: number | null): string | null {
  if (krw != null) return formatSignedKrw(krw);
  return null;
}

export function formatSignedMoneySecondary(usdt: number | null, krw: number | null): string | null {
  if (krw != null && usdt != null) return formatSignedUsdt(usdt);
  return null;
}

export function formatTime(value: string | number): string {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "방금";
  }
}

export function formatIssued(value: string | number): string {
  if (value === "" || value == null) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return (
    new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date) + " 발급"
  );
}


export function formatAge(milliseconds: number): string {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  if (seconds < 8) return "방금 확인";
  if (seconds < 60) return seconds + "초 전 확인";
  return Math.floor(seconds / 60) + "분 전 확인";
}

export function parseMoney(value: string | number): number {
  const digits = String(value || "").replace(/[^0-9]/g, "");
  return Math.min(100000000, Math.max(0, Number(digits || 0)));
}
