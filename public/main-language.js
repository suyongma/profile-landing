// Home-only language preference. The HTML itself provides the English default.
(() => {
  const root = document.documentElement;
  const toggle = document.querySelector('.main-language-toggle');
  const toggleLabel = toggle.querySelector('span');
  const preference = 'mashong-main-language';
  const translations = [];
  for (const attribute of ['', 'aria-label', 'alt', 'title', 'content']) {
    const source = attribute ? 'data-ko-' + attribute : 'data-ko';
    for (const element of document.querySelectorAll('[' + source + ']')) {
      const english = attribute ? element.getAttribute(attribute) : element.textContent;
      const korean = element.getAttribute(source);
      translations.push({ element, attribute, english, korean });
    }
  }

  let language = 'en';
  try {
    if (localStorage.getItem(preference) === 'ko') language = 'ko';
  } catch {
    // The switch still works for this visit if storage is blocked.
  }

  function render() {
    root.lang = language;
    for (const { element, attribute, english, korean } of translations) {
      const value = language === 'ko' ? korean : english;
      if (attribute) element.setAttribute(attribute, value);
      else element.textContent = value;
    }
    toggleLabel.lang = language === 'ko' ? 'en' : 'ko';
    toggleLabel.textContent = language === 'ko' ? 'English' : '한국어';
    toggle.setAttribute('aria-label', language === 'ko' ? '영어로 전환' : 'Switch to Korean');
    window.dispatchEvent(new Event('mashong-main-language-change'));
  }

  toggle.addEventListener('click', () => {
    language = language === 'ko' ? 'en' : 'ko';
    try {
      localStorage.setItem(preference, language);
    } catch {
      // Preserve the current language for the open tab.
    }
    render();
  });
  render();
  toggle.hidden = false;

  // Localize the shared account component on the home page using its open
  // shadow root. Its rendering and navigation continue to own account state.
  const accountLabels = [
    ['.brand', '마숑 계정', 'MASHONG Account'],
    ['.close', '계정 메뉴 닫기', 'Close account menu', 'aria-label'],
    ['[data-action="account"] strong', '계정 관리', 'Manage account'],
    ['[data-action="account"] small', '비밀번호와 계정 정보', 'Password and account details'],
    ['[data-action="verify"] strong', '이메일 인증', 'Verify email'],
    ['[data-action="verify"] small', '이메일을 등록하거나 인증해 주세요', 'Add or verify your email address'],
    ['[data-action="logout"] strong', '로그아웃', 'Sign out'],
    ['.footnote', '모든 마숑 서비스에서 함께 로그아웃됩니다.', 'You will be signed out of all MASHONG services.'],
  ];
  const guestLabels = [
    ['계정 확인 중', 'Checking account'],
    ['다시 확인', 'Try again'],
    ['로그인', 'Sign in'],
  ];
  const statusLabels = [
    ['실제 계정 연결은 https://mashong.com에서 확인해 주세요.', 'Visit https://mashong.com to use your account.'],
    ['로그인 상태를 확인하지 못했습니다. 다시 확인해 주세요.', 'Could not check your sign-in status. Please try again.'],
  ];
  const localized = (korean, english) => language === 'ko' ? korean : english;

  function setText(element, value) {
    if (element && element.textContent !== value) element.textContent = value;
  }

  function translateKnown(element, labels) {
    const match = labels.find(pair => pair.includes(element?.textContent));
    if (match) setText(element, localized(...match));
  }

  customElements.whenDefined('mashong-account').then(() => {
    const account = document.getElementById('mashong-account');
    const shadow = account?.shadowRoot;
    const status = document.getElementById('mashong-auth-status');
    if (!shadow || !status) return;
    const observer = new MutationObserver(localizeAccount);
    const mutations = { childList: true, subtree: true, characterData: true };

    function localizeAccount() {
      observer.disconnect();
      for (const [selector, korean, english, attribute] of accountLabels) {
        const element = shadow.querySelector(selector);
        const value = localized(korean, english);
        if (attribute) element?.setAttribute(attribute, value);
        else setText(element, value);
      }
      const trigger = shadow.querySelector('.trigger');
      const user = account.user;
      if (trigger?.classList.contains('guest')) {
        const label = trigger.querySelector('span') || trigger;
        translateKnown(label, guestLabels);
        trigger.setAttribute('aria-label', label.textContent);
      } else if (trigger && user) {
        const name = user.name || localized('마숑 회원', 'MASHONG member');
        const displayName = localized(name + ' 님', name);
        setText(trigger.querySelector('.trigger-name'), displayName);
        trigger.setAttribute('aria-label', localized(displayName + ', 마숑 계정 메뉴', displayName + ', MASHONG account menu'));
        setText(shadow.querySelector('.name'), displayName);
        setText(shadow.querySelector('.email'), user.email || localized('이메일을 등록해 주세요', 'Add an email address'));
        const badge = shadow.querySelector('.badge');
        const badgeText = user.emailVerified
          ? localized('이메일 인증 완료', 'Email verified')
          : user.email
            ? localized('이메일 미인증', 'Email not verified')
            : localized('이메일 미등록', 'No email address');
        if (badge?.lastChild?.nodeType === Node.TEXT_NODE) badge.lastChild.data = badgeText;
      }
      translateKnown(status, statusLabels);
      observer.observe(shadow, mutations);
      observer.observe(status, mutations);
    }

    window.addEventListener('mashong-main-language-change', localizeAccount);
    localizeAccount();
  });
})();
