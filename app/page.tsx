'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import AtlanticView from './atlantic-view';
import DATA from './data.json';
import PROVINCE_MAP from './province-map.json';
import ProvinceView from './province-view';
import WeatherView from './weather-view';

type Mode = 'y1997' | 'y2009' | 'y2015' | 'y2026' | 'hot' | 'wx' | 'atl';
type HistoricalMode = 'y2009' | 'y2015';
type Tooltip = { county: string; left: number; top: number } | null;

const TIER = {
  severe: { color: 'var(--severe)', label: 'Severe' },
  high: { color: 'var(--high)', label: 'High' },
  moderate: { color: 'var(--moderate)', label: 'Moderate' },
  watch: { color: 'var(--watch)', label: 'Watch' },
  minimal: { color: 'var(--minimal)', label: 'Minimal' },
} as const;
const ORDER = ['severe', 'high', 'moderate', 'watch', 'minimal'] as const;
const RANK: Record<string, number> = {
  severe: 5,
  high: 4,
  moderate: 3,
  watch: 2,
  minimal: 1,
};
const RISK_COLOR: Record<string, string> = {
  extreme: 'var(--rb-extreme)',
  veryhigh: 'var(--rb-veryhigh)',
  high: 'var(--rb-high)',
  elevated: 'var(--rb-elevated)',
  moderate: 'var(--rb-moderate)',
};
const RISK_LABEL: Record<string, string> = {
  extreme: 'Extreme',
  veryhigh: 'Very high',
  high: 'High',
  elevated: 'Elevated',
  moderate: 'Moderate',
};
const TABS: ({ mode: Mode; label: string } | { separator: true })[] = [
  { mode: 'y2026', label: '2026 outlook' },
  { mode: 'wx', label: 'Weather' },
  { separator: true },
  { mode: 'y2015', label: '2015–16' },
  { mode: 'y2009', label: '2009–10' },
  { mode: 'y1997', label: '1997–98' },
  { mode: 'hot', label: 'Hotspots' },
  { separator: true },
  { mode: 'atl', label: 'Atlantic & ENSO' },
];
const ALL_NAMES = Object.keys(DATA.boundaries);
const COUNTY_AREAS = Object.fromEntries(ALL_NAMES.map((name) => {
  const coordinates = DATA.boundaries[name as keyof typeof DATA.boundaries].match(/-?\d*\.?\d+/g)?.map(Number) ?? [];
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (let index = 0; index + 1 < coordinates.length; index += 2) {
    minX = Math.min(minX, coordinates[index]);
    maxX = Math.max(maxX, coordinates[index]);
    minY = Math.min(minY, coordinates[index + 1]);
    maxY = Math.max(maxY, coordinates[index + 1]);
  }
  return [name, (maxX - minX) * (maxY - minY)];
}));

function countyLabelStyle(name: string, width: number): React.CSSProperties {
  if (!width) return { display: 'none' };
  const area = COUNTY_AREAS[name as keyof typeof COUNTY_AREAS];
  const pixelSize = area > 60000 ? 13 : area > 20000 ? 12 : area > 6000 ? 11 : area > 2000 ? 10 : 9.5;
  const scale = 1000 / width;
  const space = PROVINCE_MAP.labelSpace[name as keyof typeof PROVINCE_MAP.labelSpace] ?? [0, 0];
  const fits = name.length * pixelSize * 0.56 * scale <= space[0] * 0.92 && pixelSize * scale <= space[1] * 0.62;
  return { fontSize: `${pixelSize * scale}px`, display: fits ? undefined : 'none' };
}

function getHotspots() {
  return Object.fromEntries(
    ALL_NAMES.map((name) => {
      const first = DATA.events.y2015.counties[name as keyof typeof DATA.events.y2015.counties];
      const second = DATA.events.y2009.counties[name as keyof typeof DATA.events.y2009.counties];
      const firstRank = first ? RANK[first.tier] : 0;
      const secondRank = second ? RANK[second.tier] : 0;
      const both = Boolean(first && second) && firstRank >= 3 && secondRank >= 3;
      return [name, { score: Math.min(5, Math.max(firstRank, secondRank) + (both ? 1 : 0)), both }];
    }),
  );
}

