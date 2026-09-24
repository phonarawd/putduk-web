# 퍼뜩 (putduk-web)

이 레포는 **퍼뜩 회원용 채굴·운용 웹 UI**를 담당합니다. 광산 조회, 내 운용, 채굴 수익 표시, 정산 기록, 지갑 연결 화면을 제공하며 백엔드와 데이터베이스는 이 레포에 만들지 않습니다.

## 백엔드 연결

- API 주소: `https://api.hiptk.app` (기존 Nest)
- 브라우저 요청은 `credentials: include`로 기존 `aipo_session` 쿠키를 사용합니다.
- 프론트는 API만 호출하고 데이터베이스에 직접 접속하지 않습니다.
- Supabase Auth, 새 인증 방식, 새 서버, 새 마이그레이션은 이 레포에 넣지 않습니다.
- 공개 환경변수는 `NEXT_PUBLIC_API_BASE` 하나만 사용합니다. 실 비밀값은 넣지 않습니다.

## 인증 화면

- 고전 아이디·비밀번호와 구글만 사용합니다.
- 구글 첫 가입자는 `/auth/complete-profile`에서 필수정보를 마친 뒤 데스크로 이동합니다.
- 비밀번호 입력 안내는 8자 이상입니다. 실제 최종 검증은 기존 서버 정책을 따릅니다.
- 카카오, 패스키, 매직링크, 출시 유저용 캡차 흐름을 새로 넣지 않습니다.

## 화면 언어와 금액

- 앱 이름: 퍼뜩
- 개인 AI: 퍼뜩AI
- 주요 메뉴: 홈 / 광산 / 내 운용 / 지갑 / 퍼뜩AI / 내 정보
- `/work`는 공개 광산 목록입니다.
- `/activity`는 내 운용 기록입니다.
- `/wallet/*`는 지갑 영역입니다.
- 완료한 업무와 정산은 `/me/records`에서 확인합니다.
- 큰 금액은 원화(₩), USDT는 보조 표기입니다.
- 서버가 제공한 원화·FX 값이 없으면 원화 숫자를 만들어 표시하지 않습니다.
- FOMO 숫자, 가짜 참여자, 가짜 수익, 수익 보장은 넣지 않습니다.

## API 호출 원칙

버튼 한 번 → 필요한 API 한 번 → 서버 응답만 화면에 반영합니다. 없는 API 주소를 지어내지 않고, 빈 응답은 빈 상태 안내로 보여 줍니다. 참여 결과와 정산 결과는 사용자가 고르지 않으며 서버 상태를 따릅니다.

## 로컬 확인

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

실제 배포 전에는 위 명령과 로그인 전·후의 데스크톱/모바일 브라우저 점검을 실행합니다.

## 자동 검사

```bash
pnpm test                              # 단위 테스트
pnpm exec playwright test              # E2E 전체 (chromium/firefox/webkit/mobile-chrome/mobile-safari)
pnpm exec playwright test --project=chromium   # E2E Chromium만 (더 빠름)
pnpm lhci                              # Lighthouse (5화면 × 3회, median 판정)
```

커밋/푸시 전 로컬 훅은 `pnpm install`의 `prepare`가 `.githooks/`를 `.git/hooks/`로 복사해 연결합니다. `git config`는 쓰지 않습니다.

- pre-commit: staged된 ts/tsx만 lint + 전체 typecheck (목표 30초대, 저사양 PC 실측 약 35초)
- pre-push: 단위 테스트 + Chromium 스모크(auth+qr, 목표 3분)
- PR에는 항상 `.github/workflows/pr-quality.yml` 전체 게이트가 따로 돈다.
