// Abfahrtsmonitor App - Compatible with older browsers (iPad Air 2)

// XMLHttpRequest wrapper for better compatibility
function makeRequest(url, callback, errorCallback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    callback(data);
                } catch (e) {
                    if (errorCallback) {
                        errorCallback('Fehler beim Parsen der Daten');
                    }
                }
            } else {
                if (errorCallback) {
                    errorCallback('Fehler beim Abrufen der Daten: ' + xhr.status);
                }
            }
        }
    };
    xhr.onerror = function() {
        if (errorCallback) {
            errorCallback('Netzwerkfehler');
        }
    };
    xhr.open('GET', url, true);
    xhr.send();
}

// Format time difference
function formatTime(minutes) {
    if (minutes < 1) {
        return 'Jetzt';
    } else if (minutes === 1) {
        return '1 Min';
    } else {
        return minutes + ' Min';
    }
}

// Get Wiener Linien official color for a line
// Based on: https://github.com/thoebert/Wiener-Linien-HA-Dashboard
function getLineColor(lineName, vehicleType) {
    var line = lineName.toUpperCase().trim();
    
    // Check for U-Bahn lines
    if (line === 'U1') return '#e3000f';
    if (line === 'U2') return '#a862a4';
    if (line === 'U3') return '#db7607';
    if (line === 'U4') return '#01963e';
    if (line === 'U5') return '#008f95';
    if (line === 'U6') return '#9d6830';
    
    // Check vehicle type from API
    if (vehicleType) {
        if (vehicleType === 'ptTram') return '#c00a09'; // Tram
        if (vehicleType === 'ptBusCity' || vehicleType === 'ptBus') return '#0b295d'; // Bus
        if (vehicleType === 'ptMetro') {
            // Metro - determine by line name
            if (line.indexOf('U1') !== -1) return '#e3000f';
            if (line.indexOf('U2') !== -1) return '#a862a4';
            if (line.indexOf('U3') !== -1) return '#db7607';
            if (line.indexOf('U4') !== -1) return '#01963e';
            if (line.indexOf('U5') !== -1) return '#008f95';
            if (line.indexOf('U6') !== -1) return '#9d6830';
        }
    }
    
    // Check if line name contains S-Bahn indicators
    if (line.indexOf('S') === 0 && line.length <= 3) return '#0089c4'; // S-Bahn
    
    // Check for tram lines (usually numbers or numbers with letters, but not U/S)
    if (/^\d+[A-Z]?$/.test(line) && line.indexOf('U') === -1 && line.indexOf('S') === -1) {
        // Could be tram or bus - default to tram red
        return '#c00a09';
    }
    
    // Default: Bus color
    return '#0b295d';
}

