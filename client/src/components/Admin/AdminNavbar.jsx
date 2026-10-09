import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import "./AdminNavbar.css";

import logo from "../../assets/pukparking-logo.png";

function AdminNavbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [logoutError, setLogoutError] = useState("");
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const navigate = useNavigate();

    const closeMenu = () => {
        setMenuOpen(false);
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        setLogoutError("");

        try {
            const response = await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
            });

            if (!response.ok) {
                setLogoutError("Unable to sign out. Please try again.");
                return;
            }

            navigate("/admin", { replace: true });
        } catch {
            setLogoutError("Unable to reach the sign-out service.");
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <>
            <header className="admin-navbar">

                <div className="admin-navbar-logo">

                    <img
                        src={logo}
                        alt="PukParking"
                    />

                    <span>ADMIN</span>

                </div>

                <button
                    className="menu-button"
                    type="button"
                    aria-label="Open admin menu"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    {menuOpen ? "✕" : "☰"}
                </button>

            </header>

            {menuOpen && (
                <div className="admin-menu">

                    <nav>

                        <NavLink
                            to="/admin/dashboard"
                            onClick={closeMenu}
                        >
                            Dashboard
                        </NavLink>

                        <NavLink
                            to="/admin/manage"
                            onClick={closeMenu}
                        >
                            Manage
                        </NavLink>

                        <NavLink
                            to="/admin/reports"
                            onClick={closeMenu}
                        >
                            Reports
                        </NavLink>

                        <NavLink
                            to="/admin/ratings"
                            onClick={closeMenu}
                        >
                            Ratings & Comments
                        </NavLink>

                        <NavLink
                            to="/admin/settings"
                            onClick={closeMenu}
                        >
                            Settings
                        </NavLink>

                    </nav>

                    <button
                        className="logout-button"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                    >
                        {isLoggingOut ? "Signing out..." : "Logout"}
                    </button>
                    {logoutError && <p role="alert">{logoutError}</p>}

                </div>
            )}

        </>
    );
}

export default AdminNavbar;