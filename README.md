# PukParking

PukParking is a mobile-first Progressive Web Application (PWA) for NWU Potchefstroom Campus parking and walking navigation. It recommends the closest valid parking area for a selected destination while respecting access type and live availability.

## Features

- Haversine distance calculation to recommend nearby parking.
- Student, staff, and visitor/guest access categories.
- Destination-based parking recommendations and walking navigation.
- Parking availability loaded from the SQLite API, with mock-data fallback for demos.

## Tech stack and APIs

- React and Vite for the frontend.
- Node.js, Express, and SQLite for the parking API.
- Mapbox GL for maps and walking directions.

## Project layout

- `client/` — React + Vite frontend for the parking and navigation experience.
- `server/` — Express API and SQLite storage for campus parking availability.

## Environment setup

Copy the example environment file to `.env` in the project root (the same directory as this README):

```bash
cp .env.example .env
```

If the token for MapBox is missing, the map UI will show a visible warning and the routing flow cannot load the route layer.

## Run the app

Install the dependencies once from the project root:

```bash
npm install
npm install --prefix client
npm ci --prefix server
```

For a new local database, copy `server/.env.example` to `server/.env` and set
`BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD`. Replace the example
`JWT_SECRET` with a random secret of at least 32 bytes (for example, 64 random
hexadecimal characters). The root `npm run dev` command creates a JWT secret
only if one is missing; it does not replace the example placeholder.

Start the frontend and API together from the project root:

```bash
npm run dev
```

Open the local Vite URL in the browser and enjoy the application.

The server automatically seeds the NWU Potchefstroom campus dataset on startup if both the buildings and parking-area tables are empty. If there is no administrator, it creates one from `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD`; both values must be set in the ignored `server/.env` file before initializing a new database. Passwords must satisfy the existing administrator password policy. Existing administrator accounts are not replaced. You can also run `npm run seed` from the project root to manually resynchronize the campus dataset; **manual seeding replaces existing buildings, parking areas, and full reports.**
SQLite uses UUID text identifiers and the ERD-aligned `ADMINISTRATOR`, `BUILDING`, `PARKING_AREA`, and `PARKING_FULL_REPORT` tables. `GET /api/buildings` returns campus buildings; `GET /api/parking-areas` computes availability and respects unexpired full reports; `POST /api/parking-areas/:id/report-full` reports a lot full for 30 minutes. Existing SQLite data is migrated to the ERD schema while preserving its rows and relationships.

## Campus data schema

The frontend expects building and parking data to normalize into the following shape:

```js
{
  id: "building-or-lot-id",
  name: "Human-readable label",
  code: "Optional short code",
  category: "Academic | Student Life | Administration | etc.",
  description: "Optional description",
  coordinates: [longitude, latitude],
  type: "student | staff | visitor",
  accessGate: "Entry or gate description",
  totalBays: 120,
  availableBays: 18,
  status: "open | almost_full | full"
}
```

Canonical coordinate contract:

- Use Mapbox-style GeoJSON ordering: `[longitude, latitude]`
- Do not mix `lat/lng` with `coordinates` arrays in different formats in the same payload.
- The frontend normalizer accepts legacy variations such as `latitude/longitude`, `lat/lng`, or `coordinates`, but it always converts them to `[longitude, latitude]` for Mapbox markers, bounds, and directions.

## Build validation

Run the production build in root before final review:

```bash
npm run build
```

This should complete without syntax or compilation errors.
