// function that reads back the parking area chosen by algorithm on the previous page (saved as a JSON string).
const storedParking = sessionStorage.getItem('selectedParking');

// function which serves as a placeholder, to display data on the page
const fallbackParking = {
  _id: 'demo-parking-b',
  name: 'Parking B',
  latitude: -26.6857,
  longitude: 27.0940,
  restrictions: [
    'Student parking only (valid disc required).',
    'No parking after 18:00 on weekdays.',
    'Display your parking disc on the dashboard at all times.',
    'Accessible bays are reserved - do not park here without a permit.',
  ],
};

// use the real data if it exists, otherwise fall back to the demo object above.
const selectedParking = storedParking ? JSON.parse(storedParking) : fallbackParking; 
const rulesList = document.getElementById('rulesList');
const closeBtn = document.getElementById('closeBtn');
const arrivedBtn = document.getElementById('arrivedBtn');
const fullBtn = document.getElementById('fullBtn');

// function that builds the "Rules & Restrictions" list. 
function renderRules(parking) {
  rulesList.innerHTML = '';

  parking.restrictions.forEach((ruleText) => {
    const listItem = document.createElement('li');
    listItem.textContent = ruleText;
    rulesList.appendChild(listItem);
  });
}

renderRules(selectedParking);

mapboxgl.accessToken = MAPBOX_TOKEN;

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [selectedParking.longitude, selectedParking.latitude],
  zoom: 16,
});

new mapboxgl.Marker({ color: '#e63946' })
  .setLngLat([selectedParking.longitude, selectedParking.latitude])
  .setPopup(new mapboxgl.Popup().setText(selectedParking.name))
  .addTo(map);

// function that draws the walking route from wherever the user currently is when opening the application
function drawRoute(startLng, startLat) {
  new mapboxgl.Marker({ color: '#2f80ed' })
    .setLngLat([startLng, startLat])
    .addTo(map);

  // route is fetched
  fetch(`${API_BASE_URL}/navigation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: { lat: startLat, lng: startLng },
      parkingId: selectedParking._id,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      map.addSource('walking-route', {
        type: 'geojson',
        data: data.route,
      });

      map.addLayer({
        id: 'walking-route-line',
        type: 'line',
        source: 'walking-route',
        paint: {
          'line-color': '#2f80ed',
          'line-width': 5,
        },
      });

      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([startLng, startLat]);
      bounds.extend([selectedParking.longitude, selectedParking.latitude]);
      map.fitBounds(bounds, { padding: 60 });
    })
    .catch((error) => {
      console.error('Could not load walking route:', error);
      alert('Sorry, we could not calculate a walking route right now.');
    });
}

// if statements to handle when the location of the user is aquired
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      drawRoute(position.coords.longitude, position.coords.latitude);
    },
    
    () => {
      alert('Location access was not available — showing the route from the Main Gate instead.');
      drawRoute(27.0925, -26.6870);
    }
  );
} else {
  alert('Your browser does not support location services.');
}

closeBtn.addEventListener('click', () => {
  window.location.href = 'index.html';
});

arrivedBtn.addEventListener('click', () => {
  sessionStorage.setItem('selectedParking', JSON.stringify(selectedParking));
  window.location.href = 'user-parked-confirmation.html';
});

fullBtn.addEventListener('click', () => {
  fetch(`${API_BASE_URL}/parking/${selectedParking._id}/report-full`, {
    method: 'POST',
  })
    .then((response) => response.json())
    
    .then((data) => {
      alert(`Thanks! We've marked ${selectedParking.name} as full. Redirecting you to ${data.alternative.name}.`);
      sessionStorage.setItem('selectedParking', JSON.stringify(data.alternative));
      window.location.reload();
    })
    .catch((error) => {
      console.error('Could not report parking as full:', error);
      alert('Sorry, something went wrong reporting this parking area as full.');
    });
});