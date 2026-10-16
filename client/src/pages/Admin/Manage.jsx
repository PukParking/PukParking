import { useCallback, useEffect, useState } from "react";
import "./Manage.css";
import "./ManageActions.css";

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

const PARKING_CATEGORIES = ["Student", "Staff", "Guest"];

function normalizeParkingCategory(value) {
    const normalizedValue = String(value || "").trim().toLowerCase();

    if (normalizedValue === "visitor") {
        return "Guest";
    }

    return (
        PARKING_CATEGORIES.find(
            (category) => category.toLowerCase() === normalizedValue,
        ) || ""
    );
}

function formatParkingForEdit(parking) {
    return {
        ...parking,
        category: normalizeParkingCategory(parking.category),
        capacity: parking.capacity == null ? "" : String(parking.capacity),
        buildingId: parking.buildingId == null ? "" : String(parking.buildingId),
        latitude: parking.latitude == null ? "" : String(parking.latitude),
        longitude: parking.longitude == null ? "" : String(parking.longitude),
    };
}

function formatBuildingForEdit(building) {
    return {
        ...building,
        latitude: building.latitude == null ? "" : String(building.latitude),
        longitude: building.longitude == null ? "" : String(building.longitude),
    };
}

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

function ParkingFields({ value, onChange, buildings, showLabels = false }) {
    const update = (field) => (event) => {
        onChange({ ...value, [field]: event.target.value });
    };

    return (
        <>
            <div className="manage-field">
                {showLabels && <label htmlFor="parking-name">Parking Name</label>}
                <input
                    id={showLabels ? "parking-name" : undefined}
                    type="text"
                    placeholder="Parking Name"
                    value={value.name}
                    onChange={update("name")}
                    maxLength={120}
                    required
                />
            </div>

            <div className="manage-field">
                {showLabels && <label htmlFor="parking-category">Category</label>}
                <select
                    id={showLabels ? "parking-category" : undefined}
                    value={value.category}
                    onChange={update("category")}
                    required
                >
                    <option value="">Select Category</option>
                    {PARKING_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                            {category}
                        </option>
                    ))}
                </select>
            </div>

            <div className="manage-field">
                {showLabels && <label htmlFor="parking-capacity">Capacity</label>}
                <input
                    id={showLabels ? "parking-capacity" : undefined}
                    type="number"
                    placeholder="Capacity"
                    value={value.capacity}
                    onChange={update("capacity")}
                    min="1"
                    step="1"
                    required
                />
            </div>

            <div className="manage-field">
                {showLabels && (
                    <label htmlFor="parking-building">Building / Block</label>
                )}
                <select
                    id={showLabels ? "parking-building" : undefined}
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
            </div>

            <div className="manage-field">
                {showLabels && <label htmlFor="parking-latitude">Latitude</label>}
                <input
                    id={showLabels ? "parking-latitude" : undefined}
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    placeholder="Parking Latitude"
                    value={value.latitude}
                    onChange={update("latitude")}
                    required
                />
            </div>

            <div className="manage-field">
                {showLabels && <label htmlFor="parking-longitude">Longitude</label>}
                <input
                    id={showLabels ? "parking-longitude" : undefined}
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    placeholder="Parking Longitude"
                    value={value.longitude}
                    onChange={update("longitude")}
                    required
                />
            </div>
        </>
    );
}