// Get weather data from Geosphere Austria API
// Documentation: https://dataset.api.hub.geosphere.at/v1/docs/
function fetchWeather() {
    // Geosphere Austria Dataset API - TAWES weather stations
    // Station 11035 = Wien-Hohe Warte (main Vienna weather station)
    // Parameters: TL (temperature), RF (humidity), FF (wind speed)
    var stationId = CONFIG.geosphereStationId || '11035';
    
    // Correct Geosphere API endpoint structure:
    // https://dataset.api.hub.geosphere.at/v1/station/current/tawes-v1-10min?parameters=TL,RF,FF&station_ids=11035&output_format=json
    var apiUrl = 'https://dataset.api.hub.geosphere.at/v1/station/current/tawes-v1-10min?parameters=TL,RF,FF&station_ids=' + 
                 stationId + '&output_format=json';
    
    // Use proxy if configured, otherwise try direct API call
    var url;
    if (CONFIG.geosphereProxy) {
        // Proxy expects the Geosphere API URL as a parameter
        // Format: proxy?url=ENCODED_API_URL
        var proxyBase = CONFIG.geosphereProxy.replace(/\/$/, ''); // Remove trailing slash
        url = proxyBase + '?url=' + encodeURIComponent(apiUrl);
    } else {
        url = apiUrl;
    }
    
    console.log('Fetching weather from:', url);
    console.log('Geosphere API URL:', apiUrl);
    console.log('Proxy base URL:', CONFIG.geosphereProxy);
    
    makeRequest(url, function(data) {
        console.log('Weather data received:', data);
        // Check if the response is actually an error message
        if (data && typeof data === 'object') {
            if (data.error || (data.message && data.message !== 'OK')) {
                console.log('Proxy returned error:', data);
                var errorText = data.error || data.message || 'Unbekannter Fehler';
                document.getElementById('weather').innerHTML = 
                    '<div class="weather-error">Wetterdaten konnten nicht geladen werden: ' + 
                    errorText + '</div>';
                return;
            }
        }
        displayGeosphereWeather(data);
    }, function(error) {
        console.log('Weather fetch error:', error);
        // Show error message with more details
        if (!CONFIG.geosphereProxy) {
            document.getElementById('weather').innerHTML = 
                '<div class="weather-error">Wetterdaten benötigen Proxy-Server (CORS-Fehler)</div>';
        } else {
            // Check if it's a 404 - proxy might not be configured correctly
            var errorMsg = error;
            var helpText = '';
            if (error.indexOf('404') !== -1 || error.indexOf('Not Found') !== -1) {
                errorMsg = 'Proxy-Server antwortet nicht (404)';
                helpText = '<br><small style="opacity: 0.7;">Hinweis: Der Proxy-Server existiert möglicherweise nicht oder ist nicht korrekt konfiguriert. Bitte überprüfen Sie die Proxy-URL in config.js und stellen Sie sicher, dass der Cloudflare Worker bereitgestellt wurde.</small>';
            } else if (error.indexOf('CORS') !== -1) {
                errorMsg = 'CORS-Fehler beim Proxy';
                helpText = '<br><small style="opacity: 0.7;">Der Proxy muss CORS-Header setzen. Bitte überprüfen Sie die Proxy-Konfiguration.</small>';
            }
            document.getElementById('weather').innerHTML = 
                '<div class="weather-error">Wetterdaten konnten nicht geladen werden: ' + errorMsg + helpText + '</div>';
        }
    });
}

// Display weather data from Geosphere TAWES API
// TAWES API returns: { "timestamps": [...], "parameters": { "TL": { "11035": [...] }, "RF": { "11035": [...] } } }
function displayGeosphereWeather(data) {
    var weatherHtml = '<div class="weather-info">';
    
    var temp = null;
    var humidity = null;
    var windSpeed = null;
    var icon = '🌤️';
    var description = 'Aktuelles Wetter';
    
    // Parse TAWES API response structure
    // Format: { "timestamps": [...], "parameters": { "TL": { "11035": [value] }, "RF": { "11035": [value] }, "FF": { "11035": [value] } } }
    if (data.parameters) {
        var stationId = CONFIG.geosphereStationId || '11035';
        
        // TL = Temperature (Lufttemperatur)
        if (data.parameters.TL && data.parameters.TL[stationId] && data.parameters.TL[stationId].length > 0) {
            temp = data.parameters.TL[stationId][data.parameters.TL[stationId].length - 1]; // Get latest value
        }
        
        // RF = Relative Humidity (Relative Feuchte)
        if (data.parameters.RF && data.parameters.RF[stationId] && data.parameters.RF[stationId].length > 0) {
            humidity = data.parameters.RF[stationId][data.parameters.RF[stationId].length - 1]; // Get latest value
        }
        
        // FF = Wind Speed (Windgeschwindigkeit)
        if (data.parameters.FF && data.parameters.FF[stationId] && data.parameters.FF[stationId].length > 0) {
            windSpeed = data.parameters.FF[stationId][data.parameters.FF[stationId].length - 1]; // Get latest value
        }
    }
    
    // Determine weather icon based on temperature and conditions
    if (temp !== null && temp !== undefined) {
        if (temp > 25) {
            icon = '☀️';
            description = 'Warm';
        } else if (temp > 15) {
            icon = '🌤️';
            description = 'Mild';
        } else if (temp > 5) {
            icon = '☁️';
            description = 'Kühl';
        } else if (temp > 0) {
            icon = '🌨️';
            description = 'Kalt';
        } else {
            icon = '❄️';
            description = 'Sehr kalt';
        }
    }
    
    // Display weather data
    if (temp !== null && temp !== undefined) {
        weatherHtml += '<span class="weather-icon">' + icon + '</span>';
        weatherHtml += '<span class="weather-temp">' + Math.round(temp) + '°C</span>';
        weatherHtml += '<div class="weather-details">';
        weatherHtml += '<div class="weather-desc">' + description + '</div>';
        weatherHtml += '<div class="weather-extra">';
        
        if (humidity !== null && humidity !== undefined) {
            weatherHtml += 'Luftfeuchtigkeit: ' + Math.round(humidity) + '%';
        }
        
        if (windSpeed !== null && windSpeed !== undefined) {
            if (humidity !== null) weatherHtml += ' | ';
            weatherHtml += 'Wind: ' + Math.round(windSpeed) + ' km/h';
        }
        
        weatherHtml += '</div>';
        weatherHtml += '</div>';
    } else {
        // No data available
        weatherHtml += '<span class="weather-icon">' + icon + '</span>';
        weatherHtml += '<div class="weather-details">';
        weatherHtml += '<div class="weather-desc">' + description + '</div>';
        weatherHtml += '<div class="weather-extra">Daten werden geladen...</div>';
        weatherHtml += '</div>';
    }
    
    weatherHtml += '</div>';
    
    document.getElementById('weather').innerHTML = weatherHtml;
}

