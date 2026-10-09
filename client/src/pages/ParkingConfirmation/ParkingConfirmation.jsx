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
  const [feedbackError, setFeedbackError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userType =
    sessionStorage.getItem("selectedUserType") || "Guest";

  const handleDone = async () => {
    if (rating < 1 || rating > 5) {
      setFeedbackError("Please select a star rating before submitting.");
      return;
    }

    setFeedbackError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parkingAreaName: parking.name,
          userType,
          rating,
          comment: comment.trim(),
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setFeedbackError(result.error || "Unable to submit your feedback.");
        return;
      }

      sessionStorage.removeItem("selectedParking");
      navigate("/home");
    } catch {
      setFeedbackError("Unable to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }

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
                aria-pressed={starValue === rating}
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
            maxLength={1000}
            placeholder="Anything you'd like to tell us about this parking area?"
            value={comment}
            onChange={(event) =>
              setComment(event.target.value)
            }
          />
          {feedbackError && (
            <p className="feedback-error" role="alert">
              {feedbackError}
            </p>
          )}

        </section>

        <button
          type="button"
          className="arrival-done"
          onClick={handleDone}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit feedback"}
          <span>→</span>
        </button>

      </main>

    </div>
  );
}

export default ParkingConfirmation;