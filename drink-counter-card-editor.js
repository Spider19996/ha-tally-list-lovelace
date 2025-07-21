import { LitElement, html, css } from 'https://unpkg.com/lit?module';

function fireEvent(node, type, detail = {}, options = {}) {
  node.dispatchEvent(
    new CustomEvent(type, {
      detail,
      bubbles: options.bubbles ?? true,
      composed: options.composed ?? true,
    })
  );
}

class DrinkCounterCardEditor extends LitElement {
  static properties = {
    _config: {},
  };

  setConfig(config) {
    this._config = { lock_ms: 1000, max_width: '', view: 'counter', ...config };
  }

  render() {
    if (!this._config) return html``;
    return html`
      <div class="form">
        <label>Sperrzeit (ms)</label>
        <input
          type="number"
          .value=${this._config.lock_ms}
          @input=${this._lockChanged}
        />
      </div>
      <div class="form">
        <label>Widget</label>
        <select .value=${this._config.view} @change=${this._viewChanged}>
          <option value="counter">Zähler</option>
          <option value="ranking">Ranking</option>
        </select>
      </div>
      <div class="form">
        <label>Maximale Breite (px)</label>
        <input
          type="number"
          .value=${(this._config.max_width ?? '').replace(/px$/, '')}
          @input=${this._widthChanged}
        />
      </div>
    `;
  }

  _lockChanged(ev) {
    const value = Number(ev.target.value);
    this._config = { ...this._config, lock_ms: isNaN(value) ? 1000 : value };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _viewChanged(ev) {
    const value = ev.target.value;
    this._config = { ...this._config, view: value };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  _widthChanged(ev) {
    const raw = ev.target.value.trim();
    const width = raw ? `${raw}px` : '';
    this._config = { ...this._config, max_width: width };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  static styles = css`
    .form {
      padding: 16px;
    }
    input,
    select {
      width: 100%;
      box-sizing: border-box;
    }
  `;
}

customElements.define('drink-counter-card-editor', DrinkCounterCardEditor);
