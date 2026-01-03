# Wie finde ich die RBL-IDs für meine Stationen?

Die Wiener Linien verwenden RBL-IDs (Realtime Base List) zur Identifikation von Stationen. Hier sind verschiedene Methoden, um die IDs Ihrer favorisierten Stationen zu finden:

## Methode 1: Über die Wiener Linien Website

1. Gehen Sie zu [wienerlinien.at](https://www.wienerlinien.at)
2. Suchen Sie nach Ihrer Station über die Suchfunktion
3. Öffnen Sie die Station
4. Die RBL-ID kann in der URL oder im Quellcode der Seite zu finden sein

## Methode 2: Über das Open Data Portal

1. Besuchen Sie [wienerlinien.at/open-data](https://www.wienerlinien.at/open-data)
2. Laden Sie die Haltestellendaten (z.B. "Haltestellen" oder "Stops") herunter
3. Öffnen Sie die CSV/JSON-Datei
4. Suchen Sie nach Ihrer Station und notieren Sie die RBL-ID

## Methode 3: API direkt testen

1. Öffnen Sie in Ihrem Browser:
   ```
   https://www.wienerlinien.at/ogd_realtime/monitor?rbl=STATION_ID
   ```
2. Ersetzen Sie `STATION_ID` mit verschiedenen IDs (z.B. 490000001, 490000002, etc.)
3. Wenn Sie eine gültige ID eingeben, sehen Sie JSON-Daten mit Abfahrtszeiten
4. Die Station kann auch im JSON-Response identifiziert werden

## Methode 4: Über WienMobil App/Website

1. Besuchen Sie die [WienMobil Website](https://www.wienmobil.at)
2. Suchen Sie nach Ihrer Station
3. Die RBL-ID kann in der URL oder im Netzwerk-Tab der Browser-Entwicklertools gefunden werden

## Bekannte Stationen (Beispiele)

Hier sind einige bekannte Stationen in Wien als Startpunkt:

- **Schwedenplatz**: Eine der zentralsten Stationen
- **Stephansplatz**: Im Zentrum von Wien
- **Karlsplatz**: Wichtiger Verkehrsknotenpunkt
- **Westbahnhof**: Hauptbahnhof
- **Hauptbahnhof**: Neuer Hauptbahnhof

**Hinweis:** Die tatsächlichen RBL-IDs können sich ändern oder variieren. Bitte verwenden Sie eine der oben genannten Methoden, um die aktuellen IDs zu finden.

## Tipp

Wenn Sie die Website testen, können Sie die Browser-Konsole öffnen (Safari: Entwicklermenü aktivieren) und die Netzwerk-Anfragen überprüfen, um zu sehen, welche IDs funktionieren.

