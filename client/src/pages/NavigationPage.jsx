import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { Link, useLocation, useNavigate } from "react-router-dom";

import {
  campusBounds,
  campusCenter,
  campusFeaturesCollection,
  defaultZoom,
  mockBuildings,
} from "../data/mockCampusData";
import { normalizeLocation } from "../data/dataUtils";
import { getDrivingRoute, getWalkingRoute } from "../services/mapboxDirections";
import "./NavigationPage.css";

const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const CUSTOM_DESTINATION_ID = "custom-destination";
const userCategories = ["Student", "Staff", "Visitor"];

function normalizeLabel(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeCategory(value) {
  const normalizedValue = String(value || "").toLowerCase();
  const category = normalizedValue === "guest" ? "visitor" : normalizedValue;

  return userCategories.find((item) => item.toLowerCase() === category);
}

const FALLBACK_ORIGIN = campusCenter;

function clearRouteLayer(map) {
  ["walking", "driving"].forEach((routeType) => {
    const layerId = `${routeType}-route-line`;
    const sourceId = `${routeType}-route`;

    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }

    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
  });
}

function drawRoute(map, geometry, routeType = "walking") {
  clearRouteLayer(map);

  const sourceId = `${routeType}-route`;
  const layerId = `${routeType}-route-line`;

  if (map.getSource(sourceId)) {
    map.getSource(sourceId).setData({
      type: "Feature",
      properties: {},
      geometry,
    });
    return;
  }

  map.addSource(sourceId, {
    type: "geojson",
    data: {
      type: "Feature",
      properties: {},
      geometry,
    },
  });

  map.addLayer({
    id: layerId,
    type: "line",
    source: sourceId,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-color": routeType === "driving" ? "#f59e0b" : "#1479d1",
      "line-width": 5,
      "line-opacity": 0.9,
    },
  });
}

function addCampusFeatureLayers(map) {
  map.addSource("campus-features", {
    type: "geojson",
    data: campusFeaturesCollection,
  });

  map.addLayer({
    id: "campus-parking-areas",
    type: "fill",
    source: "campus-features",
    filter: [
      "all",
      ["==", ["geometry-type"], "Polygon"],
      ["==", ["get", "type"], "parking"],
    ],
    paint: {
      "fill-color": "#238d76",
      "fill-opacity": 0.22,
    },
  });

  map.addLayer({
    id: "campus-parking-outlines",
    type: "line",
    source: "campus-features",
    filter: [
      "all",
      ["==", ["geometry-type"], "Polygon"],
      ["==", ["get", "type"], "parking"],
    ],
    paint: {
      "line-color": "#19745f",
      "line-width": 2,
    },
  });

  map.addLayer({
    id: "campus-amenities-and-gates",
    type: "circle",
    source: "campus-features",
    filter: [
      "all",
      ["==", ["geometry-type"], "Point"],
      ["in", ["get", "type"], ["literal", ["amenity", "gate"]]],
    ],
    paint: {
      "circle-color": [
        "match",
        ["get", "type"],
        "gate",
        "#6756a5",
        "#d98e2f",
      ],
      "circle-radius": 6,
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 2,
    },
  });

  map.addLayer({
    id: "campus-amenity-and-gate-labels",
    type: "symbol",
    source: "campus-features",
    minzoom: 15,
    filter: [
      "all",
      ["==", ["geometry-type"], "Point"],
      ["in", ["get", "type"], ["literal", ["amenity", "gate"]]],
    ],
    layout: {
      "text-field": ["get", "name"],
      "text-size": 11,
      "text-offset": [0, 1.2],
      "text-anchor": "top",
      "text-optional": true,
    },
    paint: {
      "text-color": "#35413c",
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.5,
    },
  });
}

