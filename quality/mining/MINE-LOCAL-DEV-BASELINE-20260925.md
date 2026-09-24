# PUTDUK MINE 로컬 개발 기준선

이 브랜치는 `PUTDUK MINE OS` 통합 개발 기준선이다.

## 역할

- 이 저장소는 회원용 PUTDUK 화면을 담당한다.
- Mine 화면, 내 운용, 수익/정산 표시를 새 Mine OS 기준으로 개발한다.
- 기존 리셀 화면을 새로운 광산 화면의 디자인 템플릿으로 재사용하지 않는다.
- 모든 사용자 문구는 한국어 중심으로 작성한다.

## 로컬 API

로컬 개발에서는 Supabase Cloud에 직접 연결하지 않는다.

기본 API 원점:

`http://127.0.0.1:4000`

실제 API 기능 연결 전에도 UI/UX는 로컬 상태와 계약 fixture로 개발할 수 있다.

## 금지

- 브라우저에서 Supabase 직접 호출
- 기존 리셀 Opportunity/Product 중심 UI 재확장
- 영문 중심 UI
- 가짜 수익/참여자/운용 숫자
