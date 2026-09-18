import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Parking.css";

function UserLanding() {
    const [start, setStart] = useState("");
    const [destination, setDestination] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        if (destination === start) {
            setDestination("");
        }
    }, [start]);

    const handleFind = (e) => {
        e.preventDefault();
        navigate("/parking/navigation", {
            state: {
                start,
                destination
            }
        });

        navigate("/parking/navigation", {
            state: {
                start,
                destination
            }
        });

    };

    return (
        <>
            <div className="logo-header">
                <img src="/Images/logo.jpg" alt="school-logo" />
            </div>

            <div className="location-section">
                <form onSubmit={handleFind}>
                    <h2>Current Location:</h2>

                    <select
                        className="input-box"
                        value={start}
                        required
                        onChange={(e) => setStart(e.target.value)}
                    >
                        <option value="" disabled>
                            Select starting point
                        </option>

                        <option value="Main gate">Main gate</option>
                        <option value="Library">Library</option>
                        <option value="E8">E8</option>
                    </select>

                    <h2>Where to?</h2>

                    <select
                        className="search-box"
                        value={destination}
                        required
                        onChange={(e) => setDestination(e.target.value)}
                    >
                        <option value="" disabled>
                            Select destination point
                        </option>

                        <option
                            value="Main gate"
                            disabled={start === "Main gate"}
                        >
                            Main gate
                        </option>

                        <option
                            value="Library"
                            disabled={start === "Library"}
                        >
                            Library
                        </option>

                        <option
                            value="E8"
                            disabled={start === "E8"}
                        >
                            E8
                        </option>
                    </select>

                    <button
                        type="submit"
                        className="btnFind"
                    >
                        Find
                    </button>
                </form>
            </div>

            <div className="history-section">
                <h2>History</h2>
            </div>
        </>
    );
}

export default UserLanding;