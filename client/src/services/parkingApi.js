import { mockParkingLots } from "../data/mockCampusData";
import { normalizeLocation } from "../data/dataUtils";

const PARKING_AREAS_URL = "http://localhost:3000/api/parking-areas";

function mapParkingArea(area, index) {
  const id =
    area.Parking_Area_ID ??
    area.ID ??
    area.id ??
    area.Parking_Area_Name ??
    `parking-area-${index + 1}`;
  const name = area.Parking_Area_Name ?? area.name ?? "Unnamed parking lot";
  const coordinates = normalizeLocation([
    area.Parking_Area_Longitude ?? area.longitude ?? area.lng,
    area.Parking_Area_Latitude ?? area.latitude ?? area.lat,
  ]);

  if (!coordinates) {
    throw new Error(`Parking area "${name}" has invalid coordinates.`);
  }

  const totalBays = Number(
    area.Total_Bays ?? area.Parking_Area_Capacity ?? area.totalBays ?? 50,
  );
  const occupiedBays = Number(area.Parking_Area_Occupied_Spaces);
  const availableBaysValue =
    area.Available_Bays ??
    area.availableBays ??
    (Number.isFinite(occupiedBays) ? totalBays - occupiedBays : 10);
  const availableBays = Number(availableBaysValue);

  if (
    !Number.isFinite(totalBays) ||
    totalBays < 0 ||
    !Number.isFinite(availableBays) ||
    availableBays < 0
  ) {
    throw new Error(`Parking area "${name}" has invalid bay availability.`);
  }

  const status =
    area.Status ??
    area.status ??
    (availableBays <= 0
      ? "full"
      : availableBays < Math.max(totalBays * 0.2, 5)
        ? "almost_full"
        : "open");

  return {
    id: String(id),
    name: String(name),
    coordinates,
    totalBays,
    availableBays,
    type: String(area.Type ?? area.Parking_Type ?? area.type ?? "student").toLowerCase(),
    accessGate:
      area.Parking_Area_Restrictions ?? area.accessGate ?? "Campus entrance",
    status: String(status).toLowerCase(),
  };
}

export async function fetchParkingAreas({ signal } = {}) {
  try {
    const response = await fetch(PARKING_AREAS_URL, { signal });
    if (!response.ok) {
      throw new Error(`Parking API returned HTTP ${response.status}.`);
    }

    const areas = await response.json();
    if (!Array.isArray(areas)) {
      throw new Error("Parking API response must be a JSON array.");
    }

    return areas.map(mapParkingArea);
  } catch (error) {
    if (error.name === "AbortError") {
      throw error;
    }

    console.warn("Unable to load live parking areas; using campus demo data.", error);
    return mockParkingLots;
  }
}
