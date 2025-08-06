# Tally List Lovelace

🇩🇪 [Deutsche Version lesen](README.de.md)

A Lovelace card for Home Assistant that displays drink tallies per user and allows updating them. Selecting a name shows drink counts and the amount owed. Prices and users are read automatically from the Tally List integration. Currency and language follow Home Assistant settings (English and German supported, with optional override).

**Note:** This card requires the [Tally List integration](https://github.com/Spider19996/ha-tally-list).

![Screenshot of the Tally List Card](images/image1.png)

## Installation

### Via HACS
1. Add this repository as a **Custom Repository** in HACS (category **Lovelace**).
2. Install **Tally List Card** from the HACS store.
3. HACS keeps the card up to date.

### Manual
1. Copy `tally-list-card.js` to your Home Assistant `www` directory.
2. Add to your Lovelace resources:
```yaml
- url: /local/tally-list-card.js
  type: module
```

### Add to Lovelace
After the resource is available, open the dashboard, choose **Add Card**, and select **Tally List Card**. The editor lets you configure options without YAML.

## Usage

### Automatic configuration
```yaml
type: custom:tally-list-card
```
All users detected by the integration appear in the dropdown. Admins (as defined in the Tally List integration) may choose any user; regular users can only select themselves. Drink prices are taken from sensors named `sensor.preisliste_<drink>_price`. If `sensor.preisliste_free_amount` exists, its value is deducted from each user's total. Sensors named `sensor.<name>_amount_due` override the calculated amount due.

Pressing **+1** adds a drink:

```yaml
action: tally_list.add_drink
data:
  user: Robin
  drink: Wasser
```

The **Remove drink** button subtracts a drink with a `tally_list.remove_drink` call.

## Configuration options

The card offers the following options in the UI:

* **Lock time (ms)** – Duration the buttons stay disabled after pressing them. Default `400`.
* **Maximum width (px)** – Limit card width. Default `500`.
* **Show remove menu** – Enable/disable the remove-drink dropdown.
* **Only show self** – Limit selection to the logged‑in user even for admins.
* **Language** – Force **Auto**, **Deutsch**, or **English**.
* **Version** – Display the installed version.

## Amount Due Ranking

A second card lists all users ordered by outstanding amount.

```yaml
type: custom:tally-due-ranking-card
```

Options:

* **Maximum width (px)** – Limit card width.
* **sort_by** – `due_desc` (default), `due_asc`, or `name`.
* **sort_menu** – Show a dropdown to change the sort order.
* **show_reset** – Show the admin reset button.
* **show_total** – Display the total outstanding amount.
* **max_entries** – Limit how many users are shown (`0` = no limit).
* **hide_free** – Hide users who owe nothing.
* **show_copy** – Show the "Tabelle kopieren" button.

