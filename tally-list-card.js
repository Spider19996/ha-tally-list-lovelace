// Tally List Card
import { LitElement, html, css } from 'https://unpkg.com/lit?module';
import { repeat } from 'https://unpkg.com/lit/directives/repeat.js?module';
const CARD_VERSION = '08.08.2025';

const TL_STRINGS = {
  en: {
    card_name: 'Tally List Card',
    card_desc: 'Displays drink counts per user with quick add/remove buttons.',
    ranking_name: 'Tally Due Ranking Card',
    ranking_desc: 'Shows a ranking based on the due amount per user.',
    integration_missing:
      'Tally List integration not found. Please set up the integration.',
    no_user_access: 'No access to users',
    unknown_user: 'Unknown user',
    no_drinks: 'Please add a drink via the Tally List integration first.',
    name: 'Name',
    drink: 'Drink',
    count: 'Count',
    price: 'Price',
    sum: 'Sum',
    total: 'Total',
    free_amount: 'Free amount',
    amount_due: 'Amount due',
    lock_ms: 'Lock duration (ms)',
    max_width: 'Maximum width (px)',
    show_remove_menu: 'Show remove menu',
    only_self: 'Only show own user even for admins',
    show_all_users: 'Show all users',
    show_inactive_drinks: 'Show inactive drinks',
    debug: 'Debug',
    language: 'Language',
    auto: 'Auto',
    german: 'German',
    english: 'English',
    sort: 'Sort by',
    sort_due_desc: 'By amount due',
    sort_due_asc: 'By amount due (ascending)',
    sort_name: 'Alphabetically',
    sort_menu_show: 'Show sort menu',
    show_reset: 'Show reset button (admins only)',
    show_copy: 'Show copy button',
    show_total: 'Show total amount',
    hide_free: 'Hide people without amount',
    copy_table: 'Copy table',
    reset_all: 'Reset all tallies',
    show_reset_everyone: 'Show reset button for everyone',
    max_entries: 'Maximum entries (0 = all)',
    sort_label: 'Sort:',
    version: 'Version',
    copy_success: 'Text copied to clipboard!',
    reset_confirm_prompt: 'Type "YES I WANT TO" to reset all tallies:',
    tab_all_label: 'All',
    tab_misc_label: '#',
    user_selector: 'User selector',
    user_selector_list: 'List',
    user_selector_tabs: 'Tabs',
    user_selector_grid: 'Grid',
    tab_mode: 'Tab mode',
    per_letter: 'Per letter',
    grouped: 'Grouped',
    grouped_breaks: 'Grouped breaks',
    show_all_tab: 'Show "All" tab',
    grid_columns: 'Grid columns (0 = auto)',
  },
  de: {
    card_name: 'Strichliste Karte',
    card_desc:
      'Zeigt Getränkezähler pro Benutzer mit schnellen Hinzufügen/Entfernen-Tasten.',
    ranking_name: 'Strichliste Ranglistenkarte',
    ranking_desc: 'Zeigt eine Rangliste nach offenem Betrag pro Benutzer.',
    integration_missing:
      'Strichliste-Integration nicht gefunden. Bitte richte die Integration ein.',
    no_user_access: 'Kein Zugriff auf Nutzer',
    unknown_user: 'Unbekannter Benutzer',
    no_drinks: 'Bitte füge zuerst ein Getränk über die Strichliste-Integration hinzu.',
    name: 'Name',
    drink: 'Getränk',
    count: 'Anzahl',
    price: 'Preis',
    sum: 'Summe',
    total: 'Gesamt',
    free_amount: 'Freibetrag',
    amount_due: 'Zu zahlen',
    lock_ms: 'Sperrzeit (ms)',
    max_width: 'Maximale Breite (px)',
    show_remove_menu: 'Entfernen-Menü anzeigen',
    only_self: 'Trotz Admin nur eigenen Nutzer anzeigen',
    show_all_users: 'Alle Nutzer anzeigen',
    show_inactive_drinks: 'Inaktive Getränke anzeigen',
    debug: 'Debug',
    language: 'Sprache',
    auto: 'Auto',
    german: 'Deutsch',
    english: 'Englisch',
    sort: 'Sortierung',
    sort_due_desc: 'Nach offenem Betrag',
    sort_due_asc: 'Nach offenem Betrag (aufsteigend)',
    sort_name: 'Alphabetisch',
    sort_menu_show: 'Sortiermenü anzeigen',
    show_reset: 'Reset-Button anzeigen (nur Admins)',
    show_copy: 'Kopier-Button anzeigen',
    show_total: 'Gesamtsumme anzeigen',
    hide_free: 'Personen ohne Betrag ausblenden',
    copy_table: 'Tabelle kopieren',
    reset_all: 'Alle Striche zurücksetzen',
    show_reset_everyone: 'Für jeden Reset-Button anzeigen',
    max_entries: 'Maximale Einträge (0 = alle)',
    sort_label: 'Sortierung:',
    version: 'Version',
    copy_success: 'Text in die Zwischenablage kopiert!',
    reset_confirm_prompt: 'Zum Zurücksetzen aller Striche "JA ICH WILL" eingeben:',
    tab_all_label: 'Alle',
    tab_misc_label: '#',
    user_selector: 'Nutzerauswahl',
    user_selector_list: 'Liste',
    user_selector_tabs: 'Tabs',
    user_selector_grid: 'Grid',
    tab_mode: 'Tab-Modus',
    per_letter: 'Pro Buchstabe',
    grouped: 'Gruppiert',
    grouped_breaks: 'Gruppierte Bereiche',
    show_all_tab: 'Tab "Alle" anzeigen',
    grid_columns: 'Spalten (0 = automatisch)',
  },
};

function detectLang(hass, override = 'auto') {
  if (override && override !== 'auto') return override;
  const lang =
    hass?.language || hass?.locale?.language || navigator.language || 'en';
  return lang.toLowerCase().startsWith('de') ? 'de' : 'en';
}

function t(hass, override, key) {
  const lang = detectLang(hass, override);
  return TL_STRINGS[lang][key] || TL_STRINGS.en[key] || key;
}

function fireEvent(node, type, detail = {}, options = {}) {
  node.dispatchEvent(
    new CustomEvent(type, {
      detail,
      bubbles: options.bubbles ?? true,
      composed: options.composed ?? true,
    })
  );
}

const navLang = (navigator.language || '').toLowerCase().startsWith('de')
  ? 'de'
  : 'en';
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'tally-list-card',
  name: TL_STRINGS[navLang].card_name,
  preview: true,
  description: TL_STRINGS[navLang].card_desc,
});
window.customCards.push({
  type: 'tally-due-ranking-card',
  name: TL_STRINGS[navLang].ranking_name,
  preview: true,
  description: TL_STRINGS[navLang].ranking_desc,
});

class TallyListCard extends LitElement {
  static properties = {
    hass: {},
    config: {},
    selectedUser: { state: true },
    _autoUsers: { state: true },
    _autoPrices: { state: true },
    _freeAmount: { state: true },
    _currency: { state: true },
    _tallyAdmins: { state: true },
    selectedRemoveDrink: { state: true },
    selectedCount: { state: true },
    _disabled: { state: true },
    _optimisticCounts: { state: true },
    _tabs: { state: true },
    _visibleUsers: { state: true },
    _currentTab: { state: true },
  };

