import { normalizeLocation } from "../data/dataUtils";

const directionsBaseUrl = "https://api.mapbox.com/directions/v5/mapbox/walking";

export async function getWalkingRoute(origin, destination, { signal } = {}) {
  const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("The Mapbox access token is not configured.");
  }

  const originCoordinates = normalizeLocation(origin);
  const destinationCoordinates = normalizeLocation(destination);
  if (!originCoordinates || !destinationCoordinates) {
    throw new Error("Walking route coordinates must be [longitude, latitude] pairs.");
  }

  const coordinates = `${originCoordinates.join(",")};${destinationCoordinates.join(",")}`;
  const query = new URLSearchParams({
    access_token: accessToken,
    geometries: "geojson",
    overview: "full",
  });
  const response = await fetch(`${directionsBaseUrl}/${coordinates}?${query}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(`Mapbox directions request failed (${response.status}).`);
  }

  const result = await response.json();
  const route = result.routes?.[0];

  if (!route?.geometry || typeof route.distance !== "number" || typeof route.duration !== "number") {
    throw new Error("Mapbox did not return a walking route for this trip.");
  }

  return {
    geometry: route.geometry,
    distanceMeters: route.distance,
    durationMinutes: Math.round((route.duration / 60) * 10) / 10,
  };
}