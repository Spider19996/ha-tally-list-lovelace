# ha-drink-counter-lovelace

A simple Lovelace card for showing drink counts per user. Select a name and the card displays how many drinks of each type that user has consumed and the amount owed based on configurable prices.

## Installation

1. Copy `drink-counter-card.js` to your Home Assistant `www` directory.
2. Add the following to your Lovelace resources:
   ```yaml
   - url: /local/drink-counter-card.js
     type: module
   ```

## Example

```yaml
type: custom:drink-counter-card
users:
  - name: Alice
    drinks:
      beer: sensor.alice_beer
      water: sensor.alice_water
  - name: Bob
    drinks:
      beer: sensor.bob_beer
      water: sensor.bob_water
prices:
  beer: 2.5
  water: 1.0
```

This configuration creates a dropdown with *Alice* and *Bob*. The card uses the defined sensors to read drink counts and multiplies them by the given prices to show totals.

