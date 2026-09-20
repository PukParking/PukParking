import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useState } from "react";

import "./ParkingDirections.css";

import logo from "../../assets/pukparking-logo.png";

const fallbackParking = {
  _id: "demo-parking",
  name: "Selected Parking",
  description:
    "Your selected campus parking area.",
};

function loadStoredParking() {
  const stored =
    sessionStorage.getItem(
      "selectedParking"
    );

  if (!stored) {
    return fallbackParking;
  }

  try {
    return JSON.parse(stored);
  } catch {
    return fallbackParking;
  }
}

export default function ParkingDirections({
  onClose,
  onArrived,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedParking =
    location.state?.selectedParking ||
    loadStoredParking();

  const userType =
    location.state?.userType ||
    sessionStorage.getItem(
      "selectedUserType"
    ) ||
    "Guest";

  const start =
    location.state?.start;

  const destination =
    location.state?.destination;

  const [
    fullMessage,
    setFullMessage,
  ] = useState("");

  const rules = [
    `Use parking bays permitted for ${userType.toLowerCase()} users.`,
    "Follow all campus parking signs and markings.",
    "Do not use reserved or accessible bays without the required permission.",
    "Check displayed time restrictions before leaving your vehicle.",
  ];

  function handleClose() {
    if (onClose) {
      onClose();
      return;
    }

    navigate(-1);
  }

  function handleArrived() {
    sessionStorage.setItem(
      "selectedParking",
      JSON.stringify(
        selectedParking
      )
    );

    if (onArrived) {
      onArrived(
        selectedParking
      );
    }

    navigate(
      "/parking-confirmation",
      {
        state: {
          selectedParking,
          userType,
        },
      }
    );
  }

  function handleFull() {
    setFullMessage(
      `${selectedParking.name} has been marked as full for this demonstration. Alternative parking will be provided automatically when live backend availability is connected.`
    );
  }

  return (
    <div className="directions-page">

      <header className="directions-header">

        <button
          type="button"
          className="directions-back"
          onClick={handleClose}
          aria-label="Go back"
        >
          ←
        </button>

        <img
          src={logo}
          alt="PukParking"
          className="directions-logo"
        />

        <div className="directions-user">
          {userType}
        </div>

      </header>

      <main className="directions-main">

        <section className="directions-heading">

          <p>
            PARKING DIRECTIONS
          </p>

          <h1>
            Navigate to{" "}
            <span>
              {selectedParking.name}
            </span>
          </h1>

          <p className="directions-description">
            Follow the route preview below and
            review the parking information before
            you arrive.
          </p>

        </section>

        <section className="directions-route-summary">

          <div>
            <span>
              Starting point
            </span>

            <strong>
              {start ||
                "Current location"}
            </strong>
          </div>

          <div className="directions-route-arrow">
            →
          </div>

          <div>
            <span>
              Campus destination
            </span>

            <strong>
              {destination ||
                "Selected destination"}
            </strong>
          </div>

          <div className="directions-route-arrow">
            →
          </div>

          <div>
            <span>
              Parking
            </span>

            <strong>
              {selectedParking.name}
            </strong>
          </div>

        </section>

        <section className="directions-map-card">

          <div className="directions-map-header">

            <div>
              <span>
                ROUTE PREVIEW
              </span>

              <h2>
                Campus map
              </h2>
            </div>

            <div>
              Mapbox pending
            </div>

          </div>

          <div className="directions-map">

            <img
              src="/Images/map.jpg"
              alt="Campus route preview"
            />

            <div className="directions-map-label">
              Route to{" "}
              <strong>
                {selectedParking.name}
              </strong>
            </div>

          </div>

        </section>

        <section className="directions-information">

          <div className="directions-rules">

            <p className="directions-section-label">
              BEFORE YOU PARK
            </p>

            <h2>
              Rules &amp; Restrictions
            </h2>

            <div className="directions-rule-list">

              {rules.map(
                (rule, index) => (

                  <div
                    className="directions-rule"
                    key={rule}
                  >

                    <span>
                      {index + 1}
                    </span>

                    <p>
                      {rule}
                    </p>

                  </div>

                )
              )}

            </div>

          </div>

          <aside className="directions-status-card">

            <div className="directions-parking-icon">
              P
            </div>

            <span>
              SELECTED PARKING
            </span>

            <h3>
              {selectedParking.name}
            </h3>

            <p>
              Live parking availability and
              restrictions will be loaded from
              the backend during integration.
            </p>

          </aside>

        </section>

        {fullMessage && (

          <div className="parking-full-message">

            <div>
              <strong>
                Parking marked as full
              </strong>

              <p>
                {fullMessage}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setFullMessage("")
              }
            >
              ×
            </button>

          </div>

        )}

        <section className="directions-actions">

          <button
            type="button"
            className="directions-full"
            onClick={handleFull}
          >
            Parking Full
          </button>

          <button
            type="button"
            className="directions-arrived"
            onClick={handleArrived}
          >
            I Have Arrived!

            <span>
              →
            </span>
          </button>

        </section>

      </main>

    </div>
  );
}