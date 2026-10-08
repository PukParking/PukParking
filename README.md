# PukParking

PukParking is a mobile-first Progressive Web Application (PWA) for NWU Potchefstroom Campus parking and walking navigation. It recommends the closest valid parking area for a selected destination while respecting access type and live availability.

## Project layout

- `client/` — React + Vite frontend for the parking and navigation experience.
- `server/` — Express API and SQLite storage for campus parking availability.

## Environment setup

Create a local `.env` file in the project root (same directory as this README), then add your Mapbox token:

```bash
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
```

You can copy the template from `.env.example`:

```bash
cp .env.example .env
```

If the token is missing, the map UI will show a visible warning and the routing flow cannot load the route layer.

## Run the app

From the project root:

```bash
cd client
npm install
npm run dev
```

Then open the local Vite URL in the browser and navigate to the parking flow, for example:

- `/parking/navigation`
- `/navigation`

## Server setup

Create `server/.env` from the example and set a private JWT secret of at least 32 bytes:

```bash
cd server
cp .env.example .env
npm ci
npm run seed
npm run dev
```

The API listens on `http://localhost:3000` by default. `GET /api/parking-areas` returns all parking rows as JSON. The seed command initializes an empty database with the NWU Potchefstroom demo dataset and does not overwrite existing parking data. If the required administrator foreign key has no owner, it creates a non-privileged seed owner with an inaccessible random password hash.

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

Run the production build before final review:

```bash
cd client
npm run build
```

This should complete without syntax or compilation errors.
