import { LitElement, html, css } from 'https://unpkg.com/lit?module';

function detectLang(hass, override = 'auto') {
  if (override && override !== 'auto') return override;
  const lang =
    hass?.language || hass?.locale?.language || navigator.language || 'en';
  return lang.toLowerCase().startsWith('de') ? 'de' : 'en';
}

function translate(hass, override, strings, key) {
  const lang = detectLang(hass, override);
  return strings[lang]?.[key] ?? strings.en?.[key] ?? key;
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

const CARD_VERSION = '09.08.2025';

const FD_STRINGS = {
  en: {
    user_mode: 'User mode',
    user_mode_auto: 'Auto',
    user_mode_fixed: 'Fixed',
    show_prices: 'Show prices',
    sensor_refresh_after_submit: 'Refresh sensors after submit',
    version: 'Version',
  },
  de: {
    user_mode: 'Nutzermodus',
    user_mode_auto: 'Auto',
    user_mode_fixed: 'Fixiert',
    show_prices: 'Preise anzeigen',
    sensor_refresh_after_submit: 'Sensoren nach Buchung aktualisieren',
    version: 'Version',
  },
};

function t(hass, override, key) {
  return translate(hass, override, FD_STRINGS, key);
}

class TallyListFreeDrinksCardEditor extends LitElement {
  static properties = {
    _config: {},
  };

  setConfig(config) {
    this._config = {
      user_mode: 'auto',
      show_prices: true,
      sensor_refresh_after_submit: false,
      ...(config || {}),
    };
  }

  render() {
    if (!this._config) return html``;
    const idMode = this._fid('mode');
    const idPrices = this._fid('prices');
    const idRefresh = this._fid('refresh');
    return html`
      <div class="form">
        <label for="${idMode}">${t(this.hass, this._config.language, 'user_mode')}</label>
        <select id="${idMode}" @change=${this._modeChanged}>
          <option value="auto" ?selected=${this._config.user_mode === 'auto'}>${t(this.hass, this._config.language, 'user_mode_auto')}</option>
          <option value="fixed" ?selected=${this._config.user_mode === 'fixed'}>${t(this.hass, this._config.language, 'user_mode_fixed')}</option>
        </select>
      </div>
      <div class="form">
        <input id="${idPrices}" type="checkbox" .checked=${this._config.show_prices !== false} @change=${this._pricesChanged} />
        <label for="${idPrices}">${t(this.hass, this._config.language, 'show_prices')}</label>
      </div>
      <div class="form">
        <input id="${idRefresh}" type="checkbox" .checked=${this._config.sensor_refresh_after_submit} @change=${this._refreshChanged} />
        <label for="${idRefresh}">${t(this.hass, this._config.language, 'sensor_refresh_after_submit')}</label>
      </div>
      <div class="version">${t(this.hass, this._config.language, 'version')}: ${CARD_VERSION}</div>
    `;
  }

  _modeChanged(ev) {
    this._config = { ...this._config, user_mode: ev.target.value };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _pricesChanged(ev) {
    this._config = { ...this._config, show_prices: ev.target.checked };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _refreshChanged(ev) {
    this._config = { ...this._config, sensor_refresh_after_submit: ev.target.checked };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _fid(s) {
    return `fde-${s}`;
  }

  static styles = css`
    .form {
      margin-bottom: 8px;
    }
    .version {
      margin-top: 16px;
    }
  `;
}

customElements.define('tally-list-free-drinks-card-editor', TallyListFreeDrinksCardEditor);

export { t };

