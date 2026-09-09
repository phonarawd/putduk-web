# 실제 연결 상태와 비어 있는 기능

이 레포는 기존 `https://api.hiptk.app`만 부릅니다. 프론트가 데이터베이스에 직접 연결하지 않으며, 새 인증·새 서버·새 저장소를 만들지 않습니다.

## 화면에서 사용하는 기존 API

| 화면 | 호출 | 화면 반영 |
| --- | --- | --- |
| 로그인 | `/api/v1/auth/login` | 세션 쿠키가 생기면 원래 화면으로 이동 |
| 구글 시작·돌아옴 | `/api/v1/auth/oauth/google/start`, callback | 서버 결과에 따라 로그인 또는 필수정보 화면 |
| 회원가입·이메일 확인 | `/api/v1/auth/signup/classic`, 기존 verify 경로 | 서버 응답이 있을 때만 다음 화면 |
| 구글 필수정보 | `PATCH /api/v1/auth/profile` | 이름·생년월일·성별 저장 |
| 로그인 유지·로그아웃 | `/api/v1/auth/session`, `/api/v1/auth/logout` | 세션 상태 반영 |
| 홈·기회 | `/api/v1/me/home-read`, `/api/v1/me/trial-state`, `/api/v1/opportunities`, `/api/v1/wallet/buckets` | 서버가 준 기회·자본·횟수만 표시 |
| 참여·진행 | 기존 preflight, participate, trade tick 경로 | 서버가 준 진행·정산·안전 중단 상태만 표시 |
| 원화 입금 | instructions, `POST /api/v1/wallet/krw-deposit-requests` | 서버 응답이 있을 때만 신청 상태 표시 |
| 테더 주소 | `GET /api/v1/wallet/my-deposit-address` | 주소가 있을 때만 표시 |
| 출금 | 기존 step-up policy/challenge/verify와 `POST /api/v1/wallet/withdraw` | profit·USDT 경로만 화면에 노출 |
| 지갑 내역 | `GET /api/v1/me/ledger/journals` | 서버 기록만 표시 |
| 본인확인 | `GET/POST /api/v1/compliance/kyc/status|submit` | 요청 상태와 확인 상태를 구분 |
| 등급·횟수 | `GET /api/v1/me/membership`이 응답할 때 | 받은 값만 표시 |
| 초대 | `GET /api/v1/referral/me` | 서버 코드·링크만 표시 |
| 퍼뜩AI | 기존 퍼뜩AI 응답 스트림 경로 | 자유 입력, 타이핑 응답, 근거 이동 |

모든 요청은 기존 세션 쿠키를 포함합니다. API 응답이 없거나 원화 FX 값이 없으면 임의 숫자를 만들지 않고 해당 값을 숨기거나 확인 중으로 안내합니다.

## 아직 서버 기능이 필요한 화면

- 아이디 찾기와 비밀번호 재설정은 서버의 실제 메일·완료 경로가 없으면 결과를 꾸미지 않습니다.
- 고객지원 문의, 공지사항, 이벤트, 실제 알림 발송은 확정된 조회·접수 주소가 없으면 빈 상태로 둡니다.
- 서버가 종료 상태를 내려 주지 않은 거래는 결과를 확정하지 않고 다시 확인 중으로 둡니다.

## 이 레포에서 하지 않은 일

- 백엔드, 관리자 화면, 데이터베이스, 마이그레이션을 수정하지 않았습니다.
- 없는 API 주소를 지어 호출하지 않았습니다.
- 프론트에서 슬롯·등급·수익·참여자 수를 계산하지 않았습니다.
- 배포 설정에 비밀키를 넣지 않았습니다.