function BuildingFields({ value, onChange, showLabels = false }) {
    const update = (field) => (event) => {
        onChange({ ...value, [field]: event.target.value });
    };

    return (
        <>
            <div className="manage-field">
                {showLabels && <label htmlFor="building-name">Building Name</label>}
                <input
                    id={showLabels ? "building-name" : undefined}
                    type="text"
                    placeholder="Building Name"
                    value={value.name}
                    onChange={update("name")}
                    maxLength={120}
                    required
                />
            </div>

            <div className="manage-field">
                {showLabels && <label htmlFor="building-code">Building Code</label>}
                <input
                    id={showLabels ? "building-code" : undefined}
                    type="text"
                    placeholder="Building Code"
                    value={value.code}
                    onChange={update("code")}
                    maxLength={32}
                    required
                />
            </div>

            <div className="manage-field">
                {showLabels && <label htmlFor="building-latitude">Latitude</label>}
                <input
                    id={showLabels ? "building-latitude" : undefined}
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    placeholder="Latitude"
                    value={value.latitude}
                    onChange={update("latitude")}
                    required
                />
            </div>

            <div className="manage-field">
                {showLabels && <label htmlFor="building-longitude">Longitude</label>}
                <input
                    id={showLabels ? "building-longitude" : undefined}
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    placeholder="Longitude"
                    value={value.longitude}
                    onChange={update("longitude")}
                    required
                />
            </div>
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
    const [deleteConfirmation, setDeleteConfirmation] = useState(null);
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

    const clearMessages = () => {
        setError("");
        setNotice("");
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

    const handleCancelAddParking = () => {
        setAddForm(EMPTY_PARKING);
        clearMessages();
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

    const handleCancelEditParking = () => {
        setSelectedUpdateParking(null);
        clearMessages();
    };

    const handleDeleteParking = () => {
        if (!selectedDeleteParking) {
            return;
        }

        setDeleteConfirmation({
            type: "parking",
            id: selectedDeleteParking.id,
            name: selectedDeleteParking.name,
        });

        clearMessages();
    };

    const handleCancelDeleteParking = () => {
        setSelectedDeleteParking(null);
        setDeleteConfirmation(null);
        clearMessages();
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

    const handleCancelAddBuilding = () => {
        setAddBuildingForm(EMPTY_BUILDING);
        clearMessages();
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

    const handleCancelEditBuilding = () => {
        setSelectedUpdateBuilding(null);
        clearMessages();
    };

    const handleDeleteBuilding = () => {
        if (!selectedDeleteBuilding) {
            return;
        }

        setDeleteConfirmation({
            type: "building",
            id: selectedDeleteBuilding.id,
            name: selectedDeleteBuilding.name,
        });

        clearMessages();
    };

    const handleCancelDeleteBuilding = () => {
        setSelectedDeleteBuilding(null);
        setDeleteConfirmation(null);
        clearMessages();
    };

    const handleCancelDeleteConfirmation = () => {
        if (isSaving || !deleteConfirmation) {
            return;
        }

        if (deleteConfirmation.type === "parking") {
            setSelectedDeleteParking(null);
        } else {
            setSelectedDeleteBuilding(null);
        }

        setDeleteConfirmation(null);
        clearMessages();
    };

    const handleConfirmDelete = () => {
        if (!deleteConfirmation) {
            return;
        }

        const target = deleteConfirmation;
        const isParking = target.type === "parking";

        const path = isParking
            ? `/parking-areas/${target.id}`
            : `/buildings/${target.id}`;

        const successMessage = isParking
            ? "Parking area deleted successfully."
            : "Building deleted successfully.";

        void performAction(async () => {
            await apiRequest(path, {
                method: "DELETE",
            });

            if (isParking) {
                setSelectedDeleteParking(null);
            } else {
                setSelectedDeleteBuilding(null);
            }

            setDeleteConfirmation(null);
        }, successMessage);
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
                        <div className="manage-form-actions">
                            <button
                                className="manage-cancel-button"
                                type="button"
                                onClick={handleCancelAddParking}
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving || buildings.length === 0}
                            >
                                Add Parking
                            </button>
                        </div>
                    </form>
                </section>

                <section className="manage-card">
                    <h3>Edit Parking</h3>
                    <div className="manage-selector-field">
                        <label htmlFor="parking-to-edit">Parking area to edit</label>
                        <select
                            id="parking-to-edit"
                            value={selectedUpdateParking?.id ?? ""}
                            onChange={(event) => {
                                const parking = parkings.find(
                                    (item) => item.id === event.target.value,
                                );
                                setSelectedUpdateParking(
                                    parking ? formatParkingForEdit(parking) : null,
                                );
                                clearMessages();
                            }}
                        >
                            <option value="">Select Parking</option>
                            {parkings.map((parking) => (
                                <option key={parking.id} value={parking.id}>
                                    {parking.name} - {parking.category}
                                </option>
                            ))}
                        </select>
                    </div>
                    {selectedUpdateParking && (
                        <form onSubmit={handleEditParking}>
                            <ParkingFields
                                value={selectedUpdateParking}
                                onChange={setSelectedUpdateParking}
                                buildings={buildings}
                                showLabels
                            />
                            <div className="manage-form-actions">
                                <button
                                    className="manage-cancel-button"
                                    type="button"
                                    onClick={handleCancelEditParking}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSaving}>
                                    Save Changes
                                </button>
                            </div>
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
                            setDeleteConfirmation(null);
                            clearMessages();
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
                            <div className="manage-delete-actions">
                                <button
                                    className="manage-cancel-button"
                                    type="button"
                                    onClick={handleCancelDeleteParking}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="delete-button"
                                    type="button"
                                    onClick={handleDeleteParking}
                                    disabled={isSaving}
                                >
                                    Delete Parking
                                </button>
                            </div>
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
                        <div className="manage-form-actions">
                            <button
                                className="manage-cancel-button"
                                type="button"
                                onClick={handleCancelAddBuilding}
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                            <button type="submit" disabled={isSaving}>
                                Add Building
                            </button>
                        </div>
                    </form>
                </section>

                <section className="manage-card">
                    <h3>Edit Building</h3>
                    <div className="manage-selector-field">
                        <label htmlFor="building-to-edit">Building to edit</label>
                        <select
                            id="building-to-edit"
                            value={selectedUpdateBuilding?.id ?? ""}
                            onChange={(event) => {
                                const building = buildings.find(
                                    (item) => item.id === event.target.value,
                                );
                                setSelectedUpdateBuilding(
                                    building ? formatBuildingForEdit(building) : null,
                                );
                                clearMessages();
                            }}
                        >
                            <option value="">Select Building</option>
                            {buildings.map((building) => (
                                <option key={building.id} value={building.id}>
                                    {building.name} - {building.code}
                                </option>
                            ))}
                        </select>
                    </div>
                    {selectedUpdateBuilding && (
                        <form onSubmit={handleEditBuilding}>
                            <BuildingFields
                                value={selectedUpdateBuilding}
                                onChange={setSelectedUpdateBuilding}
                                showLabels
                            />
                            <div className="manage-form-actions">
                                <button
                                    className="manage-cancel-button"
                                    type="button"
                                    onClick={handleCancelEditBuilding}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSaving}>
                                    Save Changes
                                </button>
                            </div>
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
                            setDeleteConfirmation(null);
                            clearMessages();
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
                            <div className="manage-delete-actions">
                                <button
                                    className="manage-cancel-button"
                                    type="button"
                                    onClick={handleCancelDeleteBuilding}
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="delete-button"
                                    type="button"
                                    onClick={handleDeleteBuilding}
                                    disabled={isSaving}
                                >
                                    Delete Building
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>

            {deleteConfirmation && (
                <div className="manage-modal-backdrop">
                    <div
                        className="manage-confirm-dialog"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="manage-delete-title"
                        aria-describedby="manage-delete-description"
                    >
                        <div className="manage-confirm-icon" aria-hidden="true">
                            !
                        </div>

                        <h2 id="manage-delete-title">Confirm deletion</h2>

                        <p id="manage-delete-description">
                            Are you sure you want to delete{" "}
                            <strong>{deleteConfirmation.name}</strong>?
                        </p>

                        <p className="manage-confirm-warning">
                            This action cannot be undone.
                        </p>

                        <div className="manage-dialog-actions">
                            <button
                                className="manage-dialog-cancel-button"
                                type="button"
                                onClick={handleCancelDeleteConfirmation}
                                disabled={isSaving}
                            >
                                Cancel
                            </button>

                            <button
                                className="manage-confirm-delete-button"
                                type="button"
                                onClick={handleConfirmDelete}
                                disabled={isSaving}
                            >
                                {isSaving
                                    ? "Deleting..."
                                    : deleteConfirmation.type === "parking"
                                      ? "Delete Parking"
                                      : "Delete Building"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Manage;