const HOTSPOTS = getHotspots();
const HOTSPOT_COLOR = (score: number) =>
  score >= 5
    ? TIER.severe.color
    : score === 4
      ? TIER.high.color
      : score === 3
        ? TIER.moderate.color
        : score === 2
          ? TIER.watch.color
          : TIER.minimal.color;

export default function Home() {
  const [mode, setMode] = useState<Mode>('wx');
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [tooltip, setTooltip] = useState<Tooltip>(null);
  const [mapWidth, setMapWidth] = useState(0);
  const mapContainer = useRef<HTMLDivElement>(null);
  const shouldScrollToDetail = useRef(false);

  useEffect(() => {
    const requestedMode = window.location.hash.slice(1);
    if (['y1997', 'y2009', 'y2015', 'y2026', 'hot', 'wx', 'atl'].includes(requestedMode)) {
      setMode(requestedMode as Mode);
    }
  }, []);

  useEffect(() => {
    const svg = mapContainer.current?.querySelector('svg');
    if (!svg) return;
    const measure = () => setMapWidth(svg.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(svg);
    return () => observer.disconnect();
  }, [mode]);

  useEffect(() => {
    if (!shouldScrollToDetail.current) return;
    document.getElementById('detail')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    shouldScrollToDetail.current = false;
  }, [mode, selected]);

  const historicalMode = mode === 'y2009' || mode === 'y2015' ? mode : null;
  const event = historicalMode ? DATA.events[historicalMode] : null;
  const forecast = mode === 'y2026' ? DATA.forecast : null;
  const forecastCounties = DATA.forecast.counties;

  const affectedNames = useMemo(() => {
    if (!event) return [];
    return ALL_NAMES.filter((name) => Boolean(event.counties[name as keyof typeof event.counties])).sort(
      (a, b) => {
        const aTier = event.counties[a as keyof typeof event.counties]?.tier ?? 'minimal';
        const bTier = event.counties[b as keyof typeof event.counties]?.tier ?? 'minimal';
        return RANK[bTier] - RANK[aTier] || a.localeCompare(b);
      },
    );
  }, [event]);

  const forecastNames = useMemo(
    () =>
      [...ALL_NAMES].sort(
        (a, b) =>
          forecastCounties[b as keyof typeof forecastCounties].risk -
            forecastCounties[a as keyof typeof forecastCounties].risk ||
          a.localeCompare(b),
      ),
    [forecastCounties],
  );

  const selectedName =
    selected ?? (event ? affectedNames[0] : forecast ? forecastNames[0] : null);
  const selectedRecord =
    event && selectedName
      ? event.counties[selectedName as keyof typeof event.counties]
      : null;
  const forecastRecord = selectedName
    ? forecastCounties[selectedName as keyof typeof forecastCounties]
    : null;
  const normalizedQuery = query.trim().toLowerCase();

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setSelected(null);
    setTooltip(null);
    window.history.replaceState(null, '', `#${nextMode}`);
  }

  function showTooltip(name: string, clientX: number, clientY: number) {
    const bounds = mapContainer.current?.getBoundingClientRect();
    if (!bounds) return;
    const left = clientX - bounds.left + 14;
    setTooltip({
      county: name,
      left: left > bounds.width - 250 ? left - 270 : left,
      top: clientY - bounds.top + 14,
    });
  }

  function countyFill(name: string) {
    if (mode === 'hot') return HOTSPOT_COLOR(HOTSPOTS[name as keyof typeof HOTSPOTS].score);
    if (forecast) {
      return RISK_COLOR[forecastCounties[name as keyof typeof forecastCounties].band];
    }
    const record = event?.counties[name as keyof typeof event.counties];
    return TIER[record?.tier ?? 'minimal'].color;
  }

  function countyHasBenefit(name: string) {
    return Boolean(event?.counties[name as keyof typeof event.counties]?.benefit);
  }

  const legend = mode === 'y2026' ? (
    (['extreme', 'veryhigh', 'high', 'elevated', 'moderate'] as const).map((band) => (
      <LegendItem key={band} color={RISK_COLOR[band]} label={RISK_LABEL[band]} />
    ))
  ) : mode === 'hot' ? (
    <>
      {[
        ['severe', 'Top recurring hotspots'],
        ['high', 'High recurring'],
        ['moderate', 'Moderate'],
        ['watch', 'Lower / watch'],
        ['minimal', 'No record'],
      ].map(([tier, label]) => (
        <LegendItem key={tier} color={TIER[tier as keyof typeof TIER].color} label={label} />
      ))}
      <LegendItem color="transparent" label="Recorded in both events" dashed />
    </>
  ) : (
    <>
      {ORDER.filter((tier) => tier !== 'minimal').map((tier) => (
        <LegendItem key={tier} color={TIER[tier].color} label={TIER[tier].label} />
      ))}
      <LegendItem color="transparent" label="Rainfall was beneficial" dashed />
    </>
  );

  function renderList() {
    if (forecast) {
      const highRiskCount = forecastNames.filter(
        (name) => forecastCounties[name as keyof typeof forecastCounties].risk >= 70,
      ).length;
      return (
        <>
          <ListHeader title="Projected 2026 risk" count={<><b>{highRiskCount}</b> counties at very high / extreme risk</>} />
          <div className="list">
            {forecastNames.map((name) => {
              const record = forecastCounties[name as keyof typeof forecastCounties];
              const color = RISK_COLOR[record.band];
              return (
                <CountyRow key={name} name={name} color={color} value={record.risk} displayValue={record.risk} onClick={() => setSelected(name)} />
              );
            })}
          </div>
        </>
      );
    }

    if (mode === 'hot') {
      const ranked = ALL_NAMES.filter((name) => HOTSPOTS[name as keyof typeof HOTSPOTS].score >= 3).sort(
        (a, b) =>
          HOTSPOTS[b as keyof typeof HOTSPOTS].score - HOTSPOTS[a as keyof typeof HOTSPOTS].score ||
          a.localeCompare(b),
      );
      const bothCount = ALL_NAMES.filter((name) => HOTSPOTS[name as keyof typeof HOTSPOTS].both).length;
      return (
        <>
          <ListHeader title="Recurring counties" count={<><b>{ranked.length}</b> documented · {bothCount} in both</>} />
          <div className="list">
            {ranked.map((name) => {
              const record = HOTSPOTS[name as keyof typeof HOTSPOTS];
              return (
                <CountyRow
                  key={name}
                  name={name}
                  color={HOTSPOT_COLOR(record.score)}
                  value={record.score * 20}
                  marker={record.both ? '●' : undefined}
                  onClick={() => {
                    shouldScrollToDetail.current = true;
                    setMode('y2015');
                    setSelected(name);
                    window.history.replaceState(null, '', '#y2015');
                  }}
                />
              );
            })}
          </div>
        </>
      );
    }

    const counts = { severe: 0, high: 0, moderate: 0, watch: 0 };
    let benefitCount = 0;
    affectedNames.forEach((name) => {
      const record = event?.counties[name as keyof typeof event.counties];
      if (record && record.tier in counts) counts[record.tier as keyof typeof counts] += 1;
      if (record?.benefit) benefitCount += 1;
    });
    const documentedCount = counts.severe + counts.high + counts.moderate;
    return (
      <>
        <ListHeader
          title="Affected counties"
          count={<><b>{documentedCount}</b> documented ({counts.severe} severe · {counts.high} high · {counts.moderate} moderate) · {counts.watch} watch · {benefitCount} beneficial</>}
        />
        <div className="list">
          {affectedNames.map((name) => {
            const record = event?.counties[name as keyof typeof event.counties];
            if (!record) return null;
            const color = TIER[record.tier].color;
            return (
              <CountyRow
                key={name}
                name={name}
                color={color}
                value={RANK[record.tier] * 20}
                marker={record.benefit ? '✿' : undefined}
                onClick={() => setSelected(name)}
              />
            );
          })}
        </div>
      </>
    );
  }

  function renderDetail() {
    if (mode === 'hot') {
      const ranked = ALL_NAMES.filter((name) => HOTSPOTS[name as keyof typeof HOTSPOTS].score >= 3).sort(
        (a, b) =>
          HOTSPOTS[b as keyof typeof HOTSPOTS].score - HOTSPOTS[a as keyof typeof HOTSPOTS].score ||
          a.localeCompare(b),
      );
      return (
        <div className="card pad detail" id="detail">
          <h3 className="h">Chronic hotspots</h3>
          <p className="dnote">Top recurring counties: <b>{ranked.slice(0, 8).join(', ')}</b>.</p>
          <p className="hint" style={{ marginTop: 8 }}>Select a county in the list to open its 2015–16 record.</p>
        </div>
      );
    }

    if (forecast && forecastRecord && selectedName) {
      const bar = (label: string, value: number, color: string) => (
        <div className="risk-factor" key={label}>
          <div className="risk-factor-label"><span>{label}</span><span>{value}</span></div>
          <div className="bar risk-factor-bar"><i style={{ width: `${value}%`, background: color }} /></div>
        </div>
      );
      return (
        <div className="card pad detail" id="detail">
          <span className="dtier" style={{ background: RISK_COLOR[forecastRecord.band], color: '#08101c' }}>
            {forecastRecord.risk}/100 · {RISK_LABEL[forecastRecord.band]} risk
          </span>
          <p className="dname">{selectedName}</p>
          <p className="dnote">{forecastRecord.reason}</p>
          {bar('Historical recurrence', forecastRecord.hist, 'var(--high)')}
          {bar('ICPAC / KMD 2026 forecast signal', forecastRecord.fc, 'var(--acc)')}
          {bar('Structural exposure', forecastRecord.exp, 'var(--benefit)')}
          <p className="dmeta">Score = 40% historical + 35% forecast + 25% exposure, rounded to a 0–100 index. Historical input = worst tier recorded in 2015–16 / 2009–10 ({forecastRecord.worst}).</p>
        </div>
      );
    }

    if (!selectedName) {
      return (
        <div className="card pad detail" id="detail">
          <h3 className="h">County record</h3>
          <p className="hint">Select a county on the map or in the list to inspect this event.</p>
        </div>
      );
    }

    if (!selectedRecord || !event) {
      return (
        <div className="card pad detail" id="detail">
          <h3 className="h">County record</h3>
          <p className="dname">{selectedName}</p>
          <p className="dnote">No specific impact record for this event; treated as minimal / not reported.</p>
        </div>
      );
    }

    return (
      <div className="card pad detail" id="detail">
        <span className="dtier" style={{ background: TIER[selectedRecord.tier].color, color: '#08101c' }}>
          {TIER[selectedRecord.tier].label} impact
        </span>
        <p className="dname">{selectedName}</p>
        <p className="dnote">{selectedRecord.note}</p>
        <div>
          {selectedRecord.benefit && <span className="chip g">✿ rainfall beneficial</span>}
          <span className="chip">{event.label}</span>
        </div>
        <p className="dmeta">Legend: severe = major flooding/landslides &amp; displacement · high = significant, well-documented impact · moderate = reported localised impact · watch = national flooding, limited county detail.</p>
      </div>
    );
  }

  let eventTitle = event ? `${event.label} - ${event.tag}` : forecast ? `${forecast.label} - ${forecast.tag}` : 'Chronic El Niño hotspots';
  let eventPeriod = event?.period ?? forecast?.period ?? 'Counties hit in BOTH 2015–16 and 2009–10';
  let kpis = (event?.kpis ?? forecast?.kpis ?? []) as [string, string][];
  let summary = event?.summary ?? forecast?.summary ?? 'Counties that flooded in both historical El Niño events are the country’s structural flood hotspots - where river overflow, drainage failure and settlement on floodplains repeat decade after decade. Dashed green rings mark counties recorded in both events.';

  if (mode === 'hot') {
    const bothCount = ALL_NAMES.filter((name) => HOTSPOTS[name as keyof typeof HOTSPOTS].both).length;
    const highCount = ALL_NAMES.filter((name) => HOTSPOTS[name as keyof typeof HOTSPOTS].score >= 4).length;
    kpis = [[ 'counties in both events', String(bothCount) ], [ 'highest recurring risk', String(highCount) ]];
  }

  return (
    <main className="wrap">
      <header>
        <div className="brand">
          <a className="logolockup" href="/about" aria-label="About DEGEM and this mapper">
            <span className="logotile">D</span>
            <span className="logoword"><span className="c-d">D</span><span className="c-e">E</span><span className="c-g">G</span><span className="c-e2">E</span><span className="c-m">M</span></span>
            <span className="logodot" />
          </a>
          <div className="badge">Kenya · County-level · Historical</div>
          <h1>Super El Niño Mapper <b>- Kenya</b></h1>
          <p>How the <b>1997–98</b>, <b>2009–10</b>, and <b>2015–16</b> El Niño floods affected Kenya, plus a county-level <b>2026 outlook</b>, live weather, and the Atlantic hurricane record across ENSO phases.</p>
        </div>
        <nav className="tabs" aria-label="Map views">
          {TABS.map((tab, index) => 'separator' in tab ? (
            <span className="tabsep" aria-hidden="true" key={`separator-${index}`} />
          ) : (
            <button
              className={`tab${mode === tab.mode ? ' on' : ''}`}
              type="button"
              key={tab.mode}
              aria-pressed={mode === tab.mode}
              onClick={() => switchMode(tab.mode)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {mode === 'wx' ? <WeatherView /> : mode === 'atl' ? <AtlanticView /> : mode === 'y1997' ? <ProvinceView /> : (
      <div className="grid" id="maingrid">
        <section className="card mapcard" aria-label="County impact map">
          <div className="tools">
            <input
              type="search"
              aria-label="Search a county"
              placeholder="Search a county..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="map-container" ref={mapContainer} onMouseLeave={() => setTooltip(null)}>
            <svg id="map" viewBox={DATA.viewBox.join(' ')} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Map of Kenya's 47 counties">
              <g>
                {ALL_NAMES.map((name) => (
                  <path
                    key={name}
                    d={DATA.boundaries[name as keyof typeof DATA.boundaries]}
                    className={`county${mode !== 'hot' && selectedName === name ? ' sel' : ''}${mode !== 'hot' && normalizedQuery && !name.toLowerCase().includes(normalizedQuery) ? ' dim' : ''}`}
                    fill={countyFill(name)}
                    onClick={() => setSelected(name)}
                    onMouseMove={(e) => showTooltip(name, e.clientX, e.clientY)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setSelected(name);
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`${name}${mode === 'y2026' ? `, ${forecastCounties[name as keyof typeof forecastCounties].risk} risk` : ''}`}
                  />
                ))}
              </g>
              <g>
                {ALL_NAMES.filter((name) => mode === 'hot'
                  ? HOTSPOTS[name as keyof typeof HOTSPOTS].both
                  : countyHasBenefit(name)).map((name) => (
                  <path
                    key={name}
                    d={DATA.boundaries[name as keyof typeof DATA.boundaries]}
                    className="benefit-ring"
                  />
                ))}
              </g>
              <g>
                {ALL_NAMES.map((name) => (
                  <text
                    key={name}
                    className="cty-label"
                    textAnchor="middle"
                    x={DATA.centroids[name as keyof typeof DATA.centroids][0]}
                    y={DATA.centroids[name as keyof typeof DATA.centroids][1]}
                    style={countyLabelStyle(name, mapWidth)}
                  >
                    {name}
                  </text>
                ))}
              </g>
            </svg>
            {tooltip && (
              <div className="tip" style={{ left: tooltip.left, top: tooltip.top, opacity: 1 }}>
                <b>{tooltip.county}</b><br />
                <span>
                  {mode === 'y2026'
                    ? `2026 risk ${forecastCounties[tooltip.county as keyof typeof forecastCounties].risk}/100 · ${RISK_LABEL[forecastCounties[tooltip.county as keyof typeof forecastCounties].band]}`
                    : mode === 'hot'
                      ? `${HOTSPOTS[tooltip.county as keyof typeof HOTSPOTS].both ? 'Recorded in both events' : 'Historical record'} · recurrence score ${HOTSPOTS[tooltip.county as keyof typeof HOTSPOTS].score}/5`
                      : `${(event?.counties[tooltip.county as keyof typeof event.counties]?.tier && TIER[event.counties[tooltip.county as keyof typeof event.counties]!.tier].label) || 'Minimal / not reported'}${countyHasBenefit(tooltip.county) ? ' · beneficial rains' : ''}`}
                </span>
              </div>
            )}
          </div>
          <div className="legendbar">{legend}</div>
        </section>

        <aside className="side">
          <section className="card pad">
            <h2 className="h">Event</h2>
            <p className="evtitle">{eventTitle}</p>
            <p className="evtag">{eventPeriod}</p>
            <div className="kpis">
              {kpis.map(([label, value]) => (
                <div className="kpi" key={label}><b>{value}</b><span>{label}</span></div>
              ))}
            </div>
            <p className="summary">{summary}</p>
          </section>
          {forecast && (
            <section className="card pad timeline-card">
              <h2 className="h">Probable timeline · OND 2026</h2>
              <p className="hint timeline-intro">Month-by-month outlook from NOAA CPC, ICPAC and KMD signals</p>
              <div className="tl">
                {forecast.timeline.map((entry) => (
                  <article className="tln" key={entry.k} style={{ '--timeline-color': entry.c } as React.CSSProperties}>
                    <div className="tlhead"><span className="tlm">{entry.k}</span><span className="tlp">{entry.ph}</span><span className="tlb">{entry.b}</span></div>
                    <p className="tlt">{entry.t}</p>
                  </article>
                ))}
              </div>
              <p className="hint timeline-source">{forecast.tlsrc}</p>
              <p className="hint timeline-weather">Live during the season: use the <b>Weather</b> tab for current conditions and a 7-day outlook across Kenya’s 47 counties.</p>
            </section>
          )}
          {renderDetail()}
          <section className="card pad list-panel">{renderList()}</section>
        </aside>
      </div>
      )}

      <section className="card foot mapper-footer">
        <div className="credit">
          <span className="logotile">D</span>
          <span>Super El Niño Mapper — Kenya · built and maintained by <b>DEGEM</b> · 2026</span>
        </div>
        <a href="/about">Method &amp; sources →</a>
      </section>
    </main>
  );
}

function LegendItem({ color, label, dashed = false }: { color: string; label: string; dashed?: boolean }) {
  return (
    <div className="lg">
      <span className={`sw${dashed ? ' dashed' : ''}`} style={{ background: color }} />
      {label}
    </div>
  );
}

function ListHeader({ title, count }: { title: string; count: React.ReactNode }) {
  return (
    <div className="list-header">
      <h2 className="h">{title}</h2>
      <span className="hint">{count}</span>
    </div>
  );
}

function CountyRow({
  name,
  color,
  value,
  displayValue,
  marker,
  onClick,
}: {
  name: string;
  color: string;
  value: number;
  displayValue?: number;
  marker?: string;
  onClick: () => void;
}) {
  return (
    <button className="row" type="button" onClick={onClick}>
      <span className="dot" style={{ background: color }} />
      <span className="nm">{name}</span>
      {displayValue !== undefined && <span className="row-value">{displayValue}</span>}
      <span className="bar"><i style={{ width: `${value}%`, background: color }} /></span>
      {marker && <span className={`row-marker${marker === '●' ? ' benefit' : ''}`}>{marker}</span>}
    </button>
  );
}
