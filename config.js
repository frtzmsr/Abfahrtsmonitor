// Configuration file for Abfahrtsmonitor
// Please fill in your API keys and station IDs

var CONFIG = {
    // Geosphere Austria API
    // The Geosphere API is free and doesn't require an API key for basic usage
    // For more information: https://dataset.api.hub.geosphere.at/v1/docs/
    // Note: Some endpoints may require registration
    useGeosphereApi: true,
    
    // Vienna coordinates (you can change these to your exact location)
    latitude: 48.2082,
    longitude: 16.3738,
    
    // Geosphere station ID for Vienna (optional, can be auto-detected)
    // Common Vienna weather stations: 11035 (Wien-Hohe Warte), 11040 (Wien-Innere Stadt)
    geosphereStationId: '11035', // Wien-Hohe Warte (default Vienna weather station)
    
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
    wienerLinienProxy: 'https://wienerlinien-proxy.people-02-reasons.workers.dev'
};