  selectedRemoveDrink = '';
  selectedCount = 1;
  _tallyAdmins = [];
  _optimisticCounts = {};
  _tabs = [];
  _visibleUsers = [];
  _currentTab = 'all';
  _buckets = new Map();
  _sortedUsers = [];
  _usersKey = '';
  _ownUser = null;

  constructor() {
    super();
    try {
      const stored = window.localStorage.getItem('tally-list-admins');
      this._tallyAdmins = stored ? JSON.parse(stored) : [];
    } catch (err) {
      this._tallyAdmins = [];
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this._resizeHandler = () => this._updateButtonHeight();
    window.addEventListener('resize', this._resizeHandler);
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this._resizeHandler);
    super.disconnectedCallback();
  }

  setConfig(config) {
    const tabs = {
      mode: 'per-letter',
      grouped_breaks: ['A–E', 'F–J', 'K–O', 'P–T', 'U–Z'],
      show_all_tab: true,
      ...(config?.tabs || {}),
    };
    const grid = {
      columns: 0,
      ...(config?.grid || {}),
    };
    this.config = {
      lock_ms: 400,
      max_width: '500px',
      show_remove: true,
      only_self: false,
      show_all_users: false,
      show_inactive_drinks: false,
      language: 'auto',
      user_selector: 'list',
      ...config,
    };
    this.config.tabs = tabs;
    this.config.grid = grid;
    this._disabled = false;
    const width = this._normalizeWidth(this.config.max_width);
    if (width) {
      this.style.setProperty('--dcc-max-width', width);
      this.config.max_width = width;
    } else {
      this.style.removeProperty('--dcc-max-width');
      this.config.max_width = '';
    }
    if (config.users && Array.isArray(config.users)) {
      // Prefer the configured name to preserve capitalization
      this.selectedUser = config.users[0]?.name || config.users[0]?.slug;
    }
  }

  _t(key) {
    return t(this.hass, this.config?.language, key);
  }

  _setSelectedUser(name, source) {
    this.selectedUser = name;
    fireEvent(this, 'tally-user-picker-change', { userId: name, source });
  }

