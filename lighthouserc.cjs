module.exports = {
  ci: {
    collect: {
      // LHCI 0.15.1 공식 문서: assertion 옵션을 안 주면 기본값은 {"aggregationMethod":"optimistic","minScore":1}이다.
      // numberOfRuns만 올리면 "3번 중 가장 잘 나온 값"으로 통과해버려 median 판정이 아니게 된다.
      // 그래서 3회 측정 + 아래 각 assertion에 aggregationMethod:"median"을 명시로 짝을 맞춘다.
      numberOfRuns: 3,
      startServerCommand: "pnpm exec next start --port 4174",
      startServerReadyPattern: "Ready|started|Local:|Next.js",
      url: [
        "http://127.0.0.1:4174/login",
        "http://127.0.0.1:4174/",
        "http://127.0.0.1:4174/work",
        "http://127.0.0.1:4174/wallet/deposit",
        "http://127.0.0.1:4174/me",
      ],
      puppeteerScript: "./e2e/lhci-prep.cjs",
      puppeteerLaunchOptions: {
        args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
      },
      settings: {
        preset: "desktop",
        chromePath: process.env.CHROME_PATH,
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
        skipAudits: ["uses-http2"],
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.9, aggregationMethod: "median" }],
        "categories:accessibility": ["error", { minScore: 0.95, aggregationMethod: "median" }],
        "categories:best-practices": ["error", { minScore: 0.95, aggregationMethod: "median" }],
        "categories:seo": ["error", { minScore: 0.95, aggregationMethod: "median" }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1, aggregationMethod: "median" }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "quality/artifacts/lighthouse",
    },
  },
};
