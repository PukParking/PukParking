import { useLocation, useNavigate } from "react-router-dom";
import "./Parking.css";

function UserNavigation() {
    const location = useLocation();
    const navigate = useNavigate();

    const start = location.state?.start;
    const destination = location.state?.destination;

    const selectParking = (parkingId) => {
        navigate("/parking/confirmation", {
            state: {
                selectedParking: parkingId,
                start,
                destination
            }
        });
    };

    return (
        <>
            <div id="Nav-heading">
                <a
                    href="/parking"
                    onClick={(e) => {
                        e.preventDefault();
                        navigate("/parking");
                    }}
                >
                    <span className="close-icon">
                        <img src="/Images/exit-icon.png" alt="exit-logo" />
                    </span>
                </a>

                <h2>ROUTE</h2>
            </div>

            <div className="location">
                <span className="location-icon">
                    <img src="/Images/start-icon.png" alt="start-icon" />
                </span>

                <span>{start}</span>
            </div>

            <div className="destination">
                <span className="location-icon">
                    <img src="/Images/location-tag.png" alt="location-icon" />
                </span>

                <span>{destination}</span>
            </div>

            <div className="navigation-map">
                <img src="/Images/map.jpg" alt="map showing route" />
            </div>

            <h2>SELECT PARKING</h2>

            <div className="parking-selection">

                <details className="options">
                    <summary>Parking A</summary>
                    <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit.</p>
                    <button
                        type="button"
                        onClick={() => selectParking("parking-a")}
                    >
                        Select
                    </button>
                </details>

                <details className="options">
                    <summary>Parking B</summary>
                    <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit.</p>
                    <button
                        type="button"
                        onClick={() => selectParking("parking-b")}
                    >
                        Select
                    </button>
                </details>

                <details className="options">
                    <summary>Parking C</summary>
                    <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit.</p>
                    <button
                        type="button"
                        onClick={() => selectParking("parking-c")}
                    >
                        Select
                    </button>
                </details>

            </div>
        </>
    );
}

export default UserNavigation;