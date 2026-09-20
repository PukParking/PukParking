import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './ParkingDirections.css';

// Temporary parking data until the backend and Mapbox are connected
const fallbackParking = {
    _id: 'demo-parking-b',
    name: 'Parking B',
    restrictions: [
        'Student parking only (valid disc required).',
        'No parking after 18:00 on weekdays.',
        'Display your parking disc on the dashboard at all times.',
        'Accessible bays are reserved - do not park here without a permit.',
    ],
};

// Loads selected parking from the previous page if available
function loadSelectedParking() {
    const stored = sessionStorage.getItem('selectedParking');
    return stored ? JSON.parse(stored) : fallbackParking;
}

export default function ParkingDirections({ onClose, onArrived }) {
    const navigate = useNavigate();
    const [selectedParking, setSelectedParking] = useState(
        loadSelectedParking
    );

    function handleClose() {
        if (onClose) {
            onClose();
        }
    }

    function handleArrived() {
        sessionStorage.setItem(
            'selectedParking',
            JSON.stringify(selectedParking)
        );

        navigate('/parking-confirmation');
    }

    function handleFull() {
        alert(
            `${selectedParking.name} has been marked as full. ` +
            'An alternative parking area will be provided when the backend is connected.'
        );
    }

    return (
        <div className="modal-card">

            <header className="modal-header">

                <button
                    className="icon-btn"
                    aria-label="Close"
                    onClick={handleClose}
                >
                    &times;
                </button>

                <h1>Parking Directions</h1>

            </header>

            <div className="map-placeholder">

                <div className="map-placeholder-content">

                    <h2>Map Placeholder</h2>

                    <p>
                        Walking route to{' '}
                        <strong>{selectedParking.name}</strong>
                    </p>

                    <p>
                        Mapbox navigation will be connected later.
                    </p>

                </div>

            </div>

            <section className="rules-section">

                <h2>Rules &amp; Restrictions</h2>

                <ul className="rules-list">

                    {selectedParking.restrictions.map(
                        (ruleText, index) => (
                            <li key={index}>
                                {ruleText}
                            </li>
                        )
                    )}

                </ul>

                <div className="legend">

                    <div className="legend-item">

                        <span className="legend-swatch legend-yellow" />

                        <span>
                            Time-limited / Permit Zone
                        </span>

                    </div>

                    <div className="legend-item">

                        <span className="legend-swatch legend-red" />

                        <span>
                            Restricted / No Entry Zone
                        </span>

                    </div>

                </div>

            </section>

            <footer className="modal-footer">

                <button
                    className="btn btn-outline"
                    onClick={handleFull}
                >
                    Parking Full
                </button>

                <button
                    className="btn btn-primary"
                    onClick={handleArrived}
                >
                    I have Arrived!
                </button>

            </footer>

        </div>
    );
}