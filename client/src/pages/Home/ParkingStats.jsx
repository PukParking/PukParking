import { useState } from "react";

import "./ParkingStats.css";
import MenuBar from "../../components/MenuBar";

import logo from "../../assets/pukparking-logo.png";
import carIcon from "../../assets/car-icon.png";
import locationIcon from "../../assets/location-icon.png";

function ParkingStats() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Temporary frontend demonstration data.
  // Replace with backend data during integration.
  const parkingAreas = [
    {
      name: "Parking A",
      availability: 70,
      status: "Available",
    },
    {
      name: "Parking B",
      availability: 35,
      status: "Limited",
    },
    {
      name: "Parking C",
      availability: 55,
      status: "Moderate",
    },
  ];

  return (
    <div className="stats-page">

      <header className="stats-header">

        <img
          src={logo}
          alt="PukParking"
          className="stats-logo"
        />

        <button
          className="stats-menu-button"
          type="button"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

      </header>

      {menuOpen && (
        <MenuBar
          onClose={() => setMenuOpen(false)}
        />
      )}

      <main className="stats-main">

        <div className="stats-title">

          <p>
            PARKING OVERVIEW
          </p>

          <h1>
            Parking Stats
          </h1>

          <span>
            View estimated parking availability across
            selected parking areas.
          </span>

        </div>

        <div className="stats-summary">

          <article>

            <img
              src={carIcon}
              alt=""
            />

            <div>
              <span>
                Parking Areas
              </span>

              <strong>
                {parkingAreas.length}
              </strong>
            </div>

          </article>

          <article>

            <img
              src={locationIcon}
              alt=""
            />

            <div>
              <span>
                Current View
              </span>

              <strong>
                Campus
              </strong>
            </div>

          </article>

          <article>

            <div className="availability-circle">
              %
            </div>

            <div>
              <span>
                Availability
              </span>

              <strong>
                Estimated
              </strong>
            </div>

          </article>

        </div>

        <section className="chart-card">

          <div className="chart-card-heading">

            <div>

              <h2>
                Estimated Availability
              </h2>

              <p>
                Frontend demonstration until live backend
                data is connected.
              </p>

            </div>

            <span>
              Live integration pending
            </span>

          </div>

          <div className="pretty-chart">

            {parkingAreas.map((parking) => (

              <div
                className="pretty-chart-item"
                key={parking.name}
              >

                <div className="bar-value">
                  {parking.availability}%
                </div>

                <div className="bar-track">

                  <div
                    className="pretty-bar"
                    style={{
                      height:
                        `${parking.availability}%`,
                    }}
                  ></div>

                </div>

                <strong>
                  {parking.name}
                </strong>

              </div>

            ))}

          </div>

        </section>

        <section className="stats-parking-grid">

          {parkingAreas.map((parking) => (

            <article
              className="stats-parking-card"
              key={parking.name}
            >

              <div className="parking-card-top">

                <div className="parking-p-icon">
                  P
                </div>

                <span>
                  {parking.status}
                </span>

              </div>

              <h3>
                {parking.name}
              </h3>

              <p>
                Estimated parking availability
              </p>

              <div className="availability-row">

                <strong>
                  {parking.availability}%
                </strong>

                <div className="availability-track">

                  <div
                    style={{
                      width:
                        `${parking.availability}%`,
                    }}
                  ></div>

                </div>

              </div>

            </article>

          ))}

        </section>

      </main>

    </div>
  );
}

export default ParkingStats;