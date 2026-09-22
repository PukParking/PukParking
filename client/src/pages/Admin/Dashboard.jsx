import "./Dashboard.css";

function Dashboard() {
    return (
        <div className="admin-dashboard">

            <div className="dashboard-header">
                <div>
                    <h1>Dashboard</h1>
                    <p>Welcome back, Admin</p>
                </div>
            </div>

            <div className="dashboard-cards">

                <div className="dashboard-card">
                    <span>Total Parking</span>
                    <h2>120</h2>
                    <p>Registered spaces</p>
                </div>

                <div className="dashboard-card">
                    <span>Available Spaces</span>
                    <h2>78</h2>
                    <p>Currently available</p>
                </div>

                <div className="dashboard-card">
                    <span>Occupied Spaces</span>
                    <h2>42</h2>
                    <p>Currently occupied</p>
                </div>

                <div className="dashboard-card">
                    <span>Total Users</span>
                    <h2>1,245</h2>
                    <p>Registered users</p>
                </div>

            </div>

            <div className="dashboard-section">
                <h2>Parking Overview</h2>

                <div className="parking-overview">

                    {/* Parking Status */}
                    <div className="parking-status">
                        <h3>Overall Parking Status</h3>

                        <div className="status-chart">
                            <div className="chart-circle">
                                <div className="chart-center">
                                    <strong>120</strong>
                                    <span>Total Spaces</span>
                                </div>
                            </div>
                        </div>

                        <div className="status-legend">
                            <div className="legend-item">
                                <span className="legend-dot available"></span>
                                <span>Available</span>
                                <strong>78</strong>
                            </div>

                            <div className="legend-item">
                                <span className="legend-dot occupied"></span>
                                <span>Occupied</span>
                                <strong>42</strong>
                            </div>
                        </div>
                    </div>


                    {/* Parking Areas */}
                    <div className="parking-areas">
                        <h3>Parking Areas</h3>

                        <div className="parking-table">

                            <div className="parking-table-row parking-table-header">
                                <span>Parking Area</span>
                                <span>Total</span>
                                <span>Available</span>
                                <span>Occupied</span>
                            </div>

                            <div className="parking-table-row">
                                <span>Parking A</span>
                                <span>40</span>
                                <span>28</span>
                                <span>12</span>
                            </div>

                            <div className="parking-table-row">
                                <span>Parking B</span>
                                <span>35</span>
                                <span>20</span>
                                <span>15</span>
                            </div>

                            <div className="parking-table-row">
                                <span>Parking C</span>
                                <span>25</span>
                                <span>18</span>
                                <span>7</span>
                            </div>

                            <div className="parking-table-row">
                                <span>Parking D</span>
                                <span>20</span>
                                <span>12</span>
                                <span>8</span>
                            </div>

                        </div>
                    </div>

                </div>
            </div>

            <div className="dashboard-section">
                <h2>Recent Activity</h2>

                <div className="activity-table">

                    <div className="activity-row activity-header">
                        <span>User</span>
                        <span>Action</span>
                        <span>Parking</span>
                        <span>Time</span>
                    </div>

                    <div className="activity-row">
                        <span>Student 001</span>
                        <span>Parked</span>
                        <span>Parking A</span>
                        <span>10:32</span>
                    </div>

                    <div className="activity-row">
                        <span>Staff 014</span>
                        <span>Exited</span>
                        <span>Parking B</span>
                        <span>10:18</span>
                    </div>

                    <div className="activity-row">
                        <span>Student 027</span>
                        <span>Parked</span>
                        <span>Parking C</span>
                        <span>09:54</span>
                    </div>

                </div>
            </div>

        </div>
    );
}

export default Dashboard;