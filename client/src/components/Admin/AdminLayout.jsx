import { Outlet } from "react-router-dom";

import AdminNavbar from "./AdminNavbar";

import "./AdminLayout.css";

function AdminLayout() {
    return (
        <div className="admin-layout">

            <AdminNavbar />

            <main className="admin-content">
                <Outlet />
            </main>

        </div>
    );
}

export default AdminLayout;