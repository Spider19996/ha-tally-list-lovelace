// Tally List Free Drinks Card
import { LitElement, html, css } from 'https://unpkg.com/lit?module';
import { repeat } from 'https://unpkg.com/lit/directives/repeat.js?module';
import { detectLang, translate } from './tally-list-card.js';
const CARD_VERSION = '09.08.2025';

const FD_STRINGS = {
  en: {
    card_name: 'Free Drinks Card',
    card_desc: 'Book free drinks with a required comment.',
    comment: 'Comment',
    comment_error: 'Please enter at least 3 characters',
    submit: 'Submit',
    drink: 'Drink',
    price: 'Price',
    count: 'Count',
    search: 'Search…',
    free_booked: 'Free drinks booked',
  },
  de: {
    card_name: 'Freigetränke Karte',
    card_desc: 'Freigetränke mit Pflichtkommentar buchen.',
    comment: 'Kommentar',
    comment_error: 'Bitte mindestens 3 Zeichen eingeben',
    submit: 'Abschicken',
    drink: 'Getränk',
    price: 'Preis',
    count: 'Zähler',
    search: 'Suche…',
    free_booked: 'Freigetränke gebucht',
  },
};

function t(hass, override, key) {
  return translate(hass, override, FD_STRINGS, key);
}

