// 실제 QR 라이브러리 없이 주소 문자열을 결정적으로 격자에 매핑하는 연습용 미리보기. (원본 renderQr 그대로)
export function QrPreview({ value }: { value: string }) {
  let seed = 0;
  for (let index = 0; index < value.length; index += 1) seed = (seed * 31 + value.charCodeAt(index)) >>> 0;
  const size = 17;
  const cells: boolean[] = [];
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      const finder = (row < 5 && column < 5) || (row < 5 && column > size - 6) || (row > size - 6 && column < 5);
      const frame = finder && (row % 4 === 0 || column % 4 === 0 || row % 4 === 3 || column % 4 === 3);
      const center = finder && !frame && row % 4 > 0 && column % 4 > 0;
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const filled = finder ? frame || center : ((seed >>> 28) & 1) === 1;
      cells.push(filled);
    }
  }
  return (
    <div id="usdtQr" className="qr-preview" data-qr-value={value} aria-label="테더 입금 주소 QR 미리보기">
      {cells.map((filled, index) => (
        <i key={index} className={filled ? "is-filled" : ""} />
      ))}
    </div>
  );
}
