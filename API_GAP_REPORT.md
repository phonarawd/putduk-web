# 실제 연결 상태와 비어 있는 기능

이 레포는 `https://api.hiptk.app`만 부릅니다. 새 로그인 방식은 만들지 않았습니다.

## 이미 연결해서 쓰는 기능

| 화면 | 호출 | 성공일 때만 하는 일 |
| --- | --- | --- |
| 로그인 | `/api/v1/auth/login` | 데스크로 이동 |
| 구글 시작 | `/api/v1/auth/oauth/google/start` | 구글 화면으로 이동 |
| 구글 돌아옴 | `/api/v1/auth/oauth/google/callback` | 로그인 또는 필수정보 입력 |
| 회원가입 | `/api/v1/auth/signup/classic` | 인증 메일 안내 |
| 이메일 확인 | `/api/v1/auth/signup/classic/verify` | 로그인 처리 |
| 필수정보 | `/api/v1/auth/profile` | 이름·성별·생년월일 저장 |
| 로그인 유지 | `/api/v1/auth/session` | 로그인 여부 확인 |
| 로그아웃 | `/api/v1/auth/logout` | 로그인 화면 |
| 홈/기회 | `/api/v1/me/home-read`, `/api/v1/opportunities`, `/api/v1/me/trial-state`, `/api/v1/wallet/buckets` | 기회·금액 표시 |
| 참여 | `/api/v1/opportunities/{id}/participate` | 접수 안내 |
| 원화 입금 | `/api/v1/wallet/krw-deposit-instructions`, `/api/v1/wallet/krw-deposit-requests` | 신청 접수 |
| 테더 주소 | `/api/v1/wallet/my-deposit-address` | 주소가 있을 때만 표시 |
| 출금 | `/api/v1/wallet/withdraw/step-up/*`, `/api/v1/wallet/withdraw` | 추가 확인과 출금 요청 |
| 내역 | `/api/v1/me/ledger/journals` | 기록이 있을 때만 목록 |
| 본인확인 | `/api/v1/compliance/kyc/status`, `/api/v1/compliance/kyc/submit` | 상태 조회와 요청 접수 |
| 등급 | `/api/v1/me/membership` | 횟수가 있을 때만 숫자 |
| 초대 | `/api/v1/referral/me` | 코드·링크가 있을 때만 표시 |

## 아직 백엔드가 필요한 기능

아래는 화면은 있지만, 이 레포에서 부를 수 있는 확정된 주소가 없습니다. 가짜 성공은 보여 주지 않습니다.

1. **아이디 찾기**  
   필요: 이메일로 아이디를 알려 주는 기능.

2. **비밀번호 재설정**  
   필요: 메일 확인 후 새 비밀번호를 받는 기능.

3. **퍼뜩AI 답변**  
   필요: 질문 보내기, 답변 받기, 대화 목록, 대화 이어가기.  
   지금은 질문을 이 기기에만 남기고, “아직 연결하지 못했어요”라고 안내합니다.  
   관리자가 회원 대화를 보는 기능은 이 레포에 넣지 않았습니다.

4. **고객지원 문의 접수**  
   필요: 문의 종류와 내용을 받는 기능.

5. **공지사항 목록**  
   필요: 공지 제목·날짜·내용을 내려 주는 기능.

6. **이벤트 목록**  
   필요: 진행 중 이벤트를 내려 주는 기능.

7. **알림 보내기**  
   기기 안 스위치는 저장하지만, 실제로 소식을 보내는 기능은 없습니다.

8. **거래 진행 화면**  
   참여 신청은 보냅니다. 진행 중 단계와 완료 결과는 아직 이 화면에서 만들지 않습니다. 가짜 “정산 완료”는 보여 주지 않습니다.

## 이 레포에서 하지 않은 일

- 백엔드를 수정하지 않았습니다.
- 관리자 화면을 넣지 않았습니다.
- 프론트에서 저장소·회원 DB에 직접 붙이지 않았습니다.
- 없는 주소를 지어 호출하지 않았습니다.
