import { useLocation, useNavigate } from "react-router-dom";

import "./UserNavigation.css";

import logo from "../../assets/pukparking-logo.png";
import locationIcon from "../../assets/location-icon.png";

function UserNavigation() {
  const location = useLocation();
  const navigate = useNavigate();

  const start =
    location.state?.start ||
    "Starting point";

  const destination =
    location.state?.destination ||
    "Destination";

  const userType =
    location.state?.userType ||
    sessionStorage.getItem("selectedUserType") ||
    "Guest";

  const parkingOptions = [
    {
      id: "parking-a",
      name: "Parking A",
      description:
        "A suitable campus parking option for your selected destination.",
    },
    {
      id: "parking-b",
      name: "Parking B",
      description:
        "A suitable campus parking option for your selected destination.",
    },
    {
      id: "parking-c",
      name: "Parking C",
      description:
        "A suitable campus parking option for your selected destination.",
    },
  ];

  const selectParking = (parkingId) => {
    navigate("/parking/confirmation", {
      state: {
        selectedParking: parkingId,
        start,
        destination,
        userType,
      },
    });
  };

  return (
    <div className="route-page">

      <header className="route-header">

        <button
          type="button"
          className="route-back-button"
          onClick={() => navigate("/parking")}
          aria-label="Go back"
        >
          ←
        </button>

        <img
          src={logo}
          alt="PukParking"
          className="route-logo"
        />

        <div className="route-user-badge">
          {userType}
        </div>

      </header>

      <main className="route-main">

        <section className="route-intro">

          <p className="route-eyebrow">
            YOUR ROUTE
          </p>

          <h1>
            Choose your parking
          </h1>

          <p>
            Review your route and select the
            parking area you would like to use.
          </p>

        </section>

        <section className="route-summary-card">

          <div className="route-point">

            <div className="route-point-icon start">
              ●
            </div>

            <div>
              <span>
                Starting from
              </span>

              <strong>
                {start}
              </strong>
            </div>

          </div>

          <div className="route-summary-line">
            <span></span>
          </div>

          <div className="route-point">

            <div className="route-point-icon destination">
              <img
                src={locationIcon}
                alt=""
              />
            </div>

            <div>
              <span>
                Going to
              </span>

              <strong>
                {destination}
              </strong>
            </div>

          </div>

        </section>

        <section className="route-map-card">

          <div className="route-map-heading">

            <div>
              <span>
                ROUTE PREVIEW
              </span>

              <h2>
                Campus navigation
              </h2>
            </div>

            <div className="route-preview-badge">
              Preview
            </div>

          </div>

          <div className="route-map">

            <img
              src="/Images/map.jpg"
              alt="Campus route preview"
            />

            <div className="route-map-note">
              Live Mapbox navigation will be
              connected during integration.
            </div>

          </div>

        </section>

        <section className="parking-options-section">

          <div className="parking-options-heading">

            <div>
              <p>
                SELECT PARKING
              </p>

              <h2>
                Available options
              </h2>
            </div>

            <span>
              {parkingOptions.length} options
            </span>

          </div>

          <div className="parking-options-grid">

            {parkingOptions.map(
              (parking, index) => (

                <article
                  className="parking-option-card"
                  key={parking.id}
                >

                  <div className="parking-option-top">

                    <div className="parking-option-icon">
                      P
                    </div>

                    <span>
                      Option {index + 1}
                    </span>

                  </div>

                  <h3>
                    {parking.name}
                  </h3>

                  <p>
                    {parking.description}
                  </p>

                  <div className="parking-option-status">
                    <span></span>

                    Availability confirmed during
                    live integration
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      selectParking(parking.id)
                    }
                  >
                    Select {parking.name}

                    <span>
                      →
                    </span>
                  </button>

                </article>

              )
            )}

          </div>

        </section>

      </main>

    </div>
  );
}

export default UserNavigation;