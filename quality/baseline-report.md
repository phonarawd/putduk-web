# 기준선

확인한 사실

- 시작 HEAD는 `5c946e074c305907aee1091b1ab5770842a9dc0d`, 원격 `phonarawd/putduk-web`, 기본 브랜치 `main`, 작업 전 dirty 없음.
- Next 16.3.4, React 19.2.8, pnpm 11.4.0, Node v24.19.0.
- 고객 웹은 `https://api.hiptk.app`만 호출한다. Supabase/DB/OpenAI 직접 연결은 소스에 없다.
- `/me/records`는 화면은 있으나 `GATED_PATHS`에 없었다.
- 계정 데이터는 기기 공통 `putduk-web-gpt-v2`에 이름·이메일·생년월일·성별·대화가 남았다.
- `saveProfile`은 `name/gender/birthPrefix`를 보내고 있었다.
- 로그인·가입·찾기·재설정에 Turnstile 위젯이 호출과 연결되어 있지 않았다.
- 멤버십은 `퍼뜩 리셀러`와 P 엠블럼이 고정되어 있었다.
- 혜택은 로컬 `bonusBank`를 쓰고 있었다.
- 가짜 QR 격자가 입금 주소 QR처럼 보였다.

미확인

- 운영 `PRODUCTION_WEB_URL`, BrowserStack, Google 콜백 URI, 백엔드 OpenAPI SHA.
- 세션 응답의 실제 `userId`/`issuedAt` 필드명. 화면은 있는 값만 읽는다.

이번 패치에서 한 일

- 계정 저장소를 `userId` 네임스페이스로 나누고 로그아웃·세션 실패가 `clearAccountState`를 쓴다.
- 게이트, Turnstile, Stage B 프로필, 정직 등급/혜택/원장/출금 토큰, 푸터 100dvh 그리드.

이번 패치에서 하지 않은 일

- Playwright/axe/Lighthouse/PWA 패키지 추가 (`ALLOW_NEW_DEPENDENCIES=false`).
- QR 라이브러리, 이미지 재압축, GitHub Actions, 운영 배포.
- 퍼뜩AI 서버 대화 목록 복원, Google 콜백 라우트.
