import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import "./UserConfirmation.css";

import logo from "../../assets/pukparking-logo.png";

function UserConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    selectedParking,
    start,
    destination,
    userType,
  } = location.state || {};

  const parkingData = {
    "parking-a": {
      _id: "parking-a",
      name: "Parking A",
      description:
        "You have selected Parking A for your campus trip.",
    },

    "parking-b": {
      _id: "parking-b",
      name: "Parking B",
      description:
        "You have selected Parking B for your campus trip.",
    },

    "parking-c": {
      _id: "parking-c",
      name: "Parking C",
      description:
        "You have selected Parking C for your campus trip.",
    },
  };

  const selection =
    parkingData[selectedParking];

  const handleBack = () => {
    navigate("/parking/navigation", {
      state: {
        start,
        destination,
        userType,
      },
    });
  };

  const handleConfirm = () => {
    if (!selection) {
      return;
    }

    sessionStorage.setItem(
      "selectedParking",
      JSON.stringify(selection)
    );

    navigate("/parking-directions", {
      state: {
        selectedParking: selection,
        start,
        destination,
        userType,
      },
    });
  };

  if (!selection) {
    return (
      <div className="selection-page">

        <div className="selection-empty-card">

          <img
            src={logo}
            alt="PukParking"
          />

          <h1>
            No parking selected
          </h1>

          <p>
            Return to the parking options and
            select a parking area.
          </p>

          <button
            type="button"
            onClick={handleBack}
          >
            View Parking Options
          </button>

        </div>

      </div>
    );
  }

  return (
    <div className="selection-page">

      <header className="selection-header">

        <button
          type="button"
          className="selection-back"
          onClick={handleBack}
        >
          ←
        </button>

        <img
          src={logo}
          alt="PukParking"
          className="selection-logo"
        />

        <div className="selection-category">
          {userType || "Guest"}
        </div>

      </header>

      <main className="selection-main">

        <section className="selection-card">

          <div className="selection-icon">
            P
          </div>

          <p className="selection-eyebrow">
            PARKING SELECTION
          </p>

          <h1>
            {selection.name}
          </h1>

          <p className="selection-description">
            {selection.description}
          </p>

          <div className="selection-route">

            <div>
              <span>
                From
              </span>

              <strong>
                {start}
              </strong>
            </div>

            <div className="selection-arrow">
              →
            </div>

            <div>
              <span>
                Destination
              </span>

              <strong>
                {destination}
              </strong>
            </div>

          </div>

          <div className="selection-notice">

            <strong>
              Ready to continue?
            </strong>

            <p>
              Confirm this parking area to view
              directions and parking information.
            </p>

          </div>

          <div className="selection-actions">

            <button
              type="button"
              className="selection-change"
              onClick={handleBack}
            >
              Change Parking
            </button>

            <button
              type="button"
              className="selection-confirm"
              onClick={handleConfirm}
            >
              Confirm Parking

              <span>
                →
              </span>
            </button>

          </div>

        </section>

      </main>

    </div>
  );
}

export default UserConfirmation;