const accessToken = 'pk.eyJ1Ijoic2hhd25jaGkyMDciLCJhIjoiY2t2eDM4eHVoMDBmazJucnBuODFtc3VnZCJ9.FWq9XiUtIMdqiS1wXqzzjQ'
mapboxgl.accessToken = accessToken
const styleURL = 'mapbox://styles/shawnchi207/clmr85qvx020z01rf835l7eco'
const markerURL = 'https://uploads-ssl.webflow.com/644256fe693d807d873bf254/65284f0572370299d4c65015_marker.svg'

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
    flyTo: false,  // Disable the flyTo animation
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


const routeBtn = document.querySelector('#route-btn')
disableWfBtn(routeBtn,true)

const calculateBtn = document.querySelector('#calculate-btn')


function disableWfBtn(btn,disable) {
    if (disable) {
        btn.style.opacity = 0.7
        btn.style.pointerEvents = 'none'
    } else {
        btn.style.opacity = 1
        btn.style.pointerEvents = 'unset'
    }
}



document.getElementById('starting-point').appendChild(startingPointGeocoder.onAdd(map))
document.getElementById('destination').appendChild(destinationGeocoder.onAdd(map))

const hiddenInputs = document.querySelectorAll('form .hidden-wrapper input')


const geocoders = document.querySelectorAll('.mapboxgl-ctrl-geocoder')
geocoders.forEach( geocoder => {

    geocoder.onmouseenter = () => {
        geocoder.style.zIndex = 10
    }
    geocoder.onmouseleave = () => {
        geocoder.style.zIndex = 1
    }
    geocoder.onclick = () => {
        geocoder.querySelector('.suggestions').style.opacity = '1'
        predefinedRoute = false
    }
    geocoder.style.boxShadow = 'none'
    geocoder.style.maxWidth = 'unset'
    geocoder.style.width = '100%'
} )

let tripsInput, dieselInput, trucksInput

routeBtn.onclick = () => {
    tripsInput = document.querySelector('#trips')
    dieselInput = document.querySelector('#diesel-price')
    trucksInput = document.querySelector('#trucks')
    // trucksInput.defaultValue = 5
    trucksInput.setAttribute('min', '1');
    // dieselInput.defaultValue = 4.5
    dieselInput.setAttribute('min', '0.1');
    dieselInput.setAttribute('step', '0.1');
    // tripsInput.defaultValue = 10 
    tripsInput.setAttribute('min', '1');

}



calculateBtn.onclick = (e) => {
    tripsInput = document.querySelector('#trips')
    dieselInput = document.querySelector('#diesel-price')
    trucksInput = document.querySelector('#trucks')


    try {
        [trucksInput, dieselInput, tripsInput].forEach(input => {
            console.log(input.value)
            if (!input.value) {
                input.value = input.placeholder
            }
        })
    } catch (error) {
        console.error('Error in onclick handler:', error);
    }    
    

    calculateMetrics()
}




const distanceSegment = 1 //(mile)

// Variables to hold data
let startingPointCoordinates
let startingPoint, destination
let destinationCoordinates
let timeSavedPerTrip
let totalElevationGain
let route
let grades = []
let speedDifferences = [];
let timeSaved = [];
let elevations = [];
let elevationGains = [];
let totalTimeSaved
let revoylessSpeed = []
let predefinedRoute = false


const customMarkerElem = new Image();
customMarkerElem.src = markerURL;
customMarkerElem.style.width = '120px';
customMarkerElem.style.height = '120px';
const startingPointMarker = new mapboxgl.Marker({element: customMarkerElem.cloneNode(true)});
const destinationPointMarker = new mapboxgl.Marker({element: customMarkerElem.cloneNode(true)});


// Listen for result events on geocoders to get coordinates and invoke handleRoute
startingPointGeocoder.on('result', e => {
    startingPointCoordinates = e.result.geometry.coordinates
    startingPointMarker.setLngLat(e.result.geometry.coordinates).addTo(map);
    // flyToValidPoint()
    handleResult()
    startingPoint = getLocation(e)

})

destinationGeocoder.on('result', e => {
    destinationCoordinates = e.result.geometry.coordinates
    destinationPointMarker.setLngLat(e.result.geometry.coordinates).addTo(map);
    // flyToValidPoint()
    handleResult()
    destination = getLocation(e)
})

