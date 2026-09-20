import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Home.css";
import MenuBar from "../../components/MenuBar";

import logo from "../../assets/pukparking-logo.png";
import nwuParking from "../../assets/nwu-parking.png";
import carIcon from "../../assets/car-icon.png";
import locationIcon from "../../assets/location-icon.png";
import staffIcon from "../../assets/staff-icon.png";
import studentIcon from "../../assets/student-icon.png";
import guestIcon from "../../assets/guest-icon.png";

function Home() {
  const [selectedUserType, setSelectedUserType] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const featuresRef = useRef(null);

  const selectUserType = (userType) => {
    setSelectedUserType(userType);
  };

  const showMore = () => {
    featuresRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const handleContinue = () => {
    alert(
      `Continue as ${selectedUserType} will be connected to the User Landing Page during integration.`
    );
  };

  return (
    <div className="home-page">
      <header className="main-header">
        <div className="brand-area">
          <img
            src={logo}
            alt="PukParking Logo"
            className="main-logo"
          />
        </div>

        <button
          className="hamburger-button"
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
        <MenuBar onClose={() => setMenuOpen(false)} />
      )}

      <main>
        <section className="hero-section">
          <div className="hero-glow hero-glow-left"></div>
          <div className="hero-glow hero-glow-right"></div>

          <p className="hero-eyebrow">
            PARK SMARTER
          </p>

          <h1>
            WELCOME TO{" "}
            <span>PUKPARKING</span>
          </h1>

          <p className="hero-introduction">
            PukParking helps students, staff and visitors at the
            NWU Potchefstroom Campus find suitable parking for
            their selected destination.
          </p>

          <div className="hero-content">
            <div className="parking-photo-card">
              <img
                src={nwuParking}
                alt="NWU campus parking"
                className="nwu-parking-image"
              />

              <div className="photo-label">
                NWU Potchefstroom Campus
              </div>
            </div>

            <div className="hero-features">
              <div className="hero-feature">
                <div className="feature-icon-box">
                  <img src={carIcon} alt="" />
                </div>

                <div>
                  <strong>
                    Find suitable parking
                  </strong>

                  <p>
                    Discover parking areas near your selected
                    destination.
                  </p>
                </div>
              </div>

              <div className="hero-feature">
                <div className="feature-icon-box">
                  <img src={locationIcon} alt="" />
                </div>

                <div>
                  <strong>
                    Navigate with confidence
                  </strong>

                  <p>
                    Locate suitable parking and continue towards
                    your campus destination.
                  </p>
                </div>
              </div>

              <div className="hero-feature">
                <div className="feature-icon-box mini-group-icon">
                  <img src={guestIcon} alt="" />
                </div>

                <div>
                  <strong>
                    Designed for campus users
                  </strong>

                  <p>
                    Built for students, staff and visitors.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            className="more-button"
            type="button"
            onClick={showMore}
          >
            More
            <span>→</span>
          </button>
        </section>

        <section className="user-type-section">
          <p className="section-eyebrow">
            GET STARTED
          </p>

          <h2>
            SELECT USER TYPE
          </h2>

          <p className="section-description">
            Select the category that applies to you before
            continuing with parking services.
          </p>

          <div className="user-type-grid">
            <button
              type="button"
              className={`user-type-card ${selectedUserType === "Staff" ? "selected" : ""
                }`}
              onClick={() => selectUserType("Staff")}
            >
              <img src={staffIcon} alt="Staff" />

              <div>
                <strong>STAFF</strong>
                <span>NWU employees</span>
              </div>
            </button>

            <button
              type="button"
              className={`user-type-card ${selectedUserType === "Student" ? "selected" : ""
                }`}
              onClick={() => selectUserType("Student")}
            >
              <img src={studentIcon} alt="Student" />

              <div>
                <strong>STUDENT</strong>
                <span>NWU students</span>
              </div>
            </button>

            <button
              type="button"
              className={`user-type-card ${selectedUserType === "Guest" ? "selected" : ""
                }`}
              onClick={() => selectUserType("Guest")}
            >
              <img src={guestIcon} alt="Guest" />

              <div>
                <strong>GUEST</strong>
                <span>Visitors and guests</span>
              </div>
            </button>
          </div>

          {selectedUserType && (
            <>
              <div className="selected-user-box">
                <div className="selected-check">
                  ✓
                </div>

                <div>
                  <span>
                    Selected user type
                  </span>

                  <strong>
                    {selectedUserType}
                  </strong>
                </div>
              </div>

              <button
                className="continue-button"
                type="button"
                onClick={() => navigate("/parking")}
              >
                Continue
                <span>→</span>
              </button>
            </>
          )}
        </section>

        <section
          className="why-section"
          ref={featuresRef}
        >
          <div className="why-heading">
            <p className="section-eyebrow">
              WHY PUKPARKING?
            </p>

            <h2>
              A simpler way to park on campus
            </h2>

            <p>
              PukParking brings parking information,
              availability reporting and navigation together
              in one easy-to-use campus application.
            </p>
          </div>

          <div className="why-cards">
            <article className="why-card">
              <img src={carIcon} alt="" />

              <h3>
                Parking Discovery
              </h3>

              <p>
                Search for suitable parking based on your
                campus destination.
              </p>
            </article>

            <article className="why-card">
              <img src={locationIcon} alt="" />

              <h3>
                Smart Navigation
              </h3>

              <p>
                Move from your selected parking area towards
                the destination you need.
              </p>
            </article>

            <article className="why-card">
              <img src={guestIcon} alt="" />

              <h3>
                Crowd Assistance
              </h3>

              <p>
                Parking reports help improve the availability
                information shown to other users.
              </p>
            </article>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <img
          src={logo}
          alt="PukParking"
        />

        <p>
          Smart parking for the NWU Potchefstroom Campus.
        </p>
      </footer>
    </div>
  );
}

export default Home;