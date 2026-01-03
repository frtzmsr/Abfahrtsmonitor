# Geosphere API Proxy Setup

Die Geosphere API blockiert direkte Browser-Aufrufe aufgrund von CORS-Beschränkungen. Um Wetterdaten anzuzeigen, benötigen Sie einen Proxy-Server.

## Option 1: Erweitern Sie Ihren bestehenden Proxy

Sie können Ihren bestehenden Wiener Linien Proxy erweitern, um auch Geosphere-Anfragen zu handhaben.

### Cloudflare Workers Beispiel

Falls Sie Cloudflare Workers verwenden (wie für den Wiener Linien Proxy), können Sie den Proxy so erweitern:

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Wiener Linien Proxy
  if (url.searchParams.has('diva') || url.searchParams.has('stopId') || url.searchParams.has('rbl')) {
    // ... existing Wiener Linien code ...
  }
  
  // Geosphere Proxy
  if (url.searchParams.has('url')) {
    const targetUrl = url.searchParams.get('url')
    const response = await fetch(targetUrl)
    const data = await response.json()
    
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  }
  
  return new Response('Invalid request', { status: 400 })
}
```

Dann in `config.js` setzen:
```javascript
geosphereProxy: 'https://wienerlinien-proxy.people-02-reasons.workers.dev'
```

## Option 2: Separater Geosphere Proxy

Erstellen Sie einen separaten Proxy nur für Geosphere-Anfragen.

### Einfacher Cloudflare Workers Proxy

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const targetUrl = url.searchParams.get('url')
  
  if (!targetUrl) {
    return new Response('Missing url parameter', { status: 400 })
  }
  
  try {
    const response = await fetch(targetUrl)
    const data = await response.json()
    
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}
```

## Geosphere API Endpunkt

Der korrekte Endpunkt für Wetterdaten:
```
https://dataset.api.hub.geosphere.at/v1/station/current/tawes-v1-10min?parameters=TL,RF,FF&station_ids=11035&output_format=json
```

**Parameter:**
- `TL` = Temperatur (Lufttemperatur)
- `RF` = Relative Feuchte (Luftfeuchtigkeit)
- `FF` = Windgeschwindigkeit
- `station_ids=11035` = Wien-Hohe Warte

## Konfiguration

Nach dem Erstellen des Proxys, fügen Sie die URL in `config.js` ein:

```javascript
geosphereProxy: 'https://ihr-geosphere-proxy.workers.dev'
```

Die Website wird dann automatisch den Proxy verwenden, um Wetterdaten abzurufen.