function getLocation(e) {
    if (e.result && e.result.place_name) {
        const locationArray = e.result.place_name.split(','); // Split the place_name string into an array
        const lastIndex = locationArray.length - 1
        const locationName = locationArray[lastIndex - 2]? locationArray[lastIndex -2] :locationArray[lastIndex - 1]
    
        return locationName
    }
}

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


document.querySelector('#route-1').onclick = (e) => {
    clearPoints()
    triggerGeocoderQuery(startingPointGeocoder, 'New York City, NY');
    triggerGeocoderQuery(destinationGeocoder, 'Miami, FL');
    routeBtn.click()
};

document.querySelector('#route-2').onclick = (e) => {
    clearPoints()
    triggerGeocoderQuery(startingPointGeocoder, 'Denver, CO');
    triggerGeocoderQuery(destinationGeocoder, 'New Orleans, LA');
    routeBtn.click()
};

document.querySelector('#route-3').onclick = (e) => {
    clearPoints()
    triggerGeocoderQuery(startingPointGeocoder, 'Los Angeles, CA');
    triggerGeocoderQuery(destinationGeocoder, 'Chicago, IL');
    routeBtn.click()
};

function triggerGeocoderQuery(geocoder, query) {
    geocoder.query(query)
    geocoder.container.querySelector('.suggestions').style.opacity = 0
}

function clearPoints() {
    startingPointGeocoder.clear()
    destinationGeocoder.clear()
    // destinationPointMarker.remove()
}

