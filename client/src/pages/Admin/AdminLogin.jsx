import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./AdminLogin.css";

import logo from "../../assets/pukparking-logo.png";

function AdminLogin() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ email, password }),
            });
            const result = await response.json();

            if (!response.ok) {
                setError(result.error || "Unable to sign in.");
                return;
            }

            navigate("/admin/dashboard");
        } catch {
            setError("Unable to reach the sign-in service. Please try again.");
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