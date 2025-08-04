# Tally List Lovelace

Eine Lovelace-Karte für Home Assistant, die Getränkezähler pro Nutzer anzeigt und aktualisieren lässt. Nach der Auswahl eines Namens erscheinen die Anzahl der Getränke sowie der fällige Betrag. Nutzer und Preise werden automatisch aus der Tally‑List‑Integration gelesen. Währung und Sprache folgen den Home‑Assistant‑Einstellungen (Englisch und Deutsch, manuelle Auswahl möglich).

## Installation

### Über HACS
1. Dieses Repository in HACS als **Custom Repository** (Kategorie **Lovelace**) hinzufügen.
2. **Tally List Card** aus dem HACS‑Store installieren.
3. HACS hält die Karte aktuell.

### Manuell
1. `tally-list-card.js` in das `www`‑Verzeichnis von Home Assistant kopieren.
2. Folgende Ressource in Lovelace eintragen:
```yaml
- url: /local/tally-list-card.js
  type: module
```

### In Lovelace einbinden
Nach dem Hinzufügen der Ressource das Dashboard öffnen, **Karte hinzufügen** wählen und **Tally List Card** auswählen. Der Editor erlaubt die Konfiguration ohne YAML.

## Nutzung

### Automatische Konfiguration
```yaml
type: custom:tally-list-card
```
Alle von der Integration erkannten Nutzer erscheinen in der Auswahlliste. Administratoren (laut Tally‑List‑Integration) können jeden Nutzer wählen, normale Nutzer nur sich selbst. Getränkepreise stammen aus Sensoren `sensor.preisliste_<getränk>_price`. Falls `sensor.preisliste_free_amount` existiert, wird dieser Betrag jedem Nutzer gutgeschrieben. Sensoren `sensor.<name>_amount_due` überschreiben den berechneten Betrag.

Ein Klick auf **+1** fügt ein Getränk hinzu:

```yaml
action: tally_list.add_drink
data:
  user: Robin
  drink: Wasser
```

Über den Button **Getränk entfernen** wird ein Getränk mit `tally_list.remove_drink` abgezogen.

## Konfigurationsoptionen

Folgende Optionen stehen im UI zur Verfügung:

* **Sperrzeit (ms)** – Wie lange die Buttons nach dem Drücken deaktiviert bleiben. Standard `400`.
* **Maximale Breite (px)** – Begrenzung der Kartenbreite. Standard `500`.
* **Entfernen-Menü anzeigen** – Ein-/Ausblenden des Menüs zum Entfernen.
* **Nur sich selbst zeigen** – Auswahl auch für Admins auf den eingeloggten Nutzer beschränken.
* **Sprache** – **Auto**, **Deutsch** oder **English** erzwingen.
* **Version** – Zeigt die installierte Version an.

## Betrag-Rangliste

Eine zweite Karte listet alle Nutzer nach offenem Betrag sortiert auf.

```yaml
type: custom:tally-due-ranking-card
```

Optionen:

* **Maximale Breite (px)** – Begrenzung der Kartenbreite.
* **sort_by** – `due_desc` (Standard), `due_asc` oder `name`.
* **sort_menu** – Dropdown zur Änderung der Sortierung anzeigen.
* **show_reset** – Admin-Reset-Button anzeigen.
* **show_total** – Gesamtbetrag aller Nutzer anzeigen.
* **max_entries** – Anzahl angezeigter Nutzer begrenzen (`0` = unbegrenzt).
* **hide_free** – Nutzer ohne offenen Betrag ausblenden.
* **show_copy** – Schaltfläche **Tabelle kopieren** anzeigen.

