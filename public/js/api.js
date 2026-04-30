(function () {
  const root = document.documentElement;

  const THEME_KEY = 'zarah-theme';
  const ACCENT_KEY = 'zarah-accent';
  const OLD_ACCENT_KEY = 'zarah-primary';

  const allowedThemes = ['light', 'dark'];
  const allowedAccents = ['teal', 'violet', 'blue', 'gold', 'rose'];

  function getStorage(key, fallback) {
    try {
      return localStorage.getItem(key) || fallback;
    } catch (e) {
      return fallback;
    }
  }

  function setStorage(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {}
  }

  function normalizeTheme(theme) {
    return allowedThemes.includes(theme) ? theme : 'dark';
  }

  function normalizeAccent(accent) {
    return allowedAccents.includes(accent) ? accent : 'teal';
  }

  function getTheme() {
    return normalizeTheme(
      getStorage(THEME_KEY, root.getAttribute('data-theme') || 'dark')
    );
  }

  function getAccent() {
    return normalizeAccent(
      getStorage(ACCENT_KEY, '') ||
      getStorage(OLD_ACCENT_KEY, '') ||
      root.getAttribute('data-accent') ||
      root.getAttribute('data-primary') ||
      'teal'
    );
  }

  function applyTheme(theme) {
    const finalTheme = normalizeTheme(theme);

    root.setAttribute('data-theme', finalTheme);
    setStorage(THEME_KEY, finalTheme);

    document.querySelectorAll('[data-theme-set]').forEach(function (button) {
      button.classList.toggle(
        'active',
        button.getAttribute('data-theme-set') === finalTheme
      );
    });
  }

  function applyAccent(accent) {
    const finalAccent = normalizeAccent(accent);

    root.setAttribute('data-accent', finalAccent);
    root.setAttribute('data-primary', finalAccent);

    setStorage(ACCENT_KEY, finalAccent);
    setStorage(OLD_ACCENT_KEY, finalAccent);

    document.querySelectorAll('[data-accent]').forEach(function (button) {
      button.classList.toggle(
        'active',
        button.getAttribute('data-accent') === finalAccent
      );
    });
  }

  function closePalette() {
    document.querySelectorAll('[data-palette-panel]').forEach(function (panel) {
      panel.classList.remove('open');
    });
  }

  function togglePalette(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const panel = document.querySelector('[data-palette-panel]');
    if (!panel) return;

    panel.classList.toggle('open');
  }

  function bindControls() {
    document.querySelectorAll('[data-theme-set]').forEach(function (button) {
      if (button.dataset.bound === '1') return;
      button.dataset.bound = '1';

      button.addEventListener('click', function () {
        applyTheme(button.getAttribute('data-theme-set'));
      });
    });

    document.querySelectorAll('[data-palette-toggle]').forEach(function (button) {
      if (button.dataset.bound === '1') return;
      button.dataset.bound = '1';

      button.addEventListener('click', togglePalette);
    });

    document.querySelectorAll('[data-palette-panel]').forEach(function (panel) {
      if (panel.dataset.bound === '1') return;
      panel.dataset.bound = '1';

      panel.addEventListener('click', function (event) {
        event.stopPropagation();
      });
    });

    document.querySelectorAll('[data-accent]').forEach(function (button) {
      if (button.dataset.bound === '1') return;
      button.dataset.bound = '1';

      button.addEventListener('click', function () {
        applyAccent(button.getAttribute('data-accent'));
        closePalette();
      });
    });

    document.addEventListener('click', closePalette);
  }

  function init() {
    applyTheme(getTheme());
    applyAccent(getAccent());
    bindControls();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();