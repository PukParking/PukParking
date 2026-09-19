import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { API_BASE_URL, MAPBOX_TOKEN } from './config';
import './parking-directions.css';

// placeholder used when nothing has been stored yet from the previous page
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

// this function loads the selected parking as worked out by the algorithm
function loadSelectedParking() {
  const stored = sessionStorage.getItem('selectedParking');
  return stored ? JSON.parse(stored) : fallbackParking;
}

export default function ParkingDirections({ onClose, onArrived }) {
  // use the real data if it exists, otherwise fall back to the demo object above.
  const [selectedParking, setSelectedParking] = useState(loadSelectedParking);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  // initialize the map once, and re-center/re-mark it whenever the selected parking area changes (e.g. after "Parking Full" swaps it out)
  useEffect(() => {
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [selectedParking.longitude, selectedParking.latitude],
      zoom: 16,
    });
    mapRef.current = map;

    new mapboxgl.Marker({ color: '#e63946' })
      .setLngLat([selectedParking.longitude, selectedParking.latitude])
      .setPopup(new mapboxgl.Popup().setText(selectedParking.name))
      .addTo(map);

    // this function draws the walking route from wherever the user currently is
    function drawRoute(startLng, startLat) {
      new mapboxgl.Marker({ color: '#2f80ed' })
        .setLngLat([startLng, startLat])
        .addTo(map);

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

    return () => {
      map.remove();
    };
  }, [selectedParking]);

  function handleClose() {
    if (onClose) {
      onClose();
    } else {
      window.location.href = 'index.html';
    }
  }

  function handleArrived() {
    sessionStorage.setItem('selectedParking', JSON.stringify(selectedParking));
    if (onArrived) {
      onArrived(selectedParking);
    } else {
      window.location.href = 'user-parked-confirmation.html';
    }
  }

  function handleFull() {
    fetch(`${API_BASE_URL}/parking/${selectedParking._id}/report-full`, {
      method: 'POST',
    })
      .then((response) => response.json())
      .then((data) => {
        alert(`Thanks! We've marked ${selectedParking.name} as full. Redirecting you to ${data.alternative.name}.`);
        sessionStorage.setItem('selectedParking', JSON.stringify(data.alternative));
        setSelectedParking(data.alternative);
      })
      .catch((error) => {
        console.error('Could not report parking as full:', error);
        alert('Sorry, something went wrong reporting this parking area as full.');
      });
  }

  return (
    <div className="modal-card">
      <header className="modal-header">
        <button className="icon-btn" aria-label="Close" onClick={handleClose}>
          &times;
        </button>
        <h1>Parking Directions</h1>
      </header>

      <div ref={mapContainerRef} className="map-container" />

      <section className="rules-section">
        <h2>Rules &amp; Restrictions</h2>
        <ul className="rules-list">
          {selectedParking.restrictions.map((ruleText, index) => (
            <li key={index}>{ruleText}</li>
          ))}
        </ul>

        <div className="legend">
          <div className="legend-item">
            <span className="legend-swatch legend-yellow" />
            <span>Time-limited / Permit Zone</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch legend-red" />
            <span>Restricted / No Entry Zone</span>
          </div>
        </div>
      </section>

      <footer className="modal-footer">
        <button className="btn btn-outline" onClick={handleFull}>
          Parking Full
        </button>
        <button className="btn btn-primary" onClick={handleArrived}>
          I have Arrived!
        </button>
      </footer>
    </div>
  );
}
