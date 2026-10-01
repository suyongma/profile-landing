# 성향 테스트 회원 결과 연동 — 운영 릴리스 기록

## 구현 상태

메인 `/tests`의 STRI·IPIP·IPC 카드에 `나의 마지막 결과`와 서버의 결과명을 표시한다. 완료 결과가 없는 회원에게는 정확히 `아직 미검사`를 표시한다. 진행 중인 재검사는 이전 완료 결과를 덮어쓰지 않는다. 카드 링크는 기존 검사 도메인으로 이동하며, 검사 페이지가 저장된 단계와 결과를 복원한다.

비회원에게는 로그인 안내를 표시한다. 결과 API 장애나 잘못된 응답은 `결과를 불러오지 못했어요`와 다시 시도로 처리한다. 계정 표시 변경·포커스·페이지 복귀·visible 전환 시 결과를 지운 뒤 다시 조회하고, 취소되거나 오래된 응답은 표시하지 않는다. 사용자 문자열은 textContent로만 출력한다. 게스트 localStorage나 인증 토큰을 사용하지 않는다.

공통 계정/테마 JS와 폰트는 변경하지 않았다. 첫 페이지는 캐시 버전만 v8로 변경했으며 기존 440px 중앙 카드와 배치를 유지한다. 결과 패널과 CSS는 테스트 목록에만 적용한다.

## Auth 변경

