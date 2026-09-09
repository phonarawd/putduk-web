import type { Metadata, Viewport } from "next";
import { GptProvider } from "@/lib/gpt/GptContext";
import { AppShell } from "@/components/gpt/AppShell";
import "@/styles/gpt-fonts.css";
import "@/styles/gpt.css";
import "@/styles/gpt-ambassador.css";

export const metadata: Metadata = {
  title: "퍼뜩 리셀러 데스크",
  description: "내 자본과 오늘 기회를 한눈에 확인하는 퍼뜩 리셀러 데스크",
  icons: {
    icon: [{ url: "/putduk-mark.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <body>
        <GptProvider>
          <AppShell>{children}</AppShell>
        </GptProvider>
      </body>
    </html>
  );
}