// Fetch departure data for a station
function fetchStationData(stationId, stationIndex) {
    // Use proxy server to avoid CORS issues
    // Based on testing: IDs like 60200179 work with 'diva' parameter
    var proxyUrl = CONFIG.wienerLinienProxy || 'https://wienerlinien-proxy.people-02-reasons.workers.dev';
    
    // Use 'diva' parameter directly - it works for these station IDs
    var url = proxyUrl + '?diva=' + stationId;
    
    // Try the request
    tryRequest(url, stationId, stationIndex, 'diva', proxyUrl);
}

// Helper function to try request with fallback
function tryRequest(url, stationId, stationIndex, paramName, proxyUrl) {
    makeRequest(url, function(data) {
        // Debug: Log the response structure
        console.log('Proxy response for station', stationId, 'using', paramName, ':', data);
        console.log('Full JSON:', JSON.stringify(data, null, 2));
        
        // Check if the response has an actual error
        var hasError = false;
        var errorMsg = '';
        
        if (data.message) {
            // Check for error codes (non-200 status codes indicate errors)
            if (data.message.messageCode && data.message.messageCode !== 200 && data.message.messageCode < 200) {
                hasError = true;
                errorMsg = data.message.value || 'Unbekannter Fehler';
            } else if (data.message.value && data.message.value !== 'OK') {
                // Check for error messages (but ignore "OK" messages)
                if (data.message.value.indexOf('fehlt') !== -1 || 
                    data.message.value.indexOf('Fehler') !== -1 ||
                    data.message.value.indexOf('error') !== -1) {
                    hasError = true;
                    errorMsg = data.message.value;
                }
            }
        }
        
        // If we have data (even with a message), try to display it
        displayStationData(data, stationIndex);
    }, function(error) {
        var stationEl = document.getElementById('station-' + (stationIndex + 1));
        var stationName = CONFIG.stations[stationIndex].name;
        var errorMsg = error;
        
        stationEl.innerHTML = '<h2 class="station-name">' + stationName + '</h2>' +
                             '<div class="station-error">' + errorMsg + '</div>';
    });
}

