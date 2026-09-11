"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

type Props = {
  payload: string;
};

/** 서버가 준 주소 문자열만 그대로 그림으로 옮긴다. 체인을 보태지 않는다. */
export function DepositQr({ payload }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !payload) return;
    let cancelled = false;
    void QRCode.toCanvas(canvas, payload, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 192,
      color: { dark: "#111827", light: "#ffffff" },
    }).catch(() => {
      if (!cancelled && canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        ctx?.clearRect(0, 0, 192, 192);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [payload]);

  if (!payload) return null;
  return <canvas ref={canvasRef} className="deposit-qr-canvas" width={192} height={192} aria-hidden="true" />;
}
