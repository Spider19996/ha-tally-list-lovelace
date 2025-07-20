import { LitElement, html, css } from 'https://unpkg.com/lit?module';

class DrinkCounterCard extends LitElement {
  static properties = {
    hass: {},
    config: {},
    selectedUser: { state: true },
  };

  setConfig(config) {
    if (!config.users || !Array.isArray(config.users)) {
      throw new Error("The 'users' property is required and must be an array.");
    }
    if (!config.prices || typeof config.prices !== 'object') {
      throw new Error("The 'prices' property is required and must be an object.");
    }
    this.config = config;
    this.selectedUser = config.users[0]?.name;
  }

  get userData() {
    if (!this.config) return null;
    return this.config.users.find(u => u.name === this.selectedUser);
  }

  render() {
    if (!this.hass || !this.config) return html``;
    const user = this.userData;
    if (!user) return html`<ha-card>Unknown user</ha-card>`;
    const prices = this.config.prices;
    let total = 0;
    const rows = Object.entries(user.drinks).map(([drink, entity]) => {
      const count = Number(this.hass.states[entity]?.state || 0);
      const price = Number(prices[drink] || 0);
      const cost = count * price;
      total += cost;
      return html`<tr><td>${drink}</td><td>${count}</td><td>${price}</td><td>${cost.toFixed(2)}</td></tr>`;
    });

    return html`
      <ha-card>
        <div class="user-select">
          <label for="user">Name:</label>
          <select id="user" @change=${this._selectUser.bind(this)}>
            ${this.config.users.map(u => html`<option value="${u.name}" ?selected=${u.name===this.selectedUser}>${u.name}</option>`)}
          </select>
        </div>
        <table>
          <thead><tr><th>Getränk</th><th>Anzahl</th><th>Preis</th><th>Summe</th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr><td colspan="3"><b>Gesamt</b></td><td>${total.toFixed(2)}</td></tr></tfoot>
        </table>
      </ha-card>
    `;
  }

  _selectUser(ev) {
    this.selectedUser = ev.target.value;
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
    tfoot td {
      font-weight: bold;
    }
  `;
}

customElements.define('drink-counter-card', DrinkCounterCard);

