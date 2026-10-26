import { NextRequest, NextResponse } from 'next/server';
import DATA from '../../data.json';
import LOCATIONS from '../../weather-counties.json';

type WeatherPoint = readonly [number, number, number, number];
type WeatherSample = {
  error?: boolean;
  reason?: string;
  current?: unknown;
  daily?: unknown;
};

const MODELS = new Set(['ecmwf_ifs025', 'gfs_seamless', 'icon_seamless', 'best_match']);
const COUNTY_NAMES = Object.keys(DATA.boundaries).sort() as (keyof typeof LOCATIONS)[];
const CURRENT_FIELDS = 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m';
const DAILY_FIELDS = 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max';

function errorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === 'object' && 'reason' in payload && typeof payload.reason === 'string') {
    return payload.reason;
  }
  return fallback;
}

export async function GET(request: NextRequest) {
  const model = request.nextUrl.searchParams.get('model') ?? 'ecmwf_ifs025';
  const fresh = request.nextUrl.searchParams.get('fresh') === '1';
  if (!MODELS.has(model)) {
    return NextResponse.json({ error: true, reason: 'Unsupported weather model' }, { status: 400 });
  }

  const points = COUNTY_NAMES.flatMap((name) => {
    const [latitude, longitude, latSpan, lonSpan] = LOCATIONS[name] as unknown as WeatherPoint;
    return [-1, 0, 1].flatMap((latStep) =>
      [-1, 0, 1].map((lonStep) => [
        Math.round((latitude + latStep * latSpan) * 1000) / 1000,
        Math.round((longitude + lonStep * lonSpan) * 1000) / 1000,
      ]),
    );
  });

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude: points.map(([latitude]) => latitude).join(','),
    longitude: points.map(([, longitude]) => longitude).join(','),
    current: CURRENT_FIELDS,
    daily: DAILY_FIELDS,
    forecast_days: '7',
    timezone: 'Africa/Nairobi',
    models: model,
  }).toString();

  let response: Response;
  try {
    response = await fetch(url, fresh ? { cache: 'no-store' } : { next: { revalidate: 7200 } });
  } catch {
    return NextResponse.json({ error: true, reason: 'Weather provider is unreachable' }, { status: 502 });
  }

  const text = await response.text();
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: true, reason: 'Weather provider returned an invalid response' }, { status: 502 });
  }
  if (!response.ok) {
    return NextResponse.json(
      { error: true, reason: errorMessage(payload, `Weather provider returned HTTP ${response.status}`) },
      { status: 502 },
    );
  }
  if (!Array.isArray(payload)) {
    return NextResponse.json({ error: true, reason: errorMessage(payload, 'Unexpected weather response') }, { status: 502 });
  }

  const byCounty: Record<string, WeatherSample[]> = {};
  COUNTY_NAMES.forEach((name, index) => {
    const samples = (payload as WeatherSample[]).slice(index * 9, (index + 1) * 9).filter((sample) => sample && !sample.error);
    if (samples.length) byCounty[name] = samples;
  });
  if (!Object.keys(byCounty).length) {
    return NextResponse.json({ error: true, reason: 'Weather provider returned no county data' }, { status: 502 });
  }

  return NextResponse.json(byCounty, {
    headers: {
      'Cache-Control': fresh ? 'private, no-store' : 'public, s-maxage=7200, stale-while-revalidate=3600',
    },
  });
}
