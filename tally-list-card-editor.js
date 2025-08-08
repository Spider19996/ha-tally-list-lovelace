import { LitElement, html, css } from 'https://unpkg.com/lit?module';
const CARD_VERSION = '08.08.2025';

const TL_STRINGS = {
  en: {
    general: 'General',
    user_global: 'User selection',
    tabs_section: 'Tabs',
    grid_section: 'Grid',
    labels_section: 'Labels',
    accessibility_section: 'Accessibility',
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
    tab_all_label: 'Label for "All" tab',
    tab_misc_label: 'Label for "#" tab',
    focus_outline: 'Show focus outline',
    keyboard_hint: 'Keyboard: Tab to focus, Enter/Space to activate.',
    title: 'Title',
  },
  de: {
    general: 'Allgemein',
    user_global: 'Nutzerauswahl',
    tabs_section: 'Tabs',
    grid_section: 'Grid',
    labels_section: 'Beschriftungen',
    accessibility_section: 'Barrierefreiheit',
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
    tab_all_label: 'Beschriftung "Alle" Tab',
    tab_misc_label: 'Beschriftung "#" Tab',
    focus_outline: 'Fokusrahmen anzeigen',
    keyboard_hint: 'Tastatur: Mit Tab wechseln, Enter/Leertaste auslösen.',
    title: 'Titel',
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
      button_height_px: 32,
      font_size_rem: 1.0,
      wrap_labels: false,
      ...(config?.grid || {}),
    };
    const i18n = {
      tab_all_label: 'Alle',
      tab_misc_label: '#',
      ...(config?.i18n || {}),
    };
    this._config = {
      title: config?.title,
      lock_ms: 400,
      max_width: '500px',
      show_remove: true,
      only_self: false,
      show_all_users: false,
      show_inactive_drinks: false,
      language: 'auto',
      user_selector: 'list',
      focus_outline: true,
      ...config,
      tabs,
      grid,
      i18n,
    };
  }

  _t(key) {
    return t(this.hass, this._config?.language, key);
  }

  get _generalSchema() {
    return [
      { name: 'title', label: this._t('title'), selector: { text: {} } },
      { name: 'lock_ms', label: this._t('lock_ms'), selector: { number: { min: 0 } } },
      { name: 'max_width', label: this._t('max_width'), selector: { text: {} } },
      {
        name: 'show_remove',
        label: this._t('show_remove_menu'),
        selector: { boolean: {} },
      },
      {
        name: 'user_selector',
        label: this._t('user_selector'),
        selector: {
          select: {
            options: [
              { value: 'list', label: this._t('user_selector_list') },
              { value: 'tabs', label: this._t('user_selector_tabs') },
              { value: 'grid', label: this._t('user_selector_grid') },
            ],
          },
        },
      },
    ];
  }

  get _userGlobalSchema() {
    return [
      {
        name: 'only_self',
        label: this._t('only_self'),
        selector: { boolean: {} },
      },
    ];
  }

  get _tabsSchema() {
    const schema = [
      {
        name: 'mode',
        label: this._t('tab_mode'),
        selector: {
          select: {
            options: [
              { value: 'per-letter', label: this._t('per_letter') },
              { value: 'grouped', label: this._t('grouped') },
            ],
          },
        },
      },
    ];
    if (this._config.tabs?.mode === 'grouped') {
      schema.push({
        name: 'grouped_breaks',
        label: this._t('grouped_breaks'),
        selector: { text: {} },
      });
    }
    schema.push(
      {
        name: 'show_all_tab',
        label: this._t('show_all_tab'),
        selector: { boolean: {} },
      },
      {
        name: 'show_misc_tab',
        label: this._t('show_misc_tab'),
        selector: { boolean: {} },
      }
    );
    return schema;
  }

  get _gridSchema() {
    return [
      {
        name: 'columns',
        label: this._t('grid_columns'),
        selector: { text: {} },
      },
      {
        name: 'min_button_width_px',
        label: this._t('grid_min_width'),
        selector: { number: { min: 1 } },
      },
      {
        name: 'max_button_width_px',
        label: this._t('grid_max_width'),
        selector: { number: { min: 1 } },
      },
      {
        name: 'gap_px',
        label: this._t('grid_gap'),
        selector: { number: { min: 0 } },
      },
      {
        name: 'button_height_px',
        label: this._t('grid_button_height'),
        selector: { number: { min: 1 } },
      },
      {
        name: 'font_size_rem',
        label: this._t('grid_font_size'),
        selector: { number: { min: 0.1, step: 0.1 } },
      },
      {
        name: 'wrap_labels',
        label: this._t('grid_wrap_labels'),
        selector: { boolean: {} },
      },
    ];
  }

  get _i18nSchema() {
    return [
      {
        name: 'tab_all_label',
        label: this._t('tab_all_label'),
        selector: { text: {} },
      },
      {
        name: 'tab_misc_label',
        label: this._t('tab_misc_label'),
        selector: { text: {} },
      },
    ];
  }

  get _a11ySchema() {
    return [
      {
        name: 'focus_outline',
        label: this._t('focus_outline'),
        selector: { boolean: {} },
      },
    ];
  }

  get _debugSchema() {
    return [
      {
        name: 'show_all_users',
        label: this._t('show_all_users'),
        selector: { boolean: {} },
      },
      {
        name: 'show_inactive_drinks',
        label: this._t('show_inactive_drinks'),
        selector: { boolean: {} },
      },
      {
        name: 'language',
        label: this._t('language'),
        selector: {
          select: {
            options: [
              { value: 'auto', label: this._t('auto') },
              { value: 'de', label: this._t('german') },
              { value: 'en', label: this._t('english') },
            ],
          },
        },
      },
    ];
  }

  render() {
    if (!this._config) return html``;
    return html`
      <ha-expansion-panel .expanded=${true}>
        <span slot="header">${this._t('general')}</span>
        <ha-form
          .data=${this._generalData}
          .schema=${this._generalSchema}
          @value-changed=${this._generalChanged}
        ></ha-form>
      </ha-expansion-panel>

      <ha-expansion-panel>
        <span slot="header">${this._t('user_global')}</span>
        <ha-form
          .data=${this._userGlobalData}
          .schema=${this._userGlobalSchema}
          @value-changed=${this._userGlobalChanged}
        ></ha-form>
      </ha-expansion-panel>

      ${this._config.user_selector === 'tabs'
        ? html`<ha-expansion-panel>
            <span slot="header">${this._t('tabs_section')}</span>
            <ha-form
              .data=${this._tabsData}
              .schema=${this._tabsSchema}
              @value-changed=${this._tabsChanged}
            ></ha-form>
          </ha-expansion-panel>`
        : ''}

      ${['tabs', 'grid'].includes(this._config.user_selector)
        ? html`<ha-expansion-panel>
            <span slot="header">${this._t('grid_section')}</span>
            <ha-form
              .data=${this._gridData}
              .schema=${this._gridSchema}
              @value-changed=${this._gridChanged}
            ></ha-form>
          </ha-expansion-panel>`
        : ''}

      <ha-expansion-panel>
        <span slot="header">${this._t('labels_section')}</span>
        <ha-form
          .data=${this._i18nData}
          .schema=${this._i18nSchema}
          @value-changed=${this._i18nChanged}
        ></ha-form>
      </ha-expansion-panel>

      <ha-expansion-panel>
        <span slot="header">${this._t('accessibility_section')}</span>
        <p class="hint">${this._t('keyboard_hint')}</p>
        <ha-form
          .data=${this._a11yData}
          .schema=${this._a11ySchema}
          @value-changed=${this._a11yChanged}
        ></ha-form>
      </ha-expansion-panel>

      <ha-expansion-panel>
        <span slot="header">${this._t('debug')}</span>
        <ha-form
          .data=${this._debugData}
          .schema=${this._debugSchema}
          @value-changed=${this._debugChanged}
        ></ha-form>
        <div class="version">${this._t('version')}: ${CARD_VERSION}</div>
      </ha-expansion-panel>
    `;
  }

  get _generalData() {
    return {
      title: this._config.title || '',
      lock_ms: this._config.lock_ms,
      max_width: (this._config.max_width || '').replace(/px$/, ''),
      show_remove: this._config.show_remove,
      user_selector: this._config.user_selector,
    };
  }

  get _userGlobalData() {
    return { only_self: this._config.only_self };
  }

  get _tabsData() {
    return {
      ...this._config.tabs,
      grouped_breaks: this._config.tabs.grouped_breaks.join(','),
    };
  }

  get _gridData() {
    return { ...this._config.grid, columns: String(this._config.grid.columns) };
  }

  get _i18nData() {
    return { ...this._config.i18n };
  }

  get _a11yData() {
    return { focus_outline: this._config.focus_outline !== false };
  }

  get _debugData() {
    return {
      show_all_users: this._config.show_all_users,
      show_inactive_drinks: this._config.show_inactive_drinks,
      language: this._config.language,
    };
  }

  _emitConfig() {
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _generalChanged(ev) {
    const data = ev.detail.value;
    const max_width = data.max_width ? `${Number(data.max_width)}px` : '';
    this._config = {
      ...this._config,
      title: data.title || undefined,
      lock_ms: Number(data.lock_ms),
      max_width,
      show_remove: data.show_remove,
      user_selector: data.user_selector,
    };
    this._emitConfig();
  }

  _userGlobalChanged(ev) {
    const data = ev.detail.value;
    this._config = { ...this._config, only_self: data.only_self };
    this._emitConfig();
  }

  _tabsChanged(ev) {
    const data = ev.detail.value;
    const tabs = {
      ...this._config.tabs,
      mode: data.mode,
      show_all_tab: data.show_all_tab,
      show_misc_tab: data.show_misc_tab,
    };
    if (data.grouped_breaks !== undefined) {
      tabs.grouped_breaks = data.grouped_breaks
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    }
    this._config = { ...this._config, tabs };
    this._emitConfig();
  }

  _gridChanged(ev) {
    const d = ev.detail.value;
    const columns = d.columns === '' || d.columns === 'auto'
      ? 'auto'
      : Math.max(1, Number(d.columns));
    const grid = {
      ...this._config.grid,
      columns,
      min_button_width_px: Math.max(1, Number(d.min_button_width_px)),
      max_button_width_px: Math.max(1, Number(d.max_button_width_px)),
      gap_px: Math.max(0, Number(d.gap_px)),
      button_height_px: Math.max(1, Number(d.button_height_px)),
      font_size_rem: Math.max(0.1, Number(d.font_size_rem)),
      wrap_labels: d.wrap_labels,
    };
    this._config = { ...this._config, grid };
    this._emitConfig();
  }

  _i18nChanged(ev) {
    const data = ev.detail.value;
    const i18n = { ...this._config.i18n, ...data };
    this._config = { ...this._config, i18n };
    this._emitConfig();
  }

  _a11yChanged(ev) {
    const data = ev.detail.value;
    this._config = { ...this._config, focus_outline: data.focus_outline };
    this._emitConfig();
  }

  _debugChanged(ev) {
    const data = ev.detail.value;
    this._config = {
      ...this._config,
      show_all_users: data.show_all_users,
      show_inactive_drinks: data.show_inactive_drinks,
      language: data.language,
    };
    this._emitConfig();
  }

  static styles = css`
    ha-expansion-panel {
      margin-bottom: 8px;
    }
    .version {
      padding: 0 16px 16px;
      text-align: center;
      color: var(--secondary-text-color);
    }
    .hint {
      padding: 0 16px;
      color: var(--secondary-text-color);
    }
  `;
}

customElements.define('tally-list-card-editor', TallyListCardEditor);
