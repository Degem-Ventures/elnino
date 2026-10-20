# Super El Niño Mapper - Kenya

An interactive, county-level view of El Niño impacts and flood risk across Kenya. Explore documented impacts from the 2009-10 and 2015-16 events, compare recurring hotspots, and inspect a modeled outlook for the October-December 2026 rainy season.

**Live site:** [elnino.co.ke](https://elnino.co.ke/)

## What you can explore

- **Historical events:** Browse reported county impacts for the 2009-10 and 2015-16 El Niño periods, including severity tiers and county-level notes.
- **2026 outlook:** Compare a 0-100 county risk index and its historical recurrence, forecast signal, and structural exposure inputs.
- **Chronic hotspots:** Find counties with documented impacts across both historical events.
- **Interactive map:** Search for counties, hover for a quick summary, and select a county or list entry to inspect its record.
- **Method and sources:** Review the model assumptions and follow the cited source material from the app.

## Run locally

### Requirements

- Node.js 20.9 or newer
- npm

### Development

```sh
npm install
npm run dev
```

Open the local URL printed by Next.js, usually `http://localhost:3000`.

### Original vanilla app

The standalone HTML version and its assets remain in `elnino/`. To serve it locally with Python:

```sh
python3 -m http.server 8000 --directory elnino
```

Then open `http://localhost:8000`.

### Production

```sh
npm run build
npm start
```

## Data and interpretation

Historical records are grouped by county and assigned a qualitative tier: severe, high, moderate, watch, or minimal/not reported. The records summarize cited reports; they are not a complete census, and the amount of county-specific detail varies between sources and events. A beneficial-rainfall marker indicates counties where increased rainfall was reported to help crops or livestock.

The 2026 outlook uses the score described in the app:

```text
Risk index = 40% historical recurrence
		   + 35% ICPAC/KMD 2026 forecast signal
		   + 25% structural exposure
```

This is a transparent planning index, **not** a physics-based or hydrological forecast. It is based on cited forecast publications and the dataset bundled with the app; it is not a live forecast feed. Forecast skill also decreases at smaller geographic scales and farther into the future. Check the linked sources and current official guidance before making operational decisions.

## Project layout

- `app/` - Next.js route, layout, styles, and bundled map and impact data.
- `public/` - Static assets served by Next.js.
- `elnino/index.html` - Original standalone vanilla HTML app.
- `elnino/assets/` - County boundary source data and assets used by the vanilla app.
- `elnino/build.py` and `elnino/diagram.py` - Python scripts for the original vanilla app and its diagram.

## Sources

The app links to source material from NOAA's Climate Prediction Center, ICPAC, WMO, IRI, OCHA, IFRC, the Red Cross Red Crescent Climate Centre, geoBoundaries, and other reporting. Refer to the in-app **Sources** section for the citations associated with the dataset.
