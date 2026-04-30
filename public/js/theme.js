(function () {
  const root = document.documentElement;

  const THEME_KEY = 'zarah-theme';
  const ACCENT_KEY = 'zarah-accent';
  const OLD_PRIMARY_KEY = 'zarah-primary';

  const VALID_THEMES = ['light', 'dark'];
  const VALID_ACCENTS = ['teal', 'violet', 'blue', 'gold', 'rose'];

  function safeGet(key, fallback) {
    try {
      return localStorage.getItem(key) || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      // ignore
    }
  }

  function normalizeTheme(value) {
    return VALID_THEMES.includes(value) ? value : 'light';
  }

  function normalizeAccent(value) {
    return VALID_ACCENTS.includes(value) ? value : 'teal';
  }

  function getTheme() {
    return normalizeTheme(
      safeGet(THEME_KEY, root.getAttribute('data-theme') || 'light')
    );
  }

  function getAccent() {
    const savedAccent =
      safeGet(ACCENT_KEY, '') ||
      safeGet(OLD_PRIMARY_KEY, '') ||
      root.getAttribute('data-accent') ||
      root.getAttribute('data-primary') ||
      'teal';

    return normalizeAccent(savedAccent);
  }

  function updateThemeButtons(theme) {
    const label = theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي';
    const icon = theme === 'dark' ? '☀️' : '🌙';

    document.querySelectorAll('[data-theme-label]').forEach(function (el) {
      el.textContent = label;
    });

    document.querySelectorAll('[data-theme-icon]').forEach(function (el) {
      el.textContent = icon;
    });

    const oldToggle = document.getElementById('themeToggle');

    if (oldToggle) {
      oldToggle.setAttribute(
        'aria-label',
        theme === 'dark' ? 'تفعيل الوضع النهاري' : 'تفعيل الوضع الليلي'
      );

      oldToggle.innerHTML = theme === 'dark'
        ? '<span>🌙</span><span class="theme-label">ليلي</span>'
        : '<span>☀️</span><span class="theme-label">نهاري</span>';
    }
  }

  function updateAccentButtons(accent) {
    document.querySelectorAll('[data-accent]').forEach(function (button) {
      button.classList.toggle(
        'active',
        button.getAttribute('data-accent') === accent
      );
    });

    document.querySelectorAll('[data-color]').forEach(function (button) {
      button.classList.toggle(
        'active',
        button.getAttribute('data-color') === accent
      );
    });
  }

  function applyTheme(theme) {
    const finalTheme = normalizeTheme(theme);

    root.setAttribute('data-theme', finalTheme);
    safeSet(THEME_KEY, finalTheme);
    updateThemeButtons(finalTheme);
  }

  function applyAccent(accent) {
    const finalAccent = normalizeAccent(accent);

    root.setAttribute('data-accent', finalAccent);
    root.setAttribute('data-primary', finalAccent);

    safeSet(ACCENT_KEY, finalAccent);
    safeSet(OLD_PRIMARY_KEY, finalAccent);

    updateAccentButtons(finalAccent);
  }

  function closePalette() {
    const panels = [
      document.querySelector('[data-palette-panel]'),
      document.getElementById('colorDropdown')
    ].filter(Boolean);

    panels.forEach(function (panel) {
      panel.classList.remove('open');
      panel.classList.remove('show');
    });

    document.querySelectorAll('[data-palette-arrow]').forEach(function (arrow) {
      arrow.textContent = '▾';
    });
  }

  function togglePalette() {
    const panel =
      document.querySelector('[data-palette-panel]') ||
      document.getElementById('colorDropdown');

    if (!panel) return;

    const isOpen = panel.classList.contains('open') || panel.classList.contains('show');

    if (isOpen) {
      panel.classList.remove('open');
      panel.classList.remove('show');
    } else {
      panel.classList.add('open');
      panel.classList.add('show');
    }

    document.querySelectorAll('[data-palette-arrow]').forEach(function (arrow) {
      arrow.textContent = isOpen ? '▾' : '▴';
    });
  }

  function setupThemeControls() {
    const themeButtons = Array.from(document.querySelectorAll('[data-theme-toggle]'));

    const oldThemeButton = document.getElementById('themeToggle');

    if (oldThemeButton) {
      themeButtons.push(oldThemeButton);
    }

    themeButtons.forEach(function (button) {
      if (!button || button.dataset.boundTheme) return;

      button.dataset.boundTheme = '1';

      button.addEventListener('click', function () {
        const current = normalizeTheme(root.getAttribute('data-theme') || getTheme());
        const next = current === 'dark' ? 'light' : 'dark';

        applyTheme(next);
      });
    });

    const paletteButtons = Array.from(document.querySelectorAll('[data-palette-toggle]'));

    const oldPaletteButton = document.getElementById('colorPaletteBtn');

    if (oldPaletteButton) {
      paletteButtons.push(oldPaletteButton);
    }

    paletteButtons.forEach(function (button) {
      if (!button || button.dataset.boundPalette) return;

      button.dataset.boundPalette = '1';

      button.addEventListener('click', function (event) {
        event.stopPropagation();
        togglePalette();
      });
    });

    const palettePanel =
      document.querySelector('[data-palette-panel]') ||
      document.getElementById('colorDropdown');

    if (palettePanel && !palettePanel.dataset.boundPalettePanel) {
      palettePanel.dataset.boundPalettePanel = '1';

      palettePanel.addEventListener('click', function (event) {
        event.stopPropagation();
      });
    }

    document.querySelectorAll('[data-accent]').forEach(function (button) {
      if (button.dataset.boundAccent) return;

      button.dataset.boundAccent = '1';

      button.addEventListener('click', function () {
        applyAccent(button.getAttribute('data-accent') || 'teal');
        closePalette();
      });
    });

    document.querySelectorAll('[data-color]').forEach(function (button) {
      if (button.dataset.boundColor) return;

      button.dataset.boundColor = '1';
      button.setAttribute('role', 'button');
      button.setAttribute('tabindex', '0');

      function chooseColor() {
        applyAccent(button.getAttribute('data-color') || 'teal');
        closePalette();
      }

      button.addEventListener('click', chooseColor);

      button.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          chooseColor();
        }
      });
    });

    if (!document.documentElement.dataset.closePaletteBound) {
      document.documentElement.dataset.closePaletteBound = '1';

      document.addEventListener('click', function () {
        closePalette();
      });
    }
  }

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
    return [
      ...new Set(
        values
          .map(function (value) {
            return String(value || '').trim();
          })
          .filter(Boolean)
      )
    ];
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function makeDataList(id, values) {
    let dataList = document.getElementById(id);

    if (!dataList) {
      dataList = document.createElement('datalist');
      dataList.id = id;
      document.body.appendChild(dataList);
    }

    dataList.innerHTML = unique(values)
      .slice(0, 350)
      .map(function (value) {
        return '<option value="' + escapeHtml(value) + '"></option>';
      })
      .join('');

    return dataList;
  }

  function setupTableSearch() {
    document.querySelectorAll('.table-wrap, .table-wrapper').forEach(function (wrap, index) {
      if (wrap.dataset.searchReady) return;

      const table = wrap.querySelector('table');

      if (!table) return;

      const rows = Array.from(table.querySelectorAll('tbody tr'));

      if (!rows.length) return;

      const allValues = [];

      rows.forEach(function (row) {
        Array.from(row.cells || []).forEach(function (cell) {
          const text = cell.innerText.replace(/\s+/g, ' ').trim();

          if (text && text.length <= 120) {
            allValues.push(text);
          }
        });
      });

      const box = document.createElement('div');
      box.className = 'search-tools';

      const input = document.createElement('input');
      input.className = 'smart-search';
      input.type = 'search';
      input.placeholder = '🔎 ابحث داخل الجدول...';
      input.setAttribute('autocomplete', 'off');

      const listId = 'table-suggestions-' + index;
      input.setAttribute('list', listId);
      makeDataList(listId, allValues);

      const count = document.createElement('span');
      count.className = 'search-count pill';
      count.textContent = rows.length + ' نتيجة';

      box.appendChild(input);
      box.appendChild(count);

      if (wrap.parentNode) {
        wrap.parentNode.insertBefore(box, wrap);
      }

      wrap.dataset.searchReady = '1';

      input.addEventListener('input', function () {
        const query = normalizeText(input.value);
        let visible = 0;

        rows.forEach(function (row) {
          const text = normalizeText(row.innerText);
          const show = !query || text.includes(query);

          row.style.display = show ? '' : 'none';

          if (show) {
            visible++;
          }
        });

        count.textContent = visible + ' نتيجة';
      });
    });
  }

  function setupCardSearch() {
    document.querySelectorAll('.grid').forEach(function (grid, index) {
      if (grid.dataset.searchReady) return;

      const cards = Array.from(grid.querySelectorAll(':scope > .mini-card'));

      if (cards.length < 4) return;

      const values = cards.map(function (card) {
        return card.innerText.replace(/\s+/g, ' ').trim();
      });

      const box = document.createElement('div');
      box.className = 'search-tools card-search-tools';

      const input = document.createElement('input');
      input.className = 'smart-search';
      input.type = 'search';
      input.placeholder = '🔎 ابحث داخل البطاقات...';
      input.setAttribute('autocomplete', 'off');

      const listId = 'card-suggestions-' + index;
      input.setAttribute('list', listId);
      makeDataList(listId, values);

      const count = document.createElement('span');
      count.className = 'search-count pill';
      count.textContent = cards.length + ' نتيجة';

      box.appendChild(input);
      box.appendChild(count);

      if (grid.parentNode) {
        grid.parentNode.insertBefore(box, grid);
      }

      grid.dataset.searchReady = '1';

      input.addEventListener('input', function () {
        const query = normalizeText(input.value);
        let visible = 0;

        cards.forEach(function (card) {
          const show = !query || normalizeText(card.innerText).includes(query);

          card.style.display = show ? '' : 'none';

          if (show) {
            visible++;
          }
        });

        count.textContent = visible + ' نتيجة';
      });
    });
  }

  function enhanceSelects() {
    const selector = [
      'select[name="factory_id"]',
      'select[name="material_id"]',
      'select[name="driver_id"]'
    ].join(',');

    document.querySelectorAll(selector).forEach(function (select, index) {
      if (select.dataset.comboReady) return;

      const options = Array.from(select.options || []).filter(function (option) {
        return option.value !== '';
      });

      if (!options.length) return;

      const input = document.createElement('input');
      input.className = 'combo-input';
      input.type = 'search';
      input.placeholder = 'اكتب للبحث والاختيار تلقائيًا...';
      input.setAttribute('autocomplete', 'off');

      const listId = 'combo-list-' + index + '-' + Math.random().toString(36).slice(2);
      input.setAttribute('list', listId);
      makeDataList(
        listId,
        options.map(function (option) {
          return option.textContent.trim();
        })
      );

      const selected = options.find(function (option) {
        return option.selected;
      }) || options[0];

      if (selected) {
        input.value = selected.textContent.trim();
      }

      if (select.parentNode) {
        select.parentNode.insertBefore(input, select);
      }

      select.classList.add('native-select-hidden');
      select.dataset.comboReady = '1';

      function applyValue(soft) {
        const query = normalizeText(input.value);

        if (!query) return;

        let match = options.find(function (option) {
          return normalizeText(option.textContent) === query;
        });

        if (!match) {
          match = options.find(function (option) {
            return normalizeText(option.textContent).includes(query);
          });
        }

        if (!match && !soft) {
          match = options[0];
        }

        if (match) {
          select.value = match.value;
          input.value = match.textContent.trim();
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }

      input.addEventListener('change', function () {
        applyValue(true);
      });

      input.addEventListener('blur', function () {
        applyValue(true);
      });

      input.addEventListener('input', function () {
        const query = normalizeText(input.value);

        const exact = options.find(function (option) {
          return normalizeText(option.textContent) === query;
        });

        if (exact) {
          select.value = exact.value;
        }
      });
    });
  }

  function setupSidebarSearch() {
    const nav = document.querySelector('.side-nav');

    if (!nav || document.querySelector('.sidebar-search')) return;

    const input = document.createElement('input');
    input.className = 'sidebar-search';
    input.type = 'search';
    input.placeholder = 'ابحث في الصفحات...';

    if (nav.parentNode) {
      nav.parentNode.insertBefore(input, nav);
    }

    const links = Array.from(nav.querySelectorAll('.nav-link'));

    input.addEventListener('input', function () {
      const query = normalizeText(input.value);

      links.forEach(function (link) {
        link.style.display = !query || normalizeText(link.innerText).includes(query)
          ? ''
          : 'none';
      });
    });
  }

  function setupMobileSidebar() {
    const menu =
      document.getElementById('menuBtn') ||
      document.querySelector('[data-menu-toggle]');

    const sidebar =
      document.getElementById('sidebar') ||
      document.querySelector('.sidebar');

    if (!menu || !sidebar || menu.dataset.boundMenu) return;

    menu.dataset.boundMenu = '1';

    menu.addEventListener('click', function (event) {
      event.stopPropagation();
      sidebar.classList.toggle('open');
    });

    document.addEventListener('click', function (event) {
      if (
        window.innerWidth <= 820 &&
        sidebar.classList.contains('open') &&
        !sidebar.contains(event.target) &&
        event.target !== menu
      ) {
        sidebar.classList.remove('open');
      }
    });
  }

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

  applyTheme(getTheme());
  applyAccent(getAccent());

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSmartUi);
  } else {
    initSmartUi();
  }
})();