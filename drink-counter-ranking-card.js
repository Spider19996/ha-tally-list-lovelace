// Drink Counter Ranking Card
import { LitElement, html, css } from 'https://unpkg.com/lit?module';

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'drink-counter-ranking-card',
  name: 'Drink Counter Ranking',
  preview: false,
  description: 'Displays all users sorted by amount due.'
});

class DrinkCounterRankingCard extends LitElement {
  static properties = {
    hass: {},
    config: {},
    _autoUsers: { state: true },
    _autoPrices: { state: true },
    _freeAmount: { state: true },
  };

  setConfig(config) {
    this.config = { max_width: '', ...config };
    const width = this._normalizeWidth(this.config.max_width);
    if (width) {
      this.style.setProperty('--dcr-max-width', width);
      this.config.max_width = width;
    } else {
      this.style.removeProperty('--dcr-max-width');
      this.config.max_width = '';
    }
  }

  render() {
    if (!this.hass || !this.config) return html``;
    const users = this.config.users || this._autoUsers || [];
    const prices = this.config.prices || this._autoPrices || {};
    const freeAmount = Number(this.config.free_amount ?? this._freeAmount ?? 0);
    const rows = users.map(u => {
      const drinkEntries = Object.entries(u.drinks).map(([drink, entity]) => {
        const count = Number(this.hass.states[entity]?.state || 0);
        const price = Number(prices[drink] || 0);
        return count * price;
      });
      const total = drinkEntries.reduce((a,b)=>a+b, 0);
      let due;
      if (u.amount_due_entity) {
        const dueState = this.hass.states[u.amount_due_entity];
        const val = parseFloat(dueState?.state);
        due = isNaN(val) ? Math.max(total - freeAmount, 0) : val;
      } else {
        due = Math.max(total - freeAmount, 0);
      }
      return { name: u.name || u.slug, due };
    }).sort((a,b)=>b.due - a.due);

    const width = this._normalizeWidth(this.config.max_width);
    const cardStyle = width ? `max-width:${width};margin:0 auto;` : '';
    return html`
      <ha-card style="${cardStyle}">
        <table>
          <thead><tr><th>Name</th><th>Betrag</th></tr></thead>
          <tbody>
            ${rows.map(r => html`<tr><td>${r.name}</td><td>${r.due.toFixed(2)} €</td></tr>`)}
          </tbody>
        </table>
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
    }
  }

  _gatherUsers() {
    const users = [];
    const states = this.hass.states;
    for (const [entity, state] of Object.entries(states)) {
      const match = entity.match(/^sensor\.([a-z0-9_]+)_amount_due$/);
      if (match) {
        const slug = match[1];
        const name = (state.attributes.friendly_name || '').replace(' Amount Due', '');
        const drinks = {};
        const prefix = `sensor.${slug}_`;
        for (const [e2] of Object.entries(states)) {
          const m2 = e2.startsWith(prefix) && e2.endsWith('_count') && e2.match(/^sensor\.[a-z0-9_]+_([^_]+)_count$/);
          if (m2) {
            const drink = m2[1];
            drinks[drink] = e2;
          }
        }
        users.push({ name: name || slug, slug, drinks, amount_due_entity: entity });
      }
    }
    return users;
  }

  _gatherPrices() {
    const prices = {};
    const states = this.hass.states;
    for (const [entity, state] of Object.entries(states)) {
      const match = entity.match(/^sensor\.preisliste_([^_]+)_price$/);
      if (match) {
        const drink = match[1];
        const price = parseFloat(state.state);
        prices[drink] = isNaN(price) ? 0 : price;
      }
    }
    return prices;
  }

  _gatherFreeAmount() {
    const state = this.hass.states['sensor.preisliste_free_amount'];
    if (!state) return 0;
    const val = parseFloat(state.state);
    return isNaN(val) ? 0 : val;
  }

  _normalizeWidth(value) {
    if (!value && value !== 0) return '';
    const str = String(value).trim();
    if (str === '') return '';
    return /^\d+$/.test(str) ? `${str}px` : str;
  }

  static styles = css`
    :host {
      display: block;
    }
    ha-card {
      padding: 16px;
      text-align: center;
      margin: 0 auto;
      max-width: var(--dcr-max-width, none);
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
    tbody tr:nth-child(even) {
      background: rgba(0, 0, 0, 0.05);
    }
  `;
}

customElements.define('drink-counter-ranking-card', DrinkCounterRankingCard);
