// Tally List Card
import { LitElement, html, css } from 'https://unpkg.com/lit?module';
const CARD_VERSION = '1.7.0';

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'tally-list-card',
  name: 'Tally List Card',
  preview: true,
  description: 'Displays drink counts per user with quick add/remove buttons.',
});
window.customCards.push({
  type: 'tally-due-ranking-card',
  name: 'Tally Due Ranking Card',
  preview: true,
  description: 'Shows a ranking based on the due amount per user.',
});

class TallyListCard extends LitElement {
  static properties = {
    hass: {},
    config: {},
    selectedUser: { state: true },
    _autoUsers: { state: true },
    _autoPrices: { state: true },
    _freeAmount: { state: true },
    selectedRemoveDrink: { state: true },
    _disabled: { state: true },
  };

  selectedRemoveDrink = '';

  setConfig(config) {
    this.config = { lock_ms: 1000, max_width: '', ...config };
    this._disabled = false;
    const width = this._normalizeWidth(this.config.max_width);
    if (width) {
      this.style.setProperty('--dcc-max-width', width);
      this.config.max_width = width;
    } else {
      this.style.removeProperty('--dcc-max-width');
      this.config.max_width = '';
    }
    if (config.users && Array.isArray(config.users)) {
      // Prefer the configured name to preserve capitalization
      this.selectedUser = config.users[0]?.name || config.users[0]?.slug;
    }
  }



  render() {
    if (!this.hass || !this.config) return html``;
    let users = this.config.users || this._autoUsers || [];
    if (users.length === 0) {
      return html`<ha-card>Strichliste-Integration nicht gefunden. Bitte richte die Integration ein.</ha-card>`;
    }
    const isAdmin = this.hass.user?.is_admin;
    if (!isAdmin) {
      const allowedSlugs = this._currentPersonSlugs();
      const uid = this.hass.user?.id;
      users = users.filter(u => u.user_id === uid || allowedSlugs.includes(u.slug));
    }
    if (users.length === 0) {
      return html`<ha-card>Kein Zugriff auf Nutzer</ha-card>`;
    }
    const uid = this.hass.user?.id;
    const slugsOfUser = this._currentPersonSlugs();
    const own = users.find(u => u.user_id === uid || slugsOfUser.includes(u.slug));
    users = [...users].sort((a, b) => {
      const nA = a.name || a.slug;
      const nB = b.name || b.slug;
      return nA.localeCompare(nB);
    });
    if (own) {
      users = [own, ...users.filter(u => u !== own)];
    }
    if (!this.selectedUser || !users.some(u => (u.name || u.slug) === this.selectedUser)) {
      // Prefer the current user when available, otherwise pick the first entry
      this.selectedUser = own ? (own.name || own.slug) : (users[0].name || users[0].slug);
    }
    const user = users.find(u => (u.name || u.slug) === this.selectedUser);
    if (!user) return html`<ha-card>Unbekannter Benutzer</ha-card>`;
    const prices = this.config.prices || this._autoPrices || {};
    const freeAmount = Number(this.config.free_amount ?? this._freeAmount ?? 0);
    let total = 0;
    const rows = Object.entries(user.drinks)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([drink, entity]) => {
        const count = Number(this.hass.states[entity]?.state || 0);
        const price = Number(prices[drink] || 0);
        const priceStr = price.toFixed(2) + ' €';
        const cost = count * price;
        total += cost;
        const costStr = cost.toFixed(2) + ' €';
        const displayDrink = drink.charAt(0).toUpperCase() + drink.slice(1);
        return html`<tr>
          <td><button class="add-button" @click=${() => this._addDrink(drink)} ?disabled=${this._disabled}>+1</button></td>
          <td>${displayDrink}</td>
          <td>${count}</td>
          <td>${priceStr}</td>
          <td>${costStr}</td>
        </tr>`;
      });

    const drinks = Object.keys(user.drinks).sort((a,b) => a.localeCompare(b));
    if (!this.selectedRemoveDrink && drinks.length > 0) {
      this.selectedRemoveDrink = drinks[0];
    }

