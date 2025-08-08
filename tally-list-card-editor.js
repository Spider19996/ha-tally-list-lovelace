import { LitElement, html, css } from 'https://unpkg.com/lit?module';
const CARD_VERSION = '08.08.2025';

const TL_STRINGS = {
  en: {
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
    version: 'Version',
    general: 'General',
    user_selection: 'User selection',
    tabs_section: 'Tabs',
    grid_section: 'Grid',
    labels_section: 'Labels',
    accessibility: 'Accessibility',
    title: 'Title',
    currency_override: 'Currency override',
    tab_all_label_label: '"All" tab label',
    tab_misc_label_label: '"#" tab label',
    user_selector: 'User selector',
    user_selector_list: 'List',
    user_selector_tabs: 'Tabs',
    user_selector_grid: 'Grid',
    tab_mode: 'Tab mode',
    per_letter: 'Per letter',
    grouped: 'Grouped',
    grouped_breaks: 'Grouped breaks',
    show_all_tab: 'Show "All" tab',
    show_misc_tab: 'Show "#" tab',
    grid_columns: 'Grid columns',
    grid_min_width: 'Min button width (px)',
    grid_max_width: 'Max button width (px)',
    grid_gap: 'Gap (px)',
    grid_button_height: 'Button height (px)',
    grid_font_size: 'Font size (rem)',
    grid_wrap_labels: 'Wrap labels',
    focus_outline: 'Show focus outline',
  },
  de: {
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
    version: 'Version',
    general: 'Allgemein',
    user_selection: 'Nutzerauswahl',
    tabs_section: 'Tabs',
    grid_section: 'Grid',
    labels_section: 'Beschriftungen',
    accessibility: 'Barrierefreiheit',
    title: 'Titel',
    currency_override: 'Währung überschreiben',
    tab_all_label_label: 'Tab "Alle" Beschriftung',
    tab_misc_label_label: 'Tab "#" Beschriftung',
    user_selector: 'Nutzerauswahl',
    user_selector_list: 'Liste',
    user_selector_tabs: 'Tabs',
    user_selector_grid: 'Grid',
    tab_mode: 'Tab-Modus',
    per_letter: 'Pro Buchstabe',
    grouped: 'Gruppiert',
    grouped_breaks: 'Gruppierte Bereiche',
    show_all_tab: 'Tab "Alle" anzeigen',
    show_misc_tab: 'Tab "#" anzeigen',
    grid_columns: 'Spalten',
    grid_min_width: 'Minimale Buttonbreite (px)',
    grid_max_width: 'Maximale Buttonbreite (px)',
    grid_gap: 'Abstand (px)',
    grid_button_height: 'Buttonhöhe (px)',
    grid_font_size: 'Schriftgröße (rem)',
    grid_wrap_labels: 'Text umbrechen',
    focus_outline: 'Fokusrahmen anzeigen',
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

class TallyListCardEditor extends LitElement {
  static properties = {
    _config: {},
  };

  setConfig(config) {
    const tabs = {
      mode: 'per-letter',
      grouped_breaks: ['A–E', 'F–J', 'K–O', 'P–T', 'U–Z'],
      show_all_tab: true,
      show_misc_tab: true,
      ...(config?.tabs || {}),
    };
    const grid = {
      columns: 'auto',
      min_button_width_px: 88,
      max_button_width_px: 160,
      gap_px: 8,
      button_height_px: 56,
      font_size_rem: 1.0,
      wrap_labels: false,
      ...(config?.grid || {}),
    };
    const i18n = {
      tab_all_label: 'All',
      tab_misc_label: '#',
      ...(config?.i18n || {}),
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
      focus_outline: true,
      title: '',
      currency_override: '',
      ...config,
      tabs,
      grid,
      i18n,
    };
  }

  _t(key) {
    return t(this.hass, this._config?.language, key);
  }

  render() {
    if (!this._config) return html``;
    const showTabs = this._config.user_selector === 'tabs';
    const showGrid = ['tabs', 'grid'].includes(this._config.user_selector);
    return html`
      <ha-expansion-panel .header=${this._t('general')}>
        <div class="form">
          <label>${this._t('lock_ms')}</label>
          <input type="number" .value=${this._config.lock_ms} @input=${this._lockChanged} />
        </div>
        <div class="form">
          <label>${this._t('max_width')}</label>
          <input type="number" .value=${(this._config.max_width ?? '').replace(/px$/, '')} @input=${this._widthChanged} />
        </div>
        <div class="form">
          <label><input type="checkbox" .checked=${this._config.show_remove} @change=${this._removeChanged} /> ${this._t('show_remove_menu')}</label>
        </div>
        <div class="form">
          <label><input type="checkbox" .checked=${this._config.only_self} @change=${this._selfChanged} /> ${this._t('only_self')}</label>
        </div>
        <div class="form">
          <label>${this._t('title')}</label>
          <input type="text" .value=${this._config.title || ''} @input=${this._titleChanged} />
        </div>
        <div class="form">
          <label>${this._t('currency_override')}</label>
          <input type="text" .value=${this._config.currency_override || ''} @input=${this._currencyChanged} />
        </div>
      </ha-expansion-panel>

      <ha-expansion-panel .header=${this._t('user_selection')}>
        <div class="form">
          <label>${this._t('user_selector')}</label>
          <select @change=${this._userSelectorChanged}>
            <option value="list" ?selected=${this._config.user_selector === 'list'}>${this._t('user_selector_list')}</option>
            <option value="tabs" ?selected=${this._config.user_selector === 'tabs'}>${this._t('user_selector_tabs')}</option>
            <option value="grid" ?selected=${this._config.user_selector === 'grid'}>${this._t('user_selector_grid')}</option>
          </select>
        </div>
      </ha-expansion-panel>

      ${showTabs
        ? html`<ha-expansion-panel .header=${this._t('tabs_section')}>
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
            <div class="form">
              <label><input type="checkbox" .checked=${this._config.tabs.show_misc_tab} @change=${this._showMiscTabChanged} /> ${this._t('show_misc_tab')}</label>
            </div>
          </ha-expansion-panel>`
        : ''}

      ${showGrid
        ? html`<ha-expansion-panel .header=${this._t('grid_section')}>
            <div class="form">
              <label>${this._t('grid_columns')}</label>
              <input type="text" .value=${this._config.grid.columns} @input=${this._gridColumnsChanged} />
            </div>
            <div class="form">
              <label>${this._t('grid_min_width')}</label>
              <input type="number" min="1" .value=${this._config.grid.min_button_width_px} @input=${this._gridMinWidthChanged} />
            </div>
            <div class="form">
              <label>${this._t('grid_max_width')}</label>
              <input type="number" min="1" .value=${this._config.grid.max_button_width_px} @input=${this._gridMaxWidthChanged} />
            </div>
            <div class="form">
              <label>${this._t('grid_gap')}</label>
              <input type="number" min="0" .value=${this._config.grid.gap_px} @input=${this._gridGapChanged} />
            </div>
            <div class="form">
              <label>${this._t('grid_button_height')}</label>
              <input type="number" min="1" .value=${this._config.grid.button_height_px} @input=${this._gridButtonHeightChanged} />
            </div>
            <div class="form">
              <label>${this._t('grid_font_size')}</label>
              <input type="number" step="0.1" min="0.1" .value=${this._config.grid.font_size_rem} @input=${this._gridFontSizeChanged} />
            </div>
            <div class="form">
              <label><input type="checkbox" .checked=${this._config.grid.wrap_labels} @change=${this._gridWrapChanged} /> ${this._t('grid_wrap_labels')}</label>
            </div>
          </ha-expansion-panel>`
        : ''}

      <ha-expansion-panel .header=${this._t('labels_section')}>
        <div class="form">
          <label>${this._t('tab_all_label_label')}</label>
          <input type="text" .value=${this._config.i18n.tab_all_label} @input=${this._tabAllLabelChanged} />
        </div>
        <div class="form">
          <label>${this._t('tab_misc_label_label')}</label>
          <input type="text" .value=${this._config.i18n.tab_misc_label} @input=${this._tabMiscLabelChanged} />
        </div>
      </ha-expansion-panel>

      <ha-expansion-panel .header=${this._t('accessibility')}>
        <div class="form">
          <label><input type="checkbox" .checked=${this._config.focus_outline !== false} @change=${this._focusOutlineChanged} /> ${this._t('focus_outline')}</label>
        </div>
      </ha-expansion-panel>

      <details class="debug">
        <summary>${this._t('debug')}</summary>
        <div class="form">
          <label><input type="checkbox" .checked=${this._config.show_all_users} @change=${this._debugAllChanged} /> ${this._t('show_all_users')}</label>
        </div>
        <div class="form">
          <label><input type="checkbox" .checked=${this._config.show_inactive_drinks} @change=${this._debugInactiveChanged} /> ${this._t('show_inactive_drinks')}</label>
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
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _widthChanged(ev) {
    const raw = ev.target.value.trim();
    const width = raw ? `${raw}px` : '';
    this._config = { ...this._config, max_width: width };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _removeChanged(ev) {
    this._config = { ...this._config, show_remove: ev.target.checked };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _selfChanged(ev) {
    this._config = { ...this._config, only_self: ev.target.checked };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _titleChanged(ev) {
    this._config = { ...this._config, title: ev.target.value };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _currencyChanged(ev) {
    this._config = { ...this._config, currency_override: ev.target.value };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _debugAllChanged(ev) {
    this._config = { ...this._config, show_all_users: ev.target.checked };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _debugInactiveChanged(ev) {
    this._config = { ...this._config, show_inactive_drinks: ev.target.checked };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _languageChanged(ev) {
    this._config = { ...this._config, language: ev.target.value };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _userSelectorChanged(ev) {
    this._config = { ...this._config, user_selector: ev.target.value };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _tabModeChanged(ev) {
    this._config = {
      ...this._config,
      tabs: { ...this._config.tabs, mode: ev.target.value },
    };
    fireEvent(this, 'config-changed', { config: this._config });
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
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _showAllTabChanged(ev) {
    this._config = {
      ...this._config,
      tabs: { ...this._config.tabs, show_all_tab: ev.target.checked },
    };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _showMiscTabChanged(ev) {
    this._config = {
      ...this._config,
      tabs: { ...this._config.tabs, show_misc_tab: ev.target.checked },
    };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _gridColumnsChanged(ev) {
    const val = ev.target.value.trim();
    const columns = val === '' || val === 'auto' ? 'auto' : Math.max(1, Number(val));
    this._config = {
      ...this._config,
      grid: { ...this._config.grid, columns },
    };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _gridMinWidthChanged(ev) {
    const v = Math.max(1, Number(ev.target.value));
    this._config = {
      ...this._config,
      grid: { ...this._config.grid, min_button_width_px: v },
    };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _gridMaxWidthChanged(ev) {
    const v = Math.max(1, Number(ev.target.value));
    this._config = {
      ...this._config,
      grid: { ...this._config.grid, max_button_width_px: v },
    };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _gridGapChanged(ev) {
    const v = Math.max(0, Number(ev.target.value));
    this._config = {
      ...this._config,
      grid: { ...this._config.grid, gap_px: v },
    };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _gridButtonHeightChanged(ev) {
    const v = Math.max(1, Number(ev.target.value));
    this._config = {
      ...this._config,
      grid: { ...this._config.grid, button_height_px: v },
    };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _gridFontSizeChanged(ev) {
    const v = Math.max(0.1, Number(ev.target.value));
    this._config = {
      ...this._config,
      grid: { ...this._config.grid, font_size_rem: v },
    };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _gridWrapChanged(ev) {
    this._config = {
      ...this._config,
      grid: { ...this._config.grid, wrap_labels: ev.target.checked },
    };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _tabAllLabelChanged(ev) {
    this._config = {
      ...this._config,
      i18n: { ...this._config.i18n, tab_all_label: ev.target.value },
    };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _tabMiscLabelChanged(ev) {
    this._config = {
      ...this._config,
      i18n: { ...this._config.i18n, tab_misc_label: ev.target.value },
    };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _focusOutlineChanged(ev) {
    this._config = { ...this._config, focus_outline: ev.target.checked };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  static styles = css`
    .form {
      padding: 16px;
    }
    input {
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