// Display station departure data
function displayStationData(data, stationIndex) {
    var stationEl = document.getElementById('station-' + (stationIndex + 1));
    var stationName = CONFIG.stations[stationIndex].name;
    
    var html = '<h2 class="station-name">' + stationName + '</h2>';
    
    // Handle different response formats (direct API vs proxy)
    var monitors = null;
    
    // Debug: Log data structure
    console.log('Parsing data for', stationName, ':', data);
    
    // Try different possible data structures - be very flexible
    if (data.data) {
        if (data.data.data && data.data.data.monitors) {
            // Triple nested: { data: { data: { data: { monitors: [...] } } } }
            monitors = data.data.data.monitors;
        } else if (data.data.monitors) {
            // Standard Wiener Linien API format: { data: { monitors: [...] } }
            monitors = data.data.monitors;
        } else if (Array.isArray(data.data)) {
            // Alternative format: { data: [...] }
            monitors = data.data;
        } else if (data.data.data && Array.isArray(data.data.data)) {
            // Nested array: { data: { data: [...] } }
            monitors = data.data.data;
        }
    } else if (data.monitors) {
        // Direct format: { monitors: [...] }
        monitors = data.monitors;
    } else if (Array.isArray(data)) {
        // Array format: [...]
        monitors = data;
    } else if (data.body) {
        // Some proxies wrap in body
        if (data.body.data && data.body.data.monitors) {
            monitors = data.body.data.monitors;
        } else if (data.body.monitors) {
            monitors = data.body.monitors;
        } else if (Array.isArray(data.body)) {
            monitors = data.body;
        }
    }
    
    // If still no monitors, try to find any array in the response
    if (!monitors) {
        function findMonitors(obj, depth) {
            if (depth > 5) return null; // Prevent infinite recursion
            if (Array.isArray(obj)) {
                // Check if this array contains objects with 'lines' property
                if (obj.length > 0 && obj[0] && (obj[0].lines || obj[0].name || obj[0].departures)) {
                    return obj;
                }
            }
            if (typeof obj === 'object' && obj !== null) {
                for (var key in obj) {
                    // Check for common keys that might contain monitor data
                    if ((key === 'monitors' || key === 'monitor' || key === 'departures' || key === 'stops') && Array.isArray(obj[key])) {
                        return obj[key];
                    }
                    if (typeof obj[key] === 'object') {
                        var result = findMonitors(obj[key], depth + 1);
                        if (result) return result;
                    }
                }
            }
            return null;
        }
        monitors = findMonitors(data, 0);
    }
    
    // Last resort: check if the entire response might be the Wiener Linien format
    if (!monitors && data.data && typeof data.data === 'object') {
        // Try to find any property that looks like it contains departure data
        for (var prop in data.data) {
            if (prop.toLowerCase().indexOf('monitor') !== -1 || 
                prop.toLowerCase().indexOf('departure') !== -1 ||
                prop.toLowerCase().indexOf('stop') !== -1) {
                if (Array.isArray(data.data[prop])) {
                    monitors = data.data[prop];
                    break;
                }
            }
        }
    }
    
    if (!monitors || monitors.length === 0) {
        // Check if monitors array exists but is empty (API worked but no data)
        var monitorsExists = false;
        if (data.data && data.data.monitors && Array.isArray(data.data.monitors)) {
            monitorsExists = true;
        }
        
        if (monitorsExists) {
            html += '<div class="station-error">Keine Abfahrten verfügbar (leeres Monitors-Array)</div>';
            html += '<div style="font-size: 11px; color: #666; margin-top: 10px; padding: 10px; background: #fff3cd; border-radius: 5px;">';
            html += '<strong>Hinweis:</strong> Die API antwortet, aber die Monitors-Liste ist leer.<br>';
            html += 'Mögliche Ursachen:<br>';
            html += '• Station-ID ist falsch oder nicht im richtigen Format<br>';
            html += '• Falscher Parameter-Name (rbl/stopId/diva)<br>';
            html += '• Station hat aktuell keine Abfahrten<br>';
            html += '• Proxy benötigt eine andere ID-Format<br><br>';
            html += 'Bitte überprüfen Sie die Station-ID in der Konfiguration.';
            html += '</div>';
        } else {
            html += '<div class="station-error">Keine Abfahrtsdaten verfügbar</div>';
            
            // Debug: Show full response structure in UI
            html += '<div style="font-size: 11px; color: #666; margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 5px; text-align: left; max-height: 200px; overflow: auto;">';
            html += '<strong>Debug-Information:</strong><br>';
            
            // Show response keys
            var keys = [];
            if (typeof data === 'object' && data !== null) {
                for (var k in data) {
                    keys.push(k);
                }
            }
            html += 'Response-Keys: ' + (keys.length > 0 ? keys.join(', ') : 'Keine') + '<br><br>';
            
            // Show a preview of the response (first 500 chars)
            try {
                var jsonStr = JSON.stringify(data, null, 2);
                html += '<strong>Response (erste 1000 Zeichen):</strong><br>';
                html += '<pre style="font-size: 9px; white-space: pre-wrap; word-wrap: break-word;">' + 
                        jsonStr.substring(0, 1000).replace(/</g, '&lt;').replace(/>/g, '&gt;') + 
                        (jsonStr.length > 1000 ? '...' : '') + '</pre>';
            } catch (e) {
                html += 'Konnte Response nicht formatieren: ' + e.toString();
            }
            
            html += '</div>';
        }
        
        stationEl.innerHTML = html;
        console.log('Could not find monitors in response structure. Full response:', JSON.stringify(data, null, 2));
        return false; // Return false to indicate no valid data
    }
    
    html += '<ul class="departures-list">';
    
    // Collect all departures
    var allDepartures = [];
    for (var i = 0; i < monitors.length; i++) {
        var monitor = monitors[i];
        if (monitor.lines && monitor.lines.length > 0) {
            for (var j = 0; j < monitor.lines.length; j++) {
                var line = monitor.lines[j];
                // Handle different departure formats
                if (line.departures) {
                    // New format: departures.departure[] array with departureTime.countdown
                    if (line.departures.departure && Array.isArray(line.departures.departure)) {
                        for (var k = 0; k < line.departures.departure.length; k++) {
                            var dep = line.departures.departure[k];
                            if (dep.departureTime && dep.departureTime.countdown !== undefined) {
                                allDepartures.push({
                                    line: line.name,
                                    destination: line.towards || line.direction || 'Unbekannt',
                                    minutes: parseInt(dep.departureTime.countdown, 10) || 0,
                                    vehicleType: dep.vehicle ? dep.vehicle.type : null
                                });
                            }
                        }
                    }
                    // Old format: departures.countdown[] array
                    else if (line.departures.countdown && Array.isArray(line.departures.countdown)) {
                        for (var k = 0; k < line.departures.countdown.length; k++) {
                            var departure = line.departures.countdown[k];
                            allDepartures.push({
                                line: line.name,
                                destination: line.towards || line.direction || 'Unbekannt',
                                minutes: parseInt(departure, 10) || 0,
                                vehicleType: null // Old format doesn't have vehicle type
                            });
                        }
                    }
                }
            }
        }
    }
    
    // Sort by departure time
    allDepartures.sort(function(a, b) {
        return a.minutes - b.minutes;
    });
    
    // Display up to 5 next departures
    var displayCount = Math.min(5, allDepartures.length);
    if (displayCount === 0) {
        html += '<li class="departure-item">Keine Abfahrten in den nächsten Minuten</li>';
    } else {
        for (var d = 0; d < displayCount; d++) {
            var dep = allDepartures[d];
            var timeClass = dep.minutes <= 2 ? 'soon' : (dep.minutes <= 5 ? 'in-time' : '');
            var lineColor = getLineColor(dep.line, dep.vehicleType);
            html += '<li class="departure-item">';
            html += '<span class="departure-line wiener-linien-badge" style="background-color: ' + lineColor + ';">' + dep.line + '</span>';
            html += '<span class="departure-destination">' + dep.destination + '</span>';
            html += '<span class="departure-time ' + timeClass + '">' + formatTime(dep.minutes) + '</span>';
            html += '</li>';
        }
    }
    
    html += '</ul>';
    stationEl.innerHTML = html;
    return true; // Return true to indicate successful display
}

// Update last update time
function updateLastUpdateTime() {
    var now = new Date();
    var timeString = now.toLocaleTimeString('de-DE', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    document.getElementById('lastUpdate').textContent = timeString;
}

// Refresh all data
function refreshAll() {
    for (var i = 0; i < CONFIG.stations.length; i++) {
        fetchStationData(CONFIG.stations[i].id, i);
    }
    
    updateLastUpdateTime();
}

// Initialize app
function init() {
    // Set station names from config
    for (var i = 0; i < CONFIG.stations.length; i++) {
        var stationEl = document.getElementById('station-' + (i + 1));
        var nameEl = stationEl.querySelector('.station-name');
        if (nameEl) {
            nameEl.textContent = CONFIG.stations[i].name;
        }
    }
    
    // Initial load
    refreshAll();
    
    // Set up auto-refresh
    setInterval(refreshAll, CONFIG.refreshInterval);
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