원본 저장소: `suyongma/mashong-zombie-run`. `18a9b41` 기반의 격리된 검토 커밋 `5cf6460`을 P1이 검증하고 [Auth PR #2](https://github.com/suyongma/mashong-zombie-run/pull/2)로 반영했다. 사용자 명시 승인 후 원격 main `7e6e4b78bd2875a7a55a70b7eac2a37e6fdda0d9`에서 배포했다. 기존 월드 작업과 운영 설정을 덮어쓰지 않았다.

초기 검토 패치는 Git 제외 경로 `.local-recovery/auth-personality-20261001.patch`에 보존했다. SHA-256은 `d360abf96b67057b41717d43d5ac9d5b9156bc5363282dc2806a8b4fb605c8c1`이다. 이 파일은 과거 검토 사본이며 현재 운영 소스의 정본은 Auth 저장소의 원격 main이다.

- `auth-service/src/personality.mjs`, `personality.d.mts`, `scoring.mjs` 추가.
- `auth-service/migrations/0003_personality.sql` 추가. 기존 players.id는 TEXT이며 새 레코드의 FK가 이를 참조한다.
- 기존 `__Host-mashong_session`과 session()을 재사용한다.
- `/api/personality` 전용 조회/저장만 세 검사와 메인 원점에 허용한다. 쓰기는 검사별 정확한 원점에 한정한다. `/api/me` CORS와 PT/World SSO는 유지한다.
- 복귀 주소에 세 검사의 정확한 HTTPS 원점을 추가했다.
- 원패키지 검토 과정에서 쓰기 body를 32KiB 스트림 한도로 제한하고 Content-Type을 정확하게 검증하도록 보완했다.
- 채점 번들은 성향테스트 backend/auth에서 제공한 버전이다. 문항·채점 버전 변경 시 그 원본의 build-scoring.mjs로 함께 갱신해야 한다.

## 검증

- 메인 `npm test`: 7개 통과. 회원/미검사/비회원, 계정 전환·늦은 응답, 오류·재시도, 잘못된 응답, hidden 탭, localhost 차단.
- Auth 기존 회귀 및 실제 worker 통합 테스트: 21개 통과. 기존 World/PT SSO, 세션 폐기, CSRF, 이메일/비밀번호, main 전용 CORS 포함.
- Auth 성향 결과 API 테스트: 7개 통과. 실제 서버 채점, SQLite 조건부 SQL, 진행·완료·재검사, revision/계정/원점 검증, body 크기 제한.
- Auth 전용 TypeScript 검사 및 Wrangler deploy --dry-run 성공. dry-run은 운영 배포가 아니다.
- 브라우저 API 모의 응답으로 320px·390px·1280px의 light/dark 6개 조합에서 결과명/미검사 표시, 가로 넘침 없음 확인. HTML처럼 생긴 결과명을 문자로 표시함을 확인했다. 오류 후 재시도·다른 회원·비회원 전환과 홈 440px 유지도 확인했다.

실계정 운영 통합 검증은 아직 하지 않았다. 제공받은 세 검사 프로젝트의 이전 166개 검증과 이번 검증은 별도이며 중복 합산하지 않는다.

## 운영 적용 — 2026-10-02 KST

사용자가 보류 기능 운영 반영을 요청하고 P1의 규칙에 따른 조율을 지시했다. Auth 소스의 대상 GitHub 브랜치 푸시·main 병합·운영 적용은 P1 대화에서 명시 승인됐다. 담당과 순서는 Auth(P1) → 메인(P99) → STRI/IPIP/IPC(P5)다. 운영 배포는 각 원격 main 기준이며 다른 담당의 저장소나 Worker를 중복 배포하지 않는다.

| 대상 | 적용 상태 | 릴리스 기준 |
|---|---|---|
| Auth API·D1 | 완료 | main `7e6e4b78bd2875a7a55a70b7eac2a37e6fdda0d9`, Worker `c141d571-196f-49bd-b08a-84c3709acb52` |
| 메인 결과 표시 | 완료 | [PR #1](https://github.com/suyongma/profile-landing/pull/1), main `6d209bea8922d1258a1ece2adc53e819336d61e2`, Worker `b43570ab-359f-479d-8217-fb9500a47e96` |
| STRI | 완료 | main `45e1987505e84032c6ea7be90cb87bf5953539ec`, Pages `f8ffe6a6-52c1-4009-8776-72468842ed14` |
| IPIP | 완료 | main `db694058d9b8ecf6ee96a4308886b55f981e65e0`, Pages `33d865de-a363-4143-8063-c68566307100` |
| IPC | 완료 | main `a3b2c6cfcd98f46a4f6c65f6817f05c365b7e7c4`, Pages `66dbec55-269b-4081-88f5-09842776b0d7` |

P1은 기존 D1 export·로컬 무결성 검증 후 새 `0003_personality.sql`의 테이블과 적용 기록만 추가했다. 기존 Auth 0001/0002 migration은 재실행하지 않았고 기존 회원·게임 데이터를 수정하지 않았다. quick_check 정상, 외래키 위반 없음, 신규 결과 테이블 0행을 확인했다. 새 회원·운영 결과·실제 메시지를 테스트 목적으로 생성하지 않았다.

메인은 css/theme/app 캐시 v8과 `/tests` 전용 personality-results.js v8의 운영 반영을 확인했다. 공통 JS/폰트 및 홈 440px 배치는 유지한다.

### 운영 검증 범위

- P1: Auth 기존 회귀 101개·성향 API 7개, 타입·월드 refined 빌드·Auth dry-run 통과. 운영 API·CORS·비회원 쓰기 거부·World/PT 로그인 이동 21개 및 DB 무결성 확인.
- P99: 새 Auth API의 실제 비로그인 GET·정확한 CORS·no-store·PUT preflight·기존 /api/me 제한·localhost/main 쓰기 차단 20개 통과.
- 메인: `npm run check:operations` PASS 339, FAIL 0. 운영 정적 파일 111개가 원격 main과 일치하고 공통 manifest 97개도 일치한다. 5개 서비스 연결과 canonical 리디렉션·404·기존 Auth 경계 정상.
- 실제 운영 브라우저: 홈과 `/tests`의 320/390/1280px × light/dark 12조합에서 가로 넘침·계정/테마 버튼 겹침·JavaScript 오류 없음. 비회원 로그인 안내와 홈 PC 440px 배치 확인.

- P5: 세 검사 Git 자동배포와 최종 CI 성공. 실제 운영 비회원 E2E STRI 46개·IPIP 12개·IPC 12개, 합계 70개 통과. STRI의 Auth 확인 후 키보드 초점과 모바일 선택지 가림을 추가 보완해 단위 50개·로컬 E2E 49개·운영 46개를 통과했다. 공통 JS·CSP·API·CORS·no-store 확인. 세 검사 상세 기록은 `/Volumes/T7/AI/projects/성향테스트/PERSONALITY_RELEASE_2026-10-02.md`와 각 저장소 `docs/deployment.md`를 따른다.

실회원의 저장·복원·완료·재검사·계정 A/B 전환 및 전체 로그아웃은 아직 운영 계정으로 검증하지 않았다. 로컬 합성 계정·API 모의 응답 검증과 운영 비회원 점검을 실회원 검증으로 간주하지 않는다. 실제 사용자 비밀번호·세션을 로그에 남기거나 테스트 결과를 기존 회원 계정에 임의 기록하지 않는다.

### 다음 변경과 롤백

Auth API/스키마를 먼저 준비하고 메인, 세 검사 순서로 릴리스한다. Auth는 마숑월드 `auth-service/README.md`와 P1 운영 기록 `docs/operations/personality-auth-release-20261002.md`를 따른다. 운영 DB 전체 복원이나 기존 세션 일괄 폐기를 일반 롤백으로 사용하지 않는다.

이번 메인 적용 전 정상 Worker 버전은 `2df4e8df-aab8-40c3-a908-14b00b76da38`이다. 메인 코드만 되돌리는 경우 중앙 Auth·월드·마PT를 함께 변경하지 않는다. 후속 문서 커밋이 main에 추가될 수 있으므로 운영 소스 바이트 확인은 `npm run check:operations`로 한다.
