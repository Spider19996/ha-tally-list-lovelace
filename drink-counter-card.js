// Drink Counter Card v1.1.4
import { LitElement, html, css } from 'https://unpkg.com/lit?module';

class DrinkCounterCard extends LitElement {
  static properties = {
    hass: {},
    config: {},
    selectedUser: { state: true },
    _autoUsers: { state: true },
    _autoPrices: { state: true },
    selectedRemoveDrink: { state: true },
    _disabled: { state: true },
  };

  selectedRemoveDrink = '';

  setConfig(config) {
    this.config = config;
    this._disabled = false;
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
          <td><button @click=${() => this._addDrink(drink)} ?disabled=${this._disabled}>+1</button></td>
          <td>${displayDrink}</td>
          <td>${count}</td>
          <td>${price.toFixed(2)}</td>
          <td>${cost.toFixed(2)}</td>
        </tr>`;
      });

    const drinks = Object.keys(user.drinks).sort((a,b) => a.localeCompare(b));
    if (!this.selectedRemoveDrink && drinks.length > 0) {
      this.selectedRemoveDrink = drinks[0];
    }

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
            <select @change=${this._selectRemoveDrink.bind(this)}>
              ${drinks.map(d => html`<option value="${d}" ?selected=${d===this.selectedRemoveDrink}>${d.charAt(0).toUpperCase() + d.slice(1)}</option>`)}
            </select>
            <button @click=${() => this._removeDrink(this.selectedRemoveDrink)} ?disabled=${this._disabled}>-1</button>
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

  _selectRemoveDrink(ev) {
    this.selectedRemoveDrink = ev.target.value;
  }

  _addDrink(drink) {
    if (this._disabled) {
      return;
    }
    this._disabled = true;
    this.requestUpdate();
    setTimeout(() => {
      this._disabled = false;
      this.requestUpdate();
    }, 1000);
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

  _removeDrink(drink) {
    if (this._disabled || !drink) {
      return;
    }
    this._disabled = true;
    this.requestUpdate();
    setTimeout(() => {
      this._disabled = false;
      this.requestUpdate();
    }, 1000);

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
      text-align: left;
      display: flex;
      justify-content: flex-start;
      align-items: center;
      gap: 8px;
    }
    .user-select select,
    .remove-container select {
      padding: 4px 8px;
      min-width: 120px;
      font-size: 1rem;
      height: 32px;
      box-sizing: border-box;
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
      display: flex;
      align-items: center;
      gap: 8px;
    }
    tfoot td {
      font-weight: bold;
    }
  `;
}

customElements.define('drink-counter-card', DrinkCounterCard);

