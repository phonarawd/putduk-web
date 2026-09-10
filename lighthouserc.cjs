module.exports = {
  ci: {
    collect: {
      numberOfRuns: 1,
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
      settings: {
        preset: "desktop",
        chromePath: process.env.CHROME_PATH,
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
        skipAudits: ["uses-http2"],
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["error", { minScore: 0.95 }],
        "categories:seo": ["error", { minScore: 0.95 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "quality/artifacts/lighthouse",
    },
  },
};
