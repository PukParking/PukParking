import { useState } from 'react';
import { API_BASE_URL } from './config';
import './user-parked-confirmation.css';

const fallbackParking = {
  _id: 'demo-parking-b',
  name: 'Parking B',
};

// function that loads the given parking that has been chosen
function loadParking() {
  const stored = sessionStorage.getItem('selectedParking');
  return stored ? JSON.parse(stored) : fallbackParking;
}

export default function UserParkedConfirmation({ onDone }) {
  const [parking] = useState(loadParking);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  function goHome() {
    sessionStorage.removeItem('selectedParking');
    if (onDone) {
      onDone();
    } else {
      window.location.href = 'index.html';
    }
  }

  function handleDone() {
    const feedback = {
      parkingId: parking._id,
      rating: rating > 0 ? rating : null, // null if they skipped rating
      comment: comment.trim(),
    };

    fetch(`${API_BASE_URL}/parking/${parking._id}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback),
    })
      .then(() => {
        goHome();
      })
      .catch((error) => {
        console.error('Could not save parking feedback:', error);
        goHome();
      });
  }

  return (
    <div className="card">
      <div className="logo-circle">LOGO</div>

      <h1>Arrived at {parking.name}!</h1>

      <section className="rating-card">
        <h2>Rate Parking</h2>

        <div className="stars">
          {[1, 2, 3, 4, 5].map((starValue) => (
            <button
              key={starValue}
              className="star"
              type="button"
              aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
              onClick={() => setRating(starValue)}
            >
              {starValue <= rating ? '★' : '☆'}
            </button>
          ))}
        </div>

        <label htmlFor="comment">Comment:</label>
        <textarea
          id="comment"
          rows={4}
          placeholder="Anything you'd like to tell us about this parking area?"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
        />
      </section>

      <button className="btn btn-primary" onClick={handleDone}>
        Done
      </button>
    </div>
  );
}
