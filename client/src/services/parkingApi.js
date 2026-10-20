import { mockBuildings, mockParkingLots } from "../data/mockCampusData";
import { normalizeLocation } from "../data/dataUtils";

const API_BASE_URL = "/api";

function mapBuilding(building, index) {
  const name = building.Building_Name ?? building.name ?? "Unnamed building";
  const coordinates = normalizeLocation([
    building.Building_Longitude ?? building.longitude ?? building.lng,
    building.Building_Latitude ?? building.latitude ?? building.lat,
  ]);

  if (!coordinates) {
    throw new Error(`Building "${name}" has invalid coordinates.`);
  }

  return {
    id: String(building.Building_ID ?? building.id ?? building.code ?? `building-${index + 1}`),
    name: String(name),
    code: String(building.Building_Abbreviation ?? building.code ?? "N/A"),
    description: String(building.Building_Description ?? building.description ?? ""),
    coordinates,
  };
}

function mapParkingArea(area, index) {
  const name = area.Parking_Area_Name ?? area.name ?? "Unnamed parking lot";
  const coordinates = normalizeLocation([
    area.Parking_Area_Longitude ?? area.longitude ?? area.lng,
    area.Parking_Area_Latitude ?? area.latitude ?? area.lat,
  ]);

  if (!coordinates) {
    throw new Error(`Parking area "${name}" has invalid coordinates.`);
  }

  const totalBays = Number(area.Parking_Area_Capacity ?? area.totalBays ?? 50);
  const occupiedBays = Number(area.Parking_Area_Occupied_Spaces);
  const availableBays = Number(
    area.availableBays ??
      (Number.isFinite(occupiedBays)
        ? totalBays - occupiedBays
        : area.available_bays ?? 10),
  );

  if (
    !Number.isFinite(totalBays) ||
    totalBays < 0 ||
    !Number.isFinite(availableBays) ||
    availableBays < 0
  ) {
    throw new Error(`Parking area "${name}" has invalid bay availability.`);
  }

  return {
    id: String(
      area.Parking_Area_ID ??
        area.id ??
        area.Parking_Area_Name ??
        `parking-area-${index + 1}`,
    ),
    name: String(name),
    type: String(area.Parking_Type ?? area.type ?? "student").toLowerCase(),
    totalBays,
    availableBays,
    coordinates,
    status: String(
      area.status ??
        area.Status ??
        (availableBays <= 0
          ? "full"
          : availableBays < Math.max(totalBays * 0.2, 5)
            ? "almost_full"
            : "open"),
    ).toLowerCase(),
    accessGate: area.Parking_Area_Restrictions ?? area.accessGate ?? "Campus entrance",
  };
}

async function fetchList(endpoint, fallback, mapItem, label, signal) {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, { signal });
    if (!response.ok) {
      throw new Error(`${label} API returned HTTP ${response.status}.`);
    }

    const items = await response.json();
    if (!Array.isArray(items)) {
      throw new Error(`${label} API response must be a JSON array.`);
    }
    if (items.length === 0) {
      throw new Error(`${label} API returned no ${label.toLowerCase()}.`);
    }

    return items.map(mapItem);
  } catch (error) {
    if (error.name === "AbortError") {
      throw error;
    }

    console.warn(`Unable to load live ${label.toLowerCase()}; using campus demo data.`, error);
    return fallback;
  }
}

export function fetchBuildings({ signal } = {}) {
  return fetchList("buildings", mockBuildings, mapBuilding, "Buildings", signal);
}

export function fetchParkingAreas({ signal } = {}) {
  return fetchList("parking-areas", mockParkingLots, mapParkingArea, "Parking areas", signal);
}

export async function reportParkingAreaFull(id, { signal } = {}) {
  const response = await fetch(
    `${API_BASE_URL}/parking-areas/${encodeURIComponent(id)}/report-full`,
    { method: "POST", signal },
  );
  if (!response.ok) {
    throw new Error(`Full parking report returned HTTP ${response.status}.`);
  }

  return response.json();
}
