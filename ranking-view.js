import { html } from 'https://unpkg.com/lit?module';

export function renderRanking({hass, config, autoUsers, autoPrices, freeAmount, width}) {
  const users = config.users || autoUsers || [];
  const prices = config.prices || autoPrices || {};
  const free = Number(config.free_amount ?? freeAmount ?? 0);
  const rows = users.map(u => {
    let total = 0;
    for (const [drink, entity] of Object.entries(u.drinks)) {
      const count = Number(hass.states[entity]?.state || 0);
      const price = Number(prices[drink] || 0);
      total += count * price;
    }
    let due;
    if (u.amount_due_entity) {
      const s = hass.states[u.amount_due_entity];
      const v = parseFloat(s?.state);
      due = isNaN(v) ? Math.max(total - free, 0) : v;
    } else {
      due = Math.max(total - free, 0);
    }
    return { name: u.name || u.slug, due };
  }).sort((a, b) => b.due - a.due);
  const cardStyle = width ? `max-width:${width};margin:0 auto;` : '';
  return html`
    <ha-card style="${cardStyle}">
      <table>
        <thead><tr><th>Name</th><th>Zu zahlen</th></tr></thead>
        <tbody>
          ${rows.map(r => html`<tr><td>${r.name}</td><td>${r.due.toFixed(2)} €</td></tr>`)}
        </tbody>
      </table>
    </ha-card>
  `;
}
