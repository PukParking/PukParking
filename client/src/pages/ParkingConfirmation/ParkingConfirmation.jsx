import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './ParkingConfirmation.css';

const fallbackParking = {
    _id: 'demo-parking-b',
    name: 'Parking B',
};

// Function that loads the selected parking
function loadParking() {
    const stored = sessionStorage.getItem('selectedParking');
    return stored ? JSON.parse(stored) : fallbackParking;
}

export default function UserParkedConfirmation({ onDone }) {
    const navigate = useNavigate();
    const [parking] = useState(loadParking);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');

    function goHome() {
        sessionStorage.removeItem('selectedParking');

        if (onDone) {
            navigate('/parking-confirmation');
        } else {
            // Temporary until React Router navigation is connected
            window.location.href = '/home';
        }
    }

    function handleDone() {
        const feedback = {
            parkingId: parking._id,
            rating: rating > 0 ? rating : null,
            comment: comment.trim(),
        };

        // Temporary: save feedback locally until the backend is connected
        sessionStorage.setItem(
            'parkingFeedback',
            JSON.stringify(feedback)
        );

        goHome();
    }

    return (
        <div className="card">

            <div className="logo-circle">
                LOGO
            </div>

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

                <label htmlFor="comment">
                    Comment:
                </label>

                <textarea
                    id="comment"
                    rows={4}
                    placeholder="Anything you'd like to tell us about this parking area?"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                />

            </section>

            <button
                className="btn btn-primary"
                onClick={handleDone}
            >
                Done
            </button>

        </div>
    );
}