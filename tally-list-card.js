// Tally List Card
import { LitElement, html, css } from 'https://unpkg.com/lit?module';
const CARD_VERSION = '1.11.0';

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
    _tallyAdmins: { state: true },
    selectedRemoveDrink: { state: true },
    _disabled: { state: true },
  };

  selectedRemoveDrink = '';
  _tallyAdmins = [];

  setConfig(config) {
    this.config = {
      lock_ms: 400,
      max_width: '500px',
      show_remove: true,
      only_self: false,
      show_all_users: false,
      ...config,
    };
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
    const userNames = [this.hass.user?.name, ...this._currentPersonNames()];
    const isAdmin = userNames.some(n => (this._tallyAdmins || []).includes(n));
    const limitSelf = (!isAdmin && !this.config.show_all_users) || this.config.only_self;
    if (limitSelf) {
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
        const stateObj = this.hass.states[entity];
        const isAvailable = stateObj && stateObj.state !== 'unavailable' && stateObj.state !== 'unknown';
        const count = this._toNumber(stateObj?.state);
        const price = this._toNumber(prices[drink]);
        const priceStr = price.toFixed(2) + ' €';
        const cost = count * price;
        total += cost;
        const costStr = cost.toFixed(2) + ' €';
        const displayDrink = drink.charAt(0).toUpperCase() + drink.slice(1);
        return html`<tr>
          <td><button class="add-button" @click=${() => this._addDrink(drink)} ?disabled=${this._disabled || !isAvailable}>+1</button></td>
          <td>${displayDrink}</td>
          <td>${count}</td>
          <td>${priceStr}</td>
          <td>${costStr}</td>
        </tr>`;
      });

    const drinks = Object.keys(user.drinks)
      .filter(d => {
        const st = this.hass.states[user.drinks[d]]?.state;
        return st !== 'unavailable' && st !== 'unknown';
      })
      .sort((a, b) => a.localeCompare(b));
    if (!this.selectedRemoveDrink || !drinks.includes(this.selectedRemoveDrink)) {
      this.selectedRemoveDrink = drinks[0] || '';
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
        ${this.config.show_remove !== false ? html`
          <div class="remove-bottom">
            <div class="remove-container">
              <button class="remove-button" @click=${() => this._removeDrink(this.selectedRemoveDrink)} ?disabled=${this._disabled}>-1</button>
              <select @change=${this._selectRemoveDrink.bind(this)}>
                ${drinks.map(d => html`<option value="${d}" ?selected=${d===this.selectedRemoveDrink}>${d.charAt(0).toUpperCase() + d.slice(1)}</option>`)}
              </select>
            </div>
          </div>
        ` : ''}
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
    const delay = Number(this.config.lock_ms ?? 400);
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
    const delay = Number(this.config.lock_ms ?? 400);
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
      this._fetchTallyAdmins();
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

  async _fetchTallyAdmins() {
    if (!this.hass?.connection) return;
    try {
      const resp = await this.hass.connection.sendMessagePromise({ type: 'tally_list/get_admins' });
      this._tallyAdmins = Array.isArray(resp?.admins) ? resp.admins : [];
    } catch (err) {
      this._tallyAdmins = [];
    }
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

  _currentPersonNames() {
    const userId = this.hass.user?.id;
    if (!userId) return [];
    const names = [];
    for (const [entity, state] of Object.entries(this.hass.states)) {
      if (entity.startsWith('person.') && state.attributes.user_id === userId) {
        const friendly = state.attributes.friendly_name;
        if (friendly) names.push(friendly);
      }
    }
    return names;
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
  
  _toNumber(value) {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
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
    return {
      lock_ms: 400,
      max_width: '500px',
      show_remove: true,
      only_self: false,
      show_all_users: false,
    };
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
      border: none;
      border-radius: 4px;
    }
    .remove-button {
      background-color: var(--error-color, #c62828);
      color: white;
    }
    .remove-bottom {
      text-align: left;
      margin-top: 8px;
      padding-left: 21px;
    }
    .add-button {
      height: 32px;
      width: 32px;
      background-color: var(--success-color, #2e7d32);
      color: white;
      border: none;
      border-radius: 4px;
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
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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
    this._config = {
      lock_ms: 400,
      max_width: '500px',
      show_remove: true,
      only_self: false,
      show_all_users: false,
      ...config,
    };
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
      <div class="form">
        <label>
          <input type="checkbox" .checked=${this._config.show_remove} @change=${this._removeChanged} />
          Entfernen-Menü anzeigen
        </label>
      </div>
      <div class="form">
        <label>
          <input type="checkbox" .checked=${this._config.only_self} @change=${this._selfChanged} />
          Für Admins auch nur eigenen Nutzer anzeigen
        </label>
      </div>
      <details class="debug">
        <summary>Debug</summary>
        <div class="form">
          <label>
            <input type="checkbox" .checked=${this._config.show_all_users} @change=${this._debugAllChanged} />
            Für jeden alle Nutzer anzeigen
          </label>
        </div>
        <div class="version">Version: ${CARD_VERSION}</div>
      </details>
    `;
  }

  _lockChanged(ev) {
    const value = Number(ev.target.value);
    this._config = { ...this._config, lock_ms: isNaN(value) ? 400 : value };
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

  _removeChanged(ev) {
    this._config = { ...this._config, show_remove: ev.target.checked };
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  _selfChanged(ev) {
    this._config = { ...this._config, only_self: ev.target.checked };
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  _debugAllChanged(ev) {
    this._config = { ...this._config, show_all_users: ev.target.checked };
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
    details.debug {
      padding: 0 16px 16px;
    }
    details.debug summary {
      cursor: pointer;
      font-weight: bold;
      outline: none;
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
    _tallyAdmins: { state: true },
  };

  _tallyAdmins = [];

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
        height: 32px;
        box-sizing: border-box;
        background-color: var(--error-color, #c62828);
        color: white;
        border: none;
        border-radius: 4px;
      }
      .copy-container {
        text-align: right;
        margin-top: 8px;
      }
      .copy-container button {
        padding: 4px 8px;
        height: 32px;
        box-sizing: border-box;
      }
    `,
  ];

  setConfig(config) {
    this.config = {
      max_width: '500px',
      sort_by: 'due_desc',
      sort_menu: false,
      show_reset: true,
      show_reset_everyone: false,
      show_total: true,
      max_entries: 0,
      hide_free: false,
      show_copy: true,
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
    const userNames = [this.hass.user?.name, ...this._currentPersonNames()];
    const isAdmin = userNames.some(n => (this._tallyAdmins || []).includes(n));
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
    let ranking = users.map(u => {
      let total = 0;
      for (const [drink, entity] of Object.entries(u.drinks)) {
        const count = this._toNumber(this.hass.states[entity]?.state);
        const price = this._toNumber(prices[drink]);
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
    if (this.config.hide_free) {
      ranking = ranking.filter(r => r.due > 0);
    }
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
    if (this.config.max_entries > 0) {
      ranking = ranking.slice(0, this.config.max_entries);
    }
    const rows = ranking.map((r, i) => html`<tr><td>${i + 1}</td><td>${r.name}</td><td>${r.due.toFixed(2)} €</td></tr>`);
    const totalDue = ranking.reduce((sum, r) => sum + r.due, 0);
    const totalRow = this.config.show_total !== false
      ? html`<tfoot><tr><td colspan="2"><b>Gesamt</b></td><td>${totalDue.toFixed(2)} €</td></tr></tfoot>`
      : '';
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
    const copyButton = this.config.show_copy !== false
      ? html`<div class="copy-container"><button @click=${this._copyRanking}>Tabelle kopieren</button></div>`
      : '';
    const resetButton = (isAdmin || this.config.show_reset_everyone) &&
      this.config.show_reset !== false
      ? html`<div class="reset-container">
          <button @click=${this._resetAllTallies}>Alle Striche zurücksetzen</button>
        </div>`
      : '';
    return html`
      <ha-card style="${cardStyle}">
        ${sortMenu}
        <table>
          <thead><tr><th>#</th><th>Name</th><th>Zu zahlen</th></tr></thead>
          <tbody>${rows}</tbody>
          ${totalRow}
        </table>
        ${copyButton}
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
      this._fetchTallyAdmins();
    }
  }

  static async getConfigElement() {
    return document.createElement('tally-due-ranking-card-editor');
  }

  static getStubConfig() {
    return {
      max_width: '500px',
      sort_by: 'due_desc',
      sort_menu: false,
      show_total: true,
      max_entries: 0,
      hide_free: false,
      show_copy: true,
    };
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

  async _fetchTallyAdmins() {
    if (!this.hass?.connection) return;
    try {
      const resp = await this.hass.connection.sendMessagePromise({ type: 'tally_list/get_admins' });
      this._tallyAdmins = Array.isArray(resp?.admins) ? resp.admins : [];
    } catch (err) {
      this._tallyAdmins = [];
    }
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

  _currentPersonNames() {
    const userId = this.hass.user?.id;
    if (!userId) return [];
    const names = [];
    for (const [entity, state] of Object.entries(this.hass.states)) {
      if (entity.startsWith('person.') && state.attributes.user_id === userId) {
        const friendly = state.attributes.friendly_name;
        if (friendly) names.push(friendly);
      }
    }
    return names;
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

  _toNumber(value) {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
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

  _copyRanking() {
    let users = this.config.users || this._autoUsers || [];
    const userNames = [this.hass.user?.name, ...this._currentPersonNames()];
    const isAdmin = userNames.some(n => (this._tallyAdmins || []).includes(n));
    if (!isAdmin) {
      const allowed = this._currentPersonSlugs();
      const uid = this.hass.user?.id;
      users = users.filter(u => u.user_id === uid || allowed.includes(u.slug));
    }
    if (users.length === 0) return;
    const prices = this.config.prices || this._autoPrices || {};
    const freeAmount = Number(this.config.free_amount ?? this._freeAmount ?? 0);
    let ranking = users.map(u => {
      let total = 0;
      for (const [drink, entity] of Object.entries(u.drinks)) {
        const count = this._toNumber(this.hass.states[entity]?.state);
        const price = this._toNumber(prices[drink]);
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
    if (this.config.hide_free) {
      ranking = ranking.filter(r => r.due > 0);
    }
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
    if (this.config.max_entries > 0) {
      ranking = ranking.slice(0, this.config.max_entries);
    }
    const lines = ranking.map((r, i) => `${i + 1}. ${r.name}: ${r.due.toFixed(2)} €`);
    if (this.config.show_total !== false) {
      const total = ranking.reduce((sum, r) => sum + r.due, 0);
      lines.push(`Gesamt: ${total.toFixed(2)} €`);
    }
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      this.dispatchEvent(
        new CustomEvent('hass-notification', {
          detail: { message: 'Text in die Zwischenablage kopiert!' },
          bubbles: true,
          composed: true,
        })
      );
    });
  }

  _resetAllTallies() {
    const input = prompt('Zum Zurücksetzen aller Striche "JA ICH WILL" bzw. "YES I WANT TO" eingeben:');
    const normalized = (input || '').trim().toUpperCase();
    if (normalized !== 'JA ICH WILL' && normalized !== 'YES I WANT TO') {
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
      max_width: '500px',
      sort_by: 'due_desc',
      sort_menu: false,
      show_reset: true,
      show_reset_everyone: false,
      show_total: true,
      max_entries: 0,
      hide_free: false,
      show_copy: true,
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
        <label>Maximale Einträge (0 = alle)</label>
        <input
          type="number"
          .value=${this._config.max_entries ?? 0}
          @input=${this._maxChanged}
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
      <div class="form">
        <label>
          <input type="checkbox" .checked=${this._config.show_copy} @change=${this._copyChanged} />
          Kopier-Button anzeigen
        </label>
      </div>
      <div class="form">
        <label>
          <input type="checkbox" .checked=${this._config.show_total} @change=${this._totalChanged} />
          Gesamtsumme anzeigen
        </label>
      </div>
      <div class="form">
        <label>
          <input type="checkbox" .checked=${this._config.hide_free} @change=${this._hideChanged} />
          Personen ohne Betrag ausblenden
        </label>
      </div>
      <details class="debug">
        <summary>Debug</summary>
        <div class="form">
          <label>
            <input type="checkbox" .checked=${this._config.show_reset_everyone} @change=${this._debugResetChanged} />
            Für jeden Reset-Button anzeigen
          </label>
        </div>
        <div class="version">Version: ${CARD_VERSION}</div>
      </details>
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

  _copyChanged(ev) {
    this._config = { ...this._config, show_copy: ev.target.checked };
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  _totalChanged(ev) {
    this._config = { ...this._config, show_total: ev.target.checked };
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  _maxChanged(ev) {
    const val = parseInt(ev.target.value, 10);
    this._config = { ...this._config, max_entries: isNaN(val) ? 0 : val };
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  _hideChanged(ev) {
    this._config = { ...this._config, hide_free: ev.target.checked };
    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }

  _debugResetChanged(ev) {
    this._config = { ...this._config, show_reset_everyone: ev.target.checked };
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

