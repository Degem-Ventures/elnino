'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import DATA from './data.json';
import WEATHER_COUNTIES from './weather-counties.json';

type Metric = 'rain' | 'temp';
type WeatherModel = 'ecmwf_ifs025' | 'gfs_seamless' | 'icon_seamless' | 'best_match';
type CurrentWeather = {
  time?: string;
  weather_code?: number | null;
  temperature_2m?: number | null;
  apparent_temperature?: number | null;
  relative_humidity_2m?: number | null;
  wind_speed_10m?: number | null;
};
type DailyWeather = {
  time: string[];
  weather_code: (number | null)[];
  temperature_2m_max: (number | null)[];
  temperature_2m_min: (number | null)[];
  precipitation_sum: (number | null)[];
  precipitation_probability_max: (number | null)[];
};
type CountyWeather = { current: CurrentWeather; daily: DailyWeather; samples: number };
type WeatherCache = { timestamp: number; data: Record<string, CountyWeather> };
type ForecastResponse = {
  current?: CurrentWeather;
  daily?: Partial<DailyWeather>;
  error?: boolean;
  reason?: string;
};

type WeatherCountyName = keyof typeof WEATHER_COUNTIES;
type WeatherApiResponse = Record<string, ForecastResponse[]> & {
  error?: boolean;
  reason?: string;
};

const MODELS: { value: WeatherModel; label: string }[] = [
  { value: 'ecmwf_ifs025', label: 'ECMWF IFS' },
  { value: 'gfs_seamless', label: 'NOAA GFS' },
  { value: 'icon_seamless', label: 'DWD ICON' },
  { value: 'best_match', label: 'Best match' },
];
const CONDITIONS: Record<number, string> = {
  0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Freezing fog',
  51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle', 56: 'Freezing drizzle', 57: 'Freezing drizzle',
  61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Freezing rain', 67: 'Freezing rain', 71: 'Light snow',
  73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains', 80: 'Light showers', 81: 'Showers', 82: 'Violent showers',
  85: 'Snow showers', 86: 'Heavy snow showers', 95: 'Thunderstorm', 96: 'Thunderstorm with hail',
  99: 'Severe thunderstorm',
};
const RAIN_BANDS = [
  { max: 0.01, color: '#16243a', label: 'Dry' },
  { max: 5, color: '#1d3f5e', label: '0–5 mm' },
  { max: 15, color: '#1f5f86', label: '5–15 mm' },
  { max: 30, color: '#2a86b8', label: '15–30 mm' },
  { max: 60, color: '#38bdf8', label: '30–60 mm' },
  { max: Number.POSITIVE_INFINITY, color: '#a5e4ff', label: '60 mm +' },
];
const TEMP_BANDS = [
  { max: 12, color: '#2b6cb0', label: '< 12°C' },
  { max: 16, color: '#4a90c2', label: '12–16°C' },
  { max: 20, color: '#7fb4c9', label: '16–20°C' },
  { max: 24, color: '#e8d48b', label: '20–24°C' },
  { max: 28, color: '#f0b429', label: '24–28°C' },
  { max: 32, color: '#ef7d3a', label: '28–32°C' },
  { max: Number.POSITIVE_INFINITY, color: '#d64530', label: '32°C +' },
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const COUNTY_NAMES = Object.keys(DATA.boundaries).sort() as WeatherCountyName[];
const WINDY_LAYERS = [
  { value: 'rain', label: 'Rain' },
  { value: 'clouds', label: 'Clouds' },
  { value: 'satellite', label: 'Satellite' },
  { value: 'wind', label: 'Wind' },
  { value: 'temp', label: 'Temperature' },
] as const;

function numericMean(values: (number | null | undefined)[]) {
  const valid = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (!valid.length) return null;
  return Math.round((valid.reduce((sum, value) => sum + value, 0) / valid.length) * 10) / 10;
}

function combineSamples(samples: ForecastResponse[]): CountyWeather {
  const usable = samples.filter((sample) => !sample.error && sample.current && sample.daily?.time);
  const center = usable[Math.floor(usable.length / 2)] ?? usable[0];
  const currentSamples = usable.map((sample) => sample.current ?? {});
  const dailySamples = usable.map((sample) => sample.daily ?? {});
  const times = center?.daily?.time ?? [];
  const daily: DailyWeather = {
    time: [...times],
    weather_code: times.map((_, day) => center.daily?.weather_code?.[day] ?? null),
    temperature_2m_max: times.map((_, day) => numericMean(dailySamples.map((record) => record.temperature_2m_max?.[day]))),
    temperature_2m_min: times.map((_, day) => numericMean(dailySamples.map((record) => record.temperature_2m_min?.[day]))),
    precipitation_sum: times.map((_, day) => numericMean(dailySamples.map((record) => record.precipitation_sum?.[day]))),
    precipitation_probability_max: times.map((_, day) => {
      const mean = numericMean(dailySamples.map((record) => record.precipitation_probability_max?.[day]));
      return mean === null ? null : Math.round(mean);
    }),
  };
  return {
    samples: usable.length,
    current: {
      time: center?.current?.time,
      weather_code: center?.current?.weather_code,
      temperature_2m: numericMean(currentSamples.map((record) => record.temperature_2m)),
      apparent_temperature: numericMean(currentSamples.map((record) => record.apparent_temperature)),
      relative_humidity_2m: numericMean(currentSamples.map((record) => record.relative_humidity_2m)),
      wind_speed_10m: numericMean(currentSamples.map((record) => record.wind_speed_10m)),
    },
    daily,
  };
}

function getRainfall(record: CountyWeather) {
  return record.daily.precipitation_sum.reduce((sum, value) => sum + (value ?? 0), 0);
}

function getValue(record: CountyWeather | undefined, metric: Metric) {
  if (!record) return null;
  return metric === 'rain' ? getRainfall(record) : record.current.temperature_2m ?? null;
}

function getBands(metric: Metric) {
  return metric === 'rain' ? RAIN_BANDS : TEMP_BANDS;
}

function getBandColor(value: number | null, metric: Metric) {
  if (value === null) return '#1a2740';
  return getBands(metric).find((band) => value <= band.max)?.color ?? '#1a2740';
}

function describeCode(code?: number | null) {
  return code == null ? '—' : CONDITIONS[code] ?? '—';
}

function formatWeather(value: number | null, metric: Metric) {
  if (value === null) return '—';
  return metric === 'rain' ? `${value.toFixed(1)} mm` : `${value.toFixed(1)}°C`;
}

function formatDay(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  return Number.isNaN(date.valueOf()) ? iso : WEEKDAYS[date.getDay()];
}

function formatCacheTime(timestamp: number) {
  return new Date(timestamp).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Nairobi',
  });
}

