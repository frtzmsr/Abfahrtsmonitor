# Abfahrtsmonitor - Wiener Linien

Eine einfache Website zur Anzeige von Abfahrtszeiten der Wiener Linien und aktuellen Wetterdaten, optimiert für ältere Geräte wie das iPad Air 2.

## Features

- 📍 Anzeige der Abfahrtszeiten für 5 favorisierte Stationen
- 🌤️ Aktuelles Wetter an Ihrem Standort
- 🔄 Automatische Aktualisierung alle 30 Sekunden
- 📱 Optimiert für iPad Air 2 und ältere Browser
- 🎨 Modernes, responsives Design

## Setup-Anleitung

### 1. Geosphere Austria API (kein API-Schlüssel erforderlich)

Die Website verwendet die Geosphere Austria API für Wetterdaten. Diese API ist kostenlos und erfordert normalerweise keinen API-Schlüssel für grundlegende Nutzung.

**Informationen:**
- Geosphere Austria ist der offizielle österreichische Wetterdienst
- API-Dokumentation: [dataset.api.hub.geosphere.at](https://dataset.api.hub.geosphere.at/v1/docs/)
- Die Website verwendet standardmäßig die Wetterstation Wien-Hohe Warte (ID: 11035)

**Hinweis:** Falls die API-Endpunkte geändert wurden oder CORS-Probleme auftreten, können Sie die Endpunkte in `app.js` anpassen.

### 2. Wiener Linien Station IDs finden

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

### 3. Konfiguration

Öffnen Sie die Datei `config.js` und passen Sie folgende Werte an:

```javascript
var CONFIG = {
    // Geosphere Austria API (kein API-Schlüssel erforderlich)
    useGeosphereApi: true,
    
    // Ihre Koordinaten (optional, Standard ist Wien Zentrum)
    latitude: 48.2082,  // Ihre Breitengrad
    longitude: 16.3738, // Ihr Längengrad
    
    // Geosphere Wetterstation ID (optional, Standard ist Wien-Hohe Warte)
    geosphereStationId: '11035', // Wien-Hohe Warte
    
    // Ihre 5 favorisierten Stationen
    stations: [
        {
            id: '490000001',  // RBL-ID der Station
            name: 'Schwedenplatz'  // Name der Station
        },
        // ... weitere Stationen
    ]
};
```

**Koordinaten finden:**
- Verwenden Sie [Google Maps](https://www.google.com/maps) und klicken Sie auf Ihren Standort
- Die Koordinaten werden in der URL oder im Popup angezeigt

### 4. Website verwenden

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

**Geosphere Austria:**
- Kostenloser Zugang zu Wetterdaten
- Bitte beachten Sie die [Nutzungsbedingungen](https://www.geosphere.at/)
- Bei 30 Sekunden Refresh-Intervall: ~2.880 Aufrufe/Tag

**Wiener Linien:**
- Keine bekannten Limits für Open Data
- Bitte beachten Sie die [Nutzungsbedingungen](https://www.wienerlinien.at/open-data)

## Fehlerbehebung

**Wetter wird nicht angezeigt:**
- Überprüfen Sie die Browser-Konsole auf Fehlermeldungen
- Stellen Sie sicher, dass die Geosphere API erreichbar ist
- Falls CORS-Fehler auftreten, benötigen Sie möglicherweise einen Proxy-Server
- Die API-Endpunkte können sich geändert haben - überprüfen Sie die [Geosphere API-Dokumentation](https://dataset.api.hub.geosphere.at/v1/docs/)

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
- Geosphere Austria API (kostenlos, österreichischer Wetterdienst)
- Wiener Linien Open Data (CC BY 4.0)

## Support

Bei Problemen:
1. Überprüfen Sie die Browser-Konsole auf Fehlermeldungen
2. Stellen Sie sicher, dass alle API-Schlüssel korrekt konfiguriert sind
3. Testen Sie die API-Endpunkte direkt im Browser

## Anpassungen

Sie können die Website nach Ihren Wünschen anpassen:
- **Refresh-Intervall:** Ändern Sie `refreshInterval` in `config.js` (in Millisekunden)
- **Design:** Passen Sie `style.css` an
- **Anzahl der Stationen:** Ändern Sie die Anzahl in `config.js` und `index.html`

