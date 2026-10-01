// Read-only production audit. No cookies, login, deployment or database writes.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
if (args.length > 1 || (args.length && !args[0].startsWith('--ref='))) {
  throw new Error('사용법: npm run check:operations -- --ref=origin/main');
}
const ref = args[0]?.slice(6) || 'origin/main';
const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 16 * 1024 * 1024 });
const sha = value => createHash('sha256').update(value).digest('hex');
const commit = git('rev-parse', '--verify', `${ref}^{commit}`).toString().trim();
let passed = 0;
let failed = 0;
function check(ok, label) {
  if (ok) passed++;
  else { failed++; console.error(`FAIL ${label}`); }
}
const requests = new Map();
function get(url, headers) {
  const key = JSON.stringify([url, headers]);
  if (!requests.has(key)) requests.set(key, (async () => {
    const response = await fetch(url, { headers, redirect: 'manual', signal: AbortSignal.timeout(20000) });
    return { status: response.status, headers: response.headers, body: Buffer.from(await response.arrayBuffer()) };
  })());
  return requests.get(key);
}
async function job(label, fn) {
  try { await fn(); } catch (error) { check(false, `${label}: ${error.message}`); }
}
async function parallel(jobs) {
  const queue = [...jobs];
  await Promise.all(Array.from({ length: Math.min(6, queue.length) }, async () => {
    while (queue.length) { const [label, fn] = queue.shift(); await job(label, fn); }
  }));
}
const base = 'https://mashong.com';
const paths = git('ls-tree', '-r', '--name-only', commit, '--', 'public/').toString().trim().split('\n');
const reserved = new Set(['_headers', '_redirects', '.assetsignore']);
const assets = paths.map(path => path.slice(7)).filter(path => !reserved.has(path));
console.log(`운영 기준 ${ref} (${commit.slice(0, 7)}), 정적 파일 ${assets.length}개`);
await parallel(assets.map(file => [file, async () => {
  const path = file === 'index.html' ? '/' : file === 'tests.html' ? '/tests' : file === '404.html' ? '/__mashong_recovery_missing__' : `/${file}`;
  const response = await get(base + path);
  check(response.status === (file === '404.html' ? 404 : 200), `${path} HTTP ${response.status}`);
  check(sha(response.body) === sha(git('show', `${commit}:public/${file}`)), `${path} 운영 바이트 일치`);
}]));
await parallel([
  ...['http://mashong.com/', 'https://www.mashong.com/', `${base}/world`, `${base}/world.html`].map(url => [url, async () => {
    const response = await get(url);
    const expected = url.includes('/world') ? 'https://world.mashong.com' : base;
    const location = response.headers.get('location');
    check(response.status === 301 && location && new URL(location).origin === expected, `${url} canonical 301`);
  }]),
  ...['world', 'mapt', 'stri', 'ipip', 'ipc'].map(service => [service, async () => {
    const response = await get(`https://${service}.mashong.com/`);
    check(response.status >= 200 && response.status < 400, `${service} HTTP ${response.status}`);
  }]),
  ['상태 API', async () => {
    const response = await get(`${base}/api/status`);
    const data = JSON.parse(response.body.toString());
    check(response.status === 200 && ['world', 'mapt', 'stri', 'ipip', 'ipc'].every(id => data.services?.[id] === true), '5개 서비스 상태');
    check(!Object.hasOwn(data.services || {}, 'shopping'), '준비중 서비스 제외');
  }],
  ['Auth', async () => {
    const response = await get('https://auth.mashong.com/api/me', { Origin: base });
    check(response.status === 200 && JSON.parse(response.body.toString()).authenticated === false, 'Auth 비로그인 응답');
    check(response.headers.get('access-control-allow-origin') === base && response.headers.get('access-control-allow-credentials') === 'true', 'Auth canonical CORS');
    check(response.headers.get('cache-control')?.includes('no-store'), 'Auth no-store');
    const denied = await get('https://auth.mashong.com/api/me', { Origin: 'http://localhost:8787' });
    check(!denied.headers.has('access-control-allow-origin'), 'localhost Auth CORS 차단');
  }],
  ['manifest', async () => {
    const response = await get('https://world.mashong.com/shared/mashong-ui-manifest.json');
    const manifest = JSON.parse(response.body.toString());
    check(response.status === 200 && Array.isArray(manifest.files) && manifest.files.length > 0, '공통 manifest');
    for (const file of manifest.files) {
      if (!/^\/(?:shared|fonts)\/[a-zA-Z0-9_./-]+$/.test(file.path) || file.path.includes('..')) throw Error('manifest 경로 오류');
      check(sha(readFileSync(`${root}public${file.path}`)) === file.sha256, `공통 원본 ${file.path}`);
    }
    console.log(`공통 파일 ${manifest.files.length}개 SHA-256 확인`);
  }],
  ...['world', 'mapt'].flatMap(service => ['mashong-theme.js', 'mashong-account.js'].map(file => [`${service}/${file}`, async () => {
    const response = await get(`https://${service}.mashong.com/shared/${file}`);
    check(response.status === 200 && sha(response.body) === sha(readFileSync(`${root}public/shared/${file}`)), `${service} 공통 ${file}`);
  }]))
]);
console.log(`PASS ${passed}, FAIL ${failed}`);
process.exitCode = failed ? 1 : 0;