function getInitialSelection(location, buildings = mockBuildings) {
  const state = location.state || {};
  const searchParams = new URLSearchParams(location.search);
  const category =
    normalizeCategory(state.userType ?? searchParams.get("userType")) || "Student";
  const destinationValue =
    state.destinationId ??
    state.destination?.id ??
    searchParams.get("destinationId") ??
    state.destination ??
    searchParams.get("destination");
  const destinationLabel =
    typeof destinationValue === "string" ? destinationValue : state.destination?.name;
  const normalizedDestination = normalizeLabel(destinationLabel || destinationValue || "");
  const matchedBuilding = buildings.find(
    (building) =>
      normalizeLabel(building.id) === normalizedDestination ||
      normalizeLabel(building.code) === normalizedDestination ||
      normalizeLabel(building.name) === normalizedDestination ||
      (normalizedDestination === "library" &&
        normalizeLabel(building.name).includes(normalizedDestination)),
  );

  if (matchedBuilding) {
    return {
      category,
      destinationId: matchedBuilding.id,
      customDestination: null,
    };
  }

  const queryLongitude =
    searchParams.get("destinationLng") ??
    searchParams.get("destinationLongitude") ??
    searchParams.get("lng") ??
    searchParams.get("longitude");
  const queryLatitude =
    searchParams.get("destinationLat") ??
    searchParams.get("destinationLatitude") ??
    searchParams.get("lat") ??
    searchParams.get("latitude");
  const coordinateValue =
    state.destinationCoordinates ??
    state.destination?.coordinates ??
    (state.destination && typeof state.destination === "object"
      ? state.destination
      : null) ??
    state.coordinates ??
    searchParams.get("destinationCoordinates") ??
    searchParams.get("coordinates") ??
    (queryLongitude && queryLatitude
      ? [queryLongitude, queryLatitude]
      : typeof destinationValue === "string"
        ? destinationValue
        : null);
  const coordinates = normalizeLocation(coordinateValue);

  if (!coordinates) {
    return { category, destinationId: "", customDestination: null };
  }

  const buildingAtCoordinates = buildings.find(
    (building) =>
      building.coordinates[0] === coordinates[0] &&
      building.coordinates[1] === coordinates[1],
  );

  if (buildingAtCoordinates) {
    return {
      category,
      destinationId: buildingAtCoordinates.id,
      customDestination: null,
    };
  }

  return {
    category,
    destinationId: CUSTOM_DESTINATION_ID,
    customDestination: {
      id: CUSTOM_DESTINATION_ID,
      name: destinationLabel || "Selected destination",
      coordinates,
    },
  };
}

