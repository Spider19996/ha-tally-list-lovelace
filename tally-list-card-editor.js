import { LitElement, html, css } from 'https://unpkg.com/lit?module';
import { translate, fireEvent } from './tally-list-card.js';
const CARD_VERSION = '06.09.2025';

const TL_STRINGS = {
  en: {
    lock_ms: 'Lock duration (ms)',
    pin_lock_ms: 'PIN lock duration (ms)',
    max_width: 'Maximum width (px)',
    free_drinks_timer_seconds: 'Free drinks timer (s)',
    free_drinks_per_item_limit: 'Free drinks per item limit',
    free_drinks_total_limit: 'Free drinks total limit',
    show_remove_menu: 'Show remove menu',
    only_self: 'Only show own user even for admins',
    show_step_select: 'Show step selection',
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
    grid_columns: 'Grid columns (0 = auto)',
  },
  de: {
    lock_ms: 'Sperrzeit (ms)',
    pin_lock_ms: 'PIN-Sperrzeit (ms)',
    max_width: 'Maximale Breite (px)',
    free_drinks_timer_seconds: 'Freigetränke-Timer (s)',
    free_drinks_per_item_limit: 'Limit je Getränk (0 = aus)',
    free_drinks_total_limit: 'Gesamtlimit (0 = aus)',
    show_remove_menu: 'Entfernen-Menü anzeigen',
    only_self: 'Trotz Admin nur eigenen Nutzer anzeigen',
    show_step_select: 'Schrittweiten-Auswahl anzeigen',
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
    grid_columns: 'Spalten (0 = automatisch)',
  },
};

function t(hass, override, key) {
  return translate(hass, override, TL_STRINGS, key);
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
      ...(config?.tabs || {}),
    };
    const grid = {
      columns: 0,
      ...(config?.grid || {}),
    };
    this._config = {
      lock_ms: 400,
      pin_lock_ms: 5000,
      max_width: '500px',
      free_drinks_timer_seconds: 0,
      free_drinks_per_item_limit: 0,
      free_drinks_total_limit: 0,
      show_remove: true,
      only_self: false,
      show_step_select: true,
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
        <label>${this._t('pin_lock_ms')}</label>
        <input
          type="number"
          .value=${this._config.pin_lock_ms}
          @input=${this._pinLockChanged}
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
        <label>${this._t('free_drinks_timer_seconds')}</label>
        <input
          type="number"
          .value=${this._config.free_drinks_timer_seconds}
          @input=${this._fdTimerChanged}
        />
      </div>
      <div class="form">
        <label>${this._t('free_drinks_per_item_limit')}</label>
        <input
          type="number"
          .value=${this._config.free_drinks_per_item_limit}
          @input=${this._fdPerItemChanged}
        />
      </div>
      <div class="form">
        <label>${this._t('free_drinks_total_limit')}</label>
        <input
          type="number"
          .value=${this._config.free_drinks_total_limit}
          @input=${this._fdTotalChanged}
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
          <input type="checkbox" .checked=${this._config.show_step_select !== false} @change=${this._stepSelectChanged} />
          ${this._t('show_step_select')}
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

  _pinLockChanged(ev) {
    const value = Number(ev.target.value);
    this._config = { ...this._config, pin_lock_ms: isNaN(value) ? 5000 : value };
    fireEvent(this, 'config-changed', { config: this._config });
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

  _stepSelectChanged(ev) {
    this._config = { ...this._config, show_step_select: ev.target.checked };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _selfChanged(ev) {
    this._config = { ...this._config, only_self: ev.target.checked };
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

  _gridColumnsChanged(ev) {
    const val = ev.target.value.trim();
    const num = Number(val);
    const columns = val === '' || num === 0 ? 0 : Math.max(1, num);
    this._config = {
      ...this._config,
      grid: { ...this._config.grid, columns },
    };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _fdTimerChanged(ev) {
    const value = Number(ev.target.value);
    this._config = {
      ...this._config,
      free_drinks_timer_seconds: isNaN(value) ? 0 : value,
    };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _fdPerItemChanged(ev) {
    const value = Number(ev.target.value);
    this._config = {
      ...this._config,
      free_drinks_per_item_limit: isNaN(value) ? 0 : value,
    };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _fdTotalChanged(ev) {
    const value = Number(ev.target.value);
    this._config = {
      ...this._config,
      free_drinks_total_limit: isNaN(value) ? 0 : value,
    };
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
