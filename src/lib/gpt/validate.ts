// GPT 데스크 UI 이식 - 입력값 검증 (원본 app.js 그대로)

export function validBirthday(value: string): boolean {
  return /^\d{6}$/.test(String(value || ""));
}

export function validPhone(value: string): boolean {
  return /^\d{10,11}$/.test(String(value || "").replace(/[^0-9]/g, ""));
}

export function validUsername(value: string): boolean {
  return /^[a-z][a-z0-9_]{3,19}$/.test(String(value || ""));
}

export function validEmail(value: string): boolean {
  return /^\S+@\S+\.\S+$/.test(String(value || ""));
}
