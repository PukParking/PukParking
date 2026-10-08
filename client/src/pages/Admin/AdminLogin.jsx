import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./AdminLogin.css";

import logo from "../../assets/pukparking-logo.png";
import { ADMIN_TOKEN_KEY, loginAdmin } from "../../services/adminApi";

function AdminLogin() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const result = await loginAdmin(username, password);
            localStorage.setItem(ADMIN_TOKEN_KEY, result.token);
            setError("");
            navigate("/admin/dashboard");
        } catch (loginError) {
            setError(loginError.message || "Unable to sign in.");
        } finally {
            setIsSubmitting(false);
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

                            <label htmlFor="admin-username">
                                Username
                            </label>

                            <input
                                id="admin-username"
                                type="text"
                                autoComplete="username"
                                placeholder="Enter admin username"
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
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
                                autoComplete="current-password"
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
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Signing in..." : "Login"}
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