import { useEffect, useMemo, useState } from "react";
import "./Reports.css";

const EMPTY_SUMMARY = {
    totalSpaces: 0,
    occupiedSpaces: 0,
    availableSpaces: 0,
    parkingAreas: 0,
};

function Reports() {
    const [parkingAreas, setParkingAreas] = useState([]);
    const [selectedAreaId, setSelectedAreaId] = useState("all");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isCurrent = true;

        fetch("/api/admin/dashboard", { credentials: "include" })
            .then(async (response) => {
                const result = await response.json();
                if (!response.ok) {
                    throw new Error(
                        result.error || "Unable to load the parking report.",
                    );
                }
                return result;
            })
            .then((result) => {
                if (isCurrent) {
                    setParkingAreas(result.parkingAreas);
                    setError("");
                }
            })
            .catch((requestError) => {
                if (isCurrent) {
                    setError(requestError.message);
                }
            })
            .finally(() => {
                if (isCurrent) {
                    setIsLoading(false);
                }
            });

        return () => {
            isCurrent = false;
        };
    }, []);

    const visibleAreas = useMemo(
        () => selectedAreaId === "all"
            ? parkingAreas
            : parkingAreas.filter(
                (area) => String(area.id) === selectedAreaId,
            ),
        [parkingAreas, selectedAreaId],
    );

    const summary = useMemo(
        () => visibleAreas.reduce(
            (totals, area) => ({
                totalSpaces: totals.totalSpaces + area.capacity,
                occupiedSpaces: totals.occupiedSpaces + area.occupied,
                availableSpaces: totals.availableSpaces + area.available,
                parkingAreas: totals.parkingAreas + 1,
            }),
            EMPTY_SUMMARY,
        ),
        [visibleAreas],
    );

    return (
        <div className="admin-reports">
            <div className="reports-header">
                <div>
                    <h1>Reports</h1>
                    <p>
                        Current capacity and occupancy for active parking areas.
                    </p>
                </div>
            </div>

            <div className="reports-filters">
                <div className="filter-group">
                    <label htmlFor="report-parking-area">Parking area</label>
                    <select
                        id="report-parking-area"
                        value={selectedAreaId}
                        onChange={(event) => setSelectedAreaId(event.target.value)}
                    >
                        <option value="all">All active parking areas</option>
                        {parkingAreas.map((area) => (
                            <option key={area.id} value={String(area.id)}>
                                {area.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {error && <p className="report-message report-error" role="alert">{error}</p>}
            {isLoading ? (
                <p className="report-message" role="status">
                    Loading parking report...
                </p>
            ) : !error && (
                <>
                    <div className="report-cards">
                        <div className="report-card">
                            <span>Active Parking Areas</span>
                            <h2>{summary.parkingAreas}</h2>
                            <p>Included in this report</p>
                        </div>
                        <div className="report-card">
                            <span>Total Capacity</span>
                            <h2>{summary.totalSpaces}</h2>
                            <p>Parking spaces</p>
                        </div>
                        <div className="report-card">
                            <span>Reported Occupied</span>
                            <h2>{summary.occupiedSpaces}</h2>
                            <p>Current stored occupancy</p>
                        </div>
                        <div className="report-card">
                            <span>Available</span>
                            <h2>{summary.availableSpaces}</h2>
                            <p>Capacity less reported occupancy</p>
                        </div>
                    </div>

                    <div className="report-section">
                        <div className="section-header">
                            <div>
                                <h2>Parking capacity by area</h2>
                                <p>
                                    This is a current snapshot, not historical
                                    session or usage data.
                                </p>
                            </div>
                        </div>

                        {visibleAreas.length === 0 ? (
                            <p className="report-message">
                                {parkingAreas.length === 0
                                    ? "No active parking areas are available to report."
                                    : "No parking area matches this filter."}
                            </p>
                        ) : (
                            <div className="report-table" role="table" aria-label="Parking capacity by area">
                                <div
                                    className="report-row report-table-header"
                                    role="row"
                                >
                                    <span role="columnheader">Parking area</span>
                                    <span role="columnheader">Building</span>
                                    <span role="columnheader">Capacity</span>
                                    <span role="columnheader">Occupied</span>
                                    <span role="columnheader">Available</span>
                                    <span role="columnheader">Occupancy</span>
                                </div>
                                {visibleAreas.map((area) => {
                                    const occupancyPercent = area.capacity
                                        ? Math.round(
                                            (area.occupied / area.capacity) * 100,
                                        )
                                        : 0;

                                    return (
                                        <div
                                            className="report-row"
                                            role="row"
                                            key={area.id}
                                        >
                                            <span role="cell">{area.name}</span>
                                            <span role="cell">
                                                {area.buildingName || "Unassigned"}
                                            </span>
                                            <span role="cell">{area.capacity}</span>
                                            <span role="cell">{area.occupied}</span>
                                            <span role="cell">{area.available}</span>
                                            <span role="cell">{occupancyPercent}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default Reports;
