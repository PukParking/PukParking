import "./RatingsComments.css";

function RatingsComments() {
    return (
        <div className="admin-ratings">

            {/* Header */}
            <div className="ratings-header">
                <div>
                    <h1>Ratings & Comments</h1>
                    <p>View feedback from PukParking users.</p>
                </div>
            </div>


            {/* Filters */}
            <div className="ratings-filters">

                <div className="filter-group">
                    <label>Rating</label>

                    <select>
                        <option>All Ratings</option>
                        <option>5 Stars</option>
                        <option>4 Stars</option>
                        <option>3 Stars</option>
                        <option>2 Stars</option>
                        <option>1 Star</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label>Parking Area</label>

                    <select>
                        <option>All Parking Areas</option>
                        <option>Parking A</option>
                        <option>Parking B</option>
                        <option>Parking C</option>
                        <option>Parking D</option>
                    </select>
                </div>

            </div>


            {/* Summary */}
            <div className="rating-summary">

                <div className="rating-summary-card">
                    <span>Average Rating</span>
                    <h2>4.3</h2>
                    <p>Out of 5 stars</p>
                </div>

                <div className="rating-summary-card">
                    <span>Total Reviews</span>
                    <h2>248</h2>
                    <p>User feedback</p>
                </div>

                <div className="rating-summary-card">
                    <span>5 Star Ratings</span>
                    <h2>142</h2>
                    <p>57% of reviews</p>
                </div>

            </div>


            {/* Reviews */}
            <div className="ratings-section">

                <div className="section-header">
                    <div>
                        <h2>User Feedback</h2>
                        <p>Recent ratings and comments from users.</p>
                    </div>
                </div>

                <div className="ratings-table">

                    <div className="ratings-row ratings-table-header">
                        <span>User</span>
                        <span>Parking Area</span>
                        <span>Rating</span>
                        <span>Comment</span>
                        <span>Date</span>
                    </div>

                    <div className="ratings-row">
                        <span>Student 001</span>
                        <span>Parking A</span>
                        <span className="rating-stars">★★★★★</span>
                        <span>Easy to find parking.</span>
                        <span>15 Sep 2026</span>
                    </div>

                    <div className="ratings-row">
                        <span>Staff 014</span>
                        <span>Parking B</span>
                        <span className="rating-stars">★★★★☆</span>
                        <span>Very useful navigation.</span>
                        <span>14 Sep 2026</span>
                    </div>

                    <div className="ratings-row">
                        <span>Student 027</span>
                        <span>Parking C</span>
                        <span className="rating-stars">★★★☆☆</span>
                        <span>Parking was quite full.</span>
                        <span>13 Sep 2026</span>
                    </div>

                    <div className="ratings-row">
                        <span>Guest 008</span>
                        <span>Parking D</span>
                        <span className="rating-stars">★★★★★</span>
                        <span>Very easy to use.</span>
                        <span>12 Sep 2026</span>
                    </div>

                </div>

            </div>

        </div>
    );
}

export default RatingsComments;