function getWeatherCache(key: string): WeatherCache | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? 'null') as WeatherCache | null;
    if (!parsed || typeof parsed.timestamp !== 'number' || !parsed.data || typeof parsed.data !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function windyUrl(overlay: typeof WINDY_LAYERS[number]['value']) {
  const url = new URL('https://embed.windy.com/embed2.html');
  url.search = new URLSearchParams({
    lat: '-0.1', lon: '37.9', detailLat: '-1.28', detailLon: '36.82', zoom: '6',
    level: 'surface', overlay, product: 'ecmwf', menu: 'false', message: 'false',
    marker: 'false', calendar: 'false', pressure: 'false', type: 'map',
    location: 'coordinates', detail: 'false', metricWind: 'default', metricTemp: 'default',
  }).toString();
  return url.toString();
}

async function requestWeather(model: WeatherModel, fresh: boolean) {
  const params = new URLSearchParams({ model });
  if (fresh) params.set('fresh', '1');
  const response = await fetch(`/api/weather?${params}`);
  const text = await response.text();
  let result: WeatherApiResponse;
  try {
    result = JSON.parse(text) as WeatherApiResponse;
  } catch {
    throw new Error(response.ok ? 'Unexpected weather response' : `HTTP ${response.status}`);
  }
  if (!response.ok || result.error) throw new Error(result.reason ?? `HTTP ${response.status}`);
  const samplesByCounty = result as Record<string, ForecastResponse[]>;
  const combined = Object.fromEntries(
    Object.entries(samplesByCounty).map(([name, samples]) => [name, combineSamples(samples)]),
  ) as Record<string, CountyWeather>;
  if (!Object.keys(combined).length) throw new Error('Weather provider returned no county data');
  return combined;
}

export default function WeatherView() {
  const [metric, setMetric] = useState<Metric>('rain');
  const [model, setModel] = useState<WeatherModel>('ecmwf_ifs025');
  const [county, setCounty] = useState<WeatherCountyName>('Nairobi');
  const [weatherByCounty, setWeatherByCounty] = useState<Record<string, CountyWeather> | null>(null);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [windLayer, setWindLayer] = useState<typeof WINDY_LAYERS[number]['value']>('rain');
  const lastRefreshKey = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const fresh = refreshKey !== lastRefreshKey.current;
    lastRefreshKey.current = refreshKey;
    const cacheKey = `wx:${model}`;
    setLoading(true);
    setError(null);
    setWeatherByCounty(null);
    setCachedAt(null);

    if (!fresh) {
      const cached = getWeatherCache(cacheKey);
      const age = cached ? Date.now() - cached.timestamp : null;
      if (cached && age !== null && age >= 0 && age < 2 * 60 * 60 * 1000) {
        setWeatherByCounty(cached.data);
        setCachedAt(formatCacheTime(cached.timestamp));
        setLoading(false);
        return () => { cancelled = true; };
      }
    }

    requestWeather(model, fresh)
      .then((results) => {
        if (cancelled) return;
        setWeatherByCounty(results);
        setCachedAt(null);
        try { localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: results })); } catch {}
      })
      .catch((requestError: unknown) => {
        if (cancelled) return;
        const cached = getWeatherCache(cacheKey);
        if (cached) {
          setWeatherByCounty(cached.data);
          setCachedAt(formatCacheTime(cached.timestamp));
        } else {
          setError(requestError instanceof Error ? requestError.message : 'Network error');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [model, refreshKey]);

  const selectedWeather = weatherByCounty?.[county];
  const currentValue = getValue(selectedWeather, metric);
  const bands = getBands(metric);
  const maxRainfall = Math.max(1, ...(selectedWeather?.daily.precipitation_sum ?? []).map((value) => value ?? 0));
  const windowTitle = useMemo(() => {
    if (!selectedWeather?.daily.time.length) return `Kenya · ${metric === 'rain' ? '7-day rainfall' : 'temperature now'}`;
    if (metric === 'rain') {
      const first = selectedWeather.daily.time[0];
      const last = selectedWeather.daily.time.at(-1) ?? first;
      return `Kenya · 7-day rainfall · ${formatDay(first)}–${formatDay(last)}`;
    }
    return `Kenya · temperature now · ${selectedWeather.current.time ?? ''}`;
  }, [metric, selectedWeather]);

  return (
    <section className="card pad wx-view">
      <div className="atlhead">
        <div>
          <h2 className="h wxh">{windowTitle}</h2>
          <p className="atlsub">Average of 9 points per county · click a county for its daily breakdown.</p>
        </div>
        <span className="hint">{cachedAt ? `Saved copy · ${cachedAt} EAT` : weatherByCounty ? `${metric === 'rain' ? '7-day totals' : 'temperature now'} · EAT (UTC+3)` : loading ? 'Loading weather…' : 'Weather unavailable'}</span>
      </div>

      <div className="tools wx-controls">
        <label className="sr-only" htmlFor="weather-metric">Weather metric</label>
        <select id="weather-metric" className="wxsel" value={metric} onChange={(event) => setMetric(event.target.value as Metric)}>
          <option value="rain">7-day rainfall</option><option value="temp">Temperature now</option>
        </select>
        <label className="sr-only" htmlFor="weather-county">County</label>
        <select id="weather-county" className="wxsel" value={county} onChange={(event) => setCounty(event.target.value as WeatherCountyName)}>
          {COUNTY_NAMES.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        <label className="sr-only" htmlFor="weather-model">Forecast model</label>
        <select id="weather-model" className="wxsel" value={model} onChange={(event) => setModel(event.target.value as WeatherModel)}>
          {MODELS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <button className="wxbtn" type="button" onClick={() => setRefreshKey((key) => key + 1)} disabled={loading}>Refresh</button>
      </div>

      <div className="wxgrid">
        <div className="wxmapcard">
          <div className="wx-map-container">
            <svg id="wxmap" viewBox={DATA.viewBox.join(' ')} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Clickable Kenya county weather map">
              {COUNTY_NAMES.map((name) => {
                const value = getValue(weatherByCounty?.[name], metric);
                const selected = county === name;
                return (
                  <path
                    key={name}
                    d={DATA.boundaries[name as keyof typeof DATA.boundaries]}
                    className={`county wx-county${selected ? ' sel' : ''}`}
                    fill={getBandColor(value, metric)}
                    tabIndex={0}
                    role="button"
                    aria-label={`${name}, ${formatWeather(value, metric)}${selected ? ', selected' : ''}`}
                    onClick={() => setCounty(name)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setCounty(name);
                      }
                    }}
                  ><title>{`${name} · ${formatWeather(value, metric)}`}</title></path>
                );
              })}
            </svg>
          </div>
          <div className="wxlegend">
            {bands.map((band) => <span className="wxsw" key={band.label}><i style={{ background: band.color }} />{band.label}</span>)}
          </div>
          <p className="wxhint">{metric === 'rain' ? 'Hover a county for its 7-day total' : 'Hover a county for its temperature now'}</p>
        </div>

        <div className="wxpanel" aria-live="polite">
          <h3 className="h wxpanel-title">{county}</h3>
          {loading && <p className="wxload">Sampling county weather from Open-Meteo…</p>}
          {!loading && error && <div className="wxload">Weather unavailable: {error}<br /><button type="button" className="wxbtn" onClick={() => setRefreshKey((key) => key + 1)}>Retry</button></div>}
          {!loading && !error && !selectedWeather && <p className="hint">No data for this county.</p>}
          {!loading && !error && selectedWeather && (
            <>
              <div className="hint wx-summary">Now {formatWeather(selectedWeather.current.temperature_2m ?? null, 'temp')} · 7-day rain {getRainfall(selectedWeather).toFixed(1)} mm</div>
              <div className="wxnow">
                <div className="wxtemp"><b>{Math.round(selectedWeather.current.temperature_2m ?? 0)}</b><span>°C</span></div>
                <div>
                  <div className="wxcond">{describeCode(selectedWeather.current.weather_code)}</div>
                  <div className="hint">Feels {Math.round(selectedWeather.current.apparent_temperature ?? 0)}° · {Math.round(selectedWeather.current.relative_humidity_2m ?? 0)}% · wind {Math.round(selectedWeather.current.wind_speed_10m ?? 0)} km/h</div>
                  <div className="hint">Observed {selectedWeather.current.time?.replace('T', ' ') ?? '—'} · {selectedWeather.samples} samples</div>
                </div>
              </div>
              <div className="wxdays">
                {selectedWeather.daily.time.map((day, index) => {
                  const rain = selectedWeather.daily.precipitation_sum[index] ?? 0;
                  const probability = selectedWeather.daily.precipitation_probability_max[index];
                  return (
                    <div className="wxrow2" key={day}>
                      <div className="r1"><span className="wxd">{formatDay(day)}</span><span className="wxc">{describeCode(selectedWeather.daily.weather_code[index])}</span><span className="wxt">{Math.round(selectedWeather.daily.temperature_2m_max[index] ?? 0)}° / {Math.round(selectedWeather.daily.temperature_2m_min[index] ?? 0)}°</span></div>
                      <div className="r2"><span className="wxbar"><i style={{ width: `${Math.round((rain / maxRainfall) * 100)}%` }} /></span><span className="wxmm">{rain.toFixed(1)} mm{probability !== null ? ` · ${probability}%` : ''}</span></div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
      <section className="wxlayers" aria-label="Live weather layers">
        <div className="tools wx-layer-controls">
          <span className="h">Live layers</span>
          {WINDY_LAYERS.map((layer) => (
            <button
              className={`wxbtn wxov${windLayer === layer.value ? ' on' : ''}`}
              type="button"
              key={layer.value}
              aria-pressed={windLayer === layer.value}
              onClick={() => setWindLayer(layer.value)}
            >{layer.label}</button>
          ))}
        </div>
        <iframe
          src={windyUrl(windLayer)}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`Live ${WINDY_LAYERS.find((layer) => layer.value === windLayer)?.label ?? 'weather'} layer over Kenya`}
        />
        <p className="hint">Animated rain, cloud, satellite, wind, and temperature fields from <a href="https://www.windy.com/" target="_blank" rel="noopener noreferrer">Windy.com</a>. These model-based layers cover the whole country.</p>
      </section>
      <p className="wx-attribution">Forecast data by <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a>. County values are sampled estimates, not official station observations.</p>
    </section>
  );
}
