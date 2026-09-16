import { useState } from "react";
import "./Manage.css";

function Manage() {
    const [parkings, setParkings] = useState([
        {
            id: 1,
            name: "Parking A",
            category: "Student",
            capacity: 100,
            location: "Building A",
        },
        {
            id: 2,
            name: "Parking B",
            category: "Staff",
            capacity: 50,
            location: "Building B",
        },
        {
            id: 3,
            name: "Parking C",
            category: "Guest",
            capacity: 30,
            location: "Building C",
        },
    ]);

    const [buildings, setBuildings] = useState([
        {
            id: 1,
            name: "Building A",
            code: "BLD-A",
            latitude: "-26.6840",
            longitude: "27.0970",
        },
        {
            id: 2,
            name: "Building B",
            code: "BLD-B",
            latitude: "-26.6850",
            longitude: "27.0980",
        },
        {
            id: 3,
            name: "Building C",
            code: "BLD-C",
            latitude: "-26.6860",
            longitude: "27.0990",
        },
    ]);

    const [addForm, setAddForm] = useState({
        name: "",
        category: "",
        capacity: "",
        location: "",
    });

    const [addBuildingForm, setAddBuildingForm] = useState({
        name: "",
        code: "",
        latitude: "",
        longitude: "",
    });

    const [selectedUpdateParking, setSelectedUpdateParking] = useState(null);
    const [selectedDeleteParking, setSelectedDeleteParking] = useState(null);
    const [selectedUpdateBuilding, setSelectedUpdateBuilding] = useState(null);
    const [selectedDeleteBuilding, setSelectedDeleteBuilding] = useState(null);


    const [addConfirmation, setAddConfirmation] = useState("");
    const [updateConfirmation, setUpdateConfirmation] = useState("");
    const [deleteConfirmation, setDeleteConfirmation] = useState("");
    const [addBuildingConfirmation, setAddBuildingConfirmation] = useState("");
    const [updateBuildingConfirmation, setUpdateBuildingConfirmation] = useState("");
    const [deleteBuildingConfirmation, setDeleteBuildingConfirmation] = useState("");

    const handleAdd = (e) => {
        e.preventDefault();

        const newParking = {
            id: Date.now(),
            ...addForm,
        };

        setParkings([...parkings, newParking]);

        setAddForm({
            name: "",
            category: "",
            capacity: "",
            location: "",
        });

        setAddConfirmation("Parking has been added successfully.");
        setTimeout(() => {
            setAddConfirmation("");
        }, 3000);
    };

    const handleAddBuilding = (e) => {
        e.preventDefault();

        const newBuilding = {
            id: Date.now(),
            ...addBuildingForm,
        };

        setBuildings([...buildings, newBuilding]);

        setAddBuildingForm({
            name: "",
            code: "",
            latitude: "",
            longitude: "",
        });

        setAddBuildingConfirmation(
            "Building has been added successfully."
        );

        setTimeout(() => {
            setAddBuildingConfirmation("");
        }, 3000);
    };

    const handleEdit = (e) => {
        e.preventDefault();

        setParkings(
            parkings.map((parking) =>
                parking.id === selectedUpdateParking.id
                    ? selectedUpdateParking
                    : parking
            )
        );

        setUpdateConfirmation("Parking details have been updated successfully.");
        setTimeout(() => {
            setUpdateConfirmation("");
        }, 3000);
    };

    const handleEditBuilding = (e) => {
        e.preventDefault();

        setBuildings(
            buildings.map((building) =>
                building.id === selectedUpdateBuilding.id
                    ? selectedUpdateBuilding
                    : building
            )
        );

        setUpdateBuildingConfirmation(
            "Building details have been updated successfully."
        );

        setTimeout(() => {
            setUpdateBuildingConfirmation("");
        }, 3000);
    };

    const handleDelete = () => {
        setParkings(
            parkings.filter(
                (parking) => parking.id !== selectedDeleteParking.id
            )
        );

        setSelectedDeleteParking(null);
        setDeleteConfirmation("Parking has been deleted successfully.");
        setTimeout(() => {
            setDeleteConfirmation("");
        }, 3000);
    };

    const handleDeleteBuilding = () => {
        setBuildings(
            buildings.filter(
                (building) =>
                    building.id !== selectedDeleteBuilding.id
            )
        );

        setSelectedDeleteBuilding(null);

        setDeleteBuildingConfirmation(
            "Building has been deleted successfully."
        );

        setTimeout(() => {
            setDeleteBuildingConfirmation("");
        }, 3000);
    };

    return (
        <div className="manage-page">

            <h1>Manage</h1>

            <h2>Manage Parking</h2>

            <div className="manage-cards">

                {/* ADD PARKING */}
                <div className="manage-card">

                    <h3>Add Parking</h3>

                    <form onSubmit={handleAdd}>

                        <input
                            type="text"
                            placeholder="Parking Name"
                            value={addForm.name}
                            onChange={(e) =>
                                setAddForm({
                                    ...addForm,
                                    name: e.target.value,
                                })
                            }
                            required
                        />

                        <select
                            value={addForm.category}
                            onChange={(e) =>
                                setAddForm({
                                    ...addForm,
                                    category: e.target.value,
                                })
                            }
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
                            value={addForm.capacity}
                            onChange={(e) =>
                                setAddForm({
                                    ...addForm,
                                    capacity: e.target.value,
                                })
                            }
                            required
                        />

                        <input
                            type="text"
                            placeholder="Location / Block"
                            value={addForm.location}
                            onChange={(e) =>
                                setAddForm({
                                    ...addForm,
                                    location: e.target.value,
                                })
                            }
                            required
                        />

                        <button type="submit">
                            Add Parking
                        </button>

                    </form>

                    {addConfirmation && (
                        <p className="confirmation">
                            {addConfirmation}
                        </p>
                    )}

                </div>


                {/* EDIT PARKING */}
                <div className="manage-card">

                    <h3>Edit Parking</h3>

                    <select
                        value={selectedUpdateParking?.id || ""}
                        onChange={(e) => {
                            const parking = parkings.find(
                                (p) => p.id === Number(e.target.value)
                            );

                            setSelectedUpdateParking(parking || null);
                            setUpdateConfirmation("");
                        }}
                    >
                        <option value="">
                            Select Parking
                        </option>

                        {parkings.map((parking) => (
                            <option
                                key={parking.id}
                                value={parking.id}
                            >
                                {parking.name} - {parking.category}
                            </option>
                        ))}
                    </select>

                    {selectedUpdateParking && (
                        <form onSubmit={handleEdit}>

                            <input
                                type="text"
                                value={selectedUpdateParking.name}
                                onChange={(e) =>
                                    setSelectedUpdateParking({
                                        ...selectedUpdateParking,
                                        name: e.target.value,
                                    })
                                }
                            />

                            <select
                                value={selectedUpdateParking.category}
                                onChange={(e) =>
                                    setSelectedUpdateParking({
                                        ...selectedUpdateParking,
                                        category: e.target.value,
                                    })
                                }
                            >
                                <option value="Student">Student</option>
                                <option value="Staff">Staff</option>
                                <option value="Guest">Guest</option>
                            </select>

                            <input
                                type="number"
                                value={selectedUpdateParking.capacity}
                                onChange={(e) =>
                                    setSelectedUpdateParking({
                                        ...selectedUpdateParking,
                                        capacity: e.target.value,
                                    })
                                }
                            />

                            <input
                                type="text"
                                value={selectedUpdateParking.location}
                                onChange={(e) =>
                                    setSelectedUpdateParking({
                                        ...selectedUpdateParking,
                                        location: e.target.value,
                                    })
                                }
                            />

                            <button type="submit">
                                Save Changes
                            </button>

                        </form>
                    )}

                    {updateConfirmation && selectedUpdateParking && (
                        <p className="confirmation">
                            {updateConfirmation}
                        </p>
                    )}

                </div>


                {/* DELETE PARKING */}
                <div className="manage-card">

                    <h3>Delete Parking</h3>

                    <select
                        value={selectedDeleteParking?.id || ""}
                        onChange={(e) => {
                            const parking = parkings.find(
                                (p) => p.id === Number(e.target.value)
                            );

                            setSelectedDeleteParking(parking || null);
                            setDeleteConfirmation("");
                        }}
                    >
                        <option value="">
                            Select Parking
                        </option>

                        {parkings.map((parking) => (
                            <option
                                key={parking.id}
                                value={parking.id}
                            >
                                {parking.name} - {parking.category}
                            </option>
                        ))}
                    </select>

                    {selectedDeleteParking && (
                        <div className="parking-details">

                            <p>
                                <strong>Name:</strong>{" "}
                                {selectedDeleteParking.name}
                            </p>

                            <p>
                                <strong>Category:</strong>{" "}
                                {selectedDeleteParking.category}
                            </p>

                            <p>
                                <strong>Capacity:</strong>{" "}
                                {selectedDeleteParking.capacity}
                            </p>

                            <p>
                                <strong>Location:</strong>{" "}
                                {selectedDeleteParking.location}
                            </p>

                            <button
                                className="delete-button"
                                onClick={handleDelete}
                            >
                                Delete Parking
                            </button>

                        </div>
                    )}

                    {deleteConfirmation && selectedDeleteParking === null && (
                        <p className="confirmation">
                            {deleteConfirmation}
                        </p>
                    )}

                </div>

            </div>

            <h2 className="building-heading">
                Manage Buildings
            </h2>

            <div className="manage-cards">

                {/* ADD BUILDING */}
                <div className="manage-card">

                    <h3>Add Building</h3>

                    <form onSubmit={handleAddBuilding}>

                        <input
                            type="text"
                            placeholder="Building Name"
                            value={addBuildingForm.name}
                            onChange={(e) =>
                                setAddBuildingForm({
                                    ...addBuildingForm,
                                    name: e.target.value,
                                })
                            }
                            required
                        />

                        <input
                            type="text"
                            placeholder="Building Code"
                            value={addBuildingForm.code}
                            onChange={(e) =>
                                setAddBuildingForm({
                                    ...addBuildingForm,
                                    code: e.target.value,
                                })
                            }
                            required
                        />

                        <input
                            type="number"
                            step="any"
                            placeholder="Latitude"
                            value={addBuildingForm.latitude}
                            onChange={(e) =>
                                setAddBuildingForm({
                                    ...addBuildingForm,
                                    latitude: e.target.value,
                                })
                            }
                            required
                        />

                        <input
                            type="number"
                            step="any"
                            placeholder="Longitude"
                            value={addBuildingForm.longitude}
                            onChange={(e) =>
                                setAddBuildingForm({
                                    ...addBuildingForm,
                                    longitude: e.target.value,
                                })
                            }
                            required
                        />

                        <button type="submit">
                            Add Building
                        </button>

                    </form>

                    {addBuildingConfirmation && (
                        <p className="confirmation">
                            {addBuildingConfirmation}
                        </p>
                    )}

                </div>


                {/* EDIT BUILDING */}
                <div className="manage-card">

                    <h3>Edit Building</h3>

                    <select
                        value={selectedUpdateBuilding?.id || ""}
                        onChange={(e) => {
                            const building = buildings.find(
                                (b) => b.id === Number(e.target.value)
                            );

                            setSelectedUpdateBuilding(building || null);
                            setUpdateBuildingConfirmation("");
                        }}
                    >
                        <option value="">
                            Select Building
                        </option>

                        {buildings.map((building) => (
                            <option
                                key={building.id}
                                value={building.id}
                            >
                                {building.name} - {building.code}
                            </option>
                        ))}
                    </select>

                    {selectedUpdateBuilding && (
                        <form onSubmit={handleEditBuilding}>

                            <input
                                type="text"
                                value={selectedUpdateBuilding.name}
                                onChange={(e) =>
                                    setSelectedUpdateBuilding({
                                        ...selectedUpdateBuilding,
                                        name: e.target.value,
                                    })
                                }
                            />

                            <input
                                type="text"
                                value={selectedUpdateBuilding.code}
                                onChange={(e) =>
                                    setSelectedUpdateBuilding({
                                        ...selectedUpdateBuilding,
                                        code: e.target.value,
                                    })
                                }
                            />

                            <input
                                type="number"
                                step="any"
                                value={selectedUpdateBuilding.latitude}
                                onChange={(e) =>
                                    setSelectedUpdateBuilding({
                                        ...selectedUpdateBuilding,
                                        latitude: e.target.value,
                                    })
                                }
                            />

                            <input
                                type="number"
                                step="any"
                                value={selectedUpdateBuilding.longitude}
                                onChange={(e) =>
                                    setSelectedUpdateBuilding({
                                        ...selectedUpdateBuilding,
                                        longitude: e.target.value,
                                    })
                                }
                            />

                            <button type="submit">
                                Save Changes
                            </button>

                        </form>
                    )}

                    {updateBuildingConfirmation &&
                        selectedUpdateBuilding && (
                            <p className="confirmation">
                                {updateBuildingConfirmation}
                            </p>
                        )}

                </div>


                {/* DELETE BUILDING */}
                <div className="manage-card">

                    <h3>Delete Building</h3>

                    <select
                        value={selectedDeleteBuilding?.id || ""}
                        onChange={(e) => {
                            const building = buildings.find(
                                (b) => b.id === Number(e.target.value)
                            );

                            setSelectedDeleteBuilding(building || null);
                            setDeleteBuildingConfirmation("");
                        }}
                    >
                        <option value="">
                            Select Building
                        </option>

                        {buildings.map((building) => (
                            <option
                                key={building.id}
                                value={building.id}
                            >
                                {building.name} - {building.code}
                            </option>
                        ))}
                    </select>

                    {selectedDeleteBuilding && (
                        <div className="parking-details">

                            <p>
                                <strong>Name:</strong>{" "}
                                {selectedDeleteBuilding.name}
                            </p>

                            <p>
                                <strong>Code:</strong>{" "}
                                {selectedDeleteBuilding.code}
                            </p>

                            <p>
                                <strong>Latitude:</strong>{" "}
                                {selectedDeleteBuilding.latitude}
                            </p>

                            <p>
                                <strong>Longitude:</strong>{" "}
                                {selectedDeleteBuilding.longitude}
                            </p>

                            <button
                                className="delete-button"
                                onClick={handleDeleteBuilding}
                            >
                                Delete Building
                            </button>

                        </div>
                    )}

                    {deleteBuildingConfirmation &&
                        selectedDeleteBuilding === null && (
                            <p className="confirmation">
                                {deleteBuildingConfirmation}
                            </p>
                        )}

                </div>

            </div>

        </div>
    );
}

export default Manage;