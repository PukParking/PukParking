import { useEffect, useState } from "react";
import "./Dashboard.css";

const EMPTY_DASHBOARD = {
    summary: {
        totalSpaces: 0,
        availableSpaces: 0,
        occupiedSpaces: 0,
        parkingAreas: 0,
        buildings: 0,
    },
    parkingAreas: [],
};

function Dashboard() {
    const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isCurrent = true;

        fetch("/api/admin/dashboard", { credentials: "include" })
            .then(async (response) => {
                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.error || "Unable to load dashboard.");
                }

                return result;
            })
            .then((result) => {
                if (isCurrent) {
                    setDashboard(result);
                    setError("");
                    setIsLoading(false);
                }
            })
            .catch((requestError) => {
                if (isCurrent) {
                    setError(requestError.message);
                    setIsLoading(false);
                }
            });

        return () => {
            isCurrent = false;
        };
    }, []);

    const { summary, parkingAreas } = dashboard;
    const occupiedPercent = summary.totalSpaces
        ? (summary.occupiedSpaces / summary.totalSpaces) * 100
        : 0;

    return (
        <div className="admin-dashboard">
            <div className="dashboard-header">
                <div>
                    <h1>Dashboard</h1>
                    <p>Live parking availability from the local database.</p>
                </div>
            </div>

            {error && <p className="dashboard-message" role="alert">{error}</p>}
            {isLoading && (
                <p className="dashboard-message" role="status">
                    Loading parking data...
                </p>
            )}

            {!isLoading && !error && (
                <>
                    <div className="dashboard-cards">
                        <div className="dashboard-card">
                            <span>Total Parking Spaces</span>
                            <h2>{summary.totalSpaces}</h2>
                            <p>Across active parking areas</p>
                        </div>
                        <div className="dashboard-card">
                            <span>Available Spaces</span>
                            <h2>{summary.availableSpaces}</h2>
                            <p>Capacity less occupied spaces</p>
                        </div>
                        <div className="dashboard-card">
                            <span>Occupied Spaces</span>
                            <h2>{summary.occupiedSpaces}</h2>
                            <p>Reported as occupied</p>
                        </div>
                        <div className="dashboard-card">
                            <span>Parking Areas / Buildings</span>
                            <h2>{summary.parkingAreas} / {summary.buildings}</h2>
                            <p>Active areas / registered buildings</p>
                        </div>
                    </div>

                    <div className="dashboard-section">
                        <h2>Parking Overview</h2>
                        <div className="parking-overview">
                            <div className="parking-status">
                                <h3>Overall Parking Status</h3>
                                <div className="status-chart">
                                    <div
                                        className="chart-circle"
                                        style={{
                                            background: `conic-gradient(#0877da 0% ${occupiedPercent}%, #24b7ed ${occupiedPercent}% 100%)`,
                                        }}
                                        role="img"
                                        aria-label={`${Math.round(occupiedPercent)} percent of parking spaces occupied`}
                                    >
                                        <div className="chart-center">
                                            <strong>{summary.totalSpaces}</strong>
                                            <span>Total Spaces</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="status-legend">
                                    <div className="legend-item">
                                        <span className="legend-dot available"></span>
                                        <span>Available</span>
                                        <strong>{summary.availableSpaces}</strong>
                                    </div>
                                    <div className="legend-item">
                                        <span className="legend-dot occupied"></span>
                                        <span>Occupied</span>
                                        <strong>{summary.occupiedSpaces}</strong>
                                    </div>
                                </div>
                            </div>

                            <div className="parking-areas">
                                <h3>Parking Areas</h3>
                                <div className="parking-table">
                                    <div className="parking-table-row parking-table-header">
                                        <span>Parking Area</span>
                                        <span>Building</span>
                                        <span>Total</span>
                                        <span>Available</span>
                                        <span>Occupied / Status</span>
                                    </div>
                                    {parkingAreas.map((area) => (
                                        <div className="parking-table-row" key={area.id}>
                                            <span>{area.name}</span>
                                            <span>{area.buildingName || "Unassigned"}</span>
                                            <span>{area.capacity}</span>
                                            <span>{area.available}</span>
                                            <span>
                                                {area.occupied}
                                                {area.isFull ? " (Reported full)" : ""}
                                            </span>
                                        </div>
                                    ))}
                                    {parkingAreas.length === 0 && (
                                        <p className="dashboard-empty">
                                            No active parking areas yet. Add a building and parking area in Manage.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default Dashboard;
