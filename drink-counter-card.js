// Drink Counter Card v1.1.1
import { LitElement, html, css } from 'https://unpkg.com/lit?module';

class DrinkCounterCard extends LitElement {
  static properties = {
    hass: {},
    config: {},
    selectedUser: { state: true },
    _autoUsers: { state: true },
    _autoPrices: { state: true },
  };

  setConfig(config) {
    this.config = config;
    if (config.users && Array.isArray(config.users)) {
      this.selectedUser = config.users[0]?.slug || config.users[0]?.name;
    }
  }



  render() {
    if (!this.hass || !this.config) return html``;
    const users = this.config.users || this._autoUsers || [];
    if (!this.selectedUser && users.length > 0) {
      this.selectedUser = users[0].slug || users[0].name;
    }
    const user = users.find(u => (u.slug || u.name) === this.selectedUser);
    if (!user) return html`<ha-card>Unknown user</ha-card>`;
    const prices = this.config.prices || this._autoPrices || {};
    let total = 0;
    const rows = Object.entries(user.drinks).map(([drink, entity]) => {
      const count = Number(this.hass.states[entity]?.state || 0);
      const price = Number(prices[drink] || 0);
      const cost = count * price;
      total += cost;
      return html`<tr>
        <td><button @click=${() => this._addDrink(drink)}>Add</button></td>
        <td>${drink}</td>
        <td>${count}</td>
        <td>${price}</td>
        <td>${cost.toFixed(2)}</td>
      </tr>`;
    });

    return html`
      <ha-card>
        <div class="user-select">
          <label for="user">Name:</label>
          <select id="user" @change=${this._selectUser.bind(this)}>
            ${users.map(u => html`<option value="${u.slug || u.name}" ?selected=${(u.slug || u.name)===this.selectedUser}>${u.name}</option>`)}
          </select>
        </div>
          <table>
          <thead><tr><th></th><th>Getränk</th><th>Anzahl</th><th>Preis</th><th>Summe</th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr><td colspan="4"><b>Gesamt</b></td><td>${total.toFixed(2)}</td></tr></tfoot>
        </table>
      </ha-card>
    `;
  }

  _selectUser(ev) {
    this.selectedUser = ev.target.value;
  }

  _addDrink(drink) {
    this.hass.callService('drink_counter', 'add_drink', {
      user: this.selectedUser,
      drink: drink,
    });

    const users = this.config.users || this._autoUsers || [];
    const user = users.find(u => (u.slug || u.name) === this.selectedUser);
    const entity = user?.drinks?.[drink];
    if (entity) {
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
        users.push({ name: name || slug, slug, drinks });
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

  static styles = css`
    ha-card {
      padding: 16px;
    }
    .user-select {
      margin-bottom: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 4px;
      border-bottom: 1px solid var(--divider-color);
    }
    button {
      padding: 4px;
    }
    tfoot td {
      font-weight: bold;
    }
  `;
}

customElements.define('drink-counter-card', DrinkCounterCard);

