import { useCallback, useEffect, useState } from "react";
import "./Manage.css";

const EMPTY_PARKING = {
    name: "",
    category: "",
    capacity: "",
    buildingId: "",
    latitude: "",
    longitude: "",
};

const EMPTY_BUILDING = {
    name: "",
    code: "",
    latitude: "",
    longitude: "",
};

async function apiRequest(path, { method = "GET", body } = {}) {
    const response = await fetch(`/api/admin${path}`, {
        method,
        credentials: "include",
        headers: body === undefined ? {} : { "Content-Type": "application/json" },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

    if (response.status === 204) {
        return null;
    }

    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error || "The request could not be completed.");
    }

    return result;
}

function toParkingPayload(parking) {
    return {
        name: parking.name,
        category: parking.category,
        capacity: Number(parking.capacity),
        buildingId: parking.buildingId,
        latitude: Number(parking.latitude),
        longitude: Number(parking.longitude),
    };
}

function toBuildingPayload(building) {
    return {
        name: building.name,
        code: building.code,
        latitude: Number(building.latitude),
        longitude: Number(building.longitude),
    };
}

function ParkingFields({ value, onChange, buildings }) {
    const update = (field) => (event) => {
        onChange({ ...value, [field]: event.target.value });
    };

    return (
        <>
            <input
                type="text"
                placeholder="Parking Name"
                value={value.name}
                onChange={update("name")}
                maxLength={120}
                required
            />
            <select
                value={value.category}
                onChange={update("category")}
                required
            >
                <option value="">Select Category</option>
                <option value="Student">Student</option>
                <option value="Staff">Staff</option>
                <option value="Guest">Guest</option>
            </select>
            <input
                type="number"
                placeholder="Capacity"
                value={value.capacity}
                onChange={update("capacity")}
                min="1"
                step="1"
                required
            />
            <select
                value={value.buildingId}
                onChange={update("buildingId")}
                required
                disabled={buildings.length === 0}
            >
                <option value="">Select Building / Block</option>
                {buildings.map((building) => (
                    <option key={building.id} value={building.id}>
                        {building.name} - {building.code}
                    </option>
                ))}
            </select>
            <input
                type="number"
                step="any"
                min="-90"
                max="90"
                placeholder="Parking Latitude"
                value={value.latitude}
                onChange={update("latitude")}
                required
            />
            <input
                type="number"
                step="any"
                min="-180"
                max="180"
                placeholder="Parking Longitude"
                value={value.longitude}
                onChange={update("longitude")}
                required
            />
        </>
    );
}

function BuildingFields({ value, onChange }) {
    const update = (field) => (event) => {
        onChange({ ...value, [field]: event.target.value });
    };

    return (
        <>
            <input
                type="text"
                placeholder="Building Name"
                value={value.name}
                onChange={update("name")}
                maxLength={120}
                required
            />
            <input
                type="text"
                placeholder="Building Code"
                value={value.code}
                onChange={update("code")}
                maxLength={32}
                required
            />
            <input
                type="number"
                step="any"
                min="-90"
                max="90"
                placeholder="Latitude"
                value={value.latitude}
                onChange={update("latitude")}
                required
            />
            <input
                type="number"
                step="any"
                min="-180"
                max="180"
                placeholder="Longitude"
                value={value.longitude}
                onChange={update("longitude")}
                required
            />
        </>
    );
}

