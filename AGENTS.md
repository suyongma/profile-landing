# 마숑 메인 (mashong.com) — 작업 지침 / 인수인계

마숑(MASHONG) 공식 포털. 서비스 카드(성향 테스트·마숑월드·마PT·뭐 사지?)를 모아 보여주는 정적 사이트다.
사용자와의 대화·보고는 한국어로 한다.

## 구조

- 배포: Cloudflare Workers + Workers Assets, Worker 이름 `profile-landing` (계정 kingteer2@gmail.com).
  커스텀 도메인 `mashong.com`은 Cloudflare 대시보드에서 연결돼 있다. `wrangler.json`에 routes를 추가하지 않는다.
- `workers_dev`/`preview_urls`는 `false`. 메인은 canonical `https://mashong.com`에서만 열려야 한다
  (Auth CORS가 이 origin만 허용). `www`·`http://`는 Cloudflare에서 301로 canonical에 넘어간다
  (Always Use HTTPS 켜짐, 2026-10-01).
- GitHub: `https://github.com/suyongma/profile-landing`, 기본 브랜치 `main`.

```
public/            정적 파일 (Workers Assets가 직접 서빙)
  index.html       메인 포털
  tests.html       /tests — STRI·IPIP·IPC 테스트 목록
  404.html         not_found_handling
  style.css        전체 디자인 (라이트/다크 토큰, :root[data-theme="dark"])
  theme.js         테마 토글 버튼 UI만 (상태·저장은 MashongTheme)
  app.js           토스트, 공유/URL 복사, /api/status 서비스 상태 표시
  personality-results.js  /tests 전용 회원 마지막 결과 조회 (Auth /api/personality)
  shared/          ⚠ 공통 파일 (직접 수정 금지, 아래 참고)
  fonts/           ⚠ 공통 Pretendard 자체 호스팅 (직접 수정 금지)
  _headers         보안 헤더, 캐시 규칙
  _redirects       /world → https://world.mashong.com
  .assetsignore    macOS ._* / .DS_Store 업로드 제외
worker.js          /api/* 만 처리 (run_worker_first). /api/status: 서비스 헬스 체크 (60초 캐시)
wrangler.json
```

## 개발·배포 명령

- Node 22 (`.node-version`). 빌드 단계 없음 (`npm run build`는 echo).
- 로컬: `npx wrangler dev --port 8787` → http://localhost:8787
- 로컬 단축 명령: `npm run dev`. 운영 읽기 전용 점검: `npm run check:operations`.
  점검 기준은 `origin/main`이므로 먼저 `git fetch`한다. 특정 릴리스는 `-- --ref=<커밋>`으로 지정한다.
- 배포: `npm run deploy` (= `wrangler deploy`). 배포는 사용자가 요청할 때만 한다.
- 작업 순서: `git fetch` → 변경 → 로컬 확인 → 커밋/푸시 → (요청 시) 배포 → `curl`로 운영 반영 확인.
- 다른 세션·도구가 같은 저장소를 수정하므로 작업 전 항상 `git fetch`로 원격 커밋을 확인한다.
- 커밋 메시지는 `feat:` / `fix:` / `chore:` 형식.

## 캐시 버전 규칙

`_headers`에서 css/js는 1시간 캐시된다. `style.css`, `theme.js`, `app.js`를 바꾸면
모든 HTML(index/tests/404)에서 `?v=N`을 함께 올린다 (현재 `v=8`). 안 올리면 폰에서 예전 CSS가 남는다.

## 마숑 공통 계정·테마 (2026-10-01 연결)

명세 원본: `/Volumes/T7/AI/projects/마숑월드/MASHONG_MAIN_CLAUDE_PROMPT.md`
공통 파일 manifest: `https://world.mashong.com/shared/mashong-ui-manifest.json` (파일별 SHA-256)

- `public/shared/mashong-theme.js?v=1` — 공통 테마 (`window.MashongTheme`). head에서 **동기**로 가장 먼저 로드.
- `public/shared/mashong-account.js?v=1.1` — `<mashong-account>` Web Component (Shadow DOM).
- `public/shared/mashong-main.js?v=1` — 메인용 Auth 어댑터. `#mashong-account`, `#mashong-auth-status`를 사용.
- `public/fonts/pretendard.css` + `public/fonts/pretendard/`.

규칙:
- `shared/`, `fonts/` 파일은 **수정하지 않는다.** 바이트가 월드·마PT와 같아야 한다. 갱신은 manifest에서
  받아 SHA-256을 확인하고 교체한다. 원본 수정이 필요하면 마숑월드 쪽에서 한다.
- 인증은 전부 `https://auth.mashong.com` 담당. 메인은 `GET /api/me`(credentials: include)로 표시만 한다.
  로그인/가입/계정/이메일 인증/로그아웃은 Auth 경로로 `returnTo=location.href`를 붙여 이동한다.
  로그아웃은 Auth `/logout` 확인 화면으로만 보낸다 (`/api/logout` 직접 호출 금지).
