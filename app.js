document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // 1. Theme Toggle Logic
  // --------------------------------------------------------------------------
  const themeToggle = document.getElementById('themeToggle');
  const html = document.documentElement;

  const savedTheme = localStorage.getItem('site-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
  html.setAttribute('data-theme', initialTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = html.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', newTheme);
      localStorage.setItem('site-theme', newTheme);
      showToast(newTheme === 'dark' ? '🌙 다크 모드로 전환되었습니다' : '☀️ 라이트 모드로 전환되었습니다');
    });
  }

  // --------------------------------------------------------------------------
  // 2. Toast Notification Function
  // --------------------------------------------------------------------------
  const toast = document.getElementById('toast');
  const toastMsg = toast ? toast.querySelector('.toast-msg') : null;
  let toastTimeout = null;

  function showToast(message) {
    if (!toast || !toastMsg) return;
    if (toastTimeout) clearTimeout(toastTimeout);
    toastMsg.textContent = message;
    toast.classList.add('show');
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // --------------------------------------------------------------------------
  // 3. Quick Actions: Share Page URL
  // --------------------------------------------------------------------------
  const shareCopyUrlBtn = document.getElementById('shareCopyUrlBtn');
  if (shareCopyUrlBtn) {
    shareCopyUrlBtn.addEventListener('click', () => {
      const targetUrl = window.location.href.includes('localhost') ? 'https://mashong.com' : window.location.href;
      navigator.clipboard.writeText(targetUrl).then(() => {
        showToast('🔗 페이지 주소가 복사되었습니다!');
      }).catch(() => {
        showToast('주소: ' + targetUrl);
      });
    });
  }

  // Optional Email Copy if present
  const copyEmailBtn = document.getElementById('copyEmailBtn');
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', () => {
      navigator.clipboard.writeText('contact@mashong.com').then(() => {
        showToast('✨ 이메일 주소가 복사되었습니다!');
      });
    });
  }

  // --------------------------------------------------------------------------
  // 4. 3D Subtle Tilt Effect on Profile Card
  // --------------------------------------------------------------------------
  const card = document.getElementById('profileCard');
  if (card && window.matchMedia('(hover: hover)').matches) {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const rotateX = (-y / rect.height) * 3;
      const rotateY = (x / rect.width) * 3;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    });
  }
});
