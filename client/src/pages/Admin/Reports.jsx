import { useState } from "react";
import "./Reports.css";

function Reports() {

    const [selectedPeriod, setSelectedPeriod] = useState("This Month");
    const [reportPeriod, setReportPeriod] = useState("This Month");
    return (
        <div className="admin-reports">

            {/* Header */}
            <div className="reports-header">
                <div>
                    <h1>Reports</h1>
                    <p>View and monitor PukParking activity and usage.</p>
                </div>
            </div>


            {/* Filters */}
            <div className="reports-filters">

                <div className="filter-group">
                    <label>Report Period</label>

                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                    >
                        <option>Today</option>
                        <option>This Week</option>
                        <option>This Month</option>
                        <option>Last 3 Months</option>
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

                <button
                    className="generate-button"
                    onClick={() => setReportPeriod(selectedPeriod)}
                >
                    Generate Report
                </button>

            </div>


            {/* Summary Cards */}
            <div className="report-cards">

                <div className="report-card">
                    <span>Total Parking Sessions</span>
                    <h2>486</h2>
                    <p>{reportPeriod}</p>
                </div>

                <div className="report-card">
                    <span>Average Occupancy</span>
                    <h2>68%</h2>
                    <p>Across all parking areas</p>
                </div>

                <div className="report-card">
                    <span>Peak Occupancy</span>
                    <h2>92%</h2>
                    <p>10:00 - 12:00</p>
                </div>

                <div className="report-card">
                    <span>Active Users</span>
                    <h2>324</h2>
                    <p>{reportPeriod}</p>
                </div>

            </div>


            {/* Parking Usage */}
            <div className="report-section">

                <div className="section-header">
                    <div>
                        <h2>Parking Usage</h2>
                        <p>Parking activity by area.</p>
                    </div>
                </div>

                <div className="report-table">

                    <div className="report-row report-table-header">
                        <span>Parking Area</span>
                        <span>Total Spaces</span>
                        <span>Sessions</span>
                        <span>Avg. Occupancy</span>
                    </div>

                    <div className="report-row">
                        <span>Parking A</span>
                        <span>40</span>
                        <span>156</span>
                        <span>72%</span>
                    </div>

                    <div className="report-row">
                        <span>Parking B</span>
                        <span>35</span>
                        <span>128</span>
                        <span>68%</span>
                    </div>

                    <div className="report-row">
                        <span>Parking C</span>
                        <span>25</span>
                        <span>112</span>
                        <span>64%</span>
                    </div>

                    <div className="report-row">
                        <span>Parking D</span>
                        <span>20</span>
                        <span>90</span>
                        <span>59%</span>
                    </div>

                </div>

            </div>


            {/* User Activity */}
            <div className="report-section">

                <div className="section-header">
                    <div>
                        <h2>User Activity</h2>
                        <p>Recent user activity across the parking system.</p>
                    </div>
                </div>

                <div className="report-table">

                    <div className="report-row user-report-header">
                        <span>User Type</span>
                        <span>Parking Sessions</span>
                        <span>Average Duration</span>
                        <span>Percentage</span>
                    </div>

                    <div className="report-row">
                        <span>Students</span>
                        <span>298</span>
                        <span>2h 15m</span>
                        <span>61%</span>
                    </div>

                    <div className="report-row">
                        <span>Staff</span>
                        <span>142</span>
                        <span>3h 42m</span>
                        <span>29%</span>
                    </div>

                    <div className="report-row">
                        <span>Guests</span>
                        <span>46</span>
                        <span>1h 35m</span>
                        <span>10%</span>
                    </div>

                </div>

            </div>

        </div>
    );
}

export default Reports;