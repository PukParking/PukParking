import { useEffect, useMemo, useState } from "react";

import "./ParkingStats.css";
import MenuBar from "../../components/MenuBar";

import logo from "../../assets/pukparking-logo.png";
import carIcon from "../../assets/car-icon.png";
import locationIcon from "../../assets/location-icon.png";

function ParkingStats() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [parkingAreas, setParkingAreas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadParkingAreas() {
      try {
        setIsLoading(true);
        setLoadError("");

        const response = await fetch(
          "/api/parking/areas",
          {
            signal: controller.signal,
          },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              "Unable to load parking statistics.",
          );
        }

        const areas = Array.isArray(result.parkingAreas)
          ? result.parkingAreas
          : [];

        const formattedAreas = areas.map((area) => {
          const capacity = Number(area.capacity) || 0;
          const available = Number(area.available) || 0;

          const availability =
            capacity > 0
              ? Math.round(
                  (available / capacity) * 100,
                )
              : 0;

          let status = "Available";

          if (
            area.isFull ||
            available <= 0
          ) {
            status = "Full";
          } else if (availability <= 25) {
            status = "Limited";
          } else if (availability <= 50) {
            status = "Moderate";
          }

          return {
            ...area,
            capacity,
            available,
            availability,
            status,
          };
        });

        setParkingAreas(formattedAreas);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(
            "Unable to load parking statistics.",
            error,
          );

          setLoadError(
            error.message ||
              "Unable to load parking statistics.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadParkingAreas();

    return () => controller.abort();
  }, []);

  const overallAvailability = useMemo(() => {
    const totalCapacity = parkingAreas.reduce(
      (total, area) =>
        total + area.capacity,
      0,
    );

    const totalAvailable = parkingAreas.reduce(
      (total, area) =>
        total + area.available,
      0,
    );

    if (totalCapacity === 0) {
      return 0;
    }

    return Math.round(
      (totalAvailable / totalCapacity) * 100,
    );
  }, [parkingAreas]);

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
            View live parking availability across
            campus parking areas.
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
                {isLoading
                  ? "Loading..."
                  : `${overallAvailability}%`}
              </strong>
            </div>

          </article>

        </div>

        <section className="chart-card">

          <div className="chart-card-heading">

            <div>

              <h2>
                Live Availability
              </h2>

              <p>
                Current parking availability based on
                campus parking records.
              </p>

            </div>

            <span>
              Live data
            </span>

          </div>

          {isLoading && (
            <p>
              Loading parking statistics...
            </p>
          )}

          {loadError && (
            <p role="alert">
              {loadError}
            </p>
          )}

          {!isLoading &&
            !loadError &&
            parkingAreas.length === 0 && (
              <p>
                No parking records are currently
                available.
              </p>
            )}

          {!isLoading &&
            !loadError &&
            parkingAreas.length > 0 && (
              <div className="pretty-chart">

                {parkingAreas.map((parking) => (

                  <div
                    className="pretty-chart-item"
                    key={parking.id || parking.name}
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
            )}

        </section>

        {!isLoading &&
          !loadError &&
          parkingAreas.length > 0 && (
            <section className="stats-parking-grid">

              {parkingAreas.map((parking) => (

                <article
                  className="stats-parking-card"
                  key={parking.id || parking.name}
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
                    {parking.available} of{" "}
                    {parking.capacity} bays available
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
          )}

      </main>

    </div>
  );
}

export default ParkingStats;