function Manage() {
    const [parkings, setParkings] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [addForm, setAddForm] = useState(EMPTY_PARKING);
    const [addBuildingForm, setAddBuildingForm] = useState(EMPTY_BUILDING);
    const [selectedUpdateParking, setSelectedUpdateParking] = useState(null);
    const [selectedDeleteParking, setSelectedDeleteParking] = useState(null);
    const [selectedUpdateBuilding, setSelectedUpdateBuilding] = useState(null);
    const [selectedDeleteBuilding, setSelectedDeleteBuilding] = useState(null);
    const [notice, setNotice] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const loadData = useCallback(async () => {
        setError("");
        const [parkingResult, buildingResult] = await Promise.all([
            apiRequest("/parking-areas"),
            apiRequest("/buildings"),
        ]);
        setParkings(parkingResult.parkingAreas);
        setBuildings(buildingResult.buildings);
    }, []);

    useEffect(() => {
        let isCurrent = true;

        Promise.all([
            apiRequest("/parking-areas"),
            apiRequest("/buildings"),
        ])
            .then(([parkingResult, buildingResult]) => {
                if (isCurrent) {
                    setParkings(parkingResult.parkingAreas);
                    setBuildings(buildingResult.buildings);
                    setError("");
                    setIsLoading(false);
                }
            })
            .catch((requestError) => {
                if (isCurrent) {
                    setError(requestError.message);
                    setIsLoading(false);
                }
            });

        return () => {
            isCurrent = false;
        };
    }, []);

    const performAction = async (action, successMessage) => {
        setIsSaving(true);
        setError("");
        setNotice("");

        try {
            await action();
            await loadData();
            setNotice(successMessage);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddParking = (event) => {
        event.preventDefault();
        void performAction(async () => {
            await apiRequest("/parking-areas", {
                method: "POST",
                body: toParkingPayload(addForm),
            });
            setAddForm(EMPTY_PARKING);
        }, "Parking area added successfully.");
    };

    const handleEditParking = (event) => {
        event.preventDefault();
        if (!selectedUpdateParking) {
            return;
        }

        void performAction(async () => {
            await apiRequest(`/parking-areas/${selectedUpdateParking.id}`, {
                method: "PUT",
                body: toParkingPayload(selectedUpdateParking),
            });
        }, "Parking area updated successfully.");
    };

    const handleDeleteParking = () => {
        if (!selectedDeleteParking) {
            return;
        }

        void performAction(async () => {
            await apiRequest(`/parking-areas/${selectedDeleteParking.id}`, {
                method: "DELETE",
            });
            setSelectedDeleteParking(null);
        }, "Parking area deleted successfully.");
    };

    const handleAddBuilding = (event) => {
        event.preventDefault();
        void performAction(async () => {
            await apiRequest("/buildings", {
                method: "POST",
                body: toBuildingPayload(addBuildingForm),
            });
            setAddBuildingForm(EMPTY_BUILDING);
        }, "Building added successfully.");
    };

    const handleEditBuilding = (event) => {
        event.preventDefault();
        if (!selectedUpdateBuilding) {
            return;
        }

        void performAction(async () => {
            await apiRequest(`/buildings/${selectedUpdateBuilding.id}`, {
                method: "PUT",
                body: toBuildingPayload(selectedUpdateBuilding),
            });
        }, "Building updated successfully.");
    };

    const handleDeleteBuilding = () => {
        if (!selectedDeleteBuilding) {
            return;
        }

        void performAction(async () => {
            await apiRequest(`/buildings/${selectedDeleteBuilding.id}`, {
                method: "DELETE",
            });
            setSelectedDeleteBuilding(null);
        }, "Building deleted successfully.");
    };

    if (isLoading) {
        return (
            <main className="manage-page" aria-live="polite">
                Loading buildings and parking areas...
            </main>
        );
    }

    return (
        <div className="manage-page">
            <h1>Manage</h1>
            {error && <p className="confirmation" role="alert">{error}</p>}
            {notice && <p className="confirmation" role="status">{notice}</p>}

            <h2>Manage Parking</h2>
            <div className="manage-cards">
                <section className="manage-card">
                    <h3>Add Parking</h3>
                    {buildings.length === 0 && (
                        <p>Add a building before adding a parking area.</p>
                    )}
                    <form onSubmit={handleAddParking}>
                        <ParkingFields
                            value={addForm}
                            onChange={setAddForm}
                            buildings={buildings}
                        />
                        <button type="submit" disabled={isSaving || buildings.length === 0}>
                            Add Parking
                        </button>
                    </form>
                </section>

                <section className="manage-card">
                    <h3>Edit Parking</h3>
                    <select
                        value={selectedUpdateParking?.id ?? ""}
                        onChange={(event) => {
                            const parking = parkings.find(
                                (item) => item.id === event.target.value,
                            );
                            setSelectedUpdateParking(
                                parking
                                    ? {
                                        ...parking,
                                        capacity: String(parking.capacity),
                                        buildingId: String(parking.buildingId),
                                        latitude: String(parking.latitude),
                                        longitude: String(parking.longitude),
                                    }
                                    : null,
                            );
                        }}
                    >
                        <option value="">Select Parking</option>
                        {parkings.map((parking) => (
                            <option key={parking.id} value={parking.id}>
                                {parking.name} - {parking.category}
                            </option>
                        ))}
                    </select>
                    {selectedUpdateParking && (
                        <form onSubmit={handleEditParking}>
                            <ParkingFields
                                value={selectedUpdateParking}
                                onChange={setSelectedUpdateParking}
                                buildings={buildings}
                            />
                            <button type="submit" disabled={isSaving}>
                                Save Changes
                            </button>
                        </form>
                    )}
                </section>

                <section className="manage-card">
                    <h3>Delete Parking</h3>
                    <select
                        value={selectedDeleteParking?.id ?? ""}
                        onChange={(event) => {
                            setSelectedDeleteParking(
                                parkings.find(
                                    (item) => item.id === event.target.value,
                                ) ?? null,
                            );
                        }}
                    >
                        <option value="">Select Parking</option>
                        {parkings.map((parking) => (
                            <option key={parking.id} value={parking.id}>
                                {parking.name} - {parking.category}
                            </option>
                        ))}
                    </select>
                    {selectedDeleteParking && (
                        <div className="parking-details">
                            <p><strong>Name:</strong> {selectedDeleteParking.name}</p>
                            <p><strong>Category:</strong> {selectedDeleteParking.category}</p>
                            <p><strong>Capacity:</strong> {selectedDeleteParking.capacity}</p>
                            <p><strong>Location:</strong> {selectedDeleteParking.buildingName}</p>
                            <button
                                className="delete-button"
                                type="button"
                                onClick={handleDeleteParking}
                                disabled={isSaving}
                            >
                                Delete Parking
                            </button>
                        </div>
                    )}
                </section>
            </div>

            <h2 className="building-heading">Manage Buildings</h2>
            <div className="manage-cards">
                <section className="manage-card">
                    <h3>Add Building</h3>
                    <form onSubmit={handleAddBuilding}>
                        <BuildingFields
                            value={addBuildingForm}
                            onChange={setAddBuildingForm}
                        />
                        <button type="submit" disabled={isSaving}>Add Building</button>
                    </form>
                </section>

                <section className="manage-card">
                    <h3>Edit Building</h3>
                    <select
                        value={selectedUpdateBuilding?.id ?? ""}
                        onChange={(event) => {
                            const building = buildings.find(
                                (item) => item.id === event.target.value,
                            );
                            setSelectedUpdateBuilding(
                                building
                                    ? {
                                        ...building,
                                        latitude: String(building.latitude),
                                        longitude: String(building.longitude),
                                    }
                                    : null,
                            );
                        }}
                    >
                        <option value="">Select Building</option>
                        {buildings.map((building) => (
                            <option key={building.id} value={building.id}>
                                {building.name} - {building.code}
                            </option>
                        ))}
                    </select>
                    {selectedUpdateBuilding && (
                        <form onSubmit={handleEditBuilding}>
                            <BuildingFields
                                value={selectedUpdateBuilding}
                                onChange={setSelectedUpdateBuilding}
                            />
                            <button type="submit" disabled={isSaving}>
                                Save Changes
                            </button>
                        </form>
                    )}
                </section>

                <section className="manage-card">
                    <h3>Delete Building</h3>
                    <select
                        value={selectedDeleteBuilding?.id ?? ""}
                        onChange={(event) => {
                            setSelectedDeleteBuilding(
                                buildings.find(
                                    (item) => item.id === event.target.value,
                                ) ?? null,
                            );
                        }}
                    >
                        <option value="">Select Building</option>
                        {buildings.map((building) => (
                            <option key={building.id} value={building.id}>
                                {building.name} - {building.code}
                            </option>
                        ))}
                    </select>
                    {selectedDeleteBuilding && (
                        <div className="parking-details">
                            <p><strong>Name:</strong> {selectedDeleteBuilding.name}</p>
                            <p><strong>Code:</strong> {selectedDeleteBuilding.code}</p>
                            <p><strong>Latitude:</strong> {selectedDeleteBuilding.latitude}</p>
                            <p><strong>Longitude:</strong> {selectedDeleteBuilding.longitude}</p>
                            <button
                                className="delete-button"
                                type="button"
                                onClick={handleDeleteBuilding}
                                disabled={isSaving}
                            >
                                Delete Building
                            </button>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

export default Manage;
