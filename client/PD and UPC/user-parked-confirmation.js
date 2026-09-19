// function that reads back the parking area chosen by algorithm on the previous page (saved as a JSON string).
const storedParking = sessionStorage.getItem('selectedParking');

// function which serves as a placeholder, to display data on the page
const fallbackParking = {
  _id: 'demo-parking-b',
  name: 'Parking B',
};

// use the real data if it exists, otherwise fall back to the demo object above.
const parking = storedParking ? JSON.parse(storedParking) : fallbackParking;

// Arrival message is displayed
document.getElementById('arrivedMessage').textContent = `Arrived at ${parking.name}!`;


// defaults the star rating to be 0 stars
let currentRating = 0;

// querySelectorAll('.star') finds every element with class="star"
const starButtons = document.querySelectorAll('.star');

// function that paints/fills the empty stars
function paintStars(rating) {
  starButtons.forEach((starButton, index) => {
    const starValue = index + 1;
    starButton.textContent = starValue <= rating ? '★' : '☆'; // symbols showing filled star and empty star according to UTF-8
  });
}

starButtons.forEach((starButton, index) => {
  starButton.addEventListener('click', () => {
    currentRating = index + 1;
    paintStars(currentRating);
  });
});

const commentBox = document.getElementById('comment');
const doneBtn = document.getElementById('doneBtn');

doneBtn.addEventListener('click', () => {
  const feedback = {
    parkingId: parking._id,
    rating: currentRating > 0 ? currentRating : null, // null if they skipped rating
    comment: commentBox.value.trim(),
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
});

function goHome() {
  sessionStorage.removeItem('selectedParking');
  window.location.href = 'index.html';
}
