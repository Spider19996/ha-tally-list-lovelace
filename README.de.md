# Tally List Lovelace

🇬🇧 [Read English version](README.md)

Eine Lovelace-Karte für Home Assistant, die Getränkezähler pro Nutzer anzeigt und aktualisieren lässt. Nach der Auswahl eines Namens erscheinen die Anzahl der Getränke sowie der fällige Betrag. Nutzer und Preise werden automatisch aus der Tally‑List‑Integration gelesen. Währung und Sprache folgen den Home‑Assistant‑Einstellungen (Englisch und Deutsch, manuelle Auswahl möglich).

<p align="center">
  <img src="images/image1.png" width="24%" />
  <img src="images/image2.png" width="24%" />
  <img src="images/image3.png" width="24%" />
  <img src="images/image4.png" width="24%" />
</p>

## Funktionen

* Zeigt Getränkeanzahl, offenen Betrag und Guthaben/Schulden pro Nutzer
* Getränke hinzufügen oder entfernen mit einstellbarer Schrittweite
* Automatische Erkennung von Nutzern und Preisen über die Tally‑List‑Integration
* Sprachunterstützung für Deutsch und Englisch
* Enthält zusätzliche Karten:
  * **Strichliste Rangliste** – sortiert alle Nutzer nach offenem Betrag
  * **Strichliste Freigetränke** – bucht Freigetränke mit Kommentarpflicht
  * **Strichliste PIN setzen** – erlaubt das Setzen oder Zurücksetzen der PIN

## Voraussetzungen

