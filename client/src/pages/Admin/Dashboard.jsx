import { useEffect, useState } from "react";
import { fetchAdminParkingAreas, ADMIN_TOKEN_KEY } from "../../services/adminApi";
import "./Dashboard.css";
import "./AdminData.css";

function Dashboard() {
  const [parkingAreas, setParkingAreas] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetchAdminParkingAreas(localStorage.getItem(ADMIN_TOKEN_KEY), {
      signal: controller.signal,
    })
      .then(setParkingAreas)
      .catch((loadError) => {
        if (loadError.name !== "AbortError") setError(loadError.message);
      });
    return () => controller.abort();
  }, []);

  const capacity = parkingAreas.reduce(
    (total, area) => total + area.Parking_Area_Capacity,
    0,
  );
  const occupied = parkingAreas.reduce(
    (total, area) => total + area.Parking_Area_Occupied_Spaces,
    0,
  );
  const available = capacity - occupied;
  const activeAreas = parkingAreas.filter(
    (area) => area.Parking_Area_IsActive === 1,
  ).length;

  return (
    <div className="admin-data-page admin-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Live parking occupancy from the PukParking database.</p>
        </div>
      </div>
      {error && <p className="admin-data-error" role="alert">{error}</p>}
      <div className="dashboard-cards">
        <div className="dashboard-card"><span>Parking areas</span><h2>{parkingAreas.length}</h2><p>{activeAreas} active</p></div>
        <div className="dashboard-card"><span>Total capacity</span><h2>{capacity}</h2><p>Registered spaces</p></div>
        <div className="dashboard-card"><span>Occupied spaces</span><h2>{occupied}</h2><p>Current database count</p></div>
        <div className="dashboard-card"><span>Available spaces</span><h2>{available}</h2><p>Capacity minus occupied</p></div>
      </div>
      <section className="admin-data-card">
        <h2>Parking areas</h2>
        {parkingAreas.length === 0 && !error ? (
          <p>Loading parking data...</p>
        ) : (
          <div className="admin-data-table-wrap">
            <table className="admin-data-table">
              <thead><tr><th>Parking area</th><th>Capacity</th><th>Occupied</th><th>Available</th><th>Active</th></tr></thead>
              <tbody>{parkingAreas.map((area) => (
                <tr key={area.Parking_Area_ID}>
                  <td>{area.Parking_Area_Name}</td>
                  <td>{area.Parking_Area_Capacity}</td>
                  <td>{area.Parking_Area_Occupied_Spaces}</td>
                  <td>{area.availableBays}</td>
                  <td>{area.Parking_Area_IsActive ? "Yes" : "No"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
