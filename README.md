# ha-drink-counter-lovelace

A simple Lovelace card for showing and updating drink counts per user. Select a name and the card displays how many drinks of each type that user has consumed and the amount owed. Prices are shown with the **€** symbol. Each drink row provides an **+1** button on the left to increment the counter. The table refreshes automatically after adding a drink. The card can automatically read all users and drink prices from the **Drink Counter** integration.

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

### Add to Lovelace

After the resource is available, open the Lovelace dashboard, click **Add Card**
and select **Drink Counter Card** from the list. The built-in editor lets you
adjust the lock time without writing YAML.

## Example

### Automatic configuration

```yaml
type: custom:drink-counter-card
```

The dropdown lists all users detected from the integration and calculates totals using the stored price list. No manual configuration is required.
The selected user's **display name** is sent to the `drink_counter.add_drink` service, so capitalization is preserved.

Pressing **+1** on the Water row triggers a service call like:

```yaml
action: drink_counter.add_drink
data:
  user: Robin
  drink: Wasser
```

The top-right **Getränk entfernen** button opens a menu to subtract a drink. Selecting
**Wasser** sends:

```yaml
action: drink_counter.remove_drink
data:
  user: Robin
  drink: Wasser
```

If `sensor.preisliste_free_amount` exists, its value is deducted from every user's total. The table displays this free amount and shows the final **Zu zahlen** sum.
When sensors named `sensor.<name>_amount_due` are present, their values are used directly for the **Zu zahlen** row instead of calculating it from the drink counts.

If the free amount equals **0 €**, the card hides the **Freibetrag** and **Zu zahlen** rows and only shows the **Gesamt** line.

## UI configuration

The card can now be configured directly in the Lovelace UI. It offers the following options:

* **Sperrzeit (ms)** – How long the buttons stay disabled after pressing **+1** or **-1**. The default is `1000` milliseconds.
* **Maximale Breite (px)** – Optional width limit for the card in pixels. Enter a number and the `px` unit is added automatically. Useful when using panel views to prevent the layout from stretching too wide.

