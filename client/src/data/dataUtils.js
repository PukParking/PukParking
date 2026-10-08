export function normalizeCoordinatePair(value) {
  if (Array.isArray(value)) {
    if (value.length !== 2) return null;
    return value.map((coordinate) => Number(coordinate)).filter((coordinate) => Number.isFinite(coordinate));
  }

  if (typeof value === "string") {
    const pieces = value
      .split(/[\s,]+/)
      .map((piece) => piece.trim())
      .filter(Boolean);

    if (pieces.length !== 2) return null;
    return normalizeCoordinatePair(pieces);
  }

  if (value && typeof value === "object") {
    const longitude = value.longitude ?? value.lng ?? value.lon ?? value.x ?? value[0];
    const latitude = value.latitude ?? value.lat ?? value.y ?? value[1];

    return normalizeCoordinatePair([longitude, latitude]);
  }

  return null;
}

export function normalizeLocation(value) {
  const coordinates = normalizeCoordinatePair(value);

  if (!coordinates || coordinates.length !== 2) {
    return null;
  }

  const [longitude, latitude] = coordinates;

  if (
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90
  ) {
    return null;
  }

  return [Number(longitude), Number(latitude)];
}

export function normalizeBuilding(item = {}) {
  const coordinates = normalizeLocation(
    item.coordinates ?? [item.longitude ?? item.lng, item.latitude ?? item.lat],
  ) ?? [0, 0];

  return {
    id: String(item.id ?? item._id ?? item.buildingId ?? item.building_id ?? item.code ?? "building-unknown"),
    name: item.name ?? "Unnamed building",
    code: item.code ?? item.buildingCode ?? "N/A",
    category: item.category ?? item.type ?? "Academic",
    description: item.description ?? "",
    coordinates,
  };
}

export function normalizeParkingLot(item = {}) {
  const coordinates = normalizeLocation(
    item.coordinates ?? [item.longitude ?? item.lng, item.latitude ?? item.lat],
  ) ?? [0, 0];

  const totalBays = Number(
    item.totalBays ?? item.total_bays ?? item.capacity ?? item.maxBays ?? item.total ?? 0,
  );
  const availableBays = Number(
    item.availableBays ?? item.available_bays ?? item.availableSpots ?? item.available_spots ?? 0,
  );

  return {
    id: String(
      item.id ?? item._id ?? item.lotId ?? item.lot_id ?? item.name ?? "lot-unknown",
    ),
    name: item.name ?? "Unnamed parking lot",
    type: String(item.type ?? item.accessType ?? item.category ?? "visitor").toLowerCase(),
    accessGate: item.accessGate ?? item.access_gate ?? item.gate ?? item.entrance ?? "Campus entrance",
    totalBays: Number.isFinite(totalBays) ? totalBays : 0,
    availableBays: Number.isFinite(availableBays) ? availableBays : 0,
    status:
      item.status ??
      (availableBays <= 0 ? "full" : availableBays < Math.max(totalBays * 0.2, 5) ? "almost_full" : "open"),
    coordinates,
  };
}
