# 성향 테스트 회원 결과 연동 — 구현·검증 및 릴리스 순서

## 구현 상태

메인 `/tests`의 STRI·IPIP·IPC 카드에 `나의 마지막 결과`와 서버의 결과명을 표시한다. 완료 결과가 없는 회원에게는 정확히 `아직 미검사`를 표시한다. 진행 중인 재검사는 이전 완료 결과를 덮어쓰지 않는다. 카드 링크는 기존 검사 도메인으로 이동하며, 검사 페이지가 저장된 단계와 결과를 복원한다.

비회원에게는 로그인 안내를 표시한다. 결과 API 장애나 잘못된 응답은 `결과를 불러오지 못했어요`와 다시 시도로 처리한다. 계정 표시 변경·포커스·페이지 복귀·visible 전환 시 결과를 지운 뒤 다시 조회하고, 취소되거나 오래된 응답은 표시하지 않는다. 사용자 문자열은 textContent로만 출력한다. 게스트 localStorage나 인증 토큰을 사용하지 않는다.

공통 계정/테마 JS와 폰트는 변경하지 않았다. 첫 페이지는 캐시 버전만 v8로 변경했으며 기존 440px 중앙 카드와 배치를 유지한다. 결과 패널과 CSS는 테스트 목록에만 적용한다.

## Auth 변경

원본 저장소: `suyongma/mashong-zombie-run`. 원격 main `18a9b41edc539b859a713e97f40f204496156028`에서 별도 체크아웃을 만들어 적용했다. 변경 브랜치는 로컬 `codex/personality-api`이며 기존 월드 체크아웃은 수정하지 않았다. Auth 원격 푸시는 자동 승인 검토에서 목적지 공개 권한 확인을 요구해 보류되었다.

로컬 검토 경로: `/private/tmp/mashong-auth-personality-20261001`. 재적용 가능한 패치: `/private/tmp/mashong-auth-personality-20261001.patch`.
APFS 복원 후 임시 폴더 정리에 대비해 프로젝트의 Git 제외 경로 `.local-recovery/auth-personality-20261001.patch`에도 보존했다.
패치 SHA-256은 `d360abf96b67057b41717d43d5ac9d5b9156bc5363282dc2806a8b4fb605c8c1`이며 두 사본이 일치한다.
이 로컬 보존은 원격 공개 승인과 별도다. Auth 푸시·DB migration·운영 배포는 계속 승인 대기다.

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

## 승인 후 릴리스

이번 변경은 구현·검증 단계다. 기존 UI 작업에 대한 메인 배포 요청을 Auth DB 변경이나 세 검사 신규 배포 승인으로 확대하지 않는다. 운영 DB migration, Auth 배포, 이번 메인 배포, 세 검사 배포는 실행하지 않았다.

1. Auth PR을 최신 main과 재검토/통합하고 pending migration을 확인한다. 새 테이블 migration이 다른 변경과 충돌하지 않는지 확인한다.
2. 기존 공통 DB `mashong-zombie-run-db`에 0003_personality migration을 적용하고 Auth Worker를 먼저 배포한다. auth-service/wrangler.json을 사용하며 새 DB나 secret은 만들지 않는다.
3. 메인 결과 표시 변경을 통합·배포한다. HTML과 CSS/JS v8 운영 반영을 확인한다.
4. 성향테스트의 STRI·IPIP·IPC 개발 변경을 각 저장소의 기존 배포 경로로 릴리스한다. 해당 원본 작업 공간의 변경은 이 작업에서 커밋하거나 배포하지 않았다.
5. 실계정 A/B와 비회원으로 Auth→메인→세 검사 저장/복원·완료·재검사·로그아웃을 검증한다. World/PT 기존 SSO도 확인한다.

Auth API가 아직 배포되지 않은 상태에서 메인 결과 기능만 먼저 배포하면 결과 조회 실패로 표시된다. 운영에서 회원 저장이 이미 작동한다고 보고하지 않는다.
