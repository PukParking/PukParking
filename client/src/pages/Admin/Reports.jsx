import { useEffect, useState } from "react";
import {
  ADMIN_TOKEN_KEY,
  fetchAdminReports,
} from "../../services/adminApi";
import "./Reports.css";
import "./AdminData.css";

function Reports() {
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetchAdminReports(localStorage.getItem(ADMIN_TOKEN_KEY), {
      signal: controller.signal,
    })
      .then(setReports)
      .catch((loadError) => {
        if (loadError.name !== "AbortError") setError(loadError.message);
      });
    return () => controller.abort();
  }, []);

  return (
    <div className="admin-data-page admin-reports">
      <div className="reports-header">
        <div>
          <h1>Submitted parking-full reports</h1>
          <p>{reports.length} reports recorded in the database.</p>
        </div>
      </div>
      {error && <p className="admin-data-error" role="alert">{error}</p>}
      <section className="admin-data-card">
        <div className="admin-data-table-wrap">
          <table className="admin-data-table">
            <thead><tr><th>Parking area</th><th>Submitted</th><th>Expires</th><th>Report ID</th></tr></thead>
            <tbody>{reports.map((report) => (
              <tr key={report.Report_ID}>
                <td>{report.Parking_Area_Name}</td>
                <td>{report.Report_Submitted_Time}</td>
                <td>{report.Report_Expiry_Time}</td>
                <td>{report.Report_ID}</td>
              </tr>
            ))}</tbody>
          </table>
          {reports.length === 0 && !error && <p>No parking-full reports have been submitted.</p>}
        </div>
      </section>
    </div>
  );
}

export default Reports;