function distanceBetween(first, second) {
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const [firstLongitude, firstLatitude] = first;
  const [secondLongitude, secondLatitude] = second;
  const latitudeDelta = radians(secondLatitude - firstLatitude);
  const longitudeDelta = radians(secondLongitude - firstLongitude);
  const latitudeOne = radians(firstLatitude);
  const latitudeTwo = radians(secondLatitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitudeOne) * Math.cos(latitudeTwo) * Math.sin(longitudeDelta / 2) ** 2;

  return 6371000 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function NavigationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [initialSelection] = useState(() => getInitialSelection(location));
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);
  const [category, setCategory] = useState(initialSelection.category);
  const [destinationId, setDestinationId] = useState(initialSelection.destinationId);
  const [customDestination, setCustomDestination] = useState(
    initialSelection.customDestination,
  );
  const [parkingLots, setParkingLots] = useState([]);
  const [parkingLoadError, setParkingLoadError] = useState("");
  const [isLoadingParking, setIsLoadingParking] = useState(true);
  const [isReportingFull, setIsReportingFull] = useState(false);
  const [fullReportError, setFullReportError] = useState("");
  const [route, setRoute] = useState(null);
  const [routePhase, setRoutePhase] = useState("driving");
  const [routeStatus, setRouteStatus] = useState("idle");
  const [routeError, setRouteError] = useState("");
  const [selectedLotId, setSelectedLotId] = useState("");
  const [originCoordinates, setOriginCoordinates] = useState(FALLBACK_ORIGIN);
  const [arrivalDialogOpen, setArrivalDialogOpen] = useState(false);
  const [arrivalError, setArrivalError] = useState("");
  const [isProcessingArrival, setIsProcessingArrival] = useState(false);

  const destination =
    customDestination ||
    mockBuildings.find((building) => building.id === destinationId);

  const resetNavigationForSelection = useCallback(() => {
    setRoutePhase("driving");
    setSelectedLotId("");
    setArrivalDialogOpen(false);
    setArrivalError("");
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      return undefined;
    }

    let isCurrent = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isCurrent) return;
        setOriginCoordinates([
          position.coords.longitude,
          position.coords.latitude,
        ]);
      },
      (error) => {
        if (!isCurrent) return;
        console.warn("Geolocation unavailable; using campus fallback.", error);
        setOriginCoordinates(FALLBACK_ORIGIN);
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 60_000,
      },
    );

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;

    fetch("/api/parking/areas")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Unable to load parking areas.");
        }
        return result;
      })
      .then((result) => {
        if (isCurrent) {
          setParkingLots(
            result.parkingAreas.map((area) => ({
              ...area,
              type: area.category === "Guest"
                ? "visitor"
                : String(area.category || "").toLowerCase(),
              totalBays: area.capacity,
              availableBays: area.available,
              coordinates: area.coordinates,
              accessGate: area.buildingName || "Campus",
              status: area.isFull ? "full" : "open",
            })),
          );
          setParkingLoadError("");
        }
      })
      .catch((requestError) => {
        if (isCurrent) setParkingLoadError(requestError.message);
      })
      .finally(() => {
        if (isCurrent) setIsLoadingParking(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    const nextExpiry = parkingLots
      .map((lot) => lot.fullUntil ? Date.parse(lot.fullUntil) : NaN)
      .filter((expiry) => Number.isFinite(expiry) && expiry > Date.now())
      .sort((first, second) => first - second)[0];

    if (!nextExpiry) return undefined;

    const timeout = setTimeout(async () => {
      try {
        const response = await fetch("/api/parking/areas");
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Unable to refresh parking availability.");
        }
        setParkingLots(
          result.parkingAreas.map((area) => ({
            ...area,
            type: area.category === "Guest"
              ? "visitor"
              : String(area.category || "").toLowerCase(),
            totalBays: area.capacity,
            availableBays: area.available,
            accessGate: area.buildingName || "Campus",
            status: area.isFull ? "full" : "open",
          })),
        );
      } catch (error) {
        setParkingLoadError(error.message);
      }
    }, Math.max(0, nextExpiry - Date.now() + 250));

    return () => clearTimeout(timeout);
  }, [parkingLots]);

  const availableLots = useMemo(
    () =>
      parkingLots
        .filter(
          (lot) =>
            lot.type === category.toLowerCase() &&
            lot.availableBays > 0 &&
            !lot.isFull,
        )
        .sort((first, second) =>
          destination
            ? distanceBetween(first.coordinates, destination.coordinates) -
              distanceBetween(second.coordinates, destination.coordinates)
            : 0,
        ),
    [category, destination, parkingLots],
  );
  const recommendedLot = destination ? availableLots[0] : undefined;
  const activeLot =
    routePhase === "walking" && selectedLotId
      ? parkingLots.find((lot) => lot.id === selectedLotId) || recommendedLot
      : recommendedLot;

  useEffect(() => {
    if (!mapContainerRef.current || !accessToken) return undefined;

    mapboxgl.accessToken = accessToken;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: campusCenter,
      zoom: defaultZoom,
      maxBounds: campusBounds,
    });

    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
    });
    map.addControl(geolocate, "top-right");
    geolocate.on("error", (event) => {
      const code = event?.code ?? event?.error?.code;
      const permissionDenied =
        code === "PERMISSION_DENIED" || code === 1 || event?.error?.message?.toLowerCase().includes("permission");

      if (permissionDenied) {
        console.warn("User denied geolocation access for navigation.");
        return;
      }

      console.error("Geolocation error:", event?.error ?? event);
    });

    map.on("error", (event) => {
      const error = event.error;
      const message =
        error?.message?.replace(/([?&]access_token=)[^&\s]+/g, "$1[redacted]") ||
        "Unknown Mapbox error.";

      console.error("Mapbox error:", {
        code: error?.code,
        message,
        status: error?.status ?? event.status,
        statusText: error?.statusText,
      });
    });
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.on("style.load", () => {
      addCampusFeatureLayers(map);
      map.fitBounds(campusBounds, {
        padding: 40,
        maxZoom: defaultZoom,
      });
      setMapReady(true);
    });
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      clearRouteLayer(map);
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    mockBuildings.forEach((building) => {
      const element = document.createElement("button");
      element.type = "button";
      element.className = `campus-marker campus-marker--building${
        building.id === destinationId ? " is-selected" : ""
      }`;
      element.textContent = building.code;
      element.title = `${building.name} — ${building.category || "Campus building"}: ${building.description}`;
      element.setAttribute("aria-label", `Set destination to ${building.name}`);
      element.addEventListener("click", () => {
        resetNavigationForSelection();
        setDestinationId(building.id);
        setCustomDestination(null);
      });

      markersRef.current.push(
        new mapboxgl.Marker({ element, anchor: "bottom" })
          .setLngLat(building.coordinates)
          .addTo(map),
      );
    });

    parkingLots.forEach((lot) => {
      const isFull = lot.isFull || lot.availableBays <= 0;
      const isPermitted = lot.type === category.toLowerCase();
      const element = document.createElement("div");
      element.className = `campus-marker campus-marker--parking${
        lot.id === activeLot?.id ? " is-selected" : ""
      }${isFull ? " is-full" : ""}${!isPermitted ? " is-restricted" : ""}`;
      element.textContent = isFull ? "×" : "P";
      element.title = `${lot.name} (${lot.availableBays}/${lot.totalBays} bays available; access: ${lot.accessGate})${
        isFull ? " (Full)" : ""}${
        isPermitted ? "" : ` (not for ${category.toLowerCase()}s)`
      }`;
      element.setAttribute("aria-label", element.title);

      markersRef.current.push(
        new mapboxgl.Marker({ element, anchor: "bottom" })
          .setLngLat(lot.coordinates)
          .addTo(map),
      );
    });

    if (customDestination) {
      const element = document.createElement("div");
      element.className = "campus-marker campus-marker--building is-selected";
      element.textContent = "D";
      element.title = customDestination.name;
      element.setAttribute("aria-label", customDestination.name);

      markersRef.current.push(
        new mapboxgl.Marker({ element, anchor: "bottom" })
          .setLngLat(customDestination.coordinates)
          .addTo(map),
      );
    }
  }, [
    activeLot,
    category,
    customDestination,
    destinationId,
    mapReady,
    parkingLots,
    resetNavigationForSelection,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return undefined;

    if (!destination || !activeLot) {
      clearRouteLayer(map);
      let isCurrent = true;
      queueMicrotask(() => {
        if (!isCurrent) return;
        setRoute(null);
        setRouteError("");
        setRouteStatus("idle");
      });
      return () => {
        isCurrent = false;
      };
    }

    const controller = new AbortController();
    const routeType = routePhase === "walking" ? "walking" : "driving";
    const origin = routePhase === "walking" ? activeLot.coordinates : originCoordinates;
    const target = routePhase === "walking" ? destination.coordinates : activeLot.coordinates;
    const routeRequest = routePhase === "walking" ? getWalkingRoute : getDrivingRoute;

    clearRouteLayer(map);
    queueMicrotask(() => {
      if (controller.signal.aborted) return;
      setRoute(null);
      setRouteError("");
      setRouteStatus("loading");
    });

    routeRequest(origin, target, { signal: controller.signal })
      .then((nextRoute) => {
        if (controller.signal.aborted || !nextRoute) return;

        drawRoute(map, nextRoute.geometry, routeType);

        const bounds = nextRoute.geometry.coordinates.reduce(
          (result, coordinate) => result.extend(coordinate),
          new mapboxgl.LngLatBounds(
            nextRoute.geometry.coordinates[0],
            nextRoute.geometry.coordinates[0],
          ),
        );
        map.fitBounds(bounds, {
          padding: { top: 70, bottom: 90, left: 50, right: 50 },
          maxZoom: routeType === "driving" ? 15 : 17,
        });

        setRoute(nextRoute);
        setRouteStatus("ready");
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        const message = error.message || "Unable to calculate this route.";
        setRouteError(message);
        setRouteStatus("error");
      });

    return () => controller.abort();
  }, [activeLot, destination, mapReady, originCoordinates, routePhase]);

  useEffect(() => {
    if (!activeLot || routePhase !== "driving") return;
    if (distanceBetween(originCoordinates, activeLot.coordinates) <= 70) {
      let isCurrent = true;
      queueMicrotask(() => {
        if (isCurrent) setArrivalDialogOpen(true);
      });
      return () => {
        isCurrent = false;
      };
    }
    return undefined;
  }, [activeLot, originCoordinates, routePhase]);

  async function handleConfirmArrival() {
    if (!activeLot) return;

    setIsProcessingArrival(true);
    setArrivalError("");

    try {
      const response = await fetch(
        `/api/parking/areas/${encodeURIComponent(activeLot.id)}/occupy`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to update parking occupancy.");
      }

      setParkingLots((current) =>
        current.map((lot) =>
          lot.id === activeLot.id
            ? {
              ...lot,
              availableBays: result.availableBays,
              isFull: result.availableBays <= 0,
              status: result.availableBays <= 0 ? "full" : "open",
            }
            : lot,
        ),
      );

      setSelectedLotId(activeLot.id);
      setArrivalDialogOpen(false);
      setRoutePhase("walking");
    } catch (error) {
      setArrivalError(error.message || "Unable to confirm arrival.");
    } finally {
      setIsProcessingArrival(false);
    }
  }

  function handleArrivalPrompt() {
    setArrivalError("");
    setArrivalDialogOpen(true);
  }

  async function markActiveLotFull() {
    if (!activeLot || isReportingFull) return;
    setIsReportingFull(true);
    setFullReportError("");

    try {
      const response = await fetch(
        `/api/parking/areas/${activeLot.id}/full-report`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to report this parking area full.");
      }

      setParkingLots((current) =>
        current.map((lot) => lot.id === result.parkingArea.id
          ? {
            ...lot,
            isFull: true,
            availableBays: result.parkingArea.available,
            status: "full",
            fullUntil: result.parkingArea.fullUntil,
          }
          : lot),
      );
    } catch (error) {
      setFullReportError(error.message);
    } finally {
      setIsReportingFull(false);
    }
  }

  function handleDestinationChange(event) {
    const nextDestinationId = event.target.value;
    resetNavigationForSelection();
    setDestinationId(nextDestinationId);
    setCustomDestination(null);
  }

  function handleReachedDestination() {
    if (!activeLot) return;

    navigate("/parking/confirmation", {
      state: {
        parkingAreaId: activeLot.id,
        parkingAreaName: activeLot.name,
      },
    });
  }

  return (
    <main className="navigation-page">
      <header className="navigation-header">
        <Link className="navigation-brand" to="/home" aria-label="PukParking home">
          <span className="navigation-brand-mark">P</span>
          <span>PukParking</span>
        </Link>
        <div className="navigation-campus-label">
          <span className="navigation-live-dot" />
          NWU Potchefstroom Campus
        </div>
      </header>

      <div className="navigation-layout">
        <aside className="navigation-sidebar">
          <div className="navigation-sidebar-heading">
            <p className="navigation-eyebrow">CAMPUS ROUTING</p>
            <h1>Find your way.</h1>
            <p>Choose where you are going and we’ll find the closest available parking.</p>
          </div>

          <fieldset className="navigation-fieldset">
            <legend>Your access</legend>
            <div className="navigation-category-options">
              {userCategories.map((item) => (
                <button
                  className={category === item ? "is-active" : ""}
                  key={item}
                  onClick={() => {
                    resetNavigationForSelection();
                    setCategory(item);
                  }}
                  type="button"
                  aria-pressed={category === item}
                >
                  {item}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="navigation-destination-label" htmlFor="campus-destination">
            Destination building
          </label>
          <select
            id="campus-destination"
            className="navigation-destination-select"
            value={destinationId}
            onChange={handleDestinationChange}
          >
            <option value="">Select a building</option>
            {customDestination && (
              <option value={CUSTOM_DESTINATION_ID}>{customDestination.name}</option>
            )}
            {mockBuildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.name}
              </option>
            ))}
          </select>

          <section className="navigation-parking-section" aria-live="polite">
            <div className="navigation-section-heading">
              <h2>Nearest parking</h2>
              <span>{availableLots.length} available</span>
            </div>
            {activeLot ? (
              <div className="navigation-lot-summary">
                <span className="navigation-parking-symbol">P</span>
                <div>
                  <strong>{activeLot.name}</strong>
                  <span>
                    {activeLot.availableBays} bays available · {category} parking
                  </span>
                </div>
                <span className="navigation-open-indicator" title="Available" />
              </div>
            ) : (
              <p className="navigation-empty-state">
                {isLoadingParking
                  ? "Loading parking availability..."
                  : parkingLoadError
                    ? parkingLoadError
                    : destination
                      ? "No permitted parking is currently available."
                      : "Choose a building to find permitted parking."}
              </p>
            )}
          </section>

          {activeLot && routePhase === "driving" && (
            <button
              className="navigation-arrive-button"
              type="button"
              onClick={handleArrivalPrompt}
            >
              I Have Arrived
            </button>
          )}
          {activeLot && routePhase === "walking" && (
            <button
              className="navigation-arrive-button"
              type="button"
              onClick={handleReachedDestination}
            >
              Reached Destination
            </button>
          )}

          <button
            className="navigation-full-button"
            type="button"
            onClick={markActiveLotFull}
            disabled={!activeLot || isReportingFull}
          >
            <span aria-hidden="true">×</span>
            {isReportingFull ? "Reporting..." : "Parking Full"}
          </button>
          <p className="navigation-full-hint">
            Report this lot as full for 30 minutes to find the next closest option.
          </p>
          {fullReportError && (
            <p className="navigation-full-error" role="alert">
              {fullReportError}
            </p>
          )}

          {parkingLots.some((lot) => lot.isFull) && (
            <div className="navigation-full-list">
              <span>Reported full</span>
              {parkingLots.filter((lot) => lot.isFull).map((lot) => (
                <span key={lot.id} className="navigation-full-chip">
                  {lot.name}
                </span>
              ))}
            </div>
          )}
        </aside>

        <section className="navigation-map-panel" aria-label="Campus map and navigation route">
          <div ref={mapContainerRef} className="navigation-map" />

          {!accessToken && (
            <div className="navigation-map-message" role="alert">
              Mapbox access token is missing. Set VITE_MAPBOX_ACCESS_TOKEN to load the map.
            </div>
          )}

          {destination && activeLot && (
            <div className="navigation-route-hud" aria-live="polite">
              <div className="navigation-route-hud-heading">
                <span className="navigation-route-line-icon" />
                <span>{routePhase === "walking" ? "WALKING ROUTE" : "DRIVING ROUTE"}</span>
              </div>
              {routeStatus === "loading" && <strong>Calculating route...</strong>}
              {routeStatus === "error" && <p className="navigation-route-error">{routeError}</p>}
              {routeStatus === "ready" && route && (
                <>
                  <div className="navigation-route-metrics">
                    <div>
                      <strong>{route.durationMinutes}</strong>
                      <span>{routePhase === "walking" ? "minutes" : "mins"}</span>
                    </div>
                    <div>
                      <strong>{Math.round(route.distanceMeters)}</strong>
                      <span>meters</span>
                    </div>
                  </div>
                  {routePhase === "walking" && route.steps?.length > 0 && (
                    <ol className="navigation-route-steps">
                      {route.steps.slice(0, 3).map((step, index) => (
                        <li key={`${step.instruction}-${index}`}>
                          {step.instruction}
                        </li>
                      ))}
                    </ol>
                  )}
                </>
              )}
              <p className="navigation-route-endpoints">
                {routePhase === "walking" ? `${activeLot.name} to ${destination.name}` : `${originCoordinates.join(", ")} to ${activeLot.name}`}
              </p>
            </div>
          )}

          <div className="navigation-map-legend">
            <span><i className="legend-building" /> Buildings</span>
            <span><i className="legend-parking" /> Parking</span>
            <span><i className="legend-campus-feature" /> Amenities</span>
            <span><i className="legend-campus-gate" /> Gates</span>
            <span><i className="legend-full" /> Full</span>
          </div>
        </section>
      </div>

      {arrivalDialogOpen && activeLot && (
        <div className="navigation-arrival-modal-overlay" role="dialog" aria-modal="true">
          <div className="navigation-arrival-modal">
            <h2>You've arrived at {activeLot.name}.</h2>
            <p>Confirm you have parked and continue on foot to {destination?.name}.</p>
            {arrivalError && (
              <p className="navigation-arrival-error" role="alert">{arrivalError}</p>
            )}
            <div className="navigation-arrival-actions">
              <button type="button" className="navigation-cancel-button" onClick={() => setArrivalDialogOpen(false)}>
                Cancel
              </button>
              <button type="button" className="navigation-confirm-button" onClick={handleConfirmArrival} disabled={isProcessingArrival}>
                {isProcessingArrival ? "Confirming..." : "Confirm arrival"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default NavigationPage;