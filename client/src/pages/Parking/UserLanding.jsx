import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import "./UserLanding.css";

import { mockBuildings, mockParkingLots } from "../../data/mockCampusData";
import { fetchBuildings, fetchParkingAreas } from "../../services/parkingApi";
import logo from "../../assets/pukparking-logo.png";
import carIcon from "../../assets/car-icon.png";
import locationIcon from "../../assets/location-icon.png";

function UserLanding() {
  const navigate = useNavigate();
  const location = useLocation();

  const [start, setStart] = useState("gps");
  const [destination, setDestination] = useState("");
  const [buildings, setBuildings] = useState(mockBuildings);
  const [parkingLots, setParkingLots] = useState(mockParkingLots);

  const storedUserType =
    sessionStorage.getItem("selectedUserType");

  const selectedUserType =
    location.state?.userType ||
    storedUserType ||
    "Student";

  const userType =
    selectedUserType.charAt(0).toUpperCase() +
    selectedUserType.slice(1).toLowerCase();

  const welcomeMessages = {
    Student:
      "Find suitable student parking and get to your campus destination with less stress.",

    Staff:
      "Find suitable staff parking and get to your destination quickly and confidently.",

    Visitor:
      "Welcome to NWU Potchefstroom Campus. We’ll help you find suitable visitor parking and reach your destination.",
  };

  const welcomeMessage =
    welcomeMessages[userType === "Guest" ? "Visitor" : userType] ||
    welcomeMessages.Student;

  useEffect(() => {
    sessionStorage.setItem(
      "selectedUserType",
      userType
    );
  }, [userType]);

  useEffect(() => {
    const controller = new AbortController();

    fetchBuildings({ signal: controller.signal }).then(setBuildings).catch((error) => {
      if (error.name !== "AbortError") {
        console.error("Unable to load buildings.", error);
      }
    });

    fetchParkingAreas({ signal: controller.signal })
      .then(setParkingLots)
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Unable to load parking areas.", error);
        }
      });

    return () => controller.abort();
  }, []);

  const handleStartChange = (event) => {
    const nextStart = event.target.value;
    setStart(nextStart);

    if (destination === nextStart) {
      setDestination("");
    }
  };

  const handleFind = (event) => {
    event.preventDefault();

    navigate("/parking/navigation", {
      state: {
        startLocationId: start,
        destinationId: destination,
        userType,
      },
    });
  };

  return (
    <div className="user-landing-page">

      <header className="landing-header">

        <img
          src={logo}
          alt="PukParking"
          className="landing-logo"
        />

        <button
          type="button"
          className="landing-home-button"
          onClick={() => navigate("/home")}
        >
          Home
        </button>

      </header>

      <main className="landing-main">

        <section className="landing-welcome-panel">

          <div className="landing-user-badge">
            {userType}
          </div>

          <p className="landing-eyebrow">
            PARK SMART. CAMPUS READY.
          </p>

          <h1>
            Welcome,
            <span> {userType}</span>
          </h1>

          <p className="landing-welcome-text">
            {welcomeMessage}
          </p>

          <div className="landing-benefits">

            <div className="landing-benefit">

              <div className="landing-benefit-icon">
                <img
                  src={carIcon}
                  alt=""
                />
              </div>

              <div>
                <strong>
                  Suitable Parking
                </strong>

                <p>
                  Find parking suited to your
                  selected category.
                </p>
              </div>

            </div>

            <div className="landing-benefit">

              <div className="landing-benefit-icon">
                <img
                  src={locationIcon}
                  alt=""
                />
              </div>

              <div>
                <strong>
                  Easy Navigation
                </strong>

                <p>
                  Select where you are and where
                  you want to go.
                </p>
              </div>

            </div>

          </div>

        </section>

        <section className="landing-search-card">

          <div className="landing-search-heading">

            <p>
              PLAN YOUR PARKING
            </p>

            <h2>
              Where are you going?
            </h2>

            <span>
              Select your starting point and
              campus destination.
            </span>

          </div>

          <form
            className="landing-form"
            onSubmit={handleFind}
          >

            <div className="landing-form-group">

              <label htmlFor="start">
                Current Location
              </label>

              <div className="landing-select-wrapper">

                <img
                  src={locationIcon}
                  alt=""
                />

                <select
                  id="start"
                  value={start}
                  required
                  onChange={handleStartChange}
                >
                  <option
                    value="gps"
                  >
                    My Current Location (GPS)
                  </option>

                  {parkingLots.map((lot) => (
                    <option key={lot.id} value={lot.id}>
                      {lot.name} — {lot.accessGate}
                    </option>
                  ))}
                </select>

              </div>

            </div>

            <div className="landing-route-line">

              <span></span>

              <div>
                ↓
              </div>

              <span></span>

            </div>

            <div className="landing-form-group">

              <label htmlFor="destination">
                Destination
              </label>

              <div className="landing-select-wrapper">

                <img
                  src={locationIcon}
                  alt=""
                />

                <select
                  id="destination"
                  value={destination}
                  required
                  onChange={(event) =>
                    setDestination(
                      event.target.value
                    )
                  }
                >
                  <option
                    value=""
                    disabled
                  >
                    Select destination
                  </option>

                  {buildings.map((building) => (
                    <option key={building.id} value={building.id}>
                      {building.name} ({building.code})
                    </option>
                  ))}
                </select>

              </div>

            </div>

            <button
              type="submit"
              className="landing-find-button"
            >
              Find Suitable Parking

              <span>
                →
              </span>
            </button>

          </form>

          <div className="landing-history">

            <div>
              <strong>
                Recent Trips
              </strong>

              <span>
                Your parking history will appear
                here.
              </span>
            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default UserLanding;