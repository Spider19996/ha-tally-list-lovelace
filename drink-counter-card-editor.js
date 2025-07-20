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
    this._config = { lock_ms: 1000, ...config };
  }

  render() {
    if (!this._config) return html``;
    return html`
      <div class="form">
        <label>Sperrzeit (ms)</label>
        <input
          type="number"
          .value=${this._config.lock_ms}
          @input=${this._valueChanged}
        />
      </div>
    `;
  }

  _valueChanged(ev) {
    const value = Number(ev.target.value);
    this._config = { ...this._config, lock_ms: isNaN(value) ? 1000 : value };
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
  `;
}

customElements.define('drink-counter-card-editor', DrinkCounterCardEditor);
