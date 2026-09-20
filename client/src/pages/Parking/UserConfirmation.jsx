import { useLocation, useNavigate } from "react-router-dom";

import "./Parking.css";

function UserConfirmation() {
    const location = useLocation();
    const navigate = useNavigate();

    const { selectedParking, start, destination } = location.state || {};

    const parkingData = {
        "parking-a": {
            title: "Parking A",
            text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
        },

        "parking-b": {
            title: "Parking B",
            text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
        },

        "parking-c": {
            title: "Parking C",
            text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
        }
    };

    const selection = parkingData[selectedParking];

    return (
        <>
            <a
                href="/parking/navigation"
                onClick={(e) => {
                    e.preventDefault();

                    navigate("/parking/navigation", {
                        state: {
                            start,
                            destination
                        }
                    });
                }}
            >
                <span className="close-button">
                    <img
                        src="/Images/exit-icon.png"
                        alt="exit-logo"
                    />
                </span>
            </a>

            <div className="modal-card" id="modal-card">
                <h2 className="modal-title">
                    {selection?.title}
                </h2>

                <p className="modal-text">
                    {selection?.text}
                </p>

                <button
                    className="btn-confirm"
                    onClick={() => navigate("/parking-directions")}
                >
                    Confirm
                </button>
            </div>
        </>
    );
}

export default UserConfirmation;