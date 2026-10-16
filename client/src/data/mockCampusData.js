import campusFeatures from "./campusFeatures.json";

export const campusCenter = [27.0935, -26.6888];
export const defaultZoom = 16;

export const campusBounds = [
  [27.0860, -26.6930],
  [27.1020, -26.6760],
];

export const campusFeaturesCollection = campusFeatures;
export const campusFeaturesList = campusFeatures.features;

function getBuildingCode(feature) {
  if (feature.properties.code) return feature.properties.code;

  const leadingCode = feature.properties.name.match(/^([A-Z]\d+[A-Z]?|Ratau)\b/i);
  if (leadingCode) return leadingCode[1];

  return feature.properties.name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export const mockBuildings = campusFeaturesList
  .filter((feature) => feature.properties.type === "building")
  .map((feature, index) => ({
    id: `bld-${(feature.properties.code || feature.properties.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}-${index}`,
    name: feature.properties.name,
    code: getBuildingCode(feature),
    category: "Academic",
    description: "",
    coordinates: feature.geometry.coordinates,
  }));

export const mockParkingLots = [
  {
    id: "lot-gate1-visitor",
    name: "Hoffman St / Main Gate Visitors",
    type: "visitor",
    accessGate: "Gate 1 (Hoffman Street)",
    totalBays: 35,
    availableBays: 11,
    status: "open",
    coordinates: [27.0936, -26.6905],
  },
  {
    id: "lot-lovers-lane",
    name: "Lovers' Lane Student Parking",
    type: "student",
    accessGate: "Hoffman / Meyer Street Entrances",
    totalBays: 120,
    availableBays: 18,
    status: "open",
    coordinates: [27.0945, -26.6878],
  },
  {
    id: "lot-library-west",
    name: "Library & E-Block Parking",
    type: "staff",
    accessGate: "Borcherd Street Entrance",
    totalBays: 45,
    availableBays: 4,
    status: "open",
    coordinates: [27.0912, -26.6895],
  },
  {
    id: "lot-wasgoedpen",
    name: "Wasgoedpen Student Parking",
    type: "student",
    accessGate: "Esselen Street Gate",
    totalBays: 160,
    availableBays: 42,
    status: "open",
    coordinates: [27.0950, -26.6918],
  },
  {
    id: "lot-g3-sciences",
    name: "G3 Natural Sciences Lot",
    type: "staff",
    accessGate: "Meyer Street Gate",
    totalBays: 50,
    availableBays: 2,
    status: "almost_full",
    coordinates: [27.0962, -26.6889],
  },
  {
    id: "lot-engineering-north",
    name: "Engineering Complex Parking",
    type: "student",
    accessGate: "Calderbank Avenue Gate",
    totalBays: 90,
    availableBays: 0,
    status: "full",
    coordinates: [27.0948, -26.6822],
  },
];
