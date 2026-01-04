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
                    var errorMsg = 'Fehler beim Abrufen der Daten: ' + xhr.status;
                    if (xhr.responseText) {
                        try {
                            var errorData = JSON.parse(xhr.responseText);
                            if (errorData.detail || errorData.message) {
                                errorMsg += ' - ' + (errorData.detail || errorData.message);
                            }
                        } catch (e) {
                            // Ignore parse errors
                        }
                    }
                    errorCallback(errorMsg);
                }
            }
        }
    };
    xhr.onerror = function() {
        if (errorCallback) {
            errorCallback('Netzwerkfehler (möglicherweise CORS)');
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

// Favorite line management (using localStorage)
function getFavoriteKey(stationId, line, destination) {
    return 'favorite_' + stationId + '_' + line + '_' + destination;
}

function isFavorite(stationId, line, destination) {
    var key = getFavoriteKey(stationId, line, destination);
    var stored = localStorage.getItem(key);
    return stored === 'true';
}

function toggleFavorite(stationId, line, destination) {
    var key = getFavoriteKey(stationId, line, destination);
    var isFav = isFavorite(stationId, line, destination);
    localStorage.setItem(key, (!isFav).toString());
    return !isFav;
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

// Fetch weather data from Geosphere Austria API
// Documentation: https://github.com/Geosphere-Austria/dataset-api-docs/blob/main/src/getting-started.md
function fetchWeather() {
    var stationId = CONFIG.geosphereStationId || '11035'; // Default: Wien-Hohe Warte
    var baseUrl = 'https://dataset.api.hub.geosphere.at/v1';
    var endpoint = baseUrl + '/station/current/tawes-v1-10min';
    // Format: parameters=TL,RF,FF&station_ids=11035 (no output_format needed, JSON is default)
    var apiUrl = endpoint + '?parameters=TL,RF,FF&station_ids=' + stationId;
    
    // Use proxy if configured, otherwise try direct API call
    var url;
    if (CONFIG.geosphereProxy) {
        // Proxy expects the Geosphere API URL as a parameter
        var proxyBase = CONFIG.geosphereProxy.replace(/\/$/, ''); // Remove trailing slash
        url = proxyBase + '?url=' + encodeURIComponent(apiUrl);
    } else {
        url = apiUrl;
    }
    
    console.log('Fetching weather from:', url);
    
    makeRequest(url, function(data) {
        console.log('Weather data received:', data);
        displayWeather(data);
    }, function(error) {
        console.log('Weather fetch error:', error);
        var errorMsg = error;
        if (!CONFIG.geosphereProxy && error.indexOf('422') !== -1) {
            errorMsg = 'CORS-Fehler: Proxy-Server erforderlich (siehe config.js)';
        }
        document.getElementById('weather').innerHTML = 
            '<h2 class="station-name">Wetter</h2>' +
            '<div class="station-error">Wetterdaten konnten nicht geladen werden: ' + errorMsg + '</div>';
    });
}

// Display weather data from Geosphere TAWES API
function displayWeather(data) {
    var weatherHtml = '<h2 class="station-name">Wetter</h2>';
    weatherHtml += '<div class="weather-info">';
    
    var temp = null;
    var humidity = null;
    var windSpeed = null;
    var icon = '🌤️';
    var description = 'Aktuelles Wetter';
    
    // Parse TAWES API response structure (GeoJSON FeatureCollection format)
    // Format: { "features": [{ "properties": { "parameters": { "TL": { "data": [value] }, "RF": { "data": [value] }, "FF": { "data": [value] } } } }] }
    if (data && data.features && data.features.length > 0) {
        var feature = data.features[0];
        if (feature.properties && feature.properties.parameters) {
            var params = feature.properties.parameters;
            
            // TL = Temperature (Lufttemperatur) - unit: °C
            if (params.TL && params.TL.data && params.TL.data.length > 0) {
                temp = params.TL.data[0];
            }
            
            // RF = Relative Humidity (Relative Feuchte) - unit: %
            if (params.RF && params.RF.data && params.RF.data.length > 0) {
                humidity = params.RF.data[0];
            }
            
            // FF = Wind Speed (Windgeschwindigkeit) - unit: m/s (convert to km/h)
            if (params.FF && params.FF.data && params.FF.data.length > 0) {
                windSpeed = params.FF.data[0] * 3.6; // Convert m/s to km/h
            }
        }
    }
    
    // Determine weather icon based on temperature
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
            // API responded successfully but no departures available (e.g., at night)
            html += '<ul class="departures-list">';
            html += '<li class="departure-item">Keine Abfahrten in den nächsten Minuten</li>';
            html += '</ul>';
            stationEl.innerHTML = html;
            return true; // Return true to indicate successful display
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
        var stationId = CONFIG.stations[stationIndex].id;
        for (var d = 0; d < displayCount; d++) {
            var dep = allDepartures[d];
            var timeClass = dep.minutes <= 2 ? 'soon' : (dep.minutes <= 5 ? 'in-time' : '');
            var lineColor = getLineColor(dep.line, dep.vehicleType);
            var isFav = isFavorite(stationId, dep.line, dep.destination);
            var favoriteClass = isFav ? ' favorite' : '';
            html += '<li class="departure-item' + favoriteClass + '" data-station-id="' + stationId + '" data-line="' + dep.line.replace(/"/g, '&quot;') + '" data-destination="' + dep.destination.replace(/"/g, '&quot;') + '">';
            html += '<span class="departure-line wiener-linien-badge" style="background-color: ' + lineColor + ';">' + dep.line + '</span>';
            html += '<span class="departure-destination">' + dep.destination + '</span>';
            html += '<span class="departure-time ' + timeClass + '">' + formatTime(dep.minutes) + '</span>';
            html += '</li>';
        }
    }
    
    html += '</ul>';
    stationEl.innerHTML = html;
    
    // Add click handlers to departure items for favoriting
    var departureItems = stationEl.querySelectorAll('.departure-item[data-station-id]');
    for (var i = 0; i < departureItems.length; i++) {
        departureItems[i].addEventListener('click', function(e) {
            var stationId = this.getAttribute('data-station-id');
            var line = this.getAttribute('data-line');
            var destination = this.getAttribute('data-destination');
            toggleFavorite(stationId, line, destination);
            // Refresh the station display
            fetchStationData(stationId, stationIndex);
        });
    }
    
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
    
    fetchWeather();
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

