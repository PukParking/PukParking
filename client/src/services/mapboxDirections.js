const directionsBaseUrl = "https://api.mapbox.com/directions/v5/mapbox";

export async function getDirectionsRoute(origin, destination, { signal, profile = "walking" } = {}) {
  const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("The Mapbox access token is not configured.");
  }

  const safeProfile = profile === "driving" ? "driving" : "walking";
  const coordinates = `${origin.join(",")};${destination.join(",")}`;
  const query = new URLSearchParams({
    access_token: accessToken,
    geometries: "geojson",
    overview: "full",
  });
  const response = await fetch(`${directionsBaseUrl}/${safeProfile}/${coordinates}?${query}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(`Mapbox directions request failed (${response.status}).`);
  }

  const result = await response.json();
  const route = result.routes?.[0];

  if (!route?.geometry || typeof route.distance !== "number" || typeof route.duration !== "number") {
    throw new Error(`Mapbox did not return a ${safeProfile} route for this trip.`);
  }

  const steps = (route.legs ?? []).flatMap((leg) => (leg.steps ?? []).map((step) => ({
    instruction: step.maneuver?.instruction || "Continue",
    distanceMeters: step.distance,
  })));

  return {
    geometry: route.geometry,
    distanceMeters: route.distance,
    durationMinutes: Math.round((route.duration / 60) * 10) / 10,
    steps,
  };
}

export function getWalkingRoute(origin, destination, options) {
  return getDirectionsRoute(origin, destination, { ...options, profile: "walking" });
}

export function getDrivingRoute(origin, destination, options) {
  return getDirectionsRoute(origin, destination, { ...options, profile: "driving" });
}