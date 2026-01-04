// Configuration file for Abfahrtsmonitor
// Please fill in your station IDs

var CONFIG = {
    // Wiener Linien Station IDs (DIVA IDs)
    // You can find station IDs at: https://www.wienerlinien.at/web/wl-en/traffic-information
    // Or use the Open Data Portal: https://www.wienerlinien.at/open-data
    stations: [
        {
            id: '60200179',  // Example: Replace with your favorite station ID
            name: 'Brüßlgasse'  // Replace with actual station name
        },
        {
            id: '60200704',
            name: 'Panikengasse'
        },
        {
            id: '60201037',
            name: 'Possingergasse'
        },
        {
            id: '60201374',
            name: 'Feßtgasse'
        },
        {
            id: '60200981',
            name: 'Ottakring'
        }
    ],
    
    // Refresh interval in milliseconds (30 seconds)
    refreshInterval: 30000,
    
    // Proxy server for Wiener Linien API (to handle CORS issues)
    // Your proxy server URL
    wienerLinienProxy: 'https://wienerlinien-proxy.people-02-reasons.workers.dev',
    
    // Geosphere Austria API weather station
    // Station ID for weather data (default: 11035 = Wien-Hohe Warte)
    // Documentation: https://github.com/Geosphere-Austria/dataset-api-docs/blob/main/src/getting-started.md
    geosphereStationId: '11035',
    
    // Proxy server for Geosphere API (to handle CORS issues)
    // Leave empty to try direct API call (may not work due to CORS)
    // Your proxy server URL (optional)
    geosphereProxy: ''
};