// Function to handle route logic based on geocoder results
const handleResult = () => {
    if (startingPointCoordinates && destinationCoordinates) {
        disableWfBtn(routeBtn, false)
        getRoute()
    } else if (!predefinedRoute) {
        flyToValidPoint()
        disableWfBtn(routeBtn, true)
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
    // flyToValidPoint()
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




// Add the terrain source
map.on('load', () => {
    map.addSource('mapbox-dem', {
        'type': 'raster-dem',
        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
        'tileSize': 512,
        'maxzoom': 14
    });
    map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
});




function getRoute() {
    disableWfBtn(calculateBtn, true)
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startingPointCoordinates[0]},${startingPointCoordinates[1]};${destinationCoordinates[0]},${destinationCoordinates[1]}?access_token=${mapboxgl.accessToken}&geometries=geojson`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            route = data.routes[0].geometry.coordinates;
            const routeLineString = turf.lineString(route);
            const chunks = turf.lineChunk(routeLineString, distanceSegment, { units: 'miles' });
            const segments = chunks.features.map(chunk => [chunk.geometry.coordinates[0], chunk.geometry.coordinates[chunk.geometry.coordinates.length - 1]]);
            

            const bounds = new mapboxgl.LngLatBounds();
            route.forEach(coord => bounds.extend(coord));
            const paddingOther = window.innerHeight * 0.3;
            const paddingLeft = window.innerWidth * 0.5;

            map.fitBounds(bounds, { 
                padding: { left: paddingLeft, top: paddingOther, bottom: paddingOther, right: paddingOther },
            });

            map.once('moveend', () => {
                const geojson = {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: route
                    }
                };
                drawRoute(geojson);
            });

            map.once('idle', function() {
                // Now, the map has finished loading and rendering, fetch elevations
                getElevation(segments);
                map.fitBounds(bounds, { 
                    padding: { left: paddingLeft, top: paddingOther, bottom: paddingOther, right: paddingOther },
                });
            });
        });
};


async function getElevation(segments) {
    elevations = []

    for (const segment of segments) {
        const startElevation = map.queryTerrainElevation(segment[0]);
        const endElevation = map.queryTerrainElevation(segment[1]);
        
        elevations.push(startElevation, endElevation);
    }
    console.log('elevations: ', elevations)

    calculateTimeSaved(segments);
};




const calculateTimeSaved = (segments) => {
    const routeText = document.querySelector('#route-text')
    routeText? routeText.innerText = `${startingPoint} -> ${destination}`: routeText.style.display = 'none'


    timeSaved = []
    elevationGains = []
    revoylessSpeed = []
    speedDifferences = []

    if (elevations.length !== 2 * segments.length) {
        console.error("Mismatch in elevations and segments array lengths:", elevations, segments);
        return;
    }

    for (let i = 0; i < segments.length; i++) {
        const startElevation = elevations[2 * i];
        const endElevation = elevations[2 * i + 1];

        // Convert elevation difference to miles
        const elevationDifferenceInMiles = (endElevation - startElevation) * 0.000621371;
        if (elevationDifferenceInMiles > 0) {
            elevationGains.push(elevationDifferenceInMiles);
        }

        // Calculate grade
        const grade = elevationDifferenceInMiles / distanceSegment;
        grades.push(grade);

        const currentSpeed = (35 + ((0.06 - Math.max(grade, 0)) * 20 / 0.06));
        revoylessSpeed.push(currentSpeed)

        const speedDiff = 55 - currentSpeed
        speedDifferences.push(speedDiff)



        const currentTime = distanceSegment / currentSpeed;
        const newTime = distanceSegment / 55;

        // Calculate time saved (converted from hours to minutes)
        const timeSavedForSegment = (currentTime - newTime) * 60;
        // const timeSavedForSegment = distanceSegment / speedDiff
        timeSaved.push(timeSavedForSegment);
    }

    timeSavedPerTrip = timeSaved.reduce((acc, curr) => acc + curr, 0) / 60; //convert back to hours
    totalElevationGain = elevationGains.reduce((acc, curr) => acc + curr, 0) * 5280; // Convert miles to feet
    
    disableWfBtn(calculateBtn, false)
};

function calculateMetrics() {
    const numOfTrucks = parseInt(document.getElementById('trucks').value, 10);
    const tripsPerMonth = parseInt(document.getElementById('trips').value, 10);
    const dieselPrice = parseFloat(document.getElementById('diesel-price').value);
    const isRoundTrip = document.getElementById('round-trip').checked;

    const baseMileage = turf.length(turf.lineString(route), { units: 'miles' });
    const totalMileage = baseMileage * (isRoundTrip ? 2 : 1) * numOfTrucks * tripsPerMonth;
    const savings = Math.round((totalMileage * (dieselPrice / 7)) * 0.05).toLocaleString('en-US', { maximumFractionDigits: 0 });
    const CO2eSaved = parseFloat((totalMileage * (1 / 7 - 1 / 30) * 0.0010180 * 2205)).toLocaleString('en-US', { maximumFractionDigits: 0 });
    const totalTimeSaved = Math.round(timeSavedPerTrip * numOfTrucks * tripsPerMonth * (isRoundTrip ? 2 : 1));

    console.log('Number of Trucks:', numOfTrucks);
    console.log('Trips Per Month:', tripsPerMonth);
    console.log('Diesel Price:', dieselPrice);
    console.log("Grades:", grades);
    console.log("Speed without Revoy (mph):", revoylessSpeed);
    console.log("Speed Differences (mph):", speedDifferences);
    console.log("Time Saved for each segment (minutes):", timeSaved);


    console.log("Total Elevation Gain (in feet):", totalElevationGain);
    console.log("Total Mileage (in miles):", totalMileage);
    console.log("Savings in Dollars:", savings);
    console.log("CO2e Saved (tonnes):", CO2eSaved);
    console.log("Total Time Saved (in hours):", totalTimeSaved);


    document.querySelector('#hours-saved').innerText = totalTimeSaved;
    document.querySelector('#dollars-saved').innerText = savings;
    document.querySelector('#co2-saved').innerText = CO2eSaved;

    hiddenInputs.forEach(input => {
        switch (input.id) {
            case 'start-hidden':
                input.value = startingPoint
                break;
            case 'destination-hidden':
                input.value = destination
                break;
            case 'dollars-hidden':
                input.value = savings
                break;
            case 'co2-hidden':
                input.value = CO2eSaved
                break;
            case 'time-hidden':
                input.value = totalTimeSaved
                break;
            default:
                input.value = 'missing value'
        }
        console.log('hidden inputs', input.id, input.value)
    })
}



function drawRoute(lineData) {
    //shadow-bot
    if (!map.getSource('route-shadow-bot')) {
        map.addSource('route-shadow-bot', {
            type: 'geojson',
            data: lineData
        });
    } else {
        map.getSource('route-shadow-bot').setData(lineData);
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
            data: lineData
        });
    } else {
        map.getSource('route-shadow-top').setData(lineData);
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
            data: lineData
        });
    } else {
        map.getSource('route-border').setData(lineData);
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
            data: lineData
        });
    } else {
        map.getSource('route').setData(lineData);
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
}
