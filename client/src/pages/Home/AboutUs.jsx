import { useState } from "react";

import "./AboutUs.css";
import MenuBar from "../../components/MenuBar";

import logo from "../../assets/pukparking-logo.png";
import nwuParking from "../../assets/nwu-parking.png";
import carIcon from "../../assets/car-icon.png";
import locationIcon from "../../assets/location-icon.png";
import guestIcon from "../../assets/guest-icon.png";

function AboutUs() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="about-page">

      <header className="about-header">

        <img
          src={logo}
          alt="PukParking"
          className="about-main-logo"
        />

        <button
          className="about-menu-button"
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

      <main>

        <section className="about-hero">

          <div className="about-hero-copy">

            <p className="about-label">
              ABOUT PUKPARKING
            </p>

            <h1>
              Making campus parking
              <span> easier.</span>
            </h1>

            <p>
              PukParking is a parking navigation system
              designed for the North-West University
              Potchefstroom Campus.
            </p>

            <p>
              The system assists students, staff and visitors
              in locating suitable parking areas based on their
              destination and parking category.
            </p>

            <div className="about-tag">
              PARK SMART. CAMPUS READY.
            </div>

          </div>

          <div className="about-photo">

            <img
              src={nwuParking}
              alt="NWU campus parking"
            />

            <div>
              NWU POTCHEFSTROOM CAMPUS
            </div>

          </div>

        </section>

        <section className="about-purpose">

          <div className="about-purpose-heading">

            <p>
              OUR PURPOSE
            </p>

            <h2>
              A better parking experience
              for campus users
            </h2>

          </div>

          <div className="about-purpose-grid">

            <article>

              <img
                src={carIcon}
                alt=""
              />

              <h3>
                Find Suitable Parking
              </h3>

              <p>
                Help users identify parking areas suitable
                for their selected campus destination.
              </p>

            </article>

            <article>

              <img
                src={locationIcon}
                alt=""
              />

              <h3>
                Navigate Campus
              </h3>

              <p>
                Support users with parking information and
                navigation towards suitable parking.
              </p>

            </article>

            <article>

              <img
                src={guestIcon}
                alt=""
              />

              <h3>
                Support Everyone
              </h3>

              <p>
                Provide a straightforward experience for
                students, staff and visitors.
              </p>

            </article>

          </div>

        </section>

      </main>

    </div>
  );
}

export default AboutUs;