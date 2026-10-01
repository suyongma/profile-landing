/* Mashong Theme 1.0.0. Cosmetic preference only, never authentication. */
(() => {
  if (window.MashongTheme) return;
  const KEY = 'mashong:theme',
    COOKIE = 'mashong_theme';
  const valid = (v) => ['light', 'dark', 'auto'].includes(v);
  const root = document.documentElement,
    media = window.matchMedia('(prefers-color-scheme: dark)');
  const host = window.location.hostname;
  const shared =
    window.location.protocol === 'https:' &&
    (host === 'mashong.com' || host.endsWith('.mashong.com'));
  function readCookie() {
    try {
      const all = document.cookie
        .split(';')
        .map((v) => v.trim())
        .filter((v) => v.startsWith(COOKIE + '='));
      const v = all.length === 1 ? all[0].slice(COOKIE.length + 1) : null;
      return valid(v) ? v : null;
    } catch {
      return null;
    }
  }
  function readLocal() {
    try {
      const v =
        localStorage.getItem(KEY) || localStorage.getItem('mashong-theme');
      return valid(v) ? v : null;
    } catch {
      return null;
    }
  }
  function writeCookie(v) {
    try {
      document.cookie =
        COOKIE +
        '=' +
        v +
        '; Path=/; Max-Age=31536000; SameSite=Lax' +
        (shared
          ? '; Domain=mashong.com; Secure'
          : window.location.protocol === 'https:'
            ? '; Secure'
            : '');
    } catch {}
  }
  function mirror(v) {
    try {
      localStorage.setItem(KEY, v);
    } catch {}
  }
  const saved = readCookie(),
    legacy = readLocal();
  let mode = saved || legacy || 'auto';
  if (!saved && legacy) writeCookie(mode);
  let appliedMode, appliedTheme;
  function apply() {
    const theme = mode === 'auto' ? (media.matches ? 'dark' : 'light') : mode;
    root.dataset.theme = theme;
    root.dataset.themeMode = mode;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
      meta.content = theme === 'dark' ? '#171c28' : '#f8f7f4';
    });
    if (appliedMode !== mode || appliedTheme !== theme) {
      appliedMode = mode;
      appliedTheme = theme;
      window.dispatchEvent(
        new CustomEvent('mashong-theme-change', { detail: { mode, theme } }),
      );
    }
  }
  function sync() {
    mode = readCookie() || readLocal() || mode;
    mirror(mode);
    apply();
  }
  function set(v) {
    if (!valid(v)) throw new TypeError('Theme must be light, dark, or auto');
    mode = v;
    writeCookie(mode);
    mirror(mode);
    apply();
  }
  window.MashongTheme = Object.freeze({
    getMode: () => mode,
    getTheme: () => appliedTheme,
    set,
    sync,
    toggle: () => set(appliedTheme === 'dark' ? 'light' : 'dark'),
  });
  mirror(mode);
  apply();
  window.addEventListener('focus', sync);
  window.addEventListener('pageshow', sync);
  window.addEventListener('storage', (e) => {
    if (e.key === KEY || e.key === 'mashong-theme' || e.key === null) sync();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') sync();
  });
  // Cookies have no cross-origin storage event. Poll visible tabs without network I/O.
  window.setInterval(() => {
    if (document.visibilityState === 'visible') sync();
  }, 2000);
  media.addEventListener('change', () => {
    if (mode === 'auto') apply();
  });
})();
