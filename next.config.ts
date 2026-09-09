import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 워커에는 네이티브 이미지 변환기를 넣지 않는다. 화면은 public 파일을 그대로 쓴다.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