* Home Assistant
* [Tally‑List‑Integration](https://github.com/Spider19996/ha-tally-list)

## Installation

### Über HACS
1. Dieses Repository in HACS als **Custom Repository** (Kategorie **Lovelace**) hinzufügen.
2. **Tally List Card** aus dem HACS‑Store installieren.
3. HACS hält die Dateien aktuell.

### Manuell
1. `tally-list-card.js` in das `www`‑Verzeichnis von Home Assistant kopieren.
2. Folgende Ressourcen in Lovelace eintragen:
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
Alle von der Integration erkannten Nutzer erscheinen in der Auswahlliste. Administratoren (laut Tally‑List‑Integration) können jeden Nutzer wählen, normale Nutzer nur sich selbst. Getränkepreise stammen aus Sensoren `sensor.price_list_<getränk>_price`. Falls `sensor.price_list_free_amount` existiert, wird dieser Betrag jedem Nutzer gutgeschrieben. Sensoren `sensor.<name>_amount_due` überschreiben den berechneten Betrag.

Unter der Nutzerauswahl ermöglicht eine neue Buttonreihe, wie viele Getränke auf einmal hinzugefügt oder entfernt werden (1, 3, 5 oder 10). Die gewählte Anzahl wird hervorgehoben und für alle folgenden Aktionen verwendet.

Ein Klick auf **+X** fügt die ausgewählte Anzahl an Getränken hinzu:

```yaml
action: tally_list.add_drink
data:
  user: Robin
  drink: Wasser
  count: 3
```

Über den Button **Getränk entfernen** werden Getränke mit `tally_list.remove_drink` abgezogen. Wird `count` weggelassen, beträgt der Standardwert `1`.

## Konfigurationsoptionen

Folgende Optionen stehen im UI zur Verfügung:

* **Sperrzeit (ms)** – Wie lange die Buttons nach dem Drücken deaktiviert bleiben. Standard `400`.
* **Session-Timeout (s)** – Zeit bis zum automatischen Logout nach dem Login. Standard `30`.
* **Maximale Breite (px)** – Begrenzung der Kartenbreite. Standard `500`.
* **Entfernen-Menü anzeigen** – Ein-/Ausblenden des Menüs zum Entfernen.
* **Schrittweiten-Auswahl anzeigen** – Schaltflächen zur Auswahl der Schrittweite (1, 3, 5, 10) anzeigen.
* **Guthaben/Schulden anzeigen** – Zeile mit bereits gezahltem Betrag ein- oder ausblenden.
* **Nur sich selbst zeigen** – Auswahl auch für Admins auf den eingeloggten Nutzer beschränken.
* **Namen kürzen** – Namen in der Auswahl abkürzen, bei Bedarf mit weiteren Buchstaben eindeutig halten.
* **Sprache** – **Auto**, **Deutsch** oder **English** erzwingen.
* **Version** – Zeigt die installierte Version an.

## Strichliste Rangliste

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
* **shorten_user_names** – Namen in der Tabelle abkürzen.

## Strichliste Freigetränke

Bucht Freigetränke mit Pflichtkommentar. Zähler werden lokal gepuffert, bis sie abgeschickt werden. Mit dem Reset-Button lassen sich alle Zähler zurücksetzen. Vor der PIN-Eingabe muss ein Nutzer gewählt werden.

```yaml
type: custom:tally-list-free-drinks-card
```

Optionen:

* **show_prices** – Preise anzeigen (`true` standardmäßig).
* **comment_presets** – Vordefinierte Kommentarpräfixe. Jedes Element hat `label` und optional `require_comment`.
* **session_timeout_seconds** – Zeit bis zum automatischen Logout nach dem Login (`30` standardmäßig).
* **pin_lock_ms** – PIN-Sperrzeit in Millisekunden (`5000` standardmäßig).
* **max_width** – Maximale Kartenbreite in Pixeln (`500` standardmäßig).
* **free_drinks_timer_seconds** – Auto-Reset-Timer in Sekunden (`0` = aus).
* **free_drinks_per_item_limit** – Limit je Getränk (`0` = aus).
* **free_drinks_total_limit** – Gesamtlimit (`0` = aus).
* **only_self** – Nur den eigenen Nutzer anzeigen, auch für Admins.
* **Namen kürzen** – Namen in der Auswahl abkürzen.

Beispiel:

```yaml
type: custom:tally-list-free-drinks-card
comment_presets:
  - label: Einsatz
    require_comment: true
  - label: Übung
    require_comment: false
```


## Strichliste PIN setzen

Nutzer können ihre eigene 4-stellige PIN setzen oder zurücksetzen. Administratoren können für jeden Nutzer die PIN festlegen. Die Karte kann über den Lovelace-Karteneditor hinzugefügt werden.
Beim Öffnen der Karte kann ein konfigurierbarer Hinweis anzeigen, keine wichtige PIN (z. B. die der Bankkarte) zu verwenden. Wird der Text leer gelassen, wird kein Hinweis gezeigt.

```yaml
type: custom:tally-set-pin-card
```

Die Karte verwendet die gleiche Benutzerliste wie die Hauptkarte und benötigt normalerweise keine zusätzliche Konfiguration.

Optionen:

* **Sperrzeit (ms)** – Wartezeit nach jeder PIN-Eingabe (auch bei Fehlern) (`5000` Standard).
* **max_width** – Maximale Kartenbreite in Pixeln (`500` Standard).
* **user_selector** – Layout der Nutzerauswahl: `list`, `tabs` oder `grid` (`list` standardmäßig).
* **Namen kürzen** – Namen in der Auswahl abkürzen.
* **only_self** – Nur den eigenen Nutzer anzeigen, auch für Admins.
* **pin_warning** – Warntext beim Öffnen der Karte. Unterstützt Zeilenumbrüche und einfache Markdown-Formatierung für _kursiv_, **fett** und __unterstrichen__. Leerer Text blendet den Hinweis aus. Standardtext: "**Bitte keine wichtige PIN (z. B. die der Bankkarte) verwenden.** PINs werden zwar verschlüsselt gespeichert, dennoch kann nicht garantiert werden, dass sie nicht in falsche Hände gerät."

Zum Speichern der neuen PIN wird der Service `tally_list.set_pin` aufgerufen, z. B.:

```yaml
action: tally_list.set_pin
data:
  user: Erika Mustermann
  pin: "1234"
```

## Protokoll-Karte

Zeigt die letzten Aktionen des Protokoll-Sensors in einer Markdown-Karte.

```yaml
type: markdown
content: |
  {% set all_entries = state_attr('sensor.price_list_feed','entries') | default([], true) %}
  {% set sorted = all_entries | sort(attribute='time_local') %}
  {% set entries = sorted[-50:] | list | reverse %}

  {% set action_map = {
    'add_drink': 'Getränk gebucht',
    'add_free_drink': 'Freigetränke hinzugefügt',
    'remove_drink': 'Getränk entfernt',
    'edit_drink': 'Getränk bearbeitet',
    'set_drink': 'Getränk gesetzt',
    'set_pin': 'PIN gesetzt',
    'add_drink_type': 'Getränketyp hinzugefügt',
    'remove_drink_type': 'Getränketyp entfernt',
    'enable_logging': 'Protokollierung aktiviert',
    'disable_logging': 'Protokollierung deaktiviert',
    'enable_log_drinks': 'Protokollierung Getränke aktiviert',
    'disable_log_drinks': 'Protokollierung Getränke deaktiviert',
    'enable_log_price_changes': 'Protokollierung Preisänderungen aktiviert',
    'disable_log_price_changes': 'Protokollierung Preisänderungen deaktiviert',
    'enable_log_free_drinks': 'Protokollierung Freigetränke aktiviert',
    'disable_log_free_drinks': 'Protokollierung Freigetränke deaktiviert',
    'enable_log_pin_set': 'Protokollierung PIN-Änderungen aktiviert',
    'disable_log_pin_set': 'Protokollierung PIN-Änderungen deaktiviert',
    'authorize_public': 'Öffentliches Gerät hinzugefügt',
    'unauthorize_public': 'Öffentliches Gerät entfernt',
    'grant_admin': 'Admin-Rechte vergeben',
    'revoke_admin': 'Admin-Rechte entzogen',
    'include_user': 'Nutzer hinzugefügt',
    'exclude_user': 'Nutzer ausgeschlossen',
    'set_free_amount': 'Freibetrag gesetzt',
    'set_credit': 'Guthaben gesetzt'
  } %}

  {% set module_map = {
    'log_drinks': 'Getränke',
    'log_price_changes': 'Preisänderungen',
    'log_free_drinks': 'Freigetränke',
    'log_pin_set': 'PIN-Änderungen',
    'log_settings': 'Berechtigungen'
  } %}

  {% for e in entries %}
  {% set raw = e.details | string %}
  {% set date = as_timestamp(as_datetime(e.time_local)) | timestamp_custom("%d.%m.%Y %H:%M") %}
  {% set base = "**" ~ date ~ "** — " ~ e.user ~ ": " ~ action_map.get(e.action, e.action) %}

  {% if e.action == "set_pin" %}
  {{ base }} → {{ raw | regex_replace(':set$','') }}

  {% elif e.action in ["enable_logging", "disable_logging"] %}
  {% set parts = raw.split(',') %}
  {% if parts and parts[0] != "logging" %}
  {{ base }} → {{ parts | map('replace','log_drinks', module_map['log_drinks'])
                   | map('replace','log_price_changes', module_map['log_price_changes'])
                   | map('replace','log_free_drinks', module_map['log_free_drinks'])
                   | map('replace','log_pin_set', module_map['log_pin_set'])
                   | map('replace','log_settings', module_map['log_settings'])
                   | join(', ') }}
  {% else %}
  {{ base }}
  {% endif %}

  {% elif e.action in [
    "enable_log_drinks","disable_log_drinks",
    "enable_log_price_changes","disable_log_price_changes",
    "enable_log_free_drinks","disable_log_free_drinks",
    "enable_log_pin_set","disable_log_pin_set",
    "authorize_public","unauthorize_public",
    "grant_admin","revoke_admin",
    "include_user","exclude_user"
  ] %}
  {{ base }} → {{ raw }}

  {% elif e.action == "edit_drink" %}
  {% set drink = raw.split(':')[0] %}
  {% set changes = raw.split(':')[-1] %}
  {% set parts = changes.split('->') %}
  {{ base }} → {{ drink }}: {{ "%.2f"|format(parts[0]|float) | replace('.',',') }} € → {{ "%.2f"|format(parts[1]|float) | replace('.',',') }} €

  {% elif e.action == "set_free_amount" %}
  {% set parts = raw.split('->') %}
  {{ base }} → {{ "%.2f"|format(parts[0]|float) | replace('.',',') }} € → {{ "%.2f"|format(parts[1]|float) | replace('.',',') }} €

  {% elif e.action == "set_credit" %}
  {% set parts = raw.split(':') %}
  {{ base }} → {{ parts[0] }}: {{ "%.2f"|format(parts[1]|float) | replace('.',',') }} €

  {% elif e.action in ["set_drink","add_drink_type"] %}
  {% set details = raw.split(':')[-1] %}
  {% set parts = details.split('=') %}
  {{ base }} → {{ parts[0] }} = {{ "%.2f"|format(parts[1]|float) | replace('.',',') }} €

  {% elif e.action == "remove_drink_type" %}
  {{ base }} → {{ raw.split(':')[-1] }}

  {% else %}
  {% set parts = raw.split(',') %}
  {{ base }} → {% for p in parts %}{{ p | replace(':',': ') }}{{ ', ' if not loop.last else '' }}{% endfor %}
  {% endif %}
  {% endfor %}
```

## Freigetränke-Feed Markdown-Karte

Zeigt die letzten Einträge des Freigetränke-Feeds in einer Markdown-Karte.

```yaml
type: markdown
content: |
  {% set all_entries = state_attr('sensor.free_drink_feed','entries') | default([], true) %}
  {% set entries = all_entries[-5:] | list | reverse %}

  {% for e in entries %}
  {% set date = as_timestamp(as_datetime(e.time_local)) | timestamp_custom("%d.%m.%Y %H:%M") %}
  **{{ date }}** — {{ e.name }}: Freigetränke gebucht → {{ e.drinks }} _(„{{ e.comment }}“)_
  {% endfor %}
```

