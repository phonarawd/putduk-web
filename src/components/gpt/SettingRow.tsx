"use client";

// 알림/설정 화면이 함께 쓰는 토글 한 줄. (원본 settingRow 그대로)
export function SettingRow({
  title,
  copy,
  checked,
  onToggle,
}: {
  title: string;
  copy: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="setting-row">
      <div>
        <strong>{title}</strong>
        <small>{copy}</small>
      </div>
      <button
        type="button"
        className={"toggle-button" + (checked ? " is-on" : "")}
        aria-pressed={checked}
        aria-label={`${title} ${checked ? "켜짐" : "꺼짐"}`}
        onClick={onToggle}
      >
        <span></span>
      </button>
    </div>
  );
}
