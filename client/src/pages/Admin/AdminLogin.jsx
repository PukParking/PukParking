import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./AdminLogin.css";

import logo from "../../assets/pukparking-logo.png";

function AdminLogin() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = (e) => {
        e.preventDefault();

        // Temporary login details
        if (
            email === "admin@pukparking.co.za" &&
            password === "admin123"
        ) {
            setError("");
            navigate("/admin/dashboard");
        } else {
            setError("Invalid email or password.");
        }
    };

    return (
        <div className="admin-login-page">

            <header className="admin-login-topbar">

                <img
                    src={logo}
                    alt="PukParking"
                    className="admin-login-logo"
                />

                <button
                    type="button"
                    className="admin-home-button"
                    onClick={() => navigate("/home")}
                >
                    Home
                </button>

            </header>

            <main className="admin-login-main">

                <section className="admin-login-card">

                    <div className="admin-login-header">

                        <h1>
                            Admin Login
                        </h1>

                        <p className="admin-login-description">
                            Sign in to access the PukParking
                            administration dashboard.
                        </p>

                    </div>

                    <form onSubmit={handleLogin}>

                        <div className="login-input-group">

                            <label htmlFor="admin-email">
                                Email
                            </label>

                            <input
                                id="admin-email"
                                type="email"
                                placeholder="Enter admin email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setError("");
                                }}
                                required
                            />

                        </div>

                        <div className="login-input-group">

                            <label htmlFor="admin-password">
                                Password
                            </label>

                            <input
                                id="admin-password"
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError("");
                                }}
                                required
                            />

                        </div>

                        {error && (
                            <p className="login-error">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="login-button"
                        >
                            Login
                            <span>→</span>
                        </button>

                    </form>

                    <p className="admin-login-note">
                        Authorised administrators only
                    </p>

                </section>

            </main>

        </div>
    );
}

export default AdminLogin;