# Abfahrtsmonitor - Wiener Linien

Eine einfache Website zur Anzeige von Abfahrtszeiten der Wiener Linien, optimiert für ältere Geräte wie das iPad Air 2.

## Features

- 📍 Anzeige der Abfahrtszeiten für 5 favorisierte Stationen
- 🔄 Automatische Aktualisierung alle 30 Sekunden
- 📱 Optimiert für iPad Air 2 und ältere Browser
- 🎨 Modernes, responsives Design

## Setup-Anleitung

### 1. Wiener Linien Station IDs finden

Die Wiener Linien verwenden RBL-IDs (Realtime Base List) für ihre Stationen. Sie können die IDs auf verschiedene Weise finden:

**Option A: Über die Wiener Linien Website**
1. Besuchen Sie [wienerlinien.at](https://www.wienerlinien.at)
2. Suchen Sie nach Ihrer Station
3. Die RBL-ID finden Sie in der URL oder im Quellcode

**Option B: Über das Open Data Portal**
1. Besuchen Sie [wienerlinien.at/open-data](https://www.wienerlinien.at/open-data)
2. Laden Sie die Haltestellendaten herunter
3. Suchen Sie nach Ihrer Station und notieren Sie die RBL-ID

**Option C: Über die API direkt testen**
- Öffnen Sie: `https://www.wienerlinien.at/ogd_realtime/monitor?rbl=STATION_ID`
- Ersetzen Sie `STATION_ID` mit verschiedenen IDs, bis Sie die richtige finden

### 2. Konfiguration

Öffnen Sie die Datei `config.js` und passen Sie folgende Werte an:

```javascript
var CONFIG = {
    // Ihre 5 favorisierten Stationen
    stations: [
        {
            id: '490000001',  // RBL-ID der Station
            name: 'Schwedenplatz'  // Name der Station
        },
        // ... weitere Stationen
    ],
    
    // Refresh-Intervall in Millisekunden (Standard: 30000 = 30 Sekunden)
    refreshInterval: 30000,
    
    // Proxy-Server für Wiener Linien API (optional)
    wienerLinienProxy: 'https://wienerlinien-proxy.people-02-reasons.workers.dev'
};
```

### 3. Website verwenden

**Lokale Verwendung:**
1. Öffnen Sie `index.html` direkt im Browser
2. Die Website funktioniert auch offline (außer API-Aufrufen)

**Auf einem Server hosten:**
1. Laden Sie alle Dateien auf einen Webserver hoch
2. Öffnen Sie die Website über die URL
3. Für iPad Air 2: Fügen Sie die Website zu den Favoriten hinzu

**Für iPad Air 2:**
1. Öffnen Sie die Website im Safari-Browser
2. Tippen Sie auf das Teilen-Symbol
3. Wählen Sie "Zum Home-Bildschirm hinzufügen"
4. Die Website kann nun wie eine App verwendet werden

## Dateistruktur

```
Abfahrtsmonitor/
├── index.html      # Haupt-HTML-Datei
├── style.css       # Styling
├── app.js          # Haupt-JavaScript-Logik
├── config.js       # Konfigurationsdatei
└── README.md       # Diese Datei
```

## Browser-Kompatibilität

Die Website ist optimiert für:
- Safari (iPad Air 2)
- Ältere Browser-Versionen
- Verwendet XMLHttpRequest statt Fetch API für bessere Kompatibilität
- Keine modernen JavaScript-Features, die ältere Browser nicht unterstützen

## API-Limits

**Wiener Linien:**
- Keine bekannten Limits für Open Data
- Bitte beachten Sie die [Nutzungsbedingungen](https://www.wienerlinien.at/open-data)

## Fehlerbehebung

**Stationen zeigen keine Daten:**
- Überprüfen Sie, ob die DIVA-IDs korrekt sind
- Die Website verwendet einen Proxy-Server, um CORS-Probleme zu vermeiden
- Standard-Proxy: `https://wienerlinien-proxy.people-02-reasons.workers.dev`
- Sie können den Proxy in `config.js` anpassen, falls nötig
- Testen Sie den Proxy direkt: `https://wienerlinien-proxy.people-02-reasons.workers.dev?diva=STATION_ID`

**Website lädt nicht auf iPad:**
- Stellen Sie sicher, dass Sie eine HTTPS-Verbindung verwenden (für API-Aufrufe)
- Oder verwenden Sie einen lokalen Server
- Überprüfen Sie die Browser-Konsole auf CORS-Fehler

**Proxy-Server für Wiener Linien API:**
Die Website verwendet standardmäßig einen Proxy-Server, um CORS-Probleme zu vermeiden:
- **Standard-Proxy:** `https://wienerlinien-proxy.people-02-reasons.workers.dev`
- Der Proxy erwartet den Parameter `diva` (DIVA-ID) oder `stopId`
- Sie können den Proxy-URL in `config.js` anpassen, falls Sie einen eigenen Proxy verwenden möchten

**Eigener Proxy-Server:**
Falls Sie einen eigenen Proxy erstellen möchten:
1. Der Proxy sollte GET-Anfragen mit `diva` oder `stopId` Parameter akzeptieren
2. Der Proxy sollte die Wiener Linien API aufrufen und die Antwort weiterleiten
3. Der Proxy muss CORS-Header setzen, um Browser-Aufrufe zu erlauben

## Lizenz

Diese Website verwendet:
- Wiener Linien Open Data (CC BY 4.0)

## Support

Bei Problemen:
1. Überprüfen Sie die Browser-Konsole auf Fehlermeldungen
2. Stellen Sie sicher, dass die Station-IDs korrekt konfiguriert sind
3. Testen Sie die API-Endpunkte direkt im Browser

## Anpassungen

Sie können die Website nach Ihren Wünschen anpassen:
- **Refresh-Intervall:** Ändern Sie `refreshInterval` in `config.js` (in Millisekunden)
- **Design:** Passen Sie `style.css` an
- **Anzahl der Stationen:** Ändern Sie die Anzahl in `config.js` und `index.html`

