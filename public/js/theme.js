/**
 * Zarah Smart UI & Theme Manager
 * ============================================================
 * Responsibilities:
 *  - Theme persistence (dark/light) and accent color switching
 *  - Smart search for tables, cards, and dropdowns
 *  - Mobile sidebar toggle
 *
 * Structure (conceptual modules kept in one file for simplicity):
 *   Section 1: Storage helpers
 *   Section 2: Theme & accent state
 *   Section 3: UI – Theme buttons & palette
 *   Section 4: UI – Smart search & combos
 *   Section 5: UI – Mobile sidebar
 *   Section 6: Initialization
 * ============================================================
 */

(function () {
  'use strict';

  // ──────────────────────────────────────────────
  // 1. Constants & safe storage
  // ──────────────────────────────────────────────
  const ROOT = document.documentElement;
  const THEME_KEY = 'zarah-theme';
  const ACCENT_KEY = 'zarah-accent';
  const OLD_PRIMARY_KEY = 'zarah-primary';
  const VALID_THEMES = ['light', 'dark'];
  const VALID_ACCENTS = ['teal', 'violet', 'blue', 'gold', 'rose'];

  function safeGet(key, fallback) {
    try {
      return localStorage.getItem(key) || fallback;
    } catch (_) {
      return fallback;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (_) {
      // ignore
    }
  }

  // ──────────────────────────────────────────────
  // 2. Theme / accent resolvers
  // ──────────────────────────────────────────────
  function normalizeTheme(value) {
    return VALID_THEMES.includes(value) ? value : 'light';
  }

  function normalizeAccent(value) {
    return VALID_ACCENTS.includes(value) ? value : 'teal';
  }

  function getTheme() {
    return normalizeTheme(
      safeGet(THEME_KEY, ROOT.getAttribute('data-theme') || 'light')
    );
  }

  function getAccent() {
    const saved = safeGet(ACCENT_KEY, '')
      || safeGet(OLD_PRIMARY_KEY, '')
      || ROOT.getAttribute('data-accent')
      || ROOT.getAttribute('data-primary')
      || 'teal';
    return normalizeAccent(saved);
  }

  // ──────────────────────────────────────────────
  // 3. DOM updates for theme & accent controls
  // ──────────────────────────────────────────────

  /** Updates every button that toggles between light/dark */
  function updateThemeButtons(theme) {
    const isDark = theme === 'dark';
    const label = isDark ? 'الوضع النهاري' : 'الوضع الليلي';
    const icon = isDark ? '☀️' : '🌙';

    document.querySelectorAll('[data-theme-label]').forEach(function (el) {
      el.textContent = label;
    });
    document.querySelectorAll('[data-theme-icon]').forEach(function (el) {
      el.textContent = icon;
    });

    const legacy = document.getElementById('themeToggle');
    if (legacy) {
      legacy.setAttribute('aria-label', isDark ? 'تفعيل الوضع النهاري' : 'تفعيل الوضع الليلي');
      legacy.innerHTML = isDark
        ? '<span>🌙</span><span class="theme-label">ليلي</span>'
        : '<span>☀️</span><span class="theme-label">نهاري</span>';
    }
  }

  /** Highlights the active accent button */
  function updateAccentButtons(accent) {
    const selector = '[data-accent], [data-color]';
    document.querySelectorAll(selector).forEach(function (btn) {
      const value = btn.getAttribute('data-accent') || btn.getAttribute('data-color');
      btn.classList.toggle('active', value === accent);
    });
  }

  // ──────────────────────────────────────────────
  // 4. Apply & persist theme / accent
  // ──────────────────────────────────────────────

  /** Persists theme to localStorage and DOM */
  function applyTheme(theme) {
    const final = normalizeTheme(theme);
    ROOT.setAttribute('data-theme', final);
    safeSet(THEME_KEY, final);
    updateThemeButtons(final);
  }

  /** Persists accent to localStorage and DOM */
  function applyAccent(accent) {
    const final = normalizeAccent(accent);
    ROOT.setAttribute('data-accent', final);
    ROOT.setAttribute('data-primary', final);
    safeSet(ACCENT_KEY, final);
    safeSet(OLD_PRIMARY_KEY, final);
    updateAccentButtons(final);
  }

  // ──────────────────────────────────────────────
  // 5. Palette popover
  // ──────────────────────────────────────────────

  function findPalettePanels() {
    return [
      document.querySelector('[data-palette-panel]'),
      document.getElementById('colorDropdown')
    ].filter(Boolean);
  }

  function closePalette() {
    findPalettePanels().forEach(function (panel) {
      panel.classList.remove('open', 'show');
    });
    document.querySelectorAll('[data-palette-arrow]').forEach(function (el) {
      el.textContent = '▾';
    });
  }

  function togglePalette() {
    const panels = findPalettePanels();
    if (!panels.length) return;
    const isOpen = panels[0].classList.contains('open') || panels[0].classList.contains('show');
    panels.forEach(function (p) {
      p.classList.toggle('open', !isOpen);
      p.classList.toggle('show', !isOpen);
    });
    document.querySelectorAll('[data-palette-arrow]').forEach(function (el) {
      el.textContent = isOpen ? '▾' : '▴';
    });
  }

  // ──────────────────────────────────────────────
  // 6. Wiring: theme toggle & palette buttons
  // ──────────────────────────────────────────────

  function bindThemeToggle(button) {
    if (!button || button.dataset.boundTheme) return;
    button.dataset.boundTheme = '1';
    button.addEventListener('click', function () {
      const current = normalizeTheme(ROOT.getAttribute('data-theme') || getTheme());
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  function bindPaletteToggle(button) {
    if (!button || button.dataset.boundPalette) return;
    button.dataset.boundPalette = '1';
    button.addEventListener('click', function (e) {
      e.stopPropagation();
      togglePalette();
    });
  }

  function bindAccentButton(button) {
    const accent = button.getAttribute('data-accent') || button.getAttribute('data-color');
    if (!accent) return;
    if (button.dataset.boundAccent) return;
    button.dataset.boundAccent = '1';
    button.setAttribute('role', 'button');
    button.setAttribute('tabindex', '0');
    function choose() {
      applyAccent(accent);
      closePalette();
    }
    button.addEventListener('click', choose);
    button.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        choose();
      }
    });
  }

  function setupThemeControls() {
    // Theme toggles
    document.querySelectorAll('[data-theme-toggle]').forEach(bindThemeToggle);
    const legacy = document.getElementById('themeToggle');
    if (legacy) bindThemeToggle(legacy);

    // Palette toggles
    document.querySelectorAll('[data-palette-toggle]').forEach(bindPaletteToggle);
    const legacyPalette = document.getElementById('colorPaletteBtn');
    if (legacyPalette) bindPaletteToggle(legacyPalette);

    // Palette panels – stop click propagation
    findPalettePanels().forEach(function (panel) {
      if (panel.dataset.boundPalettePanel) return;
      panel.dataset.boundPalettePanel = '1';
      panel.addEventListener('click', function (e) { e.stopPropagation(); });
    });

    // Accent buttons
    document.querySelectorAll('[data-accent], [data-color]').forEach(bindAccentButton);

    // Global close
    if (!document.documentElement.dataset.closePaletteBound) {
      document.documentElement.dataset.closePaletteBound = '1';
      document.addEventListener('click', closePalette);
    }
  }

  // ──────────────────────────────────────────────
  // 7. Utility helpers
  // ──────────────────────────────────────────────

  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .replace(/ـ/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function unique(values) {
    return [...new Set(
      values.map(function (v) { return String(v || '').trim(); }).filter(Boolean)
    )];
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function makeDataList(id, values) {
    let list = document.getElementById(id);
    if (!list) {
      list = document.createElement('datalist');
      list.id = id;
      document.body.appendChild(list);
    }
    list.innerHTML = unique(values)
      .slice(0, 350)
      .map(function (v) { return '<option value="' + escapeHtml(v) + '"></option>'; })
      .join('');
    return list;
  }

  // ──────────────────────────────────────────────
  // 8. Smart search – tables & cards
  // ──────────────────────────────────────────────

  function setupTableSearch() {
    document.querySelectorAll('.table-wrap, .table-wrapper').forEach(function (wrap, idx) {
      if (wrap.dataset.searchReady) return;
      const table = wrap.querySelector('table');
      if (!table) return;
      const rows = Array.from(table.querySelectorAll('tbody tr'));
      if (!rows.length) return;

      const allValues = [];
      rows.forEach(function (r) {
        Array.from(r.cells || []).forEach(function (c) {
          const t = c.innerText.replace(/\s+/g, ' ').trim();
          if (t && t.length <= 120) allValues.push(t);
        });
      });

      const box = document.createElement('div');
      box.className = 'search-tools';
      const input = document.createElement('input');
      input.className = 'smart-search';
      input.type = 'search';
      input.placeholder = '🔎 ابحث داخل الجدول...';
      input.setAttribute('autocomplete', 'off');
      const listId = 'table-suggestions-' + idx;
      input.setAttribute('list', listId);
      makeDataList(listId, allValues);
      const count = document.createElement('span');
      count.className = 'search-count pill';
      count.textContent = rows.length + ' نتيجة';
      box.appendChild(input);
      box.appendChild(count);
      if (wrap.parentNode) wrap.parentNode.insertBefore(box, wrap);
      wrap.dataset.searchReady = '1';

      input.addEventListener('input', function () {
        const q = normalizeText(input.value);
        let visible = 0;
        rows.forEach(function (r) {
          const show = !q || normalizeText(r.innerText).includes(q);
          r.style.display = show ? '' : 'none';
          if (show) visible++;
        });
        count.textContent = visible + ' نتيجة';
      });
    });
  }

  function setupCardSearch() {
    document.querySelectorAll('.grid').forEach(function (grid, idx) {
      if (grid.dataset.searchReady) return;
      const cards = Array.from(grid.querySelectorAll(':scope > .mini-card'));
      if (cards.length < 4) return;
      const values = cards.map(function (c) { return c.innerText.replace(/\s+/g, ' ').trim(); });
      const box = document.createElement('div');
      box.className = 'search-tools card-search-tools';
      const input = document.createElement('input');
      input.className = 'smart-search';
      input.type = 'search';
      input.placeholder = '🔎 ابحث داخل البطاقات...';
      input.setAttribute('autocomplete', 'off');
      const listId = 'card-suggestions-' + idx;
      input.setAttribute('list', listId);
      makeDataList(listId, values);
      const count = document.createElement('span');
      count.className = 'search-count pill';
      count.textContent = cards.length + ' نتيجة';
      box.appendChild(input);
      box.appendChild(count);
      if (grid.parentNode) grid.parentNode.insertBefore(box, grid);
      grid.dataset.searchReady = '1';

      input.addEventListener('input', function () {
        const q = normalizeText(input.value);
        let visible = 0;
        cards.forEach(function (c) {
          const show = !q || normalizeText(c.innerText).includes(q);
          c.style.display = show ? '' : 'none';
          if (show) visible++;
        });
        count.textContent = visible + ' نتيجة';
      });
    });
  }

  // ──────────────────────────────────────────────
  // 9. Combo-box enhancement for selects
  // ──────────────────────────────────────────────

  function enhanceSelects() {
    const selector = 'select[name="factory_id"], select[name="material_id"], select[name="driver_id"]';
    document.querySelectorAll(selector).forEach(function (select, idx) {
      if (select.dataset.comboReady) return;
      const options = Array.from(select.options || []).filter(function (o) { return o.value !== ''; });
      if (!options.length) return;
      const input = document.createElement('input');
      input.className = 'combo-input';
      input.type = 'search';
      input.placeholder = 'اكتب للبحث والاختيار تلقائيًا...';
      input.setAttribute('autocomplete', 'off');
      const listId = 'combo-list-' + idx + '-' + Math.random().toString(36).slice(2);
      input.setAttribute('list', listId);
      makeDataList(listId, options.map(function (o) { return o.textContent.trim(); }));
      const selected = options.find(function (o) { return o.selected; }) || options[0];
      if (selected) input.value = selected.textContent.trim();
      if (select.parentNode) select.parentNode.insertBefore(input, select);
      select.classList.add('native-select-hidden');
      select.dataset.comboReady = '1';

      function applyValue(soft) {
        const q = normalizeText(input.value);
        if (!q) return;
        let match = options.find(function (o) { return normalizeText(o.textContent) === q; });
        if (!match) match = options.find(function (o) { return normalizeText(o.textContent).includes(q); });
        if (!match && !soft) match = options[0];
        if (match) {
          select.value = match.value;
          input.value = match.textContent.trim();
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      input.addEventListener('change', function () { applyValue(true); });
      input.addEventListener('blur', function () { applyValue(true); });
      input.addEventListener('input', function () {
        const q = normalizeText(input.value);
        const exact = options.find(function (o) { return normalizeText(o.textContent) === q; });
        if (exact) select.value = exact.value;
      });
    });
  }

  // ──────────────────────────────────────────────
  // 10. Sidebar helpers
  // ──────────────────────────────────────────────

  function setupSidebarSearch() {
    const nav = document.querySelector('.side-nav');
    if (!nav || document.querySelector('.sidebar-search')) return;
    const input = document.createElement('input');
    input.className = 'sidebar-search';
    input.type = 'search';
    input.placeholder = 'ابحث في الصفحات...';
    if (nav.parentNode) nav.parentNode.insertBefore(input, nav);
    const links = Array.from(nav.querySelectorAll('.nav-link'));
    input.addEventListener('input', function () {
      const q = normalizeText(input.value);
      links.forEach(function (l) { l.style.display = !q || normalizeText(l.innerText).includes(q) ? '' : 'none'; });
    });
  }

  function setupMobileSidebar() {
    const menu = document.getElementById('menuBtn') || document.querySelector('[data-menu-toggle]');
    const sidebar = document.getElementById('sidebar') || document.querySelector('.sidebar');
    if (!menu || !sidebar || menu.dataset.boundMenu) return;
    menu.dataset.boundMenu = '1';
    menu.addEventListener('click', function (e) { e.stopPropagation(); sidebar.classList.toggle('open'); });
    document.addEventListener('click', function (e) {
      if (window.innerWidth <= 820 && sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== menu) {
        sidebar.classList.remove('open');
      }
    });
  }

  // ──────────────────────────────────────────────
  // 11. Bootstrap
  // ──────────────────────────────────────────────

  function initSmartUi() {
    setupThemeControls();
    setupSidebarSearch();
    setupTableSearch();
    setupCardSearch();
    enhanceSelects();
    setupMobileSidebar();
    applyTheme(getTheme());
    applyAccent(getAccent());
  }

  // Apply immediately to avoid flicker
  applyTheme(getTheme());
  applyAccent(getAccent());

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSmartUi);
  } else {
    initSmartUi();
  }
})();