    const totalStr = total.toFixed(2) + ' €';
    const freeAmountStr = freeAmount.toFixed(2) + ' €';
    let due;
    if (user.amount_due_entity) {
      const dueState = this.hass.states[user.amount_due_entity];
      const val = parseFloat(dueState?.state);
      due = isNaN(val) ? Math.max(total - freeAmount, 0) : val;
    } else {
      due = Math.max(total - freeAmount, 0);
    }
    const dueStr = due.toFixed(2) + ' €';
    const width = this._normalizeWidth(this.config.max_width);
    const cardStyle = width ? `max-width:${width};margin:0 auto;` : '';
    return html`
      <ha-card style="${cardStyle}">
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
          <tfoot>
            <tr><td colspan="4"><b>Gesamt</b></td><td>${totalStr}</td></tr>
            ${freeAmount > 0 ? html`
              <tr><td colspan="4"><b>Freibetrag</b></td><td>- ${freeAmountStr}</td></tr>
              <tr><td colspan="4"><b>Zu zahlen</b></td><td>${dueStr}</td></tr>
            ` : ''}
          </tfoot>
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
    const delay = Number(this.config.lock_ms ?? 1000);
    setTimeout(() => {
      this._disabled = false;
      this.requestUpdate();
    }, delay);
    const displayDrink = drink.charAt(0).toUpperCase() + drink.slice(1);
    this.hass.callService('tally_list', 'add_drink', {
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
    const delay = Number(this.config.lock_ms ?? 1000);
    setTimeout(() => {
      this._disabled = false;
      this.requestUpdate();
    }, delay);

    const displayDrink = drink.charAt(0).toUpperCase() + drink.slice(1);
    this.hass.callService('tally_list', 'remove_drink', {
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
        const sensorName = (state.attributes.friendly_name || '').replace(' Amount Due', '');
        const drinks = {};
        const prefix = `sensor.${slug}_`;
        for (const [e2] of Object.entries(states)) {
          const m2 = e2.startsWith(prefix) && e2.endsWith('_count') && e2.match(/^sensor\.[a-z0-9_]+_([^_]+)_count$/);
          if (m2) {
            const drink = m2[1];
            drinks[drink] = e2;
          }
        }
        let person = states[`person.${slug}`];
        if (!person) {
          for (const [pEntity, pState] of Object.entries(states)) {
            if (pEntity.startsWith('person.') && this._slugify(pState.attributes?.friendly_name || '') === slug) {
              person = pState;
              break;
            }
          }
        }
        const user_id = person?.attributes?.user_id || null;
        const personName = person?.attributes?.friendly_name;
        const name = personName || sensorName || slug;
        users.push({ name, slug, drinks, amount_due_entity: entity, user_id });
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

  _slugify(str) {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  _currentPersonSlugs() {
    const userId = this.hass.user?.id;
    if (!userId) return [];
    const slugs = [];
    for (const [entity, state] of Object.entries(this.hass.states)) {
      if (entity.startsWith('person.') && state.attributes.user_id === userId) {
        const slug = entity.substring('person.'.length);
        slugs.push(slug);
        const alt = this._slugify(state.attributes.friendly_name || '');
        if (alt && alt !== slug) {
          slugs.push(alt);
        }
      }
    }
    return slugs;
  }

  _normalizeWidth(value) {
    if (!value && value !== 0) return '';
    const str = String(value).trim();
    if (str === '') return '';
    return /^\d+$/.test(str) ? `${str}px` : str;
  }

  static async getConfigElement() {
    return document.createElement('tally-list-card-editor');
  }

  static getStubConfig() {
    return { lock_ms: 1000, max_width: '' };
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
    .controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
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
    .remove-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .remove-container button {
      height: 32px;
      width: 32px;
    }
    .add-button {
      height: 32px;
      width: 32px;
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
    tfoot td {
      font-weight: bold;
    }
  `;
}

customElements.define('tally-list-card', TallyListCard);

class TallyListCardEditor extends LitElement {
  static properties = {
    _config: {},
  };

