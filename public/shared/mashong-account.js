/* Mashong Account UI 1.1.0 — shared by all services. No authentication storage or network logic. */
(() => {
  if (customElements.get('mashong-account')) return;
  const icons = {
    user: '<circle cx="12" cy="8" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m3 7 9 6 9-6"/>',
    logout:
      '<path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M14 8l4 4-4 4M8 12h13"/>',
    login:
      '<path d="M15 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 8l4 4-4 4M3 12h11"/>',
  };
  const icon = (name) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
  const css = `
:host{--bg:#fffdfa;--fg:#292e3b;--muted:#747888;--line:#e6e3ec;--hover:#f2eef9;--accent:#705b9b;--avatar:#ece6f7;--good:#267267;--good-bg:#e9f4ef;--danger:#a1495a;display:inline-flex;vertical-align:middle;font-family:'Pretendard Variable',Pretendard,-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo',sans-serif;font-size:14px;line-height:1.5;color:var(--fg);text-align:left;color-scheme:light}
:host([theme=dark]){--bg:#222937;--fg:#eff0f6;--muted:#a7b0c2;--line:#3b4355;--hover:#30354a;--accent:#c6b6f2;--avatar:#3b3456;--good:#a4dfcf;--good-bg:#273f3b;--danger:#efb0bc;color-scheme:dark}
*{box-sizing:border-box}button,a{font:inherit;-webkit-tap-highlight-color:transparent}button{cursor:pointer;color:inherit}button:disabled{cursor:wait;opacity:.6}button:focus-visible,a:focus-visible{outline:3px solid var(--accent);outline-offset:3px}svg{width:20px;height:20px;flex:none}button{border:0;background:none}p,h2{margin:0}
.trigger{display:inline-flex;align-items:center;gap:9px;min-height:44px;padding:5px 11px 5px 5px;border:1px solid var(--line);border-radius:999px;background:var(--bg);white-space:nowrap;box-shadow:0 2px 5px #18203004;transition:background .15s,border-color .15s}.trigger:hover{background:var(--hover);border-color:var(--accent)}.avatar{display:inline-grid;place-items:center;width:32px;height:32px;flex:none;border-radius:50%;background:var(--avatar);color:var(--accent);font-size:14px;font-weight:750;letter-spacing:-.04em}.trigger-name{font-size:14px;font-weight:650;max-width:108px;overflow:hidden;text-overflow:ellipsis;letter-spacing:-.02em}.trigger>svg{width:15px;height:15px;color:var(--muted)}.trigger.guest{padding:9px 17px;gap:8px}.trigger.guest>svg{width:18px;height:18px;color:var(--accent)}
dialog{position:fixed;inset:auto;margin:0;padding:0;width:352px;max-width:calc(100vw - 24px);max-height:calc(100dvh - 24px);border:1px solid var(--line);border-radius:24px;background:var(--bg);color:var(--fg);box-shadow:0 24px 80px #1118272b;overflow:auto;overscroll-behavior:contain;font:inherit}dialog::backdrop{background:#14192530;backdrop-filter:blur(3px)}.grab{display:none}.top{display:flex;align-items:center;justify-content:space-between;padding:17px 18px 2px 24px}.brand{font-size:12px;font-weight:700;letter-spacing:.02em;color:var(--muted)}.close{display:grid;place-items:center;width:40px;height:40px;border-radius:50%;color:var(--muted)}.close:hover{background:var(--hover)}.identity{display:flex;align-items:center;gap:13px;padding:12px 24px 20px}.identity .avatar{width:48px;height:48px;font-size:20px}.identity>div{min-width:0}.name{font-size:19px;line-height:1.35;font-weight:750;letter-spacing:-.03em;overflow-wrap:anywhere}.email{font-size:13px;color:var(--muted);margin-top:3px;overflow-wrap:anywhere}.badge{display:inline-flex;align-items:center;gap:5px;margin-top:9px;padding:3px 8px;border-radius:6px;background:var(--good-bg);color:var(--good);font-size:11px;font-weight:650}.badge svg{width:13px;height:13px}.badge.pending{background:var(--hover);color:var(--accent)}.actions{padding:8px 12px;border-top:1px solid var(--line)}.row{display:flex;align-items:center;gap:12px;width:100%;padding:13px 12px;border-radius:13px;text-align:left;min-height:60px}.row:hover{background:var(--hover)}.row>.leading{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;color:var(--accent);background:var(--hover)}.row .copy{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}.row strong{font-size:14px;font-weight:650;letter-spacing:-.02em}.row small{font-size:12px;color:var(--muted);line-height:1.5}.row>svg:last-child{width:16px;height:16px;color:var(--muted)}.footer{padding:6px 12px 19px}.logout{color:var(--danger);min-height:48px;padding-block:10px}.logout>.leading{background:transparent;color:var(--danger)}.footnote{color:var(--muted);font-size:11px;line-height:1.6;padding:4px 12px 0}.error{color:var(--danger);padding:0 24px 12px;font-size:12px;overflow-wrap:anywhere}.error:empty{display:none}[hidden]{display:none!important}
@media(max-width:760px){.trigger{position:relative;min-height:32px;height:32px;padding:3px 8px 3px 3px;gap:6px}.trigger::after{content:"";position:absolute;inset:-6px 0}.trigger .avatar{width:24px;height:24px;font-size:11px}.trigger-name{font-size:12px;max-width:72px}.trigger>svg{width:12px;height:12px}.trigger.guest{padding:5px 10px;font-size:12px;gap:5px}.trigger.guest>svg{width:15px;height:15px}}
@media(max-width:600px){dialog{inset:auto 8px 8px!important;width:calc(100% - 16px);max-width:none;max-height:calc(100dvh - 24px);border-radius:24px;padding-bottom:env(safe-area-inset-bottom)}.grab{display:block;width:32px;height:4px;border-radius:9px;background:var(--line);margin:11px auto 0}.top{padding-top:2px}.identity{padding-top:8px}.row{min-height:62px}.footer{padding-bottom:16px}}
@media(max-width:360px){.trigger-name{max-width:50px}}
@media(prefers-reduced-motion:reduce){*{transition:none!important}}
`;
  class MashongAccount extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._user = null;
      this._state = 'loading';
      this._busy = false;
      this._error = '';
      this.shadowRoot.innerHTML = `<style>${css}</style><button class="trigger guest" type="button" aria-label="계정 확인 중" disabled>계정 확인 중</button><dialog aria-labelledby="account-title"><div class="grab" aria-hidden="true"></div><div class="top"><span class="brand">마숑 계정</span><button class="close" type="button" aria-label="계정 메뉴 닫기">${icon('close')}</button></div><section class="identity"><span class="avatar" aria-hidden="true"></span><div><h2 class="name" id="account-title"></h2><p class="email"></p><span class="badge"></span></div></section><div class="actions"><button class="row" data-action="account" type="button"><span class="leading">${icon('user')}</span><span class="copy"><strong>계정 관리</strong><small>비밀번호와 계정 정보</small></span>${icon('chevron')}</button><button class="row" data-action="verify" type="button"><span class="leading">${icon('mail')}</span><span class="copy"><strong>이메일 인증</strong><small>이메일을 등록하거나 인증해 주세요</small></span>${icon('chevron')}</button></div><div class="footer"><button class="row logout" data-action="logout" type="button"><span class="leading">${icon('logout')}</span><span class="copy"><strong>로그아웃</strong></span></button><p class="footnote">모든 마숑 서비스에서 함께 로그아웃됩니다.</p></div><p class="error" role="alert"></p></dialog>`;
      this.trigger = this.shadowRoot.querySelector('.trigger');
      this.dialog = this.shadowRoot.querySelector('dialog');
      this.trigger.addEventListener('click', () =>
        this._state === 'member'
          ? this.open()
          : this.action(this._state === 'error' ? 'retry' : 'login'),
      );
      this.shadowRoot
        .querySelector('.close')
        .addEventListener('click', () => this.close());
      this.dialog.addEventListener('click', (e) => {
        if (e.target === this.dialog) {
          const r = this.dialog.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            this.close();
        }
      });
      this.dialog.addEventListener('close', () => {
        this.trigger.setAttribute('aria-expanded', 'false');
        this.trigger.focus({ preventScroll: true });
      });
      this.shadowRoot
        .querySelectorAll('[data-action]')
        .forEach((b) =>
          b.addEventListener('click', () => this.action(b.dataset.action)),
        );
      this.syncTheme = () => {
        const root = document.documentElement;
        this.setAttribute(
          'theme',
          root.dataset.theme === 'dark' || root.classList.contains('dark')
            ? 'dark'
            : 'light',
        );
      };
      this.resize = () => {
        if (this.dialog.open) this.position();
      };
    }
    connectedCallback() {
      this.syncTheme();
      this.observer = new MutationObserver(this.syncTheme);
      this.observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme', 'class'],
      });
      window.addEventListener('resize', this.resize);
      this.render();
    }
    disconnectedCallback() {
      this.observer?.disconnect();
      window.removeEventListener('resize', this.resize);
      if (this.dialog.open) this.dialog.close();
    }
    set user(value) {
      this._user = value;
      this._state = value ? 'member' : 'guest';
      this.render();
    }
    get user() {
      return this._user;
    }
    set status(value) {
      this._state = value;
      this.render();
    }
    set busy(value) {
      this._busy = Boolean(value);
      this.render();
    }
    set errorMessage(value) {
      this._error = String(value || '');
      this.shadowRoot.querySelector('.error').textContent = this._error;
    }
    action(action) {
      if (this._busy) return;
      this.dispatchEvent(
        new CustomEvent('mashong-account-action', {
          detail: { action },
          bubbles: true,
          composed: true,
        }),
      );
    }
    position() {
      const r = this.trigger.getBoundingClientRect();
      this.dialog.style.top =
        Math.max(
          12,
          Math.min(r.bottom + 10, innerHeight - this.dialog.offsetHeight - 12),
        ) + 'px';
      this.dialog.style.left =
        Math.max(
          12,
          Math.min(
            r.right - this.dialog.offsetWidth,
            innerWidth - this.dialog.offsetWidth - 12,
          ),
        ) + 'px';
    }
    open() {
      if (this._state !== 'member' || this.dialog.open) return;
      this.dialog.showModal();
      this.position();
      this.trigger.setAttribute('aria-expanded', 'true');
    }
    close() {
      this.dialog.close();
    }
    render() {
      if (!this.trigger) return;
      const member = this._state === 'member' && this._user;
      this.trigger.disabled = this._busy || this._state === 'loading';
      this.trigger.className = 'trigger' + (member ? '' : ' guest');
      this.trigger.setAttribute('aria-haspopup', member ? 'dialog' : 'false');
      this.trigger.setAttribute('aria-expanded', String(this.dialog.open));
      if (member) {
        const name = String(this._user.name || '마숑 회원');
        this.trigger.innerHTML =
          '<span class="avatar" aria-hidden="true"></span><span class="trigger-name"></span>' +
          icon('down');
        this.trigger.querySelector('.avatar').textContent = Array.from(name)[0];
        this.trigger.querySelector('.trigger-name').textContent = name + ' 님';
        this.trigger.setAttribute('aria-label', name + ' 님, 마숑 계정 메뉴');
        this.shadowRoot.querySelector('.identity .avatar').textContent =
          Array.from(name)[0];
        this.shadowRoot.querySelector('.name').textContent = name + ' 님';
        this.shadowRoot.querySelector('.email').textContent =
          this._user.email || '이메일을 등록해 주세요';
        const verified = !!this._user.emailVerified;
        const badge = this.shadowRoot.querySelector('.badge');
        badge.className = 'badge' + (verified ? '' : ' pending');
        badge.innerHTML =
          icon(verified ? 'check' : 'mail') +
          (verified
            ? '이메일 인증 완료'
            : this._user.email
              ? '이메일 미인증'
              : '이메일 미등록');
        this.shadowRoot.querySelector('[data-action=verify]').hidden = verified;
      } else {
        this.trigger.innerHTML = icon('login') + '<span></span>';
        const label =
          this._state === 'loading'
            ? '계정 확인 중'
            : this._state === 'error'
              ? '다시 확인'
              : '로그인';
        this.trigger.querySelector('span').textContent = label;
        this.trigger.setAttribute('aria-label', label);
        if (this.dialog.open) this.close();
      }
      this.shadowRoot.querySelectorAll('[data-action]').forEach((b) => {
        b.disabled = this._busy;
      });
      this.dialog.setAttribute('aria-busy', String(this._busy));
    }
  }
  customElements.define('mashong-account', MashongAccount);
})();
