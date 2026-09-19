document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // 1. Theme Toggle Logic
  // --------------------------------------------------------------------------
  const themeToggle = document.getElementById('themeToggle');
  const html = document.documentElement;

  // Retrieve saved theme or check system preference
  const savedTheme = localStorage.getItem('site-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
  html.setAttribute('data-theme', initialTheme);

  themeToggle.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('site-theme', newTheme);
    showToast(newTheme === 'dark' ? '🌙 다크 모드로 전환되었습니다' : '☀️ 라이트 모드로 전환되었습니다');
  });

  // --------------------------------------------------------------------------
  // 2. Toast Notification Function
  // --------------------------------------------------------------------------
  const toast = document.getElementById('toast');
  const toastMsg = toast.querySelector('.toast-msg');
  let toastTimeout = null;

  function showToast(message) {
    if (toastTimeout) clearTimeout(toastTimeout);
    toastMsg.textContent = message;
    toast.classList.add('show');
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // --------------------------------------------------------------------------
  // 3. Quick Actions: Copy Email & vCard Contact
  // --------------------------------------------------------------------------
  const copyEmailBtn = document.getElementById('copyEmailBtn');
  const myEmail = 'mso.developer.hub@gmail.com'; // User can customize

  copyEmailBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(myEmail).then(() => {
      showToast('✨ 이메일 주소가 복사되었습니다! (' + myEmail + ')');
    }).catch(() => {
      showToast('이메일: ' + myEmail);
    });
  });

  // Generate and download .vcf Contact Card
  const vcardBtn = document.getElementById('vcardBtn');
  vcardBtn.addEventListener('click', () => {
    const vCardData = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'FN:MSO Dev',
      'TITLE:Cloud & AI Developer',
      'EMAIL;TYPE=INTERNET,WORK:' + myEmail,
      'URL:' + window.location.href,
      'NOTE:Official Hub & Developer Portfolio',
      'END:VCARD'
    ].join('\r\n');

    const blob = new Blob([vCardData], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.setAttribute('download', 'MSO_Dev_Contact.vcf');
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);

    showToast('📇 연락처(vCard) 파일이 다운로드되었습니다!');
  });

  // --------------------------------------------------------------------------
  // 4. QR Code Modal & Dynamic Generation
  // --------------------------------------------------------------------------
  const qrBtn = document.getElementById('qrBtn');
  const qrModal = document.getElementById('qrModal');
  const qrCloseBtn = document.getElementById('qrCloseBtn');
  const qrCodeWrapper = document.getElementById('qrCodeWrapper');
  const currentUrlText = document.getElementById('currentUrlText');
  const shareCopyUrlBtn = document.getElementById('shareCopyUrlBtn');

  const currentUrl = window.location.href;
  currentUrlText.textContent = currentUrl;

  // Render high-precision SVG QR Code via public API or fallback generator
  function renderQrCode(url) {
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}&color=090b10&bgcolor=ffffff&margin=1`;
    qrCodeWrapper.innerHTML = `<img src="${qrApiUrl}" alt="QR Code" style="width:100%;height:100%;border-radius:8px;">`;
  }

  qrBtn.addEventListener('click', () => {
    renderQrCode(window.location.href);
    qrModal.classList.add('active');
  });

  qrCloseBtn.addEventListener('click', () => {
    qrModal.classList.remove('active');
  });

  qrModal.addEventListener('click', (e) => {
    if (e.target === qrModal) {
      qrModal.classList.remove('active');
    }
  });

  shareCopyUrlBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      showToast('🔗 현재 페이지 링크가 복사되었습니다!');
      qrModal.classList.remove('active');
    });
  });

  // --------------------------------------------------------------------------
  // 5. 3D Subtle Tilt Effect on Profile Card
  // --------------------------------------------------------------------------
  const card = document.getElementById('profileCard');
  if (window.matchMedia('(hover: hover)').matches) {
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
