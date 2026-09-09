// GPT 데스크 UI 이식 - 클립보드 복사 (원본 app.js copyText 그대로)

export async function copyTextToClipboard(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    try {
      const input = document.createElement("textarea");
      input.value = value;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      const copied = Boolean(document.execCommand && document.execCommand("copy"));
      input.remove();
      return copied;
    } catch {
      return false;
    }
  }
}
