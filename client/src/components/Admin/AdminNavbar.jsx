import { useState } from "react";
import { NavLink } from "react-router-dom";

function AdminNavbar() {
    const [menuOpen, setMenuOpen] = useState(false);

    const closeMenu = () => {
        setMenuOpen(false);
    };

    return (
        <>
            <header className="admin-navbar">

                <div className="admin-navbar-logo">
                    <h2>PukParking</h2>
                    <span>ADMIN</span>
                </div>

                <button
                    className="menu-button"
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

                    <button className="logout-button">
                        Logout
                    </button>

                </div>
            )}
        </>
    );
}

export default AdminNavbar;