  setConfig(config) {
    this._config = { lock_ms: 1000, max_width: '', ...config };
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
        <label>Maximale Breite (px)</label>
        <input
          type="number"
          .value=${(this._config.max_width ?? '').replace(/px$/, '')}
          @input=${this._widthChanged}
        />
      </div>
      <div class="version">Version: ${CARD_VERSION}</div>
    `;
  }

  _lockChanged(ev) {
    const value = Number(ev.target.value);
    this._config = { ...this._config, lock_ms: isNaN(value) ? 1000 : value };
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  _widthChanged(ev) {
    const raw = ev.target.value.trim();
    const width = raw ? `${raw}px` : '';
    this._config = { ...this._config, max_width: width };
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  static styles = css`
    .form {
      padding: 16px;
    }
    input[type='number'],
    input[type='text'] {
      width: 100%;
      box-sizing: border-box;
    }
    .version {
      padding: 0 16px 16px;
      text-align: center;
      color: var(--secondary-text-color);
    }
  `;
}

customElements.define('tally-list-card-editor', TallyListCardEditor);

class TallyDueRankingCard extends LitElement {
  static properties = {
    hass: {},
    config: {},
    _autoUsers: { state: true },
    _autoPrices: { state: true },
    _freeAmount: { state: true },
    _sortBy: { state: true },
  };

  static styles = [
    TallyListCard.styles,
    css`
      .controls {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        flex-wrap: wrap;
      }
      .controls select {
        padding: 4px 8px;
        min-width: 160px;
        font-size: 1rem;
        height: 32px;
        box-sizing: border-box;
      }
      .reset-container {
        text-align: right;
        margin-top: 8px;
      }
      .reset-container button {
        padding: 4px 8px;
        background-color: red;
        color: #fff;
      }
    `,
  ];

  setConfig(config) {
    this.config = {
      max_width: '',
      sort_by: 'due_desc',
      sort_menu: false,
      show_reset: true,
      ...config,
    };
    this._sortBy = this.config.sort_by;
    const width = this._normalizeWidth(this.config.max_width);
    if (width) {
      this.style.setProperty('--dcc-max-width', width);
      this.config.max_width = width;
    } else {
      this.style.removeProperty('--dcc-max-width');
      this.config.max_width = '';
    }
  }

  render() {
    if (!this.hass || !this.config) return html``;
    let users = this.config.users || this._autoUsers || [];
    if (users.length === 0) {
      return html`<ha-card>Strichliste-Integration nicht gefunden. Bitte richte die Integration ein.</ha-card>`;
    }
    const isAdmin = this.hass.user?.is_admin;
    if (!isAdmin) {
      const allowed = this._currentPersonSlugs();
      const uid = this.hass.user?.id;
      users = users.filter(u => u.user_id === uid || allowed.includes(u.slug));
    }
    if (users.length === 0) {
      return html`<ha-card>Kein Zugriff auf Nutzer</ha-card>`;
    }
    const prices = this.config.prices || this._autoPrices || {};
    const freeAmount = Number(this.config.free_amount ?? this._freeAmount ?? 0);
    const ranking = users.map(u => {
      let total = 0;
      for (const [drink, entity] of Object.entries(u.drinks)) {
        const count = Number(this.hass.states[entity]?.state || 0);
        const price = Number(prices[drink] || 0);
        total += count * price;
      }
      let due;
      if (u.amount_due_entity) {
        const s = this.hass.states[u.amount_due_entity];
        const val = parseFloat(s?.state);
        due = isNaN(val) ? Math.max(total - freeAmount, 0) : val;
      } else {
        due = Math.max(total - freeAmount, 0);
      }
      return { name: u.name || u.slug, due };
    });
    const sortBy = this._sortBy || this.config.sort_by || 'due_desc';
    ranking.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'due_asc':
          return a.due - b.due;
        case 'due_desc':
        default:
          return b.due - a.due;
      }
    });
    const rows = ranking.map((r, i) => html`<tr><td>${i + 1}</td><td>${r.name}</td><td>${r.due.toFixed(2)} €</td></tr>`);
    const width = this._normalizeWidth(this.config.max_width);
    const cardStyle = width ? `max-width:${width};margin:0 auto;` : '';
    const sortMenu = this.config.sort_menu
      ? html`<div class="controls">
          <label>Sortierung:</label>
          <select @change=${this._sortMenuChanged}>
            <option value="due_desc" ?selected=${sortBy === 'due_desc'}>Nach offenem Betrag</option>
            <option value="due_asc" ?selected=${sortBy === 'due_asc'}>Nach offenem Betrag (aufsteigend)</option>
            <option value="name" ?selected=${sortBy === 'name'}>Alphabetisch</option>
          </select>
        </div>`
      : '';
    let resetButton = '';
    if (isAdmin && this.config.show_reset !== false) {
      resetButton = html`<div class="reset-container">
        <button @click=${this._resetAllTallies}>Alle Striche zurücksetzen</button>
      </div>`;
    }
    return html`
      <ha-card style="${cardStyle}">
        ${sortMenu}
        <table>
          <thead><tr><th>#</th><th>Name</th><th>Zu zahlen</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        ${resetButton}
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

  static async getConfigElement() {
    return document.createElement('tally-due-ranking-card-editor');
  }

  static getStubConfig() {
    return { max_width: '', sort_by: 'due_desc', sort_menu: false };
  }
  _gatherUsers() {
    const users = [];
    const states = this.hass.states;
    for (const [entity, state] of Object.entries(states)) {
      const match = entity.match(/^sensor\.([a-z0-9_]+)_amount_due$/);
      if (match) {
        const slug = match[1];
        const sensorName = (state.attributes.friendly_name || '').replace(' Amount Due', '');
        const drinks = {};
        const prefix = `sensor.${slug}_`;
        for (const [e2] of Object.entries(states)) {
          const m2 = e2.startsWith(prefix) && e2.endsWith('_count') && e2.match(/^sensor\.[a-z0-9_]+_([^_]+)_count$/);
          if (m2) {
            const drink = m2[1];
            drinks[drink] = e2;
          }
        }
        let person = states[`person.${slug}`];
        if (!person) {
          for (const [pEntity, pState] of Object.entries(states)) {
            if (pEntity.startsWith('person.') && this._slugify(pState.attributes?.friendly_name || '') === slug) {
              person = pState;
              break;
            }
          }
        }
        const user_id = person?.attributes?.user_id || null;
        const personName = person?.attributes?.friendly_name;
        const name = personName || sensorName || slug;
        users.push({ name, slug, drinks, amount_due_entity: entity, user_id });
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

  _slugify(str) {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  _currentPersonSlugs() {
    const userId = this.hass.user?.id;
    if (!userId) return [];
    const slugs = [];
    for (const [entity, state] of Object.entries(this.hass.states)) {
      if (entity.startsWith('person.') && state.attributes.user_id === userId) {
        const slug = entity.substring('person.'.length);
        slugs.push(slug);
        const alt = this._slugify(state.attributes.friendly_name || '');
        if (alt && alt !== slug) {
          slugs.push(alt);
        }
      }
    }
    return slugs;
  }

  _normalizeWidth(value) {
    if (!value && value !== 0) return '';
    const str = String(value).trim();
    if (str === '') return '';
    return /^\d+$/.test(str) ? `${str}px` : str;
  }

  _sortMenuChanged(ev) {
    this._sortBy = ev.target.value;
  }

  _resetAllTallies() {
    const input = prompt('Zum Zurücksetzen aller Striche "JA RESET" eingeben:');
    if (input !== 'JA RESET') {
      return;
    }
    const users = this.config.users || this._autoUsers || [];
    for (const u of users) {
      const buttonId = `button.${u.slug}_reset_tally`;
      this.hass.callService('button', 'press', { entity_id: buttonId });
      for (const entity of Object.values(u.drinks || {})) {
        this.hass.callService('homeassistant', 'update_entity', { entity_id: entity });
      }
      if (u.amount_due_entity) {
        this.hass.callService('homeassistant', 'update_entity', { entity_id: u.amount_due_entity });
      }
    }
  }
}

customElements.define('tally-due-ranking-card', TallyDueRankingCard);

class TallyDueRankingCardEditor extends LitElement {
  static properties = {
    _config: {},
  };

  setConfig(config) {
    this._config = {
      max_width: '',
      sort_by: 'due_desc',
      sort_menu: false,
      show_reset: true,
      ...config,
    };
  }

  render() {
    if (!this._config) return html``;
    return html`
      <div class="form">
        <label>Maximale Breite (px)</label>
        <input
          type="number"
          .value=${(this._config.max_width ?? '').replace(/px$/, '')}
          @input=${this._widthChanged}
        />
      </div>
      <div class="form">
        <label>Sortierung</label>
        <select @change=${this._sortChanged}>
          <option value="due_desc" ?selected=${this._config.sort_by === 'due_desc'}>
            Nach offenem Betrag
          </option>
          <option value="due_asc" ?selected=${this._config.sort_by === 'due_asc'}>
            Nach offenem Betrag (aufsteigend)
          </option>
          <option value="name" ?selected=${this._config.sort_by === 'name'}>
            Alphabetisch
          </option>
        </select>
      </div>
      <div class="form">
        <label>
          <input type="checkbox" .checked=${this._config.sort_menu} @change=${this._menuChanged} />
          Sortiermenü anzeigen
        </label>
      </div>
      <div class="form">
        <label>
          <input type="checkbox" .checked=${this._config.show_reset} @change=${this._resetChanged} />
          Reset-Button anzeigen (nur Admins)
        </label>
      </div>
      <div class="version">Version: ${CARD_VERSION}</div>
    `;
  }

  _widthChanged(ev) {
    const raw = ev.target.value.trim();
    const width = raw ? `${raw}px` : '';
    this._config = { ...this._config, max_width: width };
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  _sortChanged(ev) {
    const val = ev.target.value;
    this._config = { ...this._config, sort_by: val };
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  _menuChanged(ev) {
    this._config = { ...this._config, sort_menu: ev.target.checked };
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  _resetChanged(ev) {
    this._config = { ...this._config, show_reset: ev.target.checked };
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  static styles = TallyListCardEditor.styles;
}

customElements.define('tally-due-ranking-card-editor', TallyDueRankingCardEditor);

