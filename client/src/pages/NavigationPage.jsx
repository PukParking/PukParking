import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

import {
  campusBuildings,
  campusCenter,
  campusParkingLots,
  userCategories,
} from "../data/mockCampusData";
import { getWalkingRoute } from "../services/mapboxDirections";
import "./NavigationPage.css";

const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

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
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);
  const [category, setCategory] = useState("Student");
  const [destinationId, setDestinationId] = useState("");
  const [fullLotIds, setFullLotIds] = useState(() => new Set());
  const [route, setRoute] = useState(null);
  const [routeStatus, setRouteStatus] = useState("idle");
  const [routeError, setRouteError] = useState("");

  const destination = campusBuildings.find((building) => building.id === destinationId);
  const availableLots = useMemo(
    () =>
      campusParkingLots
        .filter(
          (lot) =>
            lot.permittedCategories.includes(category) && !fullLotIds.has(lot.id),
        )
        .sort((first, second) =>
          destination
            ? distanceBetween(first.coordinates, destination.coordinates) -
              distanceBetween(second.coordinates, destination.coordinates)
            : 0,
        ),
    [category, destination, fullLotIds],
  );
  const activeLot = destination ? availableLots[0] : undefined;

  useEffect(() => {
    if (!mapContainerRef.current || !accessToken) return undefined;

    mapboxgl.accessToken = accessToken;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: campusCenter,
      zoom: 15.3,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.on("load", () => setMapReady(true));
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
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

    campusBuildings.forEach((building) => {
      const element = document.createElement("button");
      element.type = "button";
      element.className = `campus-marker campus-marker--building${
        building.id === destinationId ? " is-selected" : ""
      }`;
      element.textContent = "B";
      element.title = `Set destination: ${building.name}`;
      element.setAttribute("aria-label", `Set destination to ${building.name}`);
      element.addEventListener("click", () => setDestinationId(building.id));

      markersRef.current.push(
        new mapboxgl.Marker({ element, anchor: "bottom" })
          .setLngLat(building.coordinates)
          .addTo(map),
      );
    });

    campusParkingLots.forEach((lot) => {
      const isFull = fullLotIds.has(lot.id);
      const isPermitted = lot.permittedCategories.includes(category);
      const element = document.createElement("div");
      element.className = `campus-marker campus-marker--parking${
        lot.id === activeLot?.id ? " is-selected" : ""
      }${isFull ? " is-full" : ""}${!isPermitted ? " is-restricted" : ""}`;
      element.textContent = isFull ? "×" : "P";
      element.title = `${lot.name}${isFull ? " (Full)" : ""}${
        isPermitted ? "" : ` (not for ${category.toLowerCase()}s)`
      }`;
      element.setAttribute("aria-label", element.title);

      markersRef.current.push(
        new mapboxgl.Marker({ element, anchor: "bottom" })
          .setLngLat(lot.coordinates)
          .addTo(map),
      );
    });
  }, [activeLot, category, destinationId, fullLotIds, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return undefined;

    const source = map.getSource("walking-route");
    if (!destination || !activeLot) {
      source?.setData({ type: "FeatureCollection", features: [] });
      return undefined;
    }

    const controller = new AbortController();
    source?.setData({ type: "FeatureCollection", features: [] });

    Promise.resolve()
      .then(() => {
        if (controller.signal.aborted) return null;
        setRoute(null);
        setRouteError("");
        setRouteStatus("loading");
        return getWalkingRoute(activeLot.coordinates, destination.coordinates, {
          signal: controller.signal,
        });
      })
      .then((nextRoute) => {
        if (controller.signal.aborted || !nextRoute) return;

        const feature = {
          type: "Feature",
          properties: {},
          geometry: nextRoute.geometry,
        };
        const routeSource = map.getSource("walking-route");

        if (routeSource) {
          routeSource.setData(feature);
        } else {
          map.addSource("walking-route", {
            type: "geojson",
            data: feature,
          });
          map.addLayer({
            id: "walking-route-line",
            type: "line",
            source: "walking-route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": "#1479d1",
              "line-width": 5,
              "line-opacity": 0.9,
            },
          });
        }

        const bounds = nextRoute.geometry.coordinates.reduce(
          (result, coordinate) => result.extend(coordinate),
          new mapboxgl.LngLatBounds(
            nextRoute.geometry.coordinates[0],
            nextRoute.geometry.coordinates[0],
          ),
        );
        map.fitBounds(bounds, { padding: { top: 70, bottom: 90, left: 50, right: 50 }, maxZoom: 17 });
        setRoute(nextRoute);
        setRouteStatus("ready");
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setRouteError(error.message || "Unable to calculate this walking route.");
        setRouteStatus("error");
      });

    return () => controller.abort();
  }, [activeLot, destination, mapReady]);

  function markActiveLotFull() {
    if (!activeLot) return;
    setFullLotIds((current) => new Set(current).add(activeLot.id));
  }

  return (
    <main className="navigation-page">
      <header className="navigation-header">
        <a className="navigation-brand" href="/home" aria-label="PukParking home">
          <span className="navigation-brand-mark">P</span>
          <span>PukParking</span>
        </a>
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
                  onClick={() => setCategory(item)}
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
            onChange={(event) => setDestinationId(event.target.value)}
          >
            <option value="">Select a building</option>
            {campusBuildings.map((building) => (
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
                  <span>{category} parking</span>
                </div>
                <span className="navigation-open-indicator" title="Available" />
              </div>
            ) : (
              <p className="navigation-empty-state">
                {destination
                  ? "All permitted parking is marked full."
                  : "Choose a building to find permitted parking."}
              </p>
            )}
          </section>

          <button
            className="navigation-full-button"
            type="button"
            onClick={markActiveLotFull}
            disabled={!activeLot}
          >
            <span aria-hidden="true">×</span>
            Parking Full
          </button>
          <p className="navigation-full-hint">
            Mark this lot full to find the next closest option.
          </p>

          {fullLotIds.size > 0 && (
            <div className="navigation-full-list">
              <span>Marked full</span>
              {[...fullLotIds].map((lotId) => (
                <span key={lotId} className="navigation-full-chip">
                  {campusParkingLots.find((lot) => lot.id === lotId)?.name}
                </span>
              ))}
            </div>
          )}
        </aside>

        <section className="navigation-map-panel" aria-label="Campus map and walking route">
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
                <span>WALKING ROUTE</span>
              </div>
              {routeStatus === "loading" && <strong>Calculating route...</strong>}
              {routeStatus === "error" && <p className="navigation-route-error">{routeError}</p>}
              {routeStatus === "ready" && route && (
                <div className="navigation-route-metrics">
                  <div>
                    <strong>{route.durationMinutes}</strong>
                    <span>minutes</span>
                  </div>
                  <div>
                    <strong>{Math.round(route.distanceMeters)}</strong>
                    <span>meters</span>
                  </div>
                </div>
              )}
              <p className="navigation-route-endpoints">
                {activeLot.name} <span>to</span> {destination.name}
              </p>
            </div>
          )}

          <div className="navigation-map-legend">
            <span><i className="legend-building" /> Buildings</span>
            <span><i className="legend-parking" /> Parking</span>
            <span><i className="legend-full" /> Full</span>
          </div>
        </section>
      </div>
    </main>
  );
}

export default NavigationPage;