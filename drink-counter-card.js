// Drink Counter Card v1.1.2
import { LitElement, html, css } from 'https://unpkg.com/lit?module';

class DrinkCounterCard extends LitElement {
  static properties = {
    hass: {},
    config: {},
    selectedUser: { state: true },
    _autoUsers: { state: true },
    _autoPrices: { state: true },
    showRemoveMenu: { state: true },
  };

  showRemoveMenu = false;

  setConfig(config) {
    this.config = config;
    if (config.users && Array.isArray(config.users)) {
      // Prefer the configured name to preserve capitalization
      this.selectedUser = config.users[0]?.name || config.users[0]?.slug;
    }
  }



  render() {
    if (!this.hass || !this.config) return html``;
    const users = this.config.users || this._autoUsers || [];
    if (!this.selectedUser && users.length > 0) {
      // Default to the display name if available
      this.selectedUser = users[0].name || users[0].slug;
    }
    const user = users.find(u => (u.name || u.slug) === this.selectedUser);
    if (!user) return html`<ha-card>Unknown user</ha-card>`;
    const prices = this.config.prices || this._autoPrices || {};
    let total = 0;
    const rows = Object.entries(user.drinks)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([drink, entity]) => {
      const count = Number(this.hass.states[entity]?.state || 0);
      const price = Number(prices[drink] || 0);
      const cost = count * price;
      total += cost;
      const displayDrink = drink.charAt(0).toUpperCase() + drink.slice(1);
      return html`<tr>
        <td><button @click=${() => this._addDrink(drink)}>Add</button></td>
        <td>${displayDrink}</td>
        <td>${count}</td>
        <td>${price}</td>
        <td>${cost.toFixed(2)}</td>
      </tr>`;
    });

    const drinks = Object.keys(user.drinks).sort((a,b) => a.localeCompare(b));

    return html`
      <ha-card>
        <div class="controls">
          <div class="user-select">
            <label for="user">Name:</label>
            <select id="user" @change=${this._selectUser.bind(this)}>
              ${users.map(u => html`<option value="${u.name || u.slug}" ?selected=${(u.name || u.slug)===this.selectedUser}>${u.name}</option>`)}
            </select>
          </div>
          <div class="remove-container">
            <button @click=${this._toggleRemoveMenu.bind(this)}>Getränk entfernen</button>
            ${this.showRemoveMenu ? html`<ul class="remove-menu">
              ${drinks.map(d => html`<li @click=${() => this._removeDrink(d)}>${d.charAt(0).toUpperCase() + d.slice(1)}</li>`)}
            </ul>` : ''}
          </div>
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
    const displayDrink = drink.charAt(0).toUpperCase() + drink.slice(1);
    this.hass.callService('drink_counter', 'add_drink', {
      user: this.selectedUser,
      drink: displayDrink,
    });

    const users = this.config.users || this._autoUsers || [];
    const user = users.find(u => (u.name || u.slug) === this.selectedUser);
    const entity = user?.drinks?.[drink];
    if (entity) {
      this.hass.callService('homeassistant', 'update_entity', {
        entity_id: entity,
      });
    }
  }

  _toggleRemoveMenu() {
    this.showRemoveMenu = !this.showRemoveMenu;
  }

  _removeDrink(drink) {
    const displayDrink = drink.charAt(0).toUpperCase() + drink.slice(1);
    this.hass.callService('drink_counter', 'remove_drink', {
      user: this.selectedUser,
      drink: displayDrink,
    });

    const users = this.config.users || this._autoUsers || [];
    const user = users.find(u => (u.name || u.slug) === this.selectedUser);
    const entity = user?.drinks?.[drink];
    if (entity) {
      this.hass.callService('homeassistant', 'update_entity', {
        entity_id: entity,
      });
    }
    this.showRemoveMenu = false;
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
      text-align: center;
    }
    .controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .user-select {
      text-align: center;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
    }
    .user-select select {
      padding: 8px;
      min-width: 120px;
      font-size: 1rem;
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
    .remove-container {
      position: relative;
    }
    .remove-menu {
      position: absolute;
      right: 0;
      top: 100%;
      list-style: none;
      margin: 0;
      padding: 0;
      background: var(--card-background-color, white);
      border: 1px solid var(--divider-color);
      z-index: 1;
    }
    .remove-menu li {
      padding: 4px 8px;
      cursor: pointer;
    }
    .remove-menu li:hover {
      background: var(--primary-color);
      color: var(--text-primary-color);
    }
    tfoot td {
      font-weight: bold;
    }
  `;
}

customElements.define('drink-counter-card', DrinkCounterCard);

