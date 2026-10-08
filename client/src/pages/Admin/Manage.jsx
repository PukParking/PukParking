import { useEffect, useState } from "react";
import {
  ADMIN_TOKEN_KEY,
  fetchAdminParkingAreas,
  updateAdminParkingArea,
} from "../../services/adminApi";
import "./Manage.css";
import "./AdminData.css";

function Manage() {
  const [parkingAreas, setParkingAreas] = useState([]);
  const [draftAvailability, setDraftAvailability] = useState({});
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetchAdminParkingAreas(localStorage.getItem(ADMIN_TOKEN_KEY), {
      signal: controller.signal,
    })
      .then((areas) => {
        setParkingAreas(areas);
        setDraftAvailability(
          Object.fromEntries(
            areas.map((area) => [area.Parking_Area_ID, area.availableBays]),
          ),
        );
      })
      .catch((loadError) => {
        if (loadError.name !== "AbortError") setError(loadError.message);
      });
    return () => controller.abort();
  }, []);

  async function saveAvailability(area) {
    setSavingId(area.Parking_Area_ID);
    setError("");
    setMessage("");
    try {
      const updated = await updateAdminParkingArea(
        area.Parking_Area_ID,
        { availableBays: Number(draftAvailability[area.Parking_Area_ID]) },
        localStorage.getItem(ADMIN_TOKEN_KEY),
      );
      setParkingAreas((current) =>
        current.map((item) =>
          item.Parking_Area_ID === updated.Parking_Area_ID ? updated : item,
        ),
      );
      setDraftAvailability((current) => ({
        ...current,
        [updated.Parking_Area_ID]: updated.availableBays,
      }));
      setMessage(`Updated availability for ${updated.Parking_Area_Name}.`);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSavingId("");
    }
  }

  async function toggleActive(area) {
    setSavingId(area.Parking_Area_ID);
    setError("");
    setMessage("");
    try {
      const updated = await updateAdminParkingArea(
        area.Parking_Area_ID,
        { isActive: area.Parking_Area_IsActive !== 1 },
        localStorage.getItem(ADMIN_TOKEN_KEY),
      );
      setParkingAreas((current) =>
        current.map((item) =>
          item.Parking_Area_ID === updated.Parking_Area_ID ? updated : item,
        ),
      );
      setMessage(`${updated.Parking_Area_Name} is now ${updated.Parking_Area_IsActive ? "active" : "inactive"}.`);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSavingId("");
    }
  }

  return (
    <div className="admin-data-page manage-page">
      <h1>Manage parking areas</h1>
      <p className="admin-data-intro">Update available spaces and control whether a lot appears to parking users.</p>
      {error && <p className="admin-data-error" role="alert">{error}</p>}
      {message && <p className="admin-data-success" role="status">{message}</p>}
      <section className="admin-data-card">
        <div className="admin-data-table-wrap">
          <table className="admin-data-table">
            <thead><tr><th>Parking area</th><th>Occupied</th><th>Capacity</th><th>Available spaces</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{parkingAreas.map((area) => (
              <tr key={area.Parking_Area_ID}>
                <td>{area.Parking_Area_Name}</td>
                <td>{area.Parking_Area_Occupied_Spaces}</td>
                <td>{area.Parking_Area_Capacity}</td>
                <td>
                  <input
                    aria-label={`Available spaces for ${area.Parking_Area_Name}`}
                    type="number"
                    min="0"
                    max={area.Parking_Area_Capacity}
                    value={draftAvailability[area.Parking_Area_ID] ?? area.availableBays}
                    onChange={(event) =>
                      setDraftAvailability((current) => ({
                        ...current,
                        [area.Parking_Area_ID]: event.target.value,
                      }))
                    }
                  />
                </td>
                <td>{area.Parking_Area_IsActive ? "Active" : "Inactive"}</td>
                <td className="admin-data-actions">
                  <button
                    type="button"
                    disabled={savingId === area.Parking_Area_ID}
                    onClick={() => saveAvailability(area)}
                  >
                    Save availability
                  </button>
                  <button
                    type="button"
                    className="admin-data-secondary"
                    disabled={savingId === area.Parking_Area_ID}
                    onClick={() => toggleActive(area)}
                  >
                    {area.Parking_Area_IsActive ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}</tbody>
          </table>
          {parkingAreas.length === 0 && !error && <p>Loading parking areas...</p>}
        </div>
      </section>
    </div>
  );
}

export default Manage;
