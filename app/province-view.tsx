'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import DATA from './data.json';
import PROVINCE_MAP from './province-map.json';

type Tier = 'severe' | 'high' | 'moderate' | 'watch' | 'minimal';
type Province = (typeof PROVINCE_MAP.provinces)[number] & { tier: Tier; counties: string[]; note: string; path: string };
type HoveredProvince = { name: string; left: number; top: number } | null;

const PROVINCES = PROVINCE_MAP.provinces as Province[];
const TIERS: Record<Tier, { color: string; label: string; rank: number }> = {
  severe: { color: 'var(--severe)', label: 'Severe', rank: 5 },
  high: { color: 'var(--high)', label: 'High', rank: 4 },
  moderate: { color: 'var(--moderate)', label: 'Moderate', rank: 3 },
  watch: { color: 'var(--watch)', label: 'Watch', rank: 2 },
  minimal: { color: 'var(--minimal)', label: 'No record', rank: 1 },
};

function countyArea(name: string) {
  const path = DATA.boundaries[name as keyof typeof DATA.boundaries];
  const coordinates = path.match(/-?\d*\.?\d+/g)?.map(Number) ?? [];
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
  return (maxX - minX) * (maxY - minY);
}

function countyFontSize(area: number) {
  return area > 60000 ? 13 : area > 20000 ? 12 : area > 6000 ? 11 : area > 2000 ? 10 : 9.5;
}

export default function ProvinceView() {
  const [selected, setSelected] = useState('North Eastern');
  const [mapWidth, setMapWidth] = useState(0);
  const [hovered, setHovered] = useState<HoveredProvince>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const event = DATA.events.y1997;
  const selectedProvince = PROVINCES.find((province) => province.name === selected) ?? PROVINCES[0];

  useEffect(() => {
    const svg = mapContainer.current?.querySelector('svg');
    if (!svg) return;
    const measure = () => setMapWidth(svg.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  const provinceLabels = useMemo(() => PROVINCES.map((province) => {
    let weightedX = 0;
    let weightedY = 0;
    let totalWeight = 0;
    province.counties.forEach((name) => {
      const centroid = DATA.centroids[name as keyof typeof DATA.centroids];
      if (!centroid) return;
      const weight = countyArea(name) + 1;
      weightedX += centroid[0] * weight;
      weightedY += centroid[1] * weight;
      totalWeight += weight;
    });
    return {
      name: province.name,
      x: totalWeight ? weightedX / totalWeight : 0,
      y: totalWeight ? weightedY / totalWeight : 0,
    };
  }), []);

  const ranked = [...PROVINCES].sort((a, b) => TIERS[b.tier].rank - TIERS[a.tier].rank || a.name.localeCompare(b.name));
  const recordedCount = PROVINCES.filter((province) => province.tier !== 'minimal').length;

  function placeTooltip(name: string, clientX: number, clientY: number) {
    const bounds = mapContainer.current?.getBoundingClientRect();
    if (!bounds) return;
    const left = clientX - bounds.left + 14;
    setHovered({
      name,
      left: left > bounds.width - 250 ? left - 270 : left,
      top: clientY - bounds.top + 14,
    });
  }

  return (
    <div className="grid province-grid">
      <section className="card mapcard" aria-label="1997–98 Kenya province impact map">
        <div className="map-container province-map-container" ref={mapContainer} onMouseLeave={() => setHovered(null)}>
          <svg id="map" viewBox={DATA.viewBox.join(' ')} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Clickable map of Kenya's pre-2010 provinces">
            {PROVINCES.map((province) => (
              <path
                key={province.name}
                d={province.path}
                className={`province-shape${selected === province.name ? ' sel' : ''}`}
                fill={TIERS[province.tier].color}
                fillRule="evenodd"
                stroke="#fff"
                strokeWidth={selected === province.name ? 3.1 : 2}
                strokeOpacity={selected === province.name ? 1 : 0.92}
                strokeLinejoin="round"
                tabIndex={0}
                role="button"
                aria-label={`${province.name} Province, ${TIERS[province.tier].label} impact`}
                onClick={() => setSelected(province.name)}
                onMouseMove={(event) => placeTooltip(province.name, event.clientX, event.clientY)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelected(province.name);
                  }
                }}
              ><title>{`${province.name} Province · ${TIERS[province.tier].label} impact · 1997–98`}</title></path>
            ))}
            {provinceLabels.map((label) => (
              <text
                key={label.name}
                className="cty-label province-label"
                textAnchor="middle"
                x={label.x}
                y={label.y}
                style={{ fontSize: mapWidth ? `${13 * 1000 / mapWidth}px` : undefined }}
              >{label.name}</text>
            ))}
          </svg>
          {hovered && (
            <div className="tip province-tooltip" style={{ left: hovered.left, top: hovered.top, opacity: 1 }}>
              <b>{hovered.name} Province</b><br />
              <span>{TIERS[PROVINCES.find((province) => province.name === hovered.name)?.tier ?? 'minimal'].label} impact · 1997–98</span>
            </div>
          )}
        </div>
        <div className="legendbar">
          {(Object.entries(TIERS) as [Tier, (typeof TIERS)[Tier]][]).map(([tier, item]) => (
            <div className="lg" key={tier}><span className="sw" style={{ background: item.color }} />{item.label}</div>
          ))}
        </div>
      </section>

      <aside className="side province-side">
        <section className="card pad">
          <h2 className="h">1997–98 event</h2>
          <p className="evtitle">{event.label} - {event.tag}</p>
          <p className="evtag">{event.period}</p>
          <div className="kpis">
            {event.kpis.map(([label, value]) => <div className="kpi" key={label}><b>{value}</b><span>{label}</span></div>)}
          </div>
          <p className="summary">{event.summary}</p>
        </section>

        <section className="card pad detail">
          <span className="dtier" style={{ background: TIERS[selectedProvince.tier].color, color: '#08101c' }}>{TIERS[selectedProvince.tier].label} impact</span>
          <p className="dname">{selectedProvince.name} Province</p>
          <p className="dnote">{selectedProvince.note}</p>
          <span className="chip">1997–98 El Niño</span>
          <p className="dmeta">Districts in this province: {selectedProvince.counties.join(', ')}. Provinces are shown as their pre-2010 county groupings.</p>
        </section>

        <section className="card pad list-panel province-list-panel">
          <div className="list-header"><h2 className="h">Provinces</h2><span className="hint"><b>{recordedCount}</b> with records · {PROVINCES.length - recordedCount} no record</span></div>
          <div className="list">
            {ranked.map((province) => (
              <button className={`row${selected === province.name ? ' province-row-selected' : ''}`} type="button" key={province.name} onClick={() => setSelected(province.name)}>
                <span className="dot" style={{ background: TIERS[province.tier].color }} />
                <span className="nm">{province.name}</span>
                <span className="bar"><i style={{ width: `${TIERS[province.tier].rank * 20}%`, background: TIERS[province.tier].color }} /></span>
              </button>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}
