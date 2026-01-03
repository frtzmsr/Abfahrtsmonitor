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

// Get weather data from Geosphere Austria API
function fetchWeather() {
    // Geosphere Austria provides weather data through their dataset API
    // Documentation: https://dataset.api.hub.geosphere.at/v1/docs/
    // Using Wien-Hohe Warte station (ID: 11035) which is the main Vienna weather station
    var stationId = CONFIG.geosphereStationId || '11035';
    
    // Try multiple possible Geosphere API endpoints
    // The exact endpoint structure may vary depending on the API version
    // If these don't work, check the official documentation and update accordingly
    var endpoints = [
        // Option 1: Direct station observation endpoint
        'https://dataset.api.hub.geosphere.at/v1/weather/observation/' + stationId,
        // Option 2: Dataset-based endpoint
        'https://dataset.api.hub.geosphere.at/v1/datasets/weather/current?station=' + stationId,
        // Option 3: Location-based endpoint
        'https://dataset.api.hub.geosphere.at/v1/weather/observation?lat=' + 
            CONFIG.latitude + '&lon=' + CONFIG.longitude,
        // Option 4: Alternative dataset endpoint format
        'https://dataset.api.hub.geosphere.at/v1/datasets/observation/current?station_id=' + stationId
    ];
    
    tryEndpoint(0);
    
    function tryEndpoint(index) {
        if (index >= endpoints.length) {
            // All endpoints failed, show error
            document.getElementById('weather').innerHTML = 
                '<div class="weather-error">Wetterdaten konnten nicht geladen werden. Bitte API-Endpunkt in app.js überprüfen.</div>';
            return;
        }
        
        makeRequest(endpoints[index], function(data) {
            displayGeosphereWeather(data);
        }, function(error) {
            // Try next endpoint
            tryEndpoint(index + 1);
        });
    }
}

// Display weather data from Geosphere API
function displayGeosphereWeather(data) {
    var weatherHtml = '<div class="weather-info">';
    
    // Geosphere API response structure may vary, handle different formats
    var temp, humidity, description, icon;
    
    // Try to extract data from different possible response structures
    if (data.temperature) {
        temp = data.temperature;
    } else if (data.temp) {
        temp = data.temp;
    } else if (data.observations && data.observations.length > 0) {
        temp = data.observations[0].temperature || data.observations[0].temp;
        humidity = data.observations[0].humidity || data.observations[0].relative_humidity;
    } else if (data.data && data.data.temperature) {
        temp = data.data.temperature;
        humidity = data.data.humidity || data.data.relative_humidity;
    }
    
    if (data.humidity) {
        humidity = data.humidity;
    } else if (data.relative_humidity) {
        humidity = data.relative_humidity;
    }
    
    // Determine weather description and icon
    if (data.weather_description) {
        description = data.weather_description;
    } else if (data.description) {
        description = data.description;
    } else if (data.condition) {
        description = data.condition;
    } else {
        description = 'Aktuelles Wetter';
    }
    
    // Weather icon based on conditions
    var descLower = description.toLowerCase();
    if (descLower.indexOf('sonnig') !== -1 || descLower.indexOf('klar') !== -1 || descLower.indexOf('clear') !== -1) {
        icon = '☀️';
    } else if (descLower.indexOf('bewölkt') !== -1 || descLower.indexOf('cloud') !== -1) {
        icon = '☁️';
    } else if (descLower.indexOf('regen') !== -1 || descLower.indexOf('rain') !== -1) {
        icon = '🌧️';
    } else if (descLower.indexOf('schnee') !== -1 || descLower.indexOf('snow') !== -1) {
        icon = '❄️';
    } else if (descLower.indexOf('gewitter') !== -1 || descLower.indexOf('thunder') !== -1) {
        icon = '⛈️';
    } else if (descLower.indexOf('nebel') !== -1 || descLower.indexOf('fog') !== -1) {
        icon = '🌫️';
    } else {
        icon = '🌤️';
    }
    
    // Display temperature
    if (temp !== undefined && temp !== null) {
        weatherHtml += '<span class="weather-icon">' + icon + '</span>';
        weatherHtml += '<span class="weather-temp">' + Math.round(temp) + '°C</span>';
        weatherHtml += '<div class="weather-details">';
        weatherHtml += '<div class="weather-desc">' + description + '</div>';
        weatherHtml += '<div class="weather-extra">';
        
        if (humidity !== undefined && humidity !== null) {
            weatherHtml += 'Luftfeuchtigkeit: ' + Math.round(humidity) + '%';
        }
        
        // Add wind information if available
        if (data.wind_speed) {
            weatherHtml += ' | Wind: ' + Math.round(data.wind_speed) + ' km/h';
        } else if (data.wind && data.wind.speed) {
            weatherHtml += ' | Wind: ' + Math.round(data.wind.speed) + ' km/h';
        }
        
        weatherHtml += '</div>';
        weatherHtml += '</div>';
    } else {
        // Fallback if temperature not found
        weatherHtml += '<span class="weather-icon">' + icon + '</span>';
        weatherHtml += '<div class="weather-details">';
        weatherHtml += '<div class="weather-desc">' + description + '</div>';
        weatherHtml += '<div class="weather-extra">Wetterdaten verfügbar</div>';
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
                                    minutes: parseInt(dep.departureTime.countdown, 10) || 0
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
                                minutes: parseInt(departure, 10) || 0
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
            html += '<li class="departure-item">';
            html += '<span class="departure-line">' + dep.line + '</span>';
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
    document.getElementById('lastUpdate').textContent = 'Letzte Aktualisierung: ' + timeString;
}

// Refresh all data
function refreshAll() {
    fetchWeather();
    
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

