import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Settings.css";

function Settings() {
    const navigate = useNavigate();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sessionError, setSessionError] = useState("");
    const [sessionsRevoked, setSessionsRevoked] = useState(false);
    const [isRevokingSessions, setIsRevokingSessions] = useState(false);

    async function handlePasswordChange(event) {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (newPassword !== confirmPassword) {
            setError("The new passwords do not match.");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch("/api/auth/change-password", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const result = await response.json();

            if (!response.ok) {
                setError(result.error || "Unable to update your password.");
                return;
            }

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setSuccess(result.message);
        } catch {
            setError("Unable to reach the password service. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleRevokeSessions() {
        setSessionError("");
        setIsRevokingSessions(true);

        try {
            const response = await fetch("/api/auth/logout-all", {
                method: "POST",
                credentials: "include",
            });

            if (!response.ok) {
                const result = await response.json();
                setSessionError(result.error || "Unable to sign out all sessions.");
                return;
            }

            setSessionsRevoked(true);
        } catch {
            setSessionError("Unable to reach the session service. Please try again.");
        } finally {
            setIsRevokingSessions(false);
        }
    }

    return (
        <div className="admin-settings">
            <header className="settings-header">
                <h1>Settings</h1>
                <p>Update your administrator account password.</p>
            </header>

            <section className="settings-card" aria-labelledby="password-heading">
                <h2 id="password-heading">Change password</h2>
                <p>
                    Your new password must be at least 15 characters and no
                    more than 72 UTF-8 bytes.
                </p>

                {success ? (
                    <div className="settings-success" role="status">
                        <p>{success}</p>
                        <button
                            type="button"
                            onClick={() => navigate("/admin", { replace: true })}
                        >
                            Continue to sign in
                        </button>
                    </div>
                ) : (
                    <form
                        className="password-change-form"
                        onSubmit={handlePasswordChange}
                    >
                        <label htmlFor="current-password">
                            Current password
                        </label>
                        <input
                            id="current-password"
                            type="password"
                            autoComplete="current-password"
                            value={currentPassword}
                            onChange={(event) => {
                                setCurrentPassword(event.target.value);
                                setError("");
                            }}
                            required
                        />

                        <label htmlFor="new-password">New password</label>
                        <input
                            id="new-password"
                            type="password"
                            autoComplete="new-password"
                            minLength={15}
                            maxLength={72}
                            value={newPassword}
                            onChange={(event) => {
                                setNewPassword(event.target.value);
                                setError("");
                            }}
                            required
                        />

                        <label htmlFor="confirm-password">
                            Confirm new password
                        </label>
                        <input
                            id="confirm-password"
                            type="password"
                            autoComplete="new-password"
                            minLength={15}
                            maxLength={72}
                            value={confirmPassword}
                            onChange={(event) => {
                                setConfirmPassword(event.target.value);
                                setError("");
                            }}
                            required
                        />

                        {error && <p className="settings-error" role="alert">{error}</p>}

                        <button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Updating..." : "Update password"}
                        </button>
                    </form>
                )}
            </section>

            <section className="settings-card" aria-labelledby="sessions-heading">
                <h2 id="sessions-heading">Active sessions</h2>
                <p>
                    Sign out this account on every device. You will need to sign
                    in again.
                </p>
                {sessionsRevoked ? (
                    <div className="settings-success" role="status">
                        <p>All sessions have been signed out.</p>
                        <button
                            type="button"
                            onClick={() => navigate("/admin", { replace: true })}
                        >
                            Continue to sign in
                        </button>
                    </div>
                ) : (
                    <div className="session-revoke-actions">
                        {sessionError && (
                            <p className="settings-error" role="alert">
                                {sessionError}
                            </p>
                        )}
                        <button
                            type="button"
                            className="revoke-sessions-button"
                            onClick={handleRevokeSessions}
                            disabled={isRevokingSessions}
                        >
                            {isRevokingSessions ? "Signing out..." : "Sign out all sessions"}
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
}

export default Settings;