import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import "./UserLanding.css";

import logo from "../../assets/pukparking-logo.png";
import carIcon from "../../assets/car-icon.png";
import locationIcon from "../../assets/location-icon.png";

function UserLanding() {
  const navigate = useNavigate();
  const location = useLocation();

  const [start, setStart] = useState("");
  const [destination, setDestination] = useState("");

  const storedUserType =
    sessionStorage.getItem("selectedUserType");

  const selectedUserType =
    location.state?.userType ||
    storedUserType ||
    "Guest";

  const userType =
    selectedUserType.charAt(0).toUpperCase() +
    selectedUserType.slice(1).toLowerCase();

  const welcomeMessages = {
    Student:
      "Find suitable student parking and get to your campus destination with less stress.",

    Staff:
      "Find suitable staff parking and get to your destination quickly and confidently.",

    Guest:
      "Welcome to NWU Potchefstroom Campus. We’ll help you find suitable visitor parking and reach your destination.",
  };

  const welcomeMessage =
    welcomeMessages[userType] ||
    welcomeMessages.Guest;

  useEffect(() => {
    sessionStorage.setItem(
      "selectedUserType",
      userType
    );
  }, [userType]);

  useEffect(() => {
    if (destination === start) {
      setDestination("");
    }
  }, [start, destination]);

  const handleFind = (event) => {
    event.preventDefault();

    navigate("/parking/navigation", {
      state: {
        start,
        destination,
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
                  onChange={(event) =>
                    setStart(event.target.value)
                  }
                >
                  <option
                    value=""
                    disabled
                  >
                    Select starting point
                  </option>

                  <option value="Main gate">
                    Main Gate
                  </option>

                  <option value="Library">
                    Library
                  </option>

                  <option value="E8">
                    E8
                  </option>

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

                  <option
                    value="Main gate"
                    disabled={
                      start === "Main gate"
                    }
                  >
                    Main Gate
                  </option>

                  <option
                    value="Library"
                    disabled={
                      start === "Library"
                    }
                  >
                    Library
                  </option>

                  <option
                    value="E8"
                    disabled={
                      start === "E8"
                    }
                  >
                    E8
                  </option>

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