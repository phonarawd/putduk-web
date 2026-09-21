import type { Metadata, Viewport } from "next";
import { AppProviders } from "@/lib/gpt/AppProviders";
import { AppShell } from "@/components/gpt/AppShell";
import { PwaRegister } from "@/components/gpt/PwaRegister";
import "@/styles/gpt-fonts.css";
import "@/styles/gpt.css";
import "@/styles/gpt-ambassador.css";
import "@/styles/mining-home.css";

export const metadata: Metadata = {
  title: "퍼뜩 마인 OS",
  description: "내 광산 운용, 채굴 현황, 출금 가능 수익과 최근 정산을 한눈에 확인하는 퍼뜩 마인 OS",
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
  themeColor: "#ffffff",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <head>
        <link rel="preload" href="/fonts/pretendard-subset/PretendardVariable.subset.90.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/pretendard-subset/PretendardVariable.subset.91.woff2" as="font" type="font" crossOrigin="anonymous" />
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
