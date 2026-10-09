import { useEffect, useState } from "react";
import "./RatingsComments.css";

const EMPTY_SUMMARY = {
    averageRating: null,
    totalReviews: 0,
    fiveStarRatings: 0,
};

function formatDate(value) {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

function RatingsComments() {
    const [ratingFilter, setRatingFilter] = useState("");
    const [areaFilter, setAreaFilter] = useState("");
    const [summary, setSummary] = useState(EMPTY_SUMMARY);
    const [parkingAreas, setParkingAreas] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isCurrent = true;
        const params = new URLSearchParams();
        if (ratingFilter) params.set("rating", ratingFilter);
        if (areaFilter) params.set("parkingArea", areaFilter);
        const query = params.size ? `?${params.toString()}` : "";

        fetch(`/api/admin/feedback${query}`, { credentials: "include" })
            .then(async (response) => {
                const result = await response.json();
                if (!response.ok) {
                    throw new Error(
                        result.error || "Unable to load user feedback.",
                    );
                }
                return result;
            })
            .then((result) => {
                if (!isCurrent) return;
                setSummary(result.summary);
                setParkingAreas(result.parkingAreas);
                setFeedback(result.feedback);
                setError("");
            })
            .catch((requestError) => {
                if (isCurrent) setError(requestError.message);
            })
            .finally(() => {
                if (isCurrent) setIsLoading(false);
            });

        return () => {
            isCurrent = false;
        };
    }, [ratingFilter, areaFilter]);

    return (
        <div className="admin-ratings">
            <div className="ratings-header">
                <div>
                    <h1>Ratings &amp; Comments</h1>
                    <p>
                        Anonymous feedback submitted after a parking journey.
                    </p>
                </div>
            </div>

            <div className="ratings-filters">
                <div className="filter-group">
                    <label htmlFor="rating-filter">Rating</label>
                    <select
                        id="rating-filter"
                        value={ratingFilter}
                        onChange={(event) => {
                            setIsLoading(true);
                            setRatingFilter(event.target.value);
                        }}
                    >
                        <option value="">All ratings</option>
                        {[5, 4, 3, 2, 1].map((value) => (
                            <option key={value} value={String(value)}>
                                {value} {value === 1 ? "star" : "stars"}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label htmlFor="feedback-area-filter">Parking area</label>
                    <select
                        id="feedback-area-filter"
                        value={areaFilter}
                        onChange={(event) => {
                            setIsLoading(true);
                            setAreaFilter(event.target.value);
                        }}
                    >
                        <option value="">All parking areas</option>
                        {parkingAreas.map((area) => (
                            <option key={area} value={area}>{area}</option>
                        ))}
                    </select>
                </div>
            </div>

            {error && <p className="ratings-message ratings-error" role="alert">{error}</p>}
            {!error && (
                <>
                    <div className="rating-summary">
                        <div className="rating-summary-card">
                            <span>Average Rating</span>
                            <h2>
                                {summary.averageRating === null
                                    ? "—"
                                    : summary.averageRating}
                            </h2>
                            <p>Out of 5 stars</p>
                        </div>
                        <div className="rating-summary-card">
                            <span>Total Reviews</span>
                            <h2>{summary.totalReviews}</h2>
                            <p>Matching feedback submissions</p>
                        </div>
                        <div className="rating-summary-card">
                            <span>5 Star Ratings</span>
                            <h2>{summary.fiveStarRatings}</h2>
                            <p>Matching submissions</p>
                        </div>
                    </div>

                    <div className="ratings-section">
                        <div className="section-header">
                            <div>
                                <h2>User Feedback</h2>
                                <p>
                                    Names, email addresses, and account
                                    identifiers are not collected.
                                </p>
                            </div>
                        </div>

                        {isLoading ? (
                            <p className="ratings-message" role="status">
                                Loading feedback...
                            </p>
                        ) : feedback.length === 0 ? (
                            <p className="ratings-message">
                                No feedback matches these filters yet.
                            </p>
                        ) : (
                            <div
                                className="ratings-table"
                                role="table"
                                aria-label="Anonymous user feedback"
                            >
                                <div
                                    className="ratings-row ratings-table-header"
                                    role="row"
                                >
                                    <span role="columnheader">User type</span>
                                    <span role="columnheader">Parking area</span>
                                    <span role="columnheader">Rating</span>
                                    <span role="columnheader">Comment</span>
                                    <span role="columnheader">Submitted</span>
                                </div>
                                {feedback.map((item) => (
                                    <div
                                        className="ratings-row"
                                        role="row"
                                        key={item.id}
                                    >
                                        <span role="cell">{item.userType}</span>
                                        <span role="cell">{item.parkingAreaName}</span>
                                        <span
                                            className="rating-stars"
                                            role="cell"
                                            aria-label={`${item.rating} out of 5 stars`}
                                        >
                                            {"★".repeat(item.rating)}
                                            {"☆".repeat(5 - item.rating)}
                                        </span>
                                        <span role="cell" className="feedback-comment">
                                            {item.comment || "No comment"}
                                        </span>
                                        <span role="cell">
                                            {formatDate(item.submittedAt)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default RatingsComments;
