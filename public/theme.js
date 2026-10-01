// Theme toggle UI (auto → light → dark). State, storage and applying the theme to <html>
// belong to the shared /shared/mashong-theme.js (window.MashongTheme), loaded first in <head>.
(() => {
  const MODES = ['auto', 'light', 'dark'];
  const LABELS = { auto: '자동 (시스템 설정)', light: '라이트 모드', dark: '다크 모드' };
  const ICONS = {
    auto: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/></svg>',
    light: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
    dark: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  };

  function init() {
    const theme = window.MashongTheme;
    if (!theme || document.querySelector('[data-action="theme"]')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-toggle';
    btn.dataset.action = 'theme';

    function render(mode) {
      btn.innerHTML = ICONS[mode] || ICONS.auto;
      btn.title = '테마: ' + LABELS[mode];
      btn.setAttribute('aria-label', '테마 변경 — 현재 ' + LABELS[mode]);
      btn.dataset.mode = mode;
    }

    btn.addEventListener('click', () => {
      const next = MODES[(MODES.indexOf(theme.getMode()) + 1) % MODES.length];
      theme.set(next);
    });
    window.addEventListener('mashong-theme-change', (e) => render(e.detail.mode));

    // Header slot next to the account button; otherwise the card corner, then the page corner.
    const slot = document.querySelector('[data-theme-slot]');
    const card = document.querySelector('.portal-card, .world-container');
    if (slot) slot.insertBefore(btn, slot.querySelector('mashong-account'));
    else if (card) {
      btn.classList.add('is-corner');
      card.appendChild(btn);
    } else {
      btn.classList.add('is-floating');
      document.body.appendChild(btn);
    }
    render(theme.getMode());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
