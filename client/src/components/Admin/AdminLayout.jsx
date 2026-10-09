import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

import AdminNavbar from "./AdminNavbar";

import "./AdminLayout.css";

function AdminLayout() {
    const [status, setStatus] = useState("checking");

    useEffect(() => {
        let isCurrent = true;

        fetch("/api/auth/me", { credentials: "include" })
            .then((response) => {
                if (!isCurrent) {
                    return;
                }

                if (response.status === 401) {
                    setStatus("unauthenticated");
                    return;
                }

                if (!response.ok) {
                    throw new Error("Unable to verify administrator session.");
                }

                setStatus("authenticated");
            })
            .catch(() => {
                if (isCurrent) {
                    setStatus("error");
                }
            });

        return () => {
            isCurrent = false;
        };
    }, []);

    if (status === "unauthenticated") {
        return <Navigate to="/admin" replace />;
    }

    if (status === "error") {
        return (
            <main role="alert">
                Unable to verify your administrator session. Refresh the page
                to try again.
            </main>
        );
    }

    if (status !== "authenticated") {
        return <main aria-live="polite">Checking administrator session...</main>;
    }

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