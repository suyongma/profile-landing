# APFS 복원 후 마숑 메인 운영 점검

복원일: 2026-10-01. 점검: 2026-10-01 밤 ~ 2026-10-02 새벽(KST).

## 디스크·저장소·실행 환경

- T7(`/Volumes/T7`)은 APFS, 쓰기 가능, SMART Verified이며 약 971GB 여유 공간이 있다.
- 메인 프로젝트의 실제 경로는 `/Volumes/T7/AI/projects/마숑메인`이다. 한글 NFC/NFD 경로 모두 같은 폴더로 접근한다.
- 원격 fetch 및 `git fsck --full` 통과. `._*` Git 오류와 깨진 의존성 심볼릭 링크는 발견되지 않았다.
- exFAT에서 이어진 일반 파일 116개의 권한을 Git 기록(644/755)에 맞춰 복구했다. APFS의 `core.filemode`는 `true`로 설정했다.
- `.node-version`, `.nvmrc`, `.gitignore`의 BOM/줄바꿈을 정리했다. 특히 BOM 때문에 `.wrangler` 제외 규칙이 정확히 적용되지 않던 부분을 수정했다.
- 시스템 Node 24는 유지한다. 프로젝트 전용 Node 22.23.3은 `.local-recovery/runtime/node_modules/.bin/node`에 준비했으며 Wrangler 4.141.0으로 실제 로컬 기동을 검증했다.
- Cloudflare OAuth 계정과 배포 dry-run 정상. Worker 이름, canonical 도메인, Assets 설정은 그대로 유지한다.

## 운영 확인 결과

기준 릴리스: `d45c49a`(홈 원래 배치 유지·색상 통일). 이 복구 작업은 운영 HTML/CSS/JS/Worker를 변경하지 않는다.

- `npm run check:operations`: PASS 337, FAIL 0.
- 운영 정적 파일 110개는 기준 Git 릴리스와 모두 SHA-256이 일치한다. 404 페이지는 HTTP 404를 유지한다.
- 공통 manifest 97개 파일은 복원된 로컬 파일과 SHA-256이 일치한다. 월드·마PT의 공통 테마/계정 JS도 일치한다.
- 메인 → `/tests` → STRI/IPIP/IPC 및 월드·마PT 연결 정상. 5개 서비스 상태는 모두 정상이다. 월드는 비로그인 진입 시 HTTP 307이 정상이다.
- HTTP/WWW → canonical 301, `/world` 및 `/world.html` → 월드 301 정상.
- Auth `/api/me` 비로그인 200, 메인 origin CORS/credentials/no-store 정상. localhost CORS는 열지 않았다.
- 로컬 홈·`/tests`를 320/390/1280px, 라이트/다크 12조합으로 확인했다. 가로 스크롤과 테마·계정 버튼 겹침, JavaScript 오류가 없으며 서비스 링크는 같은 탭이다.
- 로컬 404 정상. localhost 어댑터는 실제 Auth 요청을 하지 않는다.
- 보존된 성향 테스트 회원 결과 작업은 Node 22에서도 회귀시험 7개 통과했다.
- 격리된 Auth 검토 작업도 Node 22에서 기존 인증/SSO·worker 통합 21개와 성향 API 7개를 통과했다. 이 검증은 로컬 SQLite/합성 계정이며 운영 DB를 사용하지 않는다.

실제 회원 로그인 완료·서비스 간 세션 공유·전체 로그아웃 및 iPhone 실기기 확인은 사용자 계정/기기 확인 항목으로 남긴다. 비로그인 API와 합성 계정 UI 검증을 실회원 검증으로 간주하지 않는다.

## 다음 세션의 작업 기준

```sh
git fetch --prune
npm run check:operations
npm run dev
```

운영 점검은 기본적으로 `origin/main`의 파일과 비교한다. 미배포 기능 브랜치에서 실행해도 운영 기준을 유지한다. 배포 후 특정 커밋을 확인하려면 `npm run check:operations -- --ref=<커밋>`을 사용한다. 이 명령은 읽기 전용이며 로그인·배포·DB 변경을 하지 않는다.

Node 버전 관리 도구는 BOM 없는 `.node-version` 또는 `.nvmrc`의 `22`를 사용한다. 현재 머신의 프로젝트 전용 런타임을 직접 사용하려면 아래처럼 실행한다.

```sh
.local-recovery/runtime/node_modules/.bin/node scripts/check-operations.mjs
.local-recovery/runtime/node_modules/.bin/node node_modules/wrangler/bin/wrangler.js dev --port 8787
```

공통 파일과 폰트의 내용은 수정하지 않는다. `.local-recovery/`와 `.playwright-mcp/`는 Git 제외이며 Workers Assets의 `public/` 밖에 둔다. 임시 폴더 정리 전에 미승인 패치 등 필요한 로컬 작업을 보존한다.

## 세션·미배포 작업 보존

- `P99.마숑메인`의 프로젝트 등록과 현재 작업 경로는 복원된 폴더를 가리킨다. 메인 프로젝트에서 확인된 활성 채팅은 이 채팅 하나다.
- 월드(`/Volumes/T7/AI/projects/마숑월드`), 마PT(`/Volumes/T7/AI/projects/마PT`), 성향테스트(`/Volumes/T7/AI/projects/성향테스트`) 프로젝트 등록 경로도 존재한다. 예전 `/Volumes/T7/gpt/외부시연 웹`, `/Volumes/T7/gpt/마PT`는 없어 각 프로젝트 복구 채팅에서 정리 중이다. 메인에서 다른 프로젝트의 작업 트리나 미커밋 변경을 덮어쓰지 않는다.
- 마PT 채팅은 운영 프로세스·DB 무결성·테스트 정상화를 완료했다고 보고했다. 성향테스트 채팅도 세 저장소 복원, 로컬 검증 166개·기존 운영 브라우저 검증 70개, 개발 서버 5181/5182/5183 복원을 완료했다고 보고했다. 이 수치는 메인의 점검 수와 합산하지 않는다.
- 월드/투자 프로젝트의 세부 복구는 점검 당시 해당 채팅에서 진행 중이므로 전체 완료로 간주하지 않는다.
- 성향 테스트 회원 결과 기능은 `codex/personality-results` / [Draft PR #1](https://github.com/suyongma/profile-landing/pull/1)에 보존한다. Auth migration/API 및 신규 기능 운영 적용은 승인 대기 상태다.
- Auth 로컬 변경 패치를 임시 폴더에서 `.local-recovery/auth-personality-20261001.patch`로 복사 보존했다. 이 파일은 Git 제외이며 원격 게시/운영 배포하지 않는다.
