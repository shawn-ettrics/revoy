const accessToken = 'pk.eyJ1Ijoic2hhd25jaGkyMDciLCJhIjoiY2t2eDM4eHVoMDBmazJucnBuODFtc3VnZCJ9.FWq9XiUtIMdqiS1wXqzzjQ'
mapboxgl.accessToken = accessToken
const styleURL = 'mapbox://styles/shawnchi207/clmr85qvx020z01rf835l7eco'

// Map initialization
const map = new mapboxgl.Map({
    container: 'map',
    style: styleURL,
    center: [-105, 37.8],
    zoom: 4,
    accessToken: accessToken,
})

// Geocoder initialization for starting point
const startingPointGeocoder = new MapboxGeocoder({
    container: 'starting-point',
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    placeholder: 'Starting Point',
    country: 'US',
    marker: false,
    flyTo: false  // Disable the flyTo animation
})

// Geocoder initialization for destination
const destinationGeocoder = new MapboxGeocoder({
    container: 'destination',
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    placeholder: 'Destination',
    country: 'US',
    marker:false,
    flyTo: false, // Disable the flyTo animation
})

// Append geocoders to your divs
document.getElementById('starting-point').appendChild(startingPointGeocoder.onAdd(map))
document.getElementById('destination').appendChild(destinationGeocoder.onAdd(map))

// Variables to hold coordinates
let startingPointCoordinates
let destinationCoordinates

// Function to handle route logic based on geocoder results
const handleRoute = () => {
    if (startingPointCoordinates && destinationCoordinates) {
        getRoute()
    } else {
        flyToValidPoint()
    }
}

const removeRoute = () => {
    const layerIds = ['route-shadow', 'route-border', 'route', 'route-shadow-top', 'route-shadow-bot'];
    layerIds.forEach(layerId => {
        if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
        }
        if (map.getSource(layerId)) {
            map.removeSource(layerId);
        }
    });
    flyToValidPoint()
}

const flyToValidPoint = () => {
    if (startingPointCoordinates || destinationCoordinates) {
        const validCoordinates = startingPointCoordinates ? startingPointCoordinates : destinationCoordinates
        map.flyTo({
            center: validCoordinates,
            zoom: 10,
            offset: [window.innerWidth * 0.15, 0]  // Offset to shift center to the right
        })
    }
}

const customMarkerElem = new Image();
customMarkerElem.src = 'marker.svg';
customMarkerElem.style.width = '120px';
customMarkerElem.style.height = '120px';
const startingPointMarker = new mapboxgl.Marker({element: customMarkerElem.cloneNode(true)});
const destinationPointMarker = new mapboxgl.Marker({element: customMarkerElem.cloneNode(true)});



// Listen for result events on geocoders to get coordinates and invoke handleRoute
startingPointGeocoder.on('result', e => {
    startingPointCoordinates = e.result.geometry.coordinates
    startingPointMarker.setLngLat(e.result.geometry.coordinates).addTo(map);
    handleRoute()
})

destinationGeocoder.on('result', e => {
    destinationCoordinates = e.result.geometry.coordinates
    destinationPointMarker.setLngLat(e.result.geometry.coordinates).addTo(map);
    handleRoute()
})

startingPointGeocoder.on('clear', () => {
    startingPointCoordinates = null
    startingPointMarker.remove()
    removeRoute()
})

destinationGeocoder.on('clear', () => {
    destinationCoordinates = null
    destinationPointMarker.remove()
    removeRoute()
})

// Function to fetch and draw the route
const getRoute = () => {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startingPointCoordinates[0]},${startingPointCoordinates[1]};${destinationCoordinates[0]},${destinationCoordinates[1]}?access_token=${mapboxgl.accessToken}&geometries=geojson`

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const route = data.routes[0].geometry.coordinates
            const bounds = new mapboxgl.LngLatBounds()
            route.forEach(coord => bounds.extend(coord))

            const paddingOther = window.innerHeight * 0.3
            const paddingLeft = window.innerWidth * 0.5

            map.fitBounds(bounds, { 
                padding: { left: paddingLeft, top: paddingOther, bottom: paddingOther, right: paddingOther},
            })

            map.once('moveend', () => {
                const geojson = {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: route
                    }
                }

                
                //shadow-bot
                if (!map.getSource('route-shadow-bot')) {
                    map.addSource('route-shadow-bot', {
                        type: 'geojson',
                        data: geojson
                    });
                } else {
                    map.getSource('route-shadow-bot').setData(geojson);
                }
                

                if (!map.getLayer('route-shadow-bot')) {
                    map.addLayer({
                        id: 'route-shadow-bot',
                        type: 'line',
                        source: 'route-shadow-bot',
                        layout: {
                            'line-join': 'round',
                            'line-cap': 'round'
                        },
                        paint: {
                            'line-color': '#6CC5FF',
                            'line-width': 12,
                            'line-opacity': 0.8,
                            'line-blur': 12,
                    
                        }
                    });
                }

                //shadow-top
                if (!map.getSource('route-shadow-top')) {
                    map.addSource('route-shadow-top', {
                        type: 'geojson',
                        data: geojson
                    });
                } else {
                    map.getSource('route-shadow-top').setData(geojson);
                }
                

                if (!map.getLayer('route-shadow-top')) {
                    map.addLayer({
                        id: 'route-shadow-top',
                        type: 'line',
                        source: 'route-shadow-top',
                        layout: {
                            'line-join': 'round',
                            'line-cap': 'round'
                        },
                        paint: {
                            'line-color': '#6CC5FF',
                            'line-width': 24,
                            'line-opacity': 0.8,
                            'line-blur': 40,
                    
                        }
                    });
                }
            
                // Border Layer
                if (!map.getSource('route-border')) {
                    map.addSource('route-border', {
                        type: 'geojson',
                        data: geojson
                    });
                } else {
                    map.getSource('route-border').setData(geojson);
                }
            
                if (!map.getLayer('route-border')) {
                    map.addLayer({
                        id: 'route-border',
                        type: 'line',
                        source: 'route-border',
                        layout: {
                            'line-join': 'round',
                            'line-cap': 'round'
                        },
                        paint: {
                            'line-color': '#4AB0F2',
                            'line-width': 1
                        }
                    });
                }
            
                // Route Line Layer
                if (!map.getSource('route')) {
                    map.addSource('route', {
                        type: 'geojson',
                        data: geojson
                    });
                } else {
                    map.getSource('route').setData(geojson);
                }
            
                if (!map.getLayer('route')) {
                    map.addLayer({
                        id: 'route',
                        type: 'line',
                        source: 'route',
                        layout: {
                            'line-join': 'round',
                            'line-cap': 'round'
                        },
                        paint: {
                            'line-color': 'white',
                            'line-width': [
                                "interpolate",
                                ['exponential', 2],
                                ["zoom"],
                                5,2,15,8
                            ]
                        }
                    });
                }
            
            })
        })
}