function slugify(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

window.customCards = window.customCards || [];
const navLang = detectLang();
window.customCards.push({
  type: 'tally-list-free-drinks-card',
  name: FD_STRINGS[navLang].card_name,
  preview: true,
  description: FD_STRINGS[navLang].card_desc,
});

class TallyListFreeDrinksCard extends LitElement {
  static properties = {
    hass: {},
    config: {},
    selectedUser: { state: true },
    _autoUsers: { state: true },
    _autoPrices: { state: true },
    _currency: { state: true },
    _filter: { state: true },
    _pending: { state: true },
    _comment: { state: true },
  };

  constructor() {
    super();
    this.selectedUser = '';
    this._autoUsers = [];
    this._autoPrices = {};
    this._currency = '';
    this._filter = '';
    this._pending = {};
    this._comment = '';
  }

  setConfig(config) {
    this.config = {
      user_mode: 'auto',
      show_prices: true,
      sensor_refresh_after_submit: false,
      ...(config || {}),
    };
  }

  getCardSize() {
    return 3;
  }

  _gatherUsers() {
    const users = [];
    const states = this.hass.states;
    for (const [entity, state] of Object.entries(states)) {
      const match = entity.match(/^sensor\.([a-z0-9_]+)_amount_due$/);
      if (match) {
        const slug = match[1];
        if (slug === 'free_drinks') continue;
        const sensorName = (state.attributes.friendly_name || '')
          .replace(' Amount Due', '')
          .replace(' Offener Betrag', '');
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
            if (pEntity.startsWith('person.') && slugify(pState.attributes?.friendly_name || '') === slug) {
              person = pState;
              break;
            }
          }
        }
        const user_id = person?.attributes?.user_id || null;
        const personName = person?.attributes?.friendly_name;
        const name = personName || sensorName || slug;
        users.push({ name, slug, drinks, user_id });
      }
    }
    return users;
  }

  _gatherPrices() {
    const prices = {};
    const states = this.hass.states;
    for (const [entity, state] of Object.entries(states)) {
      const match = entity.match(/^sensor\.price_list_([^_]+)_price$/);
      if (match) {
        const drink = match[1];
        const price = parseFloat(state.state);
        prices[drink] = isNaN(price) ? 0 : price;
        if (!this._currency) {
          const cur = state.attributes?.currency || state.attributes?.unit_of_measurement;
          if (cur) this._currency = cur;
        }
      }
    }
    return prices;
  }

  updated(changedProps) {
    if (changedProps.has('hass')) {
      if (!this.config.users) {
        this._autoUsers = this._gatherUsers();
      }
      if (!this.config.prices) {
        this._autoPrices = this._gatherPrices();
      }
      const users = this.config.users || this._autoUsers || [];
      if (!this.selectedUser && this.hass.user) {
        const slug = slugify(this.hass.user.name);
        const u = users.find(u => u.slug === slug);
        this.selectedUser = u ? u.name || u.slug : slug;
      }
      if (this.config.user_mode === 'fixed' && this.hass.user) {
        const slug = slugify(this.hass.user.name);
        const u = users.find(u => u.slug === slug);
        this.selectedUser = u ? u.name || u.slug : slug;
      }
    }
  }

  _onSelectUser(ev) {
    this.selectedUser = ev.target.value;
  }

  _onSearch(ev) {
    this._filter = ev.target.value.toLowerCase();
  }

  _inc(ev) {
    const drink = ev.currentTarget.dataset.drink;
    const cur = this._pending[drink] || 0;
    this._pending = { ...this._pending, [drink]: cur + 1 };
  }

  _dec(ev) {
    const drink = ev.currentTarget.dataset.drink;
    const cur = this._pending[drink] || 0;
    const next = Math.max(0, cur - 1);
    this._pending = { ...this._pending, [drink]: next };
  }

  _onComment(ev) {
    this._comment = ev.target.value;
  }

  _validComment() {
    const trimmed = this._comment.trim();
    return trimmed.length >= 3 && trimmed === this._comment;
  }

  _pendingSum() {
    return Object.values(this._pending).reduce((a, b) => a + b, 0);
  }

  async _submit() {
    if (!this._validComment() || this._pendingSum() === 0) return;
    const comment = this._comment.trim();
    const user = this.selectedUser;
    const drinks = Object.entries(this._pending).filter(([d, c]) => c > 0);
    try {
      for (const [drink, count] of drinks) {
        const displayDrink = drink.charAt(0).toUpperCase() + drink.slice(1);
        await this.hass.callService('tally_list', 'add_drink', {
          user,
          drink: displayDrink,
          count,
          free_drink: true,
          comment,
        });
        if (this.config.sensor_refresh_after_submit) {
          const users = this.config.users || this._autoUsers || [];
          const u = users.find(u => u.slug === user || u.name === user);
          const entity = u?.drinks?.[drink];
          if (entity) {
            this.hass.callService('homeassistant', 'update_entity', { entity_id: entity });
          }
        }
      }
      this._pending = {};
      this._comment = '';
      this.dispatchEvent(
        new CustomEvent('hass-notification', {
          detail: { message: t(this.hass, this.config.language, 'free_booked') },
          bubbles: true,
          composed: true,
        })
      );
    } catch (err) {
      const code = err?.error?.code || err?.code || err?.message || err;
      this.dispatchEvent(
        new CustomEvent('hass-notification', {
          detail: { message: String(code) },
          bubbles: true,
          composed: true,
        })
      );
    }
  }

  render() {
    if (!this.hass) return html`<ha-card>Waiting for hass…</ha-card>`;
    const users = this.config.users || this._autoUsers || [];
    if (users.length === 0) return html`<ha-card>...</ha-card>`;
    if (!this.selectedUser) {
      const u0 = users[0];
      this.selectedUser = u0.name || u0.slug;
    }
    const user = users.find(u => u.slug === this.selectedUser || u.name === this.selectedUser);
    const prices = this.config.prices || this._autoPrices || {};
    const filter = this._filter;
    const drinks = Object.keys(prices)
      .sort((a, b) => a.localeCompare(b))
      .filter(d => !filter || d.toLowerCase().includes(filter));
    drinks.forEach(d => {
      if (!(d in this._pending)) this._pending[d] = 0;
    });
    const showPrices = this.config.show_prices !== false;
    const isCommentValid = this._validComment();
    const canSubmit = isCommentValid && this._pendingSum() > 0;
    const idUser = this._fid('user');
    const idSearch = this._fid('search');
    const idComment = this._fid('comment');
    return html`
      <ha-card .header=${this.config.title}>
        <div class="header">
          ${this.config.user_mode !== 'fixed'
            ? html`<div class="user-select"><select id="${idUser}" @change=${this._onSelectUser}>${repeat(
                users,
                u => u.slug,
                u => html`<option value="${u.name || u.slug}" ?selected=${
                  (u.name || u.slug) === this.selectedUser
                }>${u.name}</option>`
              )}</select></div>`
            : ''}
          <input id="${idSearch}" type="text" placeholder="${t(this.hass, this.config.language, 'search')}" @input=${this._onSearch} />
        </div>
        <div class="drinks">
          <table>
            <thead><tr><th>${t(this.hass, this.config.language, 'drink')}</th>${showPrices
                ? html`<th>${t(this.hass, this.config.language, 'price')}</th>`
                : ''}<th>${t(this.hass, this.config.language, 'count')}</th></tr></thead>
            <tbody>
              ${repeat(
                drinks,
                d => d,
                d => html`<tr>
                      <td>${d.charAt(0).toUpperCase() + d.slice(1)}</td>
                      ${showPrices
                        ? html`<td>${this._formatPrice(prices[d])} ${this._currency}</td>`
                        : ''}
                      <td class="counter">
                        <button data-drink="${d}" @click=${this._dec}>-</button>
                        <span>${this._pending[d] || 0}</span>
                        <button data-drink="${d}" @click=${this._inc}>+</button>
                      </td>
                    </tr>`
              )}
            </tbody>
          </table>
        </div>
        <div class="footer">
          <div class="comment">
            <input id="${idComment}" type="text" .value=${this._comment} @input=${this._onComment} placeholder="${t(
              this.hass,
              this.config.language,
              'comment'
            )}" />
            ${isCommentValid
              ? ''
              : html`<div class="error">${t(this.hass, this.config.language, 'comment_error')}</div>`}
          </div>
          <button class="submit" ?disabled=${!canSubmit} @click=${this._submit}>${t(
            this.hass,
            this.config.language,
            'submit'
          )}</button>
        </div>
      </ha-card>
    `;
  }

  _formatPrice(price) {
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  _fid(suffix) {
    return `fd-${suffix}`;
  }

  static async getConfigElement() {
    return document.createElement('tally-list-free-drinks-card-editor');
  }

  static getStubConfig() {
    return { user_mode: 'auto', show_prices: true, sensor_refresh_after_submit: false };
  }

  static styles = css`
    ha-card {
      padding: 8px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .drinks table {
      width: 100%;
      border-collapse: collapse;
    }
    .drinks th, .drinks td {
      padding: 4px;
    }
    .counter {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .counter button {
      width: 32px;
      height: 32px;
    }
    .footer {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 8px;
    }
    .footer .comment input {
      width: 100%;
      box-sizing: border-box;
    }
    .footer .error {
      color: var(--error-color);
      font-size: 0.8em;
    }
    .footer .submit {
      align-self: flex-end;
    }
  `;
}

customElements.define('tally-list-free-drinks-card', TallyListFreeDrinksCard);

export { t };

