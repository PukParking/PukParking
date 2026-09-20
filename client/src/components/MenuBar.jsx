import { useNavigate } from "react-router-dom";

import "./MenuBar.css";
import logo from "../assets/pukparking-logo.png";

function MenuBar({ onClose }) {
  const navigate = useNavigate();

  const goTo = (path) => {
    onClose();
    navigate(path);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      <div
        className="menu-overlay"
        onClick={onClose}
      ></div>

      <aside className="menu-bar">

        <div className="menu-brand">

          <img
            src={logo}
            alt="PukParking"
          />

          <button
            className="close-menu"
            type="button"
            aria-label="Close menu"
            onClick={onClose}
          >
            ×
          </button>

        </div>

        <div className="menu-heading">
          <span>NAVIGATION</span>
          <h2>Explore PukParking</h2>
        </div>

        <nav className="menu-links">

          <button
            type="button"
            onClick={() => goTo("/home")}
          >
            <span className="menu-number">01</span>

            <div>
              <strong>Home</strong>
              <small>Return to the main screen</small>
            </div>
          </button>

          <button
            type="button"
            onClick={() => goTo("/parking-stats")}
          >
            <span className="menu-number">02</span>

            <div>
              <strong>Parking Stats</strong>
              <small>View parking availability</small>
            </div>
          </button>

          <button
            type="button"
            onClick={() => goTo("/about")}
          >
            <span className="menu-number">03</span>

            <div>
              <strong>About Us</strong>
              <small>Learn about PukParking</small>
            </div>
          </button>

          <button
            type="button"
            onClick={() => goTo("/admin")}
          >
            <span className="menu-number">04</span>

            <div>
              <strong>Admin Login</strong>
              <small>Administration access</small>
            </div>
          </button>

        </nav>

        <div className="menu-footer">
          PARK SMART. CAMPUS READY.
        </div>

      </aside>
    </>
  );
}

export default MenuBar;