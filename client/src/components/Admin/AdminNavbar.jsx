import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import "./AdminNavbar.css";

import logo from "../../assets/pukparking-logo.png";

function AdminNavbar() {
    const [menuOpen, setMenuOpen] = useState(false);

    const navigate = useNavigate();

    const closeMenu = () => {
        setMenuOpen(false);
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

                    </nav>

                    <button
                        className="logout-button"
                        onClick={() => navigate("/home")}
                    >
                        Logout
                    </button>

                </div>
            )}

        </>
    );
}

export default AdminNavbar;