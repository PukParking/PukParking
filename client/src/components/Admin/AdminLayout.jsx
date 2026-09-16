import { Outlet } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";

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