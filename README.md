# 퍼뜩 (putduk-web)

이 레포는 **소비자 웹 UI만** 담당한다.

## 백엔드

- 주소: <https://api.hiptk.app> (기존 Nest)
- 프론트는 API만 호출한다. DB에 직접 접속하지 않는다.
- Supabase는 서버만 사용한다. 이 레포에 Supabase Auth를 붙이지 않는다.

## 연결

한 길이다. 버튼 한 번 → API 한 번 → 결과.

- 아이디·비밀번호, 구글 하나, 약관 체크
- 구글 첫 가입만 `/auth/complete-profile` (이름, 성별 버튼, 생년월일 앞자리)
- Turnstile, 캡차, 패스키, 매직링크, 카카오 없음
- 로그인·가입을 여러 단계로 쪼개지 않음
- 호출은 `src/lib/api.ts` 한 파일

비밀번호 UI 검증은 8자 이상이다. 서버가 15자면 서버 규칙이다.

## GPT UI ZIP

ZIP이 오면 시각만 덮어쓰고 `src/lib/api.ts`에 연결한다.

## PWA

지금은 넣지 않는다. 화면 이식 후 이 레포에서 새로 넣는다.

## 제품 고정

- 앱 이름 = AI 이름 = 퍼뜩
- 큰 숫자 = 원화. USDT는 보조
- 하단 탭 = 홈 / 기록 / 퍼뜩 / 초대 / 나

## 로컬 실행

```bash
pnpm install
pnpm dev
```

환경변수는 `.env.example`을 본다. 실 비밀값을 이 레포에 넣지 않는다.
