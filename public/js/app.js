(function(){
  const root = document.documentElement;

  function applyAppearance() {
    const savedTheme = localStorage.getItem('zarah-theme') || root.getAttribute('data-theme') || 'light';
    const savedPrimary = localStorage.getItem('zarah-primary') || root.getAttribute('data-primary') || 'teal';
    root.setAttribute('data-theme', savedTheme);
    root.setAttribute('data-primary', savedPrimary);
    const toggle = document.getElementById('themeToggle');
    if (toggle) {
      toggle.setAttribute('aria-label', savedTheme === 'dark' ? 'تفعيل الوضع النهاري' : 'تفعيل الوضع الليلي');
      toggle.innerHTML = savedTheme === 'dark'
        ? '<span>🌙</span><span class=\"theme-label\">ليلي</span>'
        : '<span>☀️</span><span class=\"theme-label\">نهاري</span>';
    }
    document.querySelectorAll('.color-option').forEach(opt => {
      opt.classList.toggle('active', opt.getAttribute('data-color') === savedPrimary);
    });
  }

  applyAppearance();

  const normalize = (value) => String(value || '')
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ـ/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const toggle = document.getElementById('themeToggle');
  if (toggle && !toggle.dataset.bound) {
    toggle.dataset.bound = '1';
    toggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      localStorage.setItem('zarah-theme', next);
      applyAppearance();
    });
  }

  const colorBtn = document.getElementById('colorPaletteBtn');
  const dropdown = document.getElementById('colorDropdown');
  if (colorBtn && dropdown && !colorBtn.dataset.bound) {
    colorBtn.dataset.bound = '1';
    colorBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });
    dropdown.addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('click', () => dropdown.classList.remove('show'));
    document.querySelectorAll('.color-option').forEach(opt => {
      opt.setAttribute('role', 'button');
      opt.setAttribute('tabindex', '0');
      const choose = () => {
        const color = opt.getAttribute('data-color') || 'teal';
        localStorage.setItem('zarah-primary', color);
        applyAppearance();
        dropdown.classList.remove('show');
      };
      opt.addEventListener('click', choose);
      opt.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          choose();
        }
      });
    });
  }

  const menu = document.getElementById('menuBtn');
  const sidebar = document.getElementById('sidebar');
  if (menu && sidebar && !menu.dataset.bound) {
    menu.dataset.bound = '1';
    menu.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 820 && sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== menu) {
        sidebar.classList.remove('open');
      }
    });
  }

  function unique(values) {
    return [...new Set(values.map(v => String(v || '').trim()).filter(Boolean))];
  }

  function makeDataList(id, values) {
    let dl = document.getElementById(id);
    if (!dl) {
      dl = document.createElement('datalist');
      dl.id = id;
      document.body.appendChild(dl);
    }
    dl.innerHTML = unique(values).slice(0, 350).map(v => `<option value="${v.replace(/"/g, '&quot;')}"></option>`).join('');
    return dl;
  }

  function setupTableSearch() {
    document.querySelectorAll('.table-wrap').forEach((wrap, index) => {
      if (wrap.dataset.searchReady) return;
      const table = wrap.querySelector('table');
      if (!table) return;
      const rows = Array.from(table.querySelectorAll('tbody tr'));
      if (!rows.length) return;
      const allValues = [];
      rows.forEach(row => {
        Array.from(row.cells || []).forEach(cell => {
          const text = cell.innerText.replace(/\s+/g, ' ').trim();
          if (text && text.length <= 120) allValues.push(text);
        });
      });
      const box = document.createElement('div');
      box.className = 'search-tools';
      const input = document.createElement('input');
      input.className = 'smart-search';
      input.type = 'search';
      input.placeholder = '🔎 ابحث داخل الجدول... اكتب اسم مصنع، سائق، رقم سيارة، حالة، أو نوع بحص';
      input.setAttribute('autocomplete', 'off');
      const listId = `table-suggestions-${index}`;
      input.setAttribute('list', listId);
      makeDataList(listId, allValues);
      const count = document.createElement('span');
      count.className = 'search-count pill';
      count.textContent = `${rows.length} نتيجة`;
      box.appendChild(input);
      box.appendChild(count);
      wrap.parentNode.insertBefore(box, wrap);
      wrap.dataset.searchReady = '1';

      input.addEventListener('input', () => {
        const q = normalize(input.value);
        let visible = 0;
        rows.forEach(row => {
          const txt = normalize(row.innerText);
          const show = !q || txt.includes(q);
          row.style.display = show ? '' : 'none';
          if (show) visible++;
        });
        count.textContent = `${visible} نتيجة`;
      });
    });
  }

  function setupCardSearch() {
    document.querySelectorAll('.grid').forEach((grid, index) => {
      if (grid.dataset.searchReady) return;
      const cards = Array.from(grid.querySelectorAll(':scope > .mini-card'));
      if (cards.length < 4) return;
      const values = cards.map(card => card.innerText.replace(/\s+/g, ' ').trim());
      const box = document.createElement('div');
      box.className = 'search-tools card-search-tools';
      const input = document.createElement('input');
      input.className = 'smart-search';
      input.type = 'search';
      input.placeholder = '🔎 ابحث داخل البطاقات...';
      input.setAttribute('autocomplete', 'off');
      const listId = `card-suggestions-${index}`;
      input.setAttribute('list', listId);
      makeDataList(listId, values);
      const count = document.createElement('span');
      count.className = 'search-count pill';
      count.textContent = `${cards.length} نتيجة`;
      box.appendChild(input);
      box.appendChild(count);
      grid.parentNode.insertBefore(box, grid);
      grid.dataset.searchReady = '1';
      input.addEventListener('input', () => {
        const q = normalize(input.value);
        let visible = 0;
        cards.forEach(card => {
          const show = !q || normalize(card.innerText).includes(q);
          card.style.display = show ? '' : 'none';
          if (show) visible++;
        });
        count.textContent = `${visible} نتيجة`;
      });
    });
  }

  function enhanceSelects() {
    const selector = [
      'select[name="factory_id"]',
      'select[name="material_id"]',
      'select[name="driver_id"]'
    ].join(',');
    document.querySelectorAll(selector).forEach((select, index) => {
      if (select.dataset.comboReady) return;
      const options = Array.from(select.options || []).filter(o => o.value !== '');
      if (!options.length) return;
      const input = document.createElement('input');
      input.className = 'combo-input';
      input.type = 'search';
      input.placeholder = 'اكتب للبحث والاختيار تلقائياً...';
      input.setAttribute('autocomplete', 'off');
      const listId = `combo-list-${index}-${Math.random().toString(36).slice(2)}`;
      input.setAttribute('list', listId);
      makeDataList(listId, options.map(o => o.textContent.trim()));
      const selected = options.find(o => o.selected) || options[0];
      if (selected) input.value = selected.textContent.trim();
      select.parentNode.insertBefore(input, select);
      select.classList.add('native-select-hidden');
      select.dataset.comboReady = '1';

      function applyValue(soft = false) {
        const q = normalize(input.value);
        if (!q) return;
        let match = options.find(o => normalize(o.textContent) === q);
        if (!match) match = options.find(o => normalize(o.textContent).includes(q));
        if (!match && !soft) match = options[0];
        if (match) {
          select.value = match.value;
          input.value = match.textContent.trim();
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      input.addEventListener('change', () => applyValue(true));
      input.addEventListener('blur', () => applyValue(true));
      input.addEventListener('input', () => {
        const q = normalize(input.value);
        const exact = options.find(o => normalize(o.textContent) === q);
        if (exact) select.value = exact.value;
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
    nav.parentNode.insertBefore(input, nav);
    const links = Array.from(nav.querySelectorAll('.nav-link'));
    input.addEventListener('input', () => {
      const q = normalize(input.value);
      links.forEach(link => {
        link.style.display = !q || normalize(link.innerText).includes(q) ? '' : 'none';
      });
    });
  }

  function initSmartUi() {
    setupSidebarSearch();
    setupTableSearch();
    setupCardSearch();
    enhanceSelects();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSmartUi);
  else initSmartUi();
})();
