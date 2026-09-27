// Shared behaviour for all MASHONG pages: toast, share / copy URL, live service status.
(() => {
  const CANONICAL_ORIGIN = 'https://mashong.com';

  // --------------------------------------------------------------------------
  // Toast
  // --------------------------------------------------------------------------
  const toast = document.getElementById('toast');
  let toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  // --------------------------------------------------------------------------
  // Share / copy URL
  // --------------------------------------------------------------------------
  function pageUrl() {
    const { hostname, pathname } = window.location;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    return isLocal ? CANONICAL_ORIGIN + pathname.replace(/\.html$/, '') : window.location.href;
  }

  function fallbackCopy(text) {
    const input = document.createElement('textarea');
    input.value = text;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (e) {
      ok = false;
    }
    document.body.removeChild(input);
    return ok;
  }

  async function copyUrl(url = pageUrl()) {
    let ok = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(url);
        ok = true;
      } catch (e) {
        ok = fallbackCopy(url);
      }
    } else {
      ok = fallbackCopy(url);
    }
    showToast(ok ? '🔗 페이지 주소가 복사되었습니다!' : '주소: ' + url);
  }

  async function share() {
    const url = pageUrl();
    const data = {
      title: document.title,
      text: document.querySelector('meta[name="description"]')?.content || document.title,
      url,
    };
    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch (e) {
        if (e.name === 'AbortError') return;
      }
    }
    copyUrl(url);
  }

  document.querySelectorAll('[data-action="share"]').forEach((btn) => btn.addEventListener('click', share));
  document.querySelectorAll('[data-action="copy-url"]').forEach((btn) => btn.addEventListener('click', () => copyUrl()));
  document.querySelectorAll('[data-toast]').forEach((el) =>
    el.addEventListener('click', (e) => {
      e.preventDefault();
      showToast(el.dataset.toast);
    })
  );

  // --------------------------------------------------------------------------
  // Live service status (served by worker.js at /api/status)
  // --------------------------------------------------------------------------
  const dots = document.querySelectorAll('[data-service]');
  const summary = document.querySelector('[data-status-summary]');
  if (!dots.length && !summary) return;

  function render(services) {
    dots.forEach((dot) => {
      const ids = dot.dataset.service.split(',');
      const known = ids.filter((id) => id in services);
      if (!known.length) return;
      const up = known.every((id) => services[id]);
      dot.dataset.state = up ? 'up' : 'down';
      dot.title = up ? '정상 운영 중' : '일시적으로 응답이 없습니다';
    });

    if (summary) {
      const values = Object.values(services);
      const upCount = values.filter(Boolean).length;
      const allUp = upCount === values.length;
      const label = summary.querySelector('[data-status-label]');
      summary.dataset.state = allUp ? 'ok' : 'degraded';
      if (label) {
        label.textContent = allUp ? 'All Systems Normal' : `${upCount}/${values.length} Services Online`;
      }
    }
  }

  fetch('/api/status', { headers: { accept: 'application/json' } })
    .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
    .then((body) => render(body.services || {}))
    .catch(() => {
      // Status endpoint unavailable (e.g. opened as a plain file): keep a neutral badge.
      if (summary) {
        summary.dataset.state = 'ok';
        const label = summary.querySelector('[data-status-label]');
        if (label) label.textContent = 'System Normal';
      }
    });
})();
