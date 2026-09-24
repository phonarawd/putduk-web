import type { Metadata, Viewport } from "next";
import { AppProviders } from "@/lib/gpt/AppProviders";
import { AppShell } from "@/components/gpt/AppShell";
import { PwaRegister } from "@/components/gpt/PwaRegister";
import "@/styles/gpt-fonts.css";
import "@/styles/gpt.css";
import "@/styles/gpt-ambassador.css";
import "@/styles/mining.css";

export const metadata: Metadata = {
  title: "퍼뜩 채굴 운영 플랫폼",
  description: "광산 운용·채굴 수익·정산·지갑 상태를 한곳에서 확인하는 퍼뜩",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/putduk-mark.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f3e8",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <head>
        {/* 모든 화면 공통 헤더/푸터/내비에서 가장 많이 쓰는 두 조각만 미리 가져온다.
            (조각 90=한글 고빈도, 91=라틴/숫자/기호+고빈도 한글. 소스 스캔 기준 상위 2개, 나머지는 필요할 때만) */}
        <link rel="preload" href="/fonts/pretendard-subset/PretendardVariable.subset.90.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/pretendard-subset/PretendardVariable.subset.91.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <AppProviders>
          <AppShell>{children}</AppShell>
          <PwaRegister />
        </AppProviders>
      </body>
    </html>
  );
}
