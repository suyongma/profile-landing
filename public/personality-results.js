// Read-only member summaries. Shared account/theme files remain untouched.
(() => {
  async function init() {
    const panels = [...document.querySelectorAll('[data-personality-result]')];
    if (!panels.length) return;
    const account = document.querySelector('#mashong-account');
    const notice = document.querySelector('[data-personality-notice]');
    const retry = document.querySelector('[data-personality-retry]');
    const login = document.querySelector('[data-personality-login]');
    const clear = (label) => panels.forEach((panel) => {
      panel.dataset.state = 'pending';
      panel.querySelector('[data-result-label]').textContent = label;
      panel.querySelector('[data-result-title]').textContent = '';
    });
    const message = (text, state) => {
      notice.textContent = text;
      retry.hidden = state !== 'error';
      login.hidden = state !== 'guest';
    };
    if (location.origin !== 'https://mashong.com') {
      clear('회원 결과');
      message('실제 회원 결과는 https://mashong.com에서 확인해 주세요.', 'local');
      return;
    }
    await customElements.whenDefined('mashong-account');
    let generation = 0;
    let controller;
    let accountUser = account.user;
    let accountLabel = account.trigger.getAttribute('aria-label');
    async function refresh() {
      const revision = ++generation;
      controller?.abort();
      controller = new AbortController();
      const requestController = controller;
      const timeout = setTimeout(() => requestController.abort(), 8000);
      // Clear first, including on focus: the central session may have changed.
      clear('결과 확인 중…');
      message('회원의 마지막 검사 결과를 확인하고 있어요.', 'loading');
      try {
        const response = await fetch('https://auth.mashong.com/api/personality', {
          credentials: 'include', cache: 'no-store', redirect: 'error',
          signal: requestController.signal,
        });
        if (!response.ok) throw Error('Result query failed');
        const data = await response.json();
        if (revision !== generation) return;
        if (data.authenticated === false) {
          clear('로그인 후 결과 확인');
          message('로그인하면 나의 마지막 검사 결과를 확인할 수 있어요. 비회원도 검사할 수 있습니다.', 'guest');
          return;
        }
        if (data.authenticated !== true || typeof data.user?.id !== 'string' || !data.tests) {
          throw Error('Invalid result response');
        }
        // Validate the complete response before showing any member data.
        const results = panels.map((panel) => {
          const test = data.tests[panel.dataset.personalityResult];
          if (!test || !Object.hasOwn(test, 'lastResult')) throw Error('Missing test');
          if (test.lastResult !== null &&
              (typeof test.lastResult?.title !== 'string' || !test.lastResult.title.trim())) {
            throw Error('Invalid result title');
          }
          return test.lastResult;
        });
        panels.forEach((panel, index) => {
          const result = results[index];
          panel.dataset.state = result ? 'completed' : 'not-started';
          panel.querySelector('[data-result-label]').textContent = result ? '나의 마지막 결과' : '아직 미검사';
          panel.querySelector('[data-result-title]').textContent = result ? result.title : '';
        });
        message('검사를 열면 저장된 진행 단계와 마지막 결과를 확인할 수 있어요.', 'member');
      } catch {
        if (revision !== generation) return;
        clear('결과 조회 실패');
        message('결과를 불러오지 못했어요. 다시 시도해 주세요.', 'error');
      } finally {
        clearTimeout(timeout);
      }
    }
    // The shared component has a public user getter, but no change event.
    // Observe its rendering without changing its implementation or storing identity.
    new MutationObserver(() => {
      const label = account.trigger.getAttribute('aria-label');
      if (account.user !== accountUser || label !== accountLabel) {
        accountUser = account.user;
        accountLabel = label;
        void refresh();
      }
    }).observe(account.shadowRoot, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-label'] });
    retry.addEventListener('click', refresh);
    account.addEventListener('mashong-account-action', (event) => {
      if (['logout', 'login', 'signup'].includes(event.detail.action)) {
        ++generation;
        controller?.abort();
        clear('회원 결과');
        message('계정 상태를 다시 확인하면 결과가 표시됩니다.', 'loading');
      }
    });
    window.addEventListener('pageshow', refresh);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void refresh();
      else {
        ++generation;
        controller?.abort();
        clear('회원 결과');
      }
    });
    window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, 30000);
    await refresh();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else void init();
})();
