import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

import "./ParkingConfirmation.css";

import logo from "../../assets/pukparking-logo.png";

const fallbackParking = {
  _id: "demo-parking",
  name: "Selected Parking",
};

function loadParking(routeParking) {
  if (routeParking) {
    return routeParking;
  }

  const stored = sessionStorage.getItem("selectedParking");

  if (!stored) {
    return fallbackParking;
  }

  try {
    return JSON.parse(stored);
  } catch {
    return fallbackParking;
  }
}

function ParkingConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();

  const [parking] = useState(() =>
    loadParking(location.state?.selectedParking)
  );

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const userType =
    sessionStorage.getItem("selectedUserType") || "Guest";

  const handleDone = () => {
    const feedback = {
      parkingId: parking._id,
      parkingName: parking.name,
      rating: rating > 0 ? rating : null,
      comment: comment.trim(),
    };

    sessionStorage.setItem(
      "parkingFeedback",
      JSON.stringify(feedback)
    );

    sessionStorage.removeItem("selectedParking");

    navigate("/home");
  };

  return (
    <div className="arrival-page">

      <main className="arrival-card">

        <img
          src={logo}
          alt="PukParking"
          className="arrival-logo"
        />

        <div className="arrival-check">
          ✓
        </div>

        <p className="arrival-eyebrow">
          YOU HAVE ARRIVED
        </p>

        <h1>
          Arrived at{" "}
          <span>
            {parking.name}
          </span>
        </h1>

        <p className="arrival-message">
          Your parking journey is complete.
          We would appreciate your feedback
          about your parking experience.
        </p>

        <div className="arrival-category">
          {userType} parking journey
        </div>

        <section className="arrival-feedback">

          <div className="arrival-feedback-heading">

            <div>
              <p>
                YOUR FEEDBACK
              </p>

              <h2>
                Rate Parking
              </h2>
            </div>

            {rating > 0 && (
              <span>
                {rating}/5
              </span>
            )}

          </div>

          <div className="arrival-stars">

            {[1, 2, 3, 4, 5].map((starValue) => (

              <button
                key={starValue}
                type="button"
                aria-label={`Rate ${starValue} star${
                  starValue > 1 ? "s" : ""
                }`}
                className={
                  starValue <= rating
                    ? "arrival-star active"
                    : "arrival-star"
                }
                onClick={() => setRating(starValue)}
              >
                ★
              </button>

            ))}

          </div>

          <label htmlFor="parking-comment">
            Comment
          </label>

          <textarea
            id="parking-comment"
            rows="5"
            placeholder="Anything you'd like to tell us about this parking area?"
            value={comment}
            onChange={(event) =>
              setComment(event.target.value)
            }
          />

        </section>

        <button
          type="button"
          className="arrival-done"
          onClick={handleDone}
        >
          Done
          <span>→</span>
        </button>

      </main>

    </div>
  );
}

export default ParkingConfirmation;