  _firstLetter(name) {
    return name
      .trim()
      .charAt(0)
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  _bucketizeUsers(users, cfg) {
    const misc = [];
    if ((cfg.mode || 'per-letter') === 'grouped') {
      const ranges = (cfg.grouped_breaks || []).map(b => {
        const [s, e] = b.split('–');
        return {
          key: b,
          start: this._firstLetter(s || ''),
          end: this._firstLetter(e || ''),
          users: [],
        };
      });
      users.forEach(u => {
        const ch = this._firstLetter(u.name || u.slug);
        let placed = false;
        for (const r of ranges) {
          if (ch >= r.start && ch <= r.end) {
            r.users.push(u);
            placed = true;
            break;
          }
        }
        if (!placed) misc.push(u);
      });
      return { ranges, misc };
    }
    const letters = new Map();
    users.forEach(u => {
      const ch = this._firstLetter(u.name || u.slug);
      if (ch >= 'A' && ch <= 'Z') {
        if (!letters.has(ch)) letters.set(ch, []);
        letters.get(ch).push(u);
      } else {
        misc.push(u);
      }
    });
    return { letters, misc };
  }

  _renderUserButtons(list, source) {
    const cfg = this.config.grid || {};
    const cols = Number(cfg.columns);
    const columnStyle =
      cols > 0
        ? `grid-template-columns:repeat(${cols},1fr);`
        : `grid-template-columns:repeat(auto-fit,minmax(0,1fr));`;
    const style = `${columnStyle}--tl-btn-h:32px;`;
    const pressed = this.selectedUser;
    return html`<div class="user-grid" aria-label="${this._t('name')}" style="${style}">
      ${repeat(list, u => u.user_id || u.slug, u => {
        const name = u.name || u.slug;
        return html`<button class="user-btn" data-id="${name}" data-source="${source}" aria-pressed="${name === pressed}" @pointerdown=${this._onUserPick}>${name}</button>`;
      })}
    </div>`;
  }

  _updateButtonHeight() {
    const grid = this.renderRoot?.querySelector('.user-grid');
    if (!grid) return;
    const buttons = grid.querySelectorAll('button');
    if (!buttons.length) return;
    // Temporarily allow buttons to size to their content
    buttons.forEach(btn => btn.style.height = 'auto');
    let max = 32;
    buttons.forEach(btn => {
      const h = btn.offsetHeight;
      if (h > max) max = h;
    });
    // Remove inline height so CSS variable can take effect
    buttons.forEach(btn => btn.style.removeProperty('height'));
    grid.style.setProperty('--tl-btn-h', `${max}px`);
  }

  _onUserPick(e) {
    const btn = e.currentTarget;
    const name = btn.dataset.id;
    const source = btn.dataset.source;
    e.preventDefault();
    this._setSelectedUser(name, source);
  }

  _ensureBuckets(users) {
    const locale = detectLang(this.hass, this.config?.language);
    const uid = this.hass.user?.id;
    const slugs = this._currentPersonSlugs();
    const own = users.find(u => u.user_id === uid || slugs.includes(u.slug));
    const key = users.map(u => u.name || u.slug).join('|') + '|' + (own ? own.name || own.slug : '');
    if (key === this._usersKey) return;
    const collator = new Intl.Collator(locale, { sensitivity: 'base', numeric: true });
    let sorted = [...users].sort((a, b) => collator.compare(a.name || a.slug, b.name || b.slug));
    if (own) {
      sorted = [own, ...sorted.filter(u => u !== own)];
    }
    this._usersKey = key;
    this._sortedUsers = sorted;
    this._ownUser = own;
    this._updateBuckets(sorted, locale);
  }

  _updateBuckets(users, locale) {
    const cfg = this.config.tabs || {};
    const data = this._bucketizeUsers(users, cfg);
    let tabs = [];
    if (cfg.mode === 'grouped') {
      tabs = data.ranges
        .filter(r => r.users.length > 0)
        .map(r => ({ key: r.key, label: r.key, users: r.users }));
    } else {
      const letters = Array.from(data.letters.keys()).sort((a, b) => a.localeCompare(b, locale));
      tabs = letters.map(l => ({ key: l, label: l, users: data.letters.get(l) }));
    }
    if (data.misc.length > 0) {
      tabs.push({ key: '#', label: this._t('tab_misc_label'), users: data.misc });
    }
    if (cfg.show_all_tab !== false) {
      tabs.unshift({ key: 'all', label: this._t('tab_all_label'), users });
    }
    this._tabs = tabs;
    this._buckets = new Map([
      ['*ALL*', users],
      ...tabs.map(t => [t.key, t.key === 'all' ? users : t.users]),
    ]);
    if (!this._buckets.has(this._currentTab)) {
      this._currentTab = tabs[0]?.key || 'all';
    }
    this._visibleUsers = this._buckets.get(this._currentTab) || [];
  }

  _setTab(tab) {
    this._currentTab = tab;
    this._visibleUsers = this._buckets.get(tab) || this._buckets.get('*ALL*') || [];
    this.requestUpdate('_visibleUsers');
  }

  _onTabbarPointerDown(e) {
    const btn = e.target.closest('.tab');
    if (!btn) return;
    e.preventDefault();
    const tab = btn.dataset.tab;
    requestAnimationFrame(() => this._setTab(tab));
  }

  _renderTabs() {
    const tabs = this._tabs || [];
    return html`<div class="user-tabs tabbar" role="tablist" @pointerdown=${this._onTabbarPointerDown}>
        ${tabs.map(t => html`<button class="tab" role="tab" data-tab="${t.key}" aria-selected="${t.key === this._currentTab}">${t.label}</button>`) }
      </div>
      ${this._renderUserButtons(this._visibleUsers, 'tabs')}`;
  }

  _renderGrid(users) {
    return this._renderUserButtons(users, 'grid');
  }

  _renderUserSelector(users, isAdmin) {
    if (!isAdmin) {
      const own = users.find(u => (u.name || u.slug) === this.selectedUser) || users[0];
      const name = own?.name || own?.slug || '';
      return html`<div class="controls"><div class="user-label">${name}</div></div>`;
    }
    const mode = this.config.user_selector || 'list';
    if (mode === 'tabs') return this._renderTabs();
    if (mode === 'grid') return this._renderGrid(users);
    return html`<div class="controls"><div class="user-select"><label for="user">${this._t('name')}:</label><select id="user" @change=${this._selectUser.bind(this)}>${users.map(u => html`<option value="${u.name || u.slug}" ?selected=${(u.name || u.slug)===this.selectedUser}>${u.name}</option>`)}</select></div></div>`;
  }

  render() {
    if (!this.hass || !this.config) return html``;
    let users = this.config.users || this._autoUsers || [];
    if (users.length === 0) {
      return html`<ha-card>${this._t('integration_missing')}</ha-card>`;
    }
    const userNames = [this.hass.user?.name, ...this._currentPersonNames()];
    const isAdmin = userNames.some(n => (this._tallyAdmins || []).includes(n));
    const limitSelf = !isAdmin || this.config.only_self;
    if (limitSelf) {
      const allowedSlugs = this._currentPersonSlugs();
      const uid = this.hass.user?.id;
      users = users.filter(u => u.user_id === uid || allowedSlugs.includes(u.slug));
    }
    if (users.length === 0) {
      return html`<ha-card>${this._t('no_user_access')}</ha-card>`;
    }
    this._ensureBuckets(users);
    users = this._sortedUsers;
    const own = this._ownUser;
    if (!this.selectedUser || !users.some(u => (u.name || u.slug) === this.selectedUser)) {
      // Prefer the current user when available, otherwise pick the first entry
      this.selectedUser = own ? (own.name || own.slug) : (users[0].name || users[0].slug);
    }
    const user = users.find(u => (u.name || u.slug) === this.selectedUser);
    if (!user) return html`<ha-card>${this._t('unknown_user')}</ha-card>`;
    if (!user.drinks || Object.keys(user.drinks).length === 0) {
      return html`<ha-card>${this._t('no_drinks')}</ha-card>`;
    }
    const prices = this.config.prices || this._autoPrices || {};
    const freeAmount = Number(this.config.free_amount ?? this._freeAmount ?? 0);
    const drinkEntries = Object.entries(user.drinks).filter(([d, e]) => {
      if (this.config.show_inactive_drinks) return true;
      const st = this.hass.states[e]?.state;
      return st !== 'unavailable' && st !== 'unknown';
    });
    if (drinkEntries.length === 0) {
      return html`<ha-card>${this._t('no_drinks')}</ha-card>`;
    }
    let total = 0;
    const rows = drinkEntries
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([drink, entity]) => {
        const stateObj = this.hass.states[entity];
        const isAvailable =
          stateObj && stateObj.state !== 'unavailable' && stateObj.state !== 'unknown';
        const count = this._optimisticCounts[entity] ?? this._toNumber(stateObj?.state);
        const price = this._toNumber(prices[drink]);
        const priceStr = this._formatPrice(price) + ` ${this._currency}`;
        const cost = count * price;
        total += cost;
        const costStr = this._formatPrice(cost) + ` ${this._currency}`;
        const displayDrink = drink.charAt(0).toUpperCase() + drink.slice(1);
        return html`<tr>
          <td>
            <button
              class="add-button"
              @click=${() => this._addDrink(drink)}
              ?disabled=${this._disabled || !isAvailable}
            >
              +${this.selectedCount}
            </button>
          </td>
          <td>${displayDrink}</td>
          <td>${count}</td>
          <td>${priceStr}</td>
          <td>${costStr}</td>
        </tr>`;
      });

    const drinks = drinkEntries.map(([d]) => d).sort((a, b) => a.localeCompare(b));
    if (!this.selectedRemoveDrink || !drinks.includes(this.selectedRemoveDrink)) {
      this.selectedRemoveDrink = drinks[0] || '';
    }

    const selectedEntity = user.drinks[this.selectedRemoveDrink];
    const selectedState = selectedEntity ? this.hass.states[selectedEntity] : null;
    const selectedAvailable =
      selectedState &&
      selectedState.state !== 'unavailable' &&
      selectedState.state !== 'unknown';
    const currentCount =
      this._optimisticCounts[selectedEntity] ?? this._toNumber(selectedState?.state);
    const removeDisabled =
      this._disabled || !selectedAvailable || currentCount < this.selectedCount;

    const totalStr = this._formatPrice(total) + ` ${this._currency}`;
    const freeAmountStr = this._formatPrice(freeAmount) + ` ${this._currency}`;
    let due;
    if (user.amount_due_entity) {
      const dueState = this.hass.states[user.amount_due_entity];
      const val = parseFloat(dueState?.state);
      due = isNaN(val) ? Math.max(total - freeAmount, 0) : val;
    } else {
      due = Math.max(total - freeAmount, 0);
    }
    const dueStr = this._formatPrice(due) + ` ${this._currency}`;
    const width = this._normalizeWidth(this.config.max_width);
    const cardStyle = width ? `max-width:${width};margin:0 auto;` : '';
    const selector = this._renderUserSelector(users, isAdmin);
    const countSelector = html`
      <div class="count-row">
        ${[1, 3, 5, 10].map(
          c => html`<button
            class=${c === this.selectedCount ? 'selected' : ''}
            @click=${() => (this.selectedCount = c)}
          >
            ${c}
          </button>`
        )}
      </div>
    `;
    return html`
      <ha-card style="${cardStyle}">
        ${selector}
        ${countSelector}
        <table>
          <thead><tr><th></th><th>${this._t('drink')}</th><th>${this._t('count')}</th><th>${this._t('price')}</th><th>${this._t('sum')}</th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr><td colspan="4"><b>${this._t('total')}</b></td><td>${totalStr}</td></tr>
            ${freeAmount > 0 ? html`
              <tr><td colspan="4"><b>${this._t('free_amount')}</b></td><td>- ${freeAmountStr}</td></tr>
              <tr><td colspan="4"><b>${this._t('amount_due')}</b></td><td>${dueStr}</td></tr>
            ` : ''}
            ${this.config.show_remove !== false ? html`
              <tr class="remove-row">
                <td><button class="remove-button" @click=${() => this._removeDrink(this.selectedRemoveDrink)} ?disabled=${removeDisabled}>-${this.selectedCount}</button></td>
                <td colspan="4" class="remove-select-cell">
                  <select class="remove-select" @change=${this._selectRemoveDrink.bind(this)}>
                    ${drinks.map(d => html`<option value="${d}" ?selected=${d===this.selectedRemoveDrink}>${d.charAt(0).toUpperCase() + d.slice(1)}</option>`)}
                  </select>
                </td>
              </tr>
            ` : ''}
          </tfoot>
        </table>
      </ha-card>
    `;
  }

  _selectUser(ev) {
    this._setSelectedUser(ev.target.value, 'list');
  }

  _selectRemoveDrink(ev) {
    this.selectedRemoveDrink = ev.target.value;
    this.requestUpdate();
  }

  _addDrink(drink) {
    if (this._disabled) {
      return;
    }
    this._disabled = true;
    this.requestUpdate();
    const delay = Number(this.config.lock_ms ?? 400);
    setTimeout(() => {
      this._disabled = false;
      this.requestUpdate();
    }, delay);
    const displayDrink = drink.charAt(0).toUpperCase() + drink.slice(1);
    this.hass.callService('tally_list', 'add_drink', {
      user: this.selectedUser,
      drink: displayDrink,
      count: this.selectedCount,
    });

    const users = this.config.users || this._autoUsers || [];
    const user = users.find(u => (u.name || u.slug) === this.selectedUser);
    const entity = user?.drinks?.[drink];
    if (entity) {
      const stateObj = this.hass.states[entity];
      const base = this._optimisticCounts[entity] ?? this._toNumber(stateObj?.state);
      this._optimisticCounts = { ...this._optimisticCounts, [entity]: base + this.selectedCount };
      this.hass.callService('homeassistant', 'update_entity', {
        entity_id: entity,
      });
    }
  }

  _removeDrink(drink) {
    if (this._disabled || !drink) {
      return;
    }

    const users = this.config.users || this._autoUsers || [];
    const user = users.find(u => (u.name || u.slug) === this.selectedUser);
    const entity = user?.drinks?.[drink];
    const stateObj = entity ? this.hass.states[entity] : null;
    const isAvailable =
      stateObj &&
      stateObj.state !== 'unavailable' &&
      stateObj.state !== 'unknown';
    const count = this._optimisticCounts[entity] ?? this._toNumber(stateObj?.state);
    if (!isAvailable || count < this.selectedCount) {
      return;
    }

    this._disabled = true;
    this.requestUpdate();
    const delay = Number(this.config.lock_ms ?? 400);
    setTimeout(() => {
      this._disabled = false;
      this.requestUpdate();
    }, delay);

    const displayDrink = drink.charAt(0).toUpperCase() + drink.slice(1);
    this.hass.callService('tally_list', 'remove_drink', {
      user: this.selectedUser,
      drink: displayDrink,
      count: this.selectedCount,
    });

    if (entity) {
      const base = this._optimisticCounts[entity] ?? count;
      this._optimisticCounts = { ...this._optimisticCounts, [entity]: base - this.selectedCount };
      this.hass.callService('homeassistant', 'update_entity', {
        entity_id: entity,
      });
    }
  }

  updated(changedProps) {
    if (changedProps.has('hass')) {
      if (!this.config.users) {
        this._autoUsers = this._gatherUsers();
      }
      if (!this.config.prices) {
        this._autoPrices = this._gatherPrices();
      }
      if (!this.config.free_amount) {
        this._freeAmount = this._gatherFreeAmount();
      }
      this._fetchTallyAdmins();

      // Sync optimistic counts with real states when updates arrive
      const updated = { ...this._optimisticCounts };
      let changed = false;
      for (const [entity, val] of Object.entries(this._optimisticCounts)) {
        const real = this._toNumber(this.hass.states[entity]?.state);
        if (!isNaN(real)) {
          if (real === val) {
            delete updated[entity];
          } else {
            updated[entity] = real;
          }
          changed = true;
        }
      }
      if (changed) {
        this._optimisticCounts = updated;
      }
    }
    if (changedProps.has('_visibleUsers')) {
      this._updateButtonHeight();
    }
  }

  _gatherUsers() {
    const users = [];
    const states = this.hass.states;
    for (const [entity, state] of Object.entries(states)) {
      const match = entity.match(/^sensor\.([a-z0-9_]+)_amount_due$/);
      if (match) {
        const slug = match[1];
        const sensorName = (state.attributes.friendly_name || '').replace(' Amount Due', '');
        const drinks = {};
        const prefix = `sensor.${slug}_`;
        for (const [e2] of Object.entries(states)) {
          const m2 = e2.startsWith(prefix) && e2.endsWith('_count') && e2.match(/^sensor\.[a-z0-9_]+_([^_]+)_count$/);
          if (m2) {
            const drink = m2[1];
            drinks[drink] = e2;
          }
        }
        let person = states[`person.${slug}`];
        if (!person) {
          for (const [pEntity, pState] of Object.entries(states)) {
            if (pEntity.startsWith('person.') && this._slugify(pState.attributes?.friendly_name || '') === slug) {
              person = pState;
              break;
            }
          }
        }
        const user_id = person?.attributes?.user_id || null;
        const personName = person?.attributes?.friendly_name;
        const name = personName || sensorName || slug;
        users.push({ name, slug, drinks, amount_due_entity: entity, user_id });
      }
    }
    return users;
  }

  _gatherPrices() {
    const prices = {};
    const states = this.hass.states;
    for (const [entity, state] of Object.entries(states)) {
      const match = entity.match(/^sensor\.price_list_([^_]+)_price$/);
      if (match) {
        const drink = match[1];
        const price = parseFloat(state.state);
        prices[drink] = isNaN(price) ? 0 : price;
        if (!this._currency) {
          const cur = state.attributes?.currency || state.attributes?.unit_of_measurement;
          if (cur) this._currency = cur;
        }
      }
    }
    if (!this._currency) {
      const state = states['sensor.price_list_free_amount'];
      const cur = state?.attributes?.currency || state?.attributes?.unit_of_measurement;
      if (cur) this._currency = cur;
    }
    if (!this._currency) {
      for (const [entity, state] of Object.entries(states)) {
        if (/^sensor\.[a-z0-9_]+_amount_due$/.test(entity)) {
          const cur = state.attributes?.currency || state.attributes?.unit_of_measurement;
          if (cur) {
            this._currency = cur;
            break;
          }
        }
      }
    }
    return prices;
  }

  _gatherFreeAmount() {
    const state = this.hass.states['sensor.price_list_free_amount'];
    if (!state) return 0;
    const val = parseFloat(state.state);
    return isNaN(val) ? 0 : val;
  }

  async _fetchTallyAdmins() {
    if (!this.hass?.connection) return;
    try {
      const resp = await this.hass.connection.sendMessagePromise({ type: 'tally_list/get_admins' });
      this._tallyAdmins = Array.isArray(resp?.admins) ? resp.admins : [];
      window.localStorage.setItem('tally-list-admins', JSON.stringify(this._tallyAdmins));
    } catch (err) {
      this._tallyAdmins = [];
    }
  }

  _slugify(str) {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  _currentPersonNames() {
    const userId = this.hass.user?.id;
    if (!userId) return [];
    const names = [];
    for (const [entity, state] of Object.entries(this.hass.states)) {
      if (entity.startsWith('person.') && state.attributes.user_id === userId) {
        const friendly = state.attributes.friendly_name;
        if (friendly) names.push(friendly);
      }
    }
    return names;
  }

  _currentPersonSlugs() {
    const userId = this.hass.user?.id;
    if (!userId) return [];
    const slugs = [];
    for (const [entity, state] of Object.entries(this.hass.states)) {
      if (entity.startsWith('person.') && state.attributes.user_id === userId) {
        const slug = entity.substring('person.'.length);
        slugs.push(slug);
        const alt = this._slugify(state.attributes.friendly_name || '');
        if (alt && alt !== slug) {
          slugs.push(alt);
        }
      }
    }
    return slugs;
  }
  
  _toNumber(value) {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }

  _formatPrice(value) {
    const locale = this.hass?.locale;
    let locales;
    switch (locale?.number_format) {
      case 'comma_decimal':
        locales = ['en-US', 'en'];
        break;
      case 'decimal_comma':
        locales = ['de', 'es', 'it'];
        break;
      case 'space_comma':
        locales = ['fr', 'sv', 'cs'];
        break;
      default:
        locales =
          locale?.language || this.hass?.language || navigator.language || 'en';
    }
    return new Intl.NumberFormat(locales, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  _normalizeWidth(value) {
    if (!value && value !== 0) return '';
    const str = String(value).trim();
    if (str === '') return '';
    return /^\d+$/.test(str) ? `${str}px` : str;
  }

  static async getConfigElement() {
    return document.createElement('tally-list-card-editor');
  }

  static getStubConfig() {
    return {
      lock_ms: 400,
      max_width: '500px',
      show_remove: true,
      only_self: false,
      show_all_users: false,
      show_inactive_drinks: false,
    };
  }

  static styles = css`
    :host {
      display: block;
    }
    ha-card {
      padding: 16px;
      text-align: center;
      margin: 0 auto;
      max-width: var(--dcc-max-width, none);
    }
    .controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 8px;
    }
    .user-select {
      text-align: left;
      display: flex;
      justify-content: flex-start;
      align-items: center;
      gap: 8px;
    }
    .user-label {
      font-weight: bold;
      margin-bottom: 8px;
    }
    .count-row {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
    }
    .count-row button {
      flex: 1;
      height: 32px;
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      background: var(
        --card-background-color,
        var(--ha-card-background, transparent)
      );
      color: var(--primary-text-color);
      transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
    }
    .count-row button.selected {
      background-color: var(--success-color, #2e7d32);
      color: var(--text-primary-color, #fff);
      border: none;
    }
    .user-tabs {
      display: flex;
      overflow-x: auto;
      gap: 8px;
      margin-bottom: 8px;
    }
    .user-tabs button {
      flex: 0 0 auto;
      padding: 8px 12px;
      min-height: 44px;
      height: auto;
      border: none;
      background: var(--secondary-background-color);
      border-radius: 4px;
      transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
      white-space: normal;
      overflow-wrap: anywhere;
    }
    .user-tabs button[aria-selected='true'],
    .user-grid button[aria-pressed='true'] {
      background: var(--label-badge-green, var(--primary-color));
      color: var(--text-primary-color, #fff);
      border: none;
      outline: none;
    }
    .user-grid {
      display: grid;
      margin-bottom: 8px;
      transition: none;
      content-visibility: auto;
      contain-intrinsic-size: 500px 300px;
      gap: 8px;
    }
    .user-grid button {
      min-height: var(--tl-btn-h, 32px);
      height: auto;
      font-size: 1rem;
      width: 100%;
      white-space: normal;
      overflow-wrap: anywhere;
      border: none;
      border-radius: 4px;
      transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
    }
    .user-tabs button:focus,
    .user-grid button:focus {
      outline: none;
    }
    .user-select select,
    .remove-select {
      padding: 4px 8px;
      min-width: 120px;
      font-size: 1rem;
      height: 32px;
      box-sizing: border-box;
    }
    .remove-row td {
      border-bottom: none;
      padding-top: 8px;
      font-weight: normal;
    }
    .remove-row .remove-button {
      height: 32px;
      width: 32px;
      border: none;
      border-radius: 4px;
    }
    .remove-button {
      background-color: var(--error-color, #c62828);
      color: white;
    }
    .remove-select-cell {
      text-align: left;
    }
    .add-button {
      height: 32px;
      width: 32px;
      background-color: var(--success-color, #2e7d32);
      color: white;
      border: none;
      border-radius: 4px;
    }
    .reset-container,
    .copy-container {
      text-align: right;
      margin-top: 8px;
    }
    .copy-container button,
    .reset-container button {
      padding: 4px 8px;
      height: 32px;
      box-sizing: border-box;
      border: none;
      border-radius: 4px;
    }
    .reset-container button {
      background-color: var(--error-color, #c62828);
      color: white;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th,
    td {
      padding: 4px;
      border-bottom: 1px solid var(--divider-color);
      text-align: center;
    }
    button {
      padding: 4px;
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    tfoot td {
      font-weight: bold;
    }
  `;
}

customElements.define('tally-list-card', TallyListCard);

class TallyListCardEditor extends LitElement {
  static properties = {
    _config: {},
  };

  setConfig(config) {
    const tabs = {
      mode: 'per-letter',
      grouped_breaks: ['A–E', 'F–J', 'K–O', 'P–T', 'U–Z'],
      show_all_tab: true,
      ...(config?.tabs || {}),
    };
    const grid = {
      columns: 0,
      ...(config?.grid || {}),
    };
    this._config = {
      lock_ms: 400,
      max_width: '500px',
      show_remove: true,
      only_self: false,
      show_all_users: false,
      show_inactive_drinks: false,
      language: 'auto',
      user_selector: 'list',
      ...config,
      tabs,
      grid,
    };
  }

  _t(key) {
    return t(this.hass, this._config?.language, key);
  }

  render() {
    if (!this._config) return html``;
    return html`
      <div class="form">
        <label>${this._t('lock_ms')}</label>
        <input
          type="number"
          .value=${this._config.lock_ms}
          @input=${this._lockChanged}
        />
      </div>
      <div class="form">
        <label>${this._t('max_width')}</label>
        <input
          type="number"
          .value=${(this._config.max_width ?? '').replace(/px$/, '')}
          @input=${this._widthChanged}
        />
      </div>
      <div class="form">
        <label>
          <input type="checkbox" .checked=${this._config.show_remove} @change=${this._removeChanged} />
          ${this._t('show_remove_menu')}
        </label>
      </div>
      <div class="form">
        <label>
          <input type="checkbox" .checked=${this._config.only_self} @change=${this._selfChanged} />
          ${this._t('only_self')}
        </label>
      </div>
      <div class="form">
        <label>${this._t('user_selector')}</label>
        <select @change=${this._userSelectorChanged}>
          <option value="list" ?selected=${this._config.user_selector === 'list'}>${this._t('user_selector_list')}</option>
          <option value="tabs" ?selected=${this._config.user_selector === 'tabs'}>${this._t('user_selector_tabs')}</option>
          <option value="grid" ?selected=${this._config.user_selector === 'grid'}>${this._t('user_selector_grid')}</option>
        </select>
      </div>
      ${['tabs', 'grid'].includes(this._config.user_selector)
        ? html`
            ${this._config.user_selector === 'tabs'
              ? html`
                  <div class="form">
                    <label>${this._t('tab_mode')}</label>
                    <select @change=${this._tabModeChanged}>
                      <option value="per-letter" ?selected=${this._config.tabs.mode === 'per-letter'}>${this._t('per_letter')}</option>
                      <option value="grouped" ?selected=${this._config.tabs.mode === 'grouped'}>${this._t('grouped')}</option>
                    </select>
                  </div>
                  ${this._config.tabs.mode === 'grouped'
                    ? html`<div class="form">
                        <label>${this._t('grouped_breaks')}</label>
                        <input type="text" .value=${this._config.tabs.grouped_breaks.join(',')} @input=${this._groupedBreaksChanged} />
                      </div>`
                    : ''}
                  <div class="form">
                    <label><input type="checkbox" .checked=${this._config.tabs.show_all_tab} @change=${this._showAllTabChanged} /> ${this._t('show_all_tab')}</label>
                  </div>
                `
              : ''}
            <div class="form">
              <label>${this._t('grid_columns')}</label>
              <input type="text" .value=${this._config.grid.columns} @input=${this._gridColumnsChanged} />
            </div>
          `
        : ''}
      <details class="debug">
        <summary>${this._t('debug')}</summary>
        <div class="form">
          <label>
            <input type="checkbox" .checked=${this._config.show_all_users} @change=${this._debugAllChanged} />
            ${this._t('show_all_users')}
          </label>
        </div>
        <div class="form">
          <label>
            <input type="checkbox" .checked=${this._config.show_inactive_drinks} @change=${this._debugInactiveChanged} />
            ${this._t('show_inactive_drinks')}
          </label>
        </div>
        <div class="form">
          <label>${this._t('language')}</label>
          <select @change=${this._languageChanged}>
            <option value="auto" ?selected=${this._config.language === 'auto'}>${this._t('auto')}</option>
            <option value="de" ?selected=${this._config.language === 'de'}>${this._t('german')}</option>
            <option value="en" ?selected=${this._config.language === 'en'}>${this._t('english')}</option>
          </select>
        </div>
        <div class="version">${this._t('version')}: ${CARD_VERSION}</div>
      </details>
    `;
  }

  _lockChanged(ev) {
    const value = Number(ev.target.value);
    this._config = { ...this._config, lock_ms: isNaN(value) ? 400 : value };
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  _widthChanged(ev) {
    const raw = ev.target.value.trim();
    const width = raw ? `${raw}px` : '';
    this._config = { ...this._config, max_width: width };
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  _removeChanged(ev) {
    this._config = { ...this._config, show_remove: ev.target.checked };
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  _selfChanged(ev) {
    this._config = { ...this._config, only_self: ev.target.checked };
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  _debugAllChanged(ev) {
    this._config = { ...this._config, show_all_users: ev.target.checked };
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  _debugInactiveChanged(ev) {
    this._config = { ...this._config, show_inactive_drinks: ev.target.checked };
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  _languageChanged(ev) {
    this._config = { ...this._config, language: ev.target.value };
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  _userSelectorChanged(ev) {
    this._config = { ...this._config, user_selector: ev.target.value };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true }));
  }

  _tabModeChanged(ev) {
    this._config = {
      ...this._config,
      tabs: { ...this._config.tabs, mode: ev.target.value },
    };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true }));
  }

  _groupedBreaksChanged(ev) {
    const arr = ev.target.value
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    this._config = {
      ...this._config,
      tabs: { ...this._config.tabs, grouped_breaks: arr },
    };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true }));
  }

  _showAllTabChanged(ev) {
    this._config = {
      ...this._config,
      tabs: { ...this._config.tabs, show_all_tab: ev.target.checked },
    };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true }));
  }

  _gridColumnsChanged(ev) {
    const val = ev.target.value.trim();
    const num = Number(val);
    const columns = val === '' || num === 0 ? 0 : Math.max(1, num);
    this._config = {
      ...this._config,
      grid: { ...this._config.grid, columns },
    };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true }));
  }

  static styles = css`
    .form {
      padding: 16px;
    }
    input[type='number'],
    input[type='text'] {
      width: 100%;
      box-sizing: border-box;
    }
    details.debug {
      padding: 0 16px 16px;
    }
    details.debug summary {
      cursor: pointer;
      font-weight: bold;
      outline: none;
    }
    .version {
      padding: 0 16px 16px;
      text-align: center;
      color: var(--secondary-text-color);
    }
  `;
}

customElements.define('tally-list-card-editor', TallyListCardEditor);

class TallyDueRankingCard extends LitElement {
  static properties = {
    hass: {},
    config: {},
    _autoUsers: { state: true },
    _autoPrices: { state: true },
    _freeAmount: { state: true },
    _currency: { state: true },
    _sortBy: { state: true },
    _tallyAdmins: { state: true },
  };

  _tallyAdmins = [];

  constructor() {
    super();
    try {
      const stored = window.localStorage.getItem('tally-list-admins');
      this._tallyAdmins = stored ? JSON.parse(stored) : [];
    } catch (err) {
      this._tallyAdmins = [];
    }
  }

  static styles = [
    TallyListCard.styles,
    css`
      .controls {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        flex-wrap: wrap;
      }
      .controls select {
        padding: 4px 8px;
        min-width: 160px;
        font-size: 1rem;
        height: 32px;
        box-sizing: border-box;
      }
      .reset-container {
        text-align: right;
        margin-top: 8px;
      }
      .reset-container button {
        padding: 4px 8px;
        height: 32px;
        box-sizing: border-box;
        background-color: var(--error-color, #c62828);
        color: white;
        border: none;
        border-radius: 4px;
      }
      .copy-container {
        text-align: right;
        margin-top: 8px;
      }
      .copy-container button {
        padding: 4px 8px;
        height: 32px;
        box-sizing: border-box;
        border: none;
        border-radius: 4px;
      }
    `,
  ];

  setConfig(config) {
    this.config = {
      max_width: '500px',
      sort_by: 'due_desc',
      sort_menu: false,
      show_reset: true,
      show_reset_everyone: false,
      show_total: true,
      max_entries: 0,
      hide_free: false,
      show_copy: true,
      language: 'auto',
      ...config,
    };
    this._sortBy = this.config.sort_by;
    const width = this._normalizeWidth(this.config.max_width);
    if (width) {
      this.style.setProperty('--dcc-max-width', width);
      this.config.max_width = width;
    } else {
      this.style.removeProperty('--dcc-max-width');
      this.config.max_width = '';
    }
  }

  _t(key) {
    return t(this.hass, this.config?.language, key);
  }

  render() {
    if (!this.hass || !this.config) return html``;
    let users = this.config.users || this._autoUsers || [];
    if (users.length === 0) {
      return html`<ha-card>${this._t('integration_missing')}</ha-card>`;
    }
    const userNames = [this.hass.user?.name, ...this._currentPersonNames()];
    const isAdmin = userNames.some(n => (this._tallyAdmins || []).includes(n));
    if (!isAdmin) {
      const allowed = this._currentPersonSlugs();
      const uid = this.hass.user?.id;
      users = users.filter(u => u.user_id === uid || allowed.includes(u.slug));
    }
    if (users.length === 0) {
      return html`<ha-card>${this._t('no_user_access')}</ha-card>`;
    }
    const prices = this.config.prices || this._autoPrices || {};
    const freeAmount = Number(this.config.free_amount ?? this._freeAmount ?? 0);
    let ranking = users.map(u => {
      let total = 0;
      for (const [drink, entity] of Object.entries(u.drinks)) {
        const count = this._toNumber(this.hass.states[entity]?.state);
        const price = this._toNumber(prices[drink]);
        total += count * price;
      }
      let due;
      if (u.amount_due_entity) {
        const s = this.hass.states[u.amount_due_entity];
        const val = parseFloat(s?.state);
        due = isNaN(val) ? Math.max(total - freeAmount, 0) : val;
      } else {
        due = Math.max(total - freeAmount, 0);
      }
      return { name: u.name || u.slug, due };
    });
    if (this.config.hide_free) {
      ranking = ranking.filter(r => r.due > 0);
    }
    const sortBy = this._sortBy || this.config.sort_by || 'due_desc';
    ranking.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'due_asc':
          return a.due - b.due;
        case 'due_desc':
        default:
          return b.due - a.due;
      }
    });
    if (this.config.max_entries > 0) {
      ranking = ranking.slice(0, this.config.max_entries);
    }
    const rows = ranking.map((r, i) => html`<tr><td>${i + 1}</td><td>${r.name}</td><td>${this._formatPrice(r.due)} ${this._currency}</td></tr>`);
    const totalDue = ranking.reduce((sum, r) => sum + r.due, 0);
    const totalRow = this.config.show_total !== false
      ? html`<tfoot><tr><td colspan="2"><b>${this._t('total')}</b></td><td>${this._formatPrice(totalDue)} ${this._currency}</td></tr></tfoot>`
      : '';
    const width = this._normalizeWidth(this.config.max_width);
    const cardStyle = width ? `max-width:${width};margin:0 auto;` : '';
    const sortMenu = this.config.sort_menu
      ? html`<div class="controls">
          <label>${this._t('sort_label')}</label>
          <select @change=${this._sortMenuChanged}>
            <option value="due_desc" ?selected=${sortBy === 'due_desc'}>${this._t('sort_due_desc')}</option>
            <option value="due_asc" ?selected=${sortBy === 'due_asc'}>${this._t('sort_due_asc')}</option>
            <option value="name" ?selected=${sortBy === 'name'}>${this._t('sort_name')}</option>
          </select>
        </div>`
      : '';
    const copyButton = this.config.show_copy !== false
      ? html`<div class="copy-container"><button @click=${this._copyRanking}>${this._t('copy_table')}</button></div>`
      : '';
    const resetButton = (isAdmin || this.config.show_reset_everyone) &&
      this.config.show_reset !== false
      ? html`<div class="reset-container">
          <button @click=${this._resetAllTallies}>${this._t('reset_all')}</button>
        </div>`
      : '';
    return html`
      <ha-card style="${cardStyle}">
        ${sortMenu}
        <table>
          <thead><tr><th>#</th><th>${this._t('name')}</th><th>${this._t('amount_due')}</th></tr></thead>
          <tbody>${rows}</tbody>
          ${totalRow}
        </table>
        ${copyButton}
        ${resetButton}
      </ha-card>
    `;
  }

  updated(changedProps) {
    if (changedProps.has('hass')) {
      if (!this.config.users) {
        this._autoUsers = this._gatherUsers();
      }
      if (!this.config.prices) {
        this._autoPrices = this._gatherPrices();
      }
      if (!this.config.free_amount) {
        this._freeAmount = this._gatherFreeAmount();
      }
      this._fetchTallyAdmins();
    }
  }

  static async getConfigElement() {
    return document.createElement('tally-due-ranking-card-editor');
  }

  static getStubConfig() {
    return {
      max_width: '500px',
      sort_by: 'due_desc',
      sort_menu: false,
      show_total: true,
      max_entries: 0,
      hide_free: false,
      show_copy: true,
    };
  }
  _gatherUsers() {
    const users = [];
    const states = this.hass.states;
    for (const [entity, state] of Object.entries(states)) {
      const match = entity.match(/^sensor\.([a-z0-9_]+)_amount_due$/);
      if (match) {
        const slug = match[1];
        const sensorName = (state.attributes.friendly_name || '').replace(' Amount Due', '');
        const drinks = {};
        const prefix = `sensor.${slug}_`;
        for (const [e2] of Object.entries(states)) {
          const m2 = e2.startsWith(prefix) && e2.endsWith('_count') && e2.match(/^sensor\.[a-z0-9_]+_([^_]+)_count$/);
          if (m2) {
            const drink = m2[1];
            drinks[drink] = e2;
          }
        }
        let person = states[`person.${slug}`];
        if (!person) {
          for (const [pEntity, pState] of Object.entries(states)) {
            if (pEntity.startsWith('person.') && this._slugify(pState.attributes?.friendly_name || '') === slug) {
              person = pState;
              break;
            }
          }
        }
        const user_id = person?.attributes?.user_id || null;
        const personName = person?.attributes?.friendly_name;
        const name = personName || sensorName || slug;
        users.push({ name, slug, drinks, amount_due_entity: entity, user_id });
      }
    }
    return users;
  }

  _gatherPrices() {
    const prices = {};
    const states = this.hass.states;
    for (const [entity, state] of Object.entries(states)) {
      const match = entity.match(/^sensor\.price_list_([^_]+)_price$/);
      if (match) {
        const drink = match[1];
        const price = parseFloat(state.state);
        prices[drink] = isNaN(price) ? 0 : price;
        if (!this._currency) {
          const cur = state.attributes?.currency || state.attributes?.unit_of_measurement;
          if (cur) this._currency = cur;
        }
      }
    }
    if (!this._currency) {
      const state = states['sensor.price_list_free_amount'];
      const cur = state?.attributes?.currency || state?.attributes?.unit_of_measurement;
      if (cur) this._currency = cur;
    }
    if (!this._currency) {
      for (const [entity, state] of Object.entries(states)) {
        if (/^sensor\.[a-z0-9_]+_amount_due$/.test(entity)) {
          const cur = state.attributes?.currency || state.attributes?.unit_of_measurement;
          if (cur) {
            this._currency = cur;
            break;
          }
        }
      }
    }
    return prices;
  }

  _gatherFreeAmount() {
    const state = this.hass.states['sensor.price_list_free_amount'];
    if (!state) return 0;
    const val = parseFloat(state.state);
    return isNaN(val) ? 0 : val;
  }

  async _fetchTallyAdmins() {
    if (!this.hass?.connection) return;
    try {
      const resp = await this.hass.connection.sendMessagePromise({ type: 'tally_list/get_admins' });
      this._tallyAdmins = Array.isArray(resp?.admins) ? resp.admins : [];
      window.localStorage.setItem('tally-list-admins', JSON.stringify(this._tallyAdmins));
    } catch (err) {
      this._tallyAdmins = [];
    }
  }

  _slugify(str) {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  _currentPersonNames() {
    const userId = this.hass.user?.id;
    if (!userId) return [];
    const names = [];
    for (const [entity, state] of Object.entries(this.hass.states)) {
      if (entity.startsWith('person.') && state.attributes.user_id === userId) {
        const friendly = state.attributes.friendly_name;
        if (friendly) names.push(friendly);
      }
    }
    return names;
  }

  _currentPersonSlugs() {
    const userId = this.hass.user?.id;
    if (!userId) return [];
    const slugs = [];
    for (const [entity, state] of Object.entries(this.hass.states)) {
      if (entity.startsWith('person.') && state.attributes.user_id === userId) {
        const slug = entity.substring('person.'.length);
        slugs.push(slug);
        const alt = this._slugify(state.attributes.friendly_name || '');
        if (alt && alt !== slug) {
          slugs.push(alt);
        }
      }
    }
    return slugs;
  }

  _toNumber(value) {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }

  _formatPrice(value) {
    const locale = this.hass?.locale;
    let locales;
    switch (locale?.number_format) {
      case 'comma_decimal':
        locales = ['en-US', 'en'];
        break;
      case 'decimal_comma':
        locales = ['de', 'es', 'it'];
        break;
      case 'space_comma':
        locales = ['fr', 'sv', 'cs'];
        break;
      default:
        locales =
          locale?.language || this.hass?.language || navigator.language || 'en';
    }
    return new Intl.NumberFormat(locales, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  _normalizeWidth(value) {
    if (!value && value !== 0) return '';
    const str = String(value).trim();
    if (str === '') return '';
    return /^\d+$/.test(str) ? `${str}px` : str;
  }

  _sortMenuChanged(ev) {
    this._sortBy = ev.target.value;
  }

  _copyRanking() {
    let users = this.config.users || this._autoUsers || [];
    const userNames = [this.hass.user?.name, ...this._currentPersonNames()];
    const isAdmin = userNames.some(n => (this._tallyAdmins || []).includes(n));
    if (!isAdmin) {
      const allowed = this._currentPersonSlugs();
      const uid = this.hass.user?.id;
      users = users.filter(u => u.user_id === uid || allowed.includes(u.slug));
    }
    if (users.length === 0) return;
    const prices = this.config.prices || this._autoPrices || {};
    const freeAmount = Number(this.config.free_amount ?? this._freeAmount ?? 0);
    let ranking = users.map(u => {
      let total = 0;
      for (const [drink, entity] of Object.entries(u.drinks)) {
        const count = this._toNumber(this.hass.states[entity]?.state);
        const price = this._toNumber(prices[drink]);
        total += count * price;
      }
      let due;
      if (u.amount_due_entity) {
        const s = this.hass.states[u.amount_due_entity];
        const val = parseFloat(s?.state);
        due = isNaN(val) ? Math.max(total - freeAmount, 0) : val;
      } else {
        due = Math.max(total - freeAmount, 0);
      }
      return { name: u.name || u.slug, due };
    });
    if (this.config.hide_free) {
      ranking = ranking.filter(r => r.due > 0);
    }
    const sortBy = this._sortBy || this.config.sort_by || 'due_desc';
    ranking.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'due_asc':
          return a.due - b.due;
        case 'due_desc':
        default:
          return b.due - a.due;
      }
    });
    if (this.config.max_entries > 0) {
      ranking = ranking.slice(0, this.config.max_entries);
    }
    const lines = ranking.map((r, i) => `${i + 1}. ${r.name}: ${this._formatPrice(r.due)} ${this._currency}`);
    if (this.config.show_total !== false) {
      const total = ranking.reduce((sum, r) => sum + r.due, 0);
      lines.push(`${this._t('total')}: ${this._formatPrice(total)} ${this._currency}`);
    }
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      this.dispatchEvent(
        new CustomEvent('hass-notification', {
          detail: { message: this._t('copy_success') },
          bubbles: true,
          composed: true,
        })
      );
    });
  }

  _resetAllTallies() {
    const input = prompt(this._t('reset_confirm_prompt'));
    const normalized = (input || '').trim().toUpperCase();
    if (normalized !== 'JA ICH WILL' && normalized !== 'YES I WANT TO') {
      return;
    }
    const users = this.config.users || this._autoUsers || [];
    for (const u of users) {
      const buttonId = `button.${u.slug}_reset_tally`;
      this.hass.callService('button', 'press', { entity_id: buttonId });
      for (const entity of Object.values(u.drinks || {})) {
        this.hass.callService('homeassistant', 'update_entity', { entity_id: entity });
      }
      if (u.amount_due_entity) {
        this.hass.callService('homeassistant', 'update_entity', { entity_id: u.amount_due_entity });
      }
    }
  }
}

customElements.define('tally-due-ranking-card', TallyDueRankingCard);

class TallyDueRankingCardEditor extends LitElement {
  static properties = {
    _config: {},
  };

  setConfig(config) {
    this._config = {
      max_width: '500px',
      sort_by: 'due_desc',
      sort_menu: false,
      show_reset: true,
      show_reset_everyone: false,
      show_total: true,
      max_entries: 0,
      hide_free: false,
      show_copy: true,
      language: 'auto',
      ...config,
    };
  }

  _t(key) {
    return t(this.hass, this._config?.language, key);
  }

  render() {
    if (!this._config) return html``;
    return html`
      <div class="form">
        <label>${this._t('max_width')}</label>
        <input
          type="number"
          .value=${(this._config.max_width ?? '').replace(/px$/, '')}
          @input=${this._widthChanged}
        />
      </div>
      <div class="form">
        <label>${this._t('max_entries')}</label>
        <input
          type="number"
          .value=${this._config.max_entries ?? 0}
          @input=${this._maxChanged}
        />
      </div>
      <div class="form">
        <label>${this._t('sort')}</label>
        <select @change=${this._sortChanged}>
          <option value="due_desc" ?selected=${this._config.sort_by === 'due_desc'}>
            ${this._t('sort_due_desc')}
          </option>
          <option value="due_asc" ?selected=${this._config.sort_by === 'due_asc'}>
            ${this._t('sort_due_asc')}
          </option>
          <option value="name" ?selected=${this._config.sort_by === 'name'}>
            ${this._t('sort_name')}
          </option>
        </select>
      </div>
      <div class="form">
        <label>
          <input type="checkbox" .checked=${this._config.sort_menu} @change=${this._menuChanged} />
          ${this._t('sort_menu_show')}
        </label>
      </div>
      <div class="form">
        <label>
          <input type="checkbox" .checked=${this._config.show_reset} @change=${this._resetChanged} />
          ${this._t('show_reset')}
        </label>
      </div>
      <div class="form">
        <label>
          <input type="checkbox" .checked=${this._config.show_copy} @change=${this._copyChanged} />
          ${this._t('show_copy')}
        </label>
      </div>
      <div class="form">
        <label>
          <input type="checkbox" .checked=${this._config.show_total} @change=${this._totalChanged} />
          ${this._t('show_total')}
        </label>
      </div>
      <div class="form">
        <label>
          <input type="checkbox" .checked=${this._config.hide_free} @change=${this._hideChanged} />
          ${this._t('hide_free')}
        </label>
      </div>
      <details class="debug">
        <summary>${this._t('debug')}</summary>
        <div class="form">
          <label>
            <input type="checkbox" .checked=${this._config.show_reset_everyone} @change=${this._debugResetChanged} />
            ${this._t('show_reset_everyone')}
          </label>
        </div>
        <div class="form">
          <label>${this._t('language')}</label>
          <select @change=${this._languageChanged}>
            <option value="auto" ?selected=${this._config.language === 'auto'}>${this._t('auto')}</option>
            <option value="de" ?selected=${this._config.language === 'de'}>${this._t('german')}</option>
            <option value="en" ?selected=${this._config.language === 'en'}>${this._t('english')}</option>
          </select>
        </div>
        <div class="version">${this._t('version')}: ${CARD_VERSION}</div>
      </details>
    `;
  }

  _widthChanged(ev) {
    const raw = ev.target.value.trim();
    const width = raw ? `${raw}px` : '';
    this._config = { ...this._config, max_width: width };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _sortChanged(ev) {
    const val = ev.target.value;
    this._config = { ...this._config, sort_by: val };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _menuChanged(ev) {
    this._config = { ...this._config, sort_menu: ev.target.checked };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _resetChanged(ev) {
    this._config = { ...this._config, show_reset: ev.target.checked };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _copyChanged(ev) {
    this._config = { ...this._config, show_copy: ev.target.checked };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _totalChanged(ev) {
    this._config = { ...this._config, show_total: ev.target.checked };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _maxChanged(ev) {
    const val = parseInt(ev.target.value, 10);
    this._config = { ...this._config, max_entries: isNaN(val) ? 0 : val };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _hideChanged(ev) {
    this._config = { ...this._config, hide_free: ev.target.checked };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _debugResetChanged(ev) {
    this._config = { ...this._config, show_reset_everyone: ev.target.checked };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _languageChanged(ev) {
    this._config = { ...this._config, language: ev.target.value };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  static styles = TallyListCardEditor.styles;
}

customElements.define('tally-due-ranking-card-editor', TallyDueRankingCardEditor);

