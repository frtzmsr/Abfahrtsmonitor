# Geosphere Austria API - Hinweise

Die Website verwendet die Geosphere Austria API für Wetterdaten. Hier sind wichtige Informationen:

## API-Dokumentation

- **Offizielle Dokumentation:** https://dataset.api.hub.geosphere.at/v1/docs/
- **Website:** https://www.geosphere.at/

## Wichtige Informationen

1. **Kein API-Schlüssel erforderlich:** Die Geosphere API ist kostenlos und erfordert normalerweise keine Registrierung für grundlegende Nutzung.

2. **Wetterstationen in Wien:**
   - **Wien-Hohe Warte (11035):** Hauptwetterstation in Wien (Standard in der Konfiguration)
   - **Wien-Innere Stadt (11040):** Alternative Station im Stadtzentrum
   - Weitere Stationen finden Sie in der API-Dokumentation

3. **API-Endpunkte:**
   Die genauen Endpunkte können sich ändern. Die Website versucht automatisch mehrere mögliche Endpunkt-Formate. Falls keine funktionieren:
   - Überprüfen Sie die aktuelle API-Dokumentation
   - Passen Sie die Endpunkte in `app.js` in der Funktion `fetchWeather()` an

4. **CORS-Probleme:**
   Falls Sie CORS-Fehler (Cross-Origin Resource Sharing) sehen:
   - Die Geosphere API erlaubt möglicherweise keine direkten Browser-Aufrufe
   - Sie benötigen dann einen Proxy-Server oder müssen die Daten serverseitig abrufen

## Endpunkt-Anpassung

Falls die Standard-Endpunkte nicht funktionieren, können Sie die Endpunkte in `app.js` anpassen:

```javascript
// In der Funktion fetchWeather() finden Sie das Array 'endpoints'
// Passen Sie die URLs entsprechend der aktuellen API-Dokumentation an
var endpoints = [
    'https://dataset.api.hub.geosphere.at/v1/...', // Ihre angepasste URL
    // ...
];
```

## Alternative: Andere Wetter-APIs

Falls die Geosphere API nicht funktioniert, können Sie auch andere APIs verwenden:
- OpenWeatherMap (kostenlos mit Registrierung)
- Meteosource (kostenlos mit Registrierung)

Um eine andere API zu verwenden, passen Sie die Funktionen `fetchWeather()` und `displayGeosphereWeather()` in `app.js` entsprechend an.

