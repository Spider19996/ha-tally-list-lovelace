import { LitElement, html, css } from 'https://unpkg.com/lit?module';

class DrinkRankingCard extends LitElement {
  static properties = {
    hass: {},
    users: {},
    prices: {},
    freeAmount: {},
  };

  render() {
    if (!this.hass || !Array.isArray(this.users)) return html``;
    const freeAmount = Number(this.freeAmount ?? 0);
    const list = this.users.map(u => {
      let total = 0;
      for (const [drink, entity] of Object.entries(u.drinks || {})) {
        const count = Number(this.hass.states[entity]?.state || 0);
        const price = Number(this.prices?.[drink] || 0);
        total += count * price;
      }
      let due;
      if (u.amount_due_entity) {
        const val = parseFloat(this.hass.states[u.amount_due_entity]?.state);
        due = isNaN(val) ? Math.max(total - freeAmount, 0) : val;
      } else {
        due = Math.max(total - freeAmount, 0);
      }
      return { name: u.name || u.slug, due };
    });
    list.sort((a, b) => b.due - a.due);
    return html`
      <ha-card>
        <table>
          <thead>
            <tr><th>Name</th><th>Zu zahlen</th></tr>
          </thead>
          <tbody>
            ${list.map(item => html`<tr><td>${item.name}</td><td>${item.due.toFixed(2)} €</td></tr>`)}
          </tbody>
        </table>
      </ha-card>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }
    ha-card {
      padding: 16px;
      text-align: center;
      margin: 0 auto;
      max-width: var(--dcc-max-width, none);
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 4px;
      border-bottom: 1px solid var(--divider-color);
      text-align: center;
    }
    tfoot td {
      font-weight: bold;
    }
  `;
}

customElements.define('drink-ranking-card', DrinkRankingCard);
