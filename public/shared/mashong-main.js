/* Main portal adapter 1.0.0. Vendor with mashong-account.js and mashong-theme.js. */
(() => {
  async function init() {
    const account = document.querySelector('#mashong-account');
    if (!account) return;
    await customElements.whenDefined('mashong-account');
    const status = document.querySelector('#mashong-auth-status');
    const message = (text) => {
      if (status) status.textContent = text;
    };
    const routes = {
      login: '/login',
      signup: '/signup',
      account: '/account',
      verify: '/verify-email',
      logout: '/logout',
    };
    const navigate = (action) => {
      if (!Object.hasOwn(routes, action)) return;
      const url = new URL(routes[action], 'https://auth.mashong.com');
      url.searchParams.set('returnTo', location.href);
      location.assign(url.href);
    };
    account.user = null;
    account.status = 'loading';
    if (location.origin !== 'https://mashong.com') {
      account.status = 'error';
      message('실제 계정 연결은 https://mashong.com에서 확인해 주세요.');
      return;
    }
    let pending = null;
    function refresh() {
      if (pending) return pending;
      pending = (async () => {
        try {
          const response = await fetch('https://auth.mashong.com/api/me', {
            credentials: 'include',
            mode: 'cors',
            cache: 'no-store',
            redirect: 'error',
            signal: AbortSignal.timeout(8000),
          });
          if (!response.ok)
            throw Error(
              '로그인 상태를 확인하지 못했습니다. 다시 확인해 주세요.',
            );
          const data = await response.json();
          if (
            data.authenticated === true &&
            typeof data.user?.id === 'string' &&
            typeof data.user.nickname === 'string'
          ) {
            account.user = {
              name: data.user.nickname,
              email: data.user.email,
              emailVerified: data.user.emailVerified === true,
            };
          } else if (data.authenticated === false) {
            account.user = null;
          } else throw Error('로그인 상태 응답을 확인하지 못했습니다.');
          message('');
        } catch {
          // A network failure is not proof that the user is logged out.
          account.status = 'error';
          message('로그인 상태를 확인하지 못했습니다. 다시 확인해 주세요.');
        } finally {
          pending = null;
        }
      })();
      return pending;
    }
    account.addEventListener('mashong-account-action', async (event) => {
      if (event.detail.action === 'retry') {
        account.status = 'loading';
        await refresh();
      } else navigate(event.detail.action);
    });
    document.querySelectorAll('[data-mashong-auth]').forEach((button) =>
      button.addEventListener('click', (event) => {
        const action = button.getAttribute('data-mashong-auth');
        if (Object.hasOwn(routes, action)) {
          event.preventDefault();
          navigate(action);
        }
      }),
    );
    window.addEventListener('pageshow', refresh);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void refresh();
    });
    window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, 30000);
    await refresh();
  }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init, { once: true });
  else void init();
})();
