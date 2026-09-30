// Theme: follows the system (auto) unless the visitor picks light / dark manually.
// Loaded synchronously in <head> so the right theme is applied before first paint.
(() => {
  const KEY = 'mashong-theme';
  const MODES = ['auto', 'light', 'dark'];
  const THEME_COLORS = { light: '#f8f7f4', dark: '#161b27' };
  const LABELS = { auto: '자동 (시스템 설정)', light: '라이트 모드', dark: '다크 모드' };
  const ICONS = {
    auto: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/></svg>',
    light: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
    dark: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  };

  const root = document.documentElement;
  const media = window.matchMedia('(prefers-color-scheme: dark)');

  function readMode() {
    try {
      const saved = localStorage.getItem(KEY);
      return MODES.includes(saved) ? saved : 'auto';
    } catch (e) {
      return 'auto';
    }
  }

  function saveMode(mode) {
    try {
      if (mode === 'auto') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, mode);
    } catch (e) {
      /* storage unavailable: choice lasts for this page view only */
    }
  }

  let mode = readMode();

  function apply() {
    const theme = mode === 'auto' ? (media.matches ? 'dark' : 'light') : mode;
    root.dataset.theme = theme;
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
      meta.content = THEME_COLORS[theme];
    });
    const btn = document.querySelector('[data-action="theme"]');
    if (btn) {
      btn.innerHTML = ICONS[mode];
      btn.title = '테마: ' + LABELS[mode];
      btn.setAttribute('aria-label', '테마 변경 — 현재 ' + LABELS[mode]);
      btn.dataset.mode = mode;
    }
  }

  const onSystemChange = () => mode === 'auto' && apply();
  if (media.addEventListener) media.addEventListener('change', onSystemChange);
  else if (media.addListener) media.addListener(onSystemChange); // iOS Safari < 14
  apply();

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-toggle';
    btn.dataset.action = 'theme';
    btn.addEventListener('click', () => {
      mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
      saveMode(mode);
      apply();
    });
    // Sit in the card's top-right corner (next to the profile image); fall back to the page corner.
    const card = document.querySelector('.portal-card, .world-container');
    if (card) card.appendChild(btn);
    else {
      btn.classList.add('is-floating');
      document.body.appendChild(btn);
    }
    apply();
  });
})();