- 메인에 회원 DB·비밀번호·secret·토큰 저장·자체 인증 서버를 만들지 않는다.
- 로컬(localhost)에서는 어댑터가 일부러 "다시 확인" 상태 + 안내 문구를 띄운다. 정상이다.
  로컬 UI 확인은 콘솔에서 합성 데이터로:
  `document.querySelector('#mashong-account').user = {name:'테스트', email:'a@example.com', emailVerified:true}`
  localhost 때문에 운영 Auth CORS/returnTo를 넓히지 않는다.
- 테마: 모드 `auto|light|dark`, 쿠키 `mashong_theme` (Domain=mashong.com)로 서비스 간 동기화.
  `theme.js`는 `MashongTheme.getMode()/set()`과 `mashong-theme-change` 이벤트로 버튼만 그린다.
  CSS 다크 모드는 `:root[data-theme="dark"]` 기준 (OS 미디어쿼리로 다크를 강제하지 않는다).

## 레이아웃 메모

- 메인 첫 페이지는 기존 440px 중앙 카드·프로필·세로 서비스 메뉴와 UI 스타일을 유지하고 색상만 통일한다.
  성향 테스트 목록은 최대 너비 1060px, PC 3열·모바일(≤900px) 1열 카드 구성이다.
  테스트 페이지 전용 레이아웃은 `.tests-layout` 범위에 적용해 메인 배치에 영향을 주지 않는다.
- 메인 카드 상단 `.card-topbar`: 왼쪽 브랜드 심볼, 오른쪽 `.card-actions[data-theme-slot]`
  (테마 버튼 → 계정 버튼 순). `theme.js`가 `[data-theme-slot]` 안 계정 버튼 앞에 테마 버튼을 넣는다.
  슬롯이 없으면 카드 모서리(`.is-corner`, 404 페이지)에 둔다.
- `/tests`는 기존 `.world-top-nav .nav-actions`가 슬롯. 480px 이하 아이콘만, 400px 이하 URL 복사 버튼 숨김.
- 모바일(≤760px): 헤더 버튼 32px, 아이콘 16px, 터치 영역 약 44px. PC: 계정·테마 버튼 44px.
- 320px / 390px / PC, 라이트/다크에서 겹침·가로 스크롤·헤더 두 줄이 없는지 확인한다.
- 서비스 링크(마숑월드·마PT·테스트들)는 같은 탭에서 연다 (`target="_blank"` 쓰지 않음).
- "뭐 사지?"는 준비중 카드(링크 없음). `/api/status`에서도 제외돼 있다.

## 성향 테스트 회원 결과 (2026-10-02 운영 반영)

- `/tests`만 `personality-results.js`를 로드한다. 조회는 Auth `/api/personality`, credentials 포함·no-store.
- 완료 결과는 `나의 마지막 결과`와 결과명, 완료 결과가 없으면 정확히 `아직 미검사`로 표시한다.
- 조회 실패는 미검사/비회원으로 간주하지 않는다. 계정 전환 시 이전 결과와 오래된 응답을 제거한다.
- 검증: `npm test`. 릴리스 상태와 순서는 `docs/PERSONALITY_RELEASE.md`를 확인한다.
- 운영 순서는 P1 Auth migration/API → P99 메인 → P5 세 검사다. Auth·메인·세 검사는 2026-10-02 운영 반영과 비회원 검증을 완료했다.
- Auth 배포는 마숑월드 `auth-service/README.md`의 원격 main 배포 규칙을 따르며 P1과 조율한다.

## 남은 확인 항목 (사용자 실계정·실기기)

1. 로그인 → 메인 복귀 → 닉네임 표시
2. 로그인 상태로 월드·마PT 이동 시 기존 세션 진입 (마PT 이메일 미인증 안내 포함)
3. 월드·마PT에서 로그인 후 메인에 로그인 상태 표시
4. 메인 로그아웃 → 중앙 확인 → 메인 복귀 시 비로그인, 월드·마PT도 로그아웃, 다른 탭 갱신
5. iPhone 320/390px 실기기 화면과 하단 계정 메뉴

## 알려진 이슈

- 공통 `mashong-theme.js`는 `matchMedia().addEventListener`만 사용 → iOS Safari 14 미만에서 오류 가능.
  공통 파일이므로 마숑월드 원본에서 고쳐야 한다.
- T7은 2026-10-01 APFS로 포맷·복원됐다. 현재 경로는 `/Volumes/T7/AI/projects/마숑메인`이다.
  과거 `/Volumes/T7/gpt/...` 경로를 새 세션에서 사용하지 않는다. APFS 점검 기록은
  `docs/APFS_RECOVERY_2026-10-01.md`를 참고한다. exFAT 관련 Git 오류는 현재 재현되지 않는다.
- `.local-recovery/`는 로컬 런타임·이전 Auth 검토 패치 보존용이며 Git/배포 대상이 아니다.
  성향 테스트 회원 결과 PR #1은 main에 병합됐다. 현재 운영 상태는 `docs/PERSONALITY_RELEASE.md`를 따른다.
- `push_to_github.ps1`은 예전 Windows 환경용 스크립트로 현재 사용하지 않는다.
