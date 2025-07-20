# ha-drink-counter-lovelace

A simple Lovelace card for showing and updating drink counts per user. Select a name and the card displays how many drinks of each type that user has consumed and the amount owed. Each drink row provides an **Add** button to increment the counter. The card can automatically read all users and drink prices from the **Drink Counter** integration.

## Installation

### Via HACS

1. Add this repository as a **Custom Repository** in HACS using the
   **Lovelace** category.
2. Install the **Drink Counter Card** from the HACS store.
3. HACS will keep the card up to date.

### Manual

1. Copy `drink-counter-card.js` to your Home Assistant `www` directory.
2. Add the following to your Lovelace resources:
   ```yaml
   - url: /local/drink-counter-card.js
     type: module
   ```

## Example

### Automatic configuration

```yaml
type: custom:drink-counter-card
```

### Manual configuration

```yaml
type: custom:drink-counter-card
users:
  - name: Alice
    drinks:
      beer: sensor.alice_beer_count
      water: sensor.alice_water_count
prices:
  beer: 2.5
  water: 1.0
```

When configured automatically the dropdown lists all users detected from the integration and calculates totals using the stored price list.

