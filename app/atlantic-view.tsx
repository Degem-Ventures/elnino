import seasons from './atlantic.json';

type Season = (typeof seasons)[number];
type Phase = 'ln' | 'en' | 'nu';

const PHASES: Record<Phase, { label: string; color: string }> = {
  ln: { label: 'La Niña', color: '#7dd3fc' },
  en: { label: 'El Niño', color: '#fb923c' },
  nu: { label: 'Neutral', color: '#cbd5e1' },
};

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export default function AtlanticView() {
  const maximum = Math.max(...seasons.map((season) => season.h));
  const groups = (['ln', 'en', 'nu'] as const).map((phase) => {
    const rows = seasons.filter((season) => season.g === phase);
    const mean = rows.reduce((sum, season) => sum + season.h, 0) / rows.length;
    const majorMean = rows.reduce((sum, season) => sum + season.m, 0) / rows.length;
    return { phase, rows, mean, majorMean, median: median(rows.map((season) => season.h)) };
  });
  const totalHurricanes = seasons.reduce((sum, season) => sum + season.h, 0);
  const totalMajor = seasons.reduce((sum, season) => sum + season.m, 0);
  const sorted = [...seasons].sort((a, b) => b.y - a.y);

  return (
    <section className="card pad atl-view">
      <div className="atlhead">
        <div>
          <h2 className="h atl-title">Atlantic hurricane activity &amp; ENSO phases</h2>
          <p className="atlsub">
            El Niño, La Niña, neutral: how each Atlantic season actually ran. A hurricane has maximum
            sustained winds of at least 74 mph; major means Category 3 or higher. Counts are from
            NOAA/NHC HURDAT2, paired with the historical ENSO winter and peak-season phase.
          </p>
        </div>
        <span className="hint">2007–2025 · {seasons.length} seasons</span>
      </div>

      <div className="atlkpis">
        {groups.map(({ phase, rows, mean, majorMean, median: phaseMedian }) => (
          <div className="atlkpi" key={phase}>
            <span className="lab" style={{ color: PHASES[phase].color }}>{PHASES[phase].label} seasons</span>
            <b>{mean.toFixed(1)}</b>
            <span>avg hurricanes/season · {rows.length} seasons · median {phaseMedian} · {majorMean.toFixed(1)} major</span>
          </div>
        ))}
        <div className="atlkpi">
          <span className="lab" style={{ color: 'var(--acc)' }}>Record spread</span>
          <b>21 / 2</b>
          <span>Busiest 2021 (La Niña), quietest 2013 (neutral) · {totalHurricanes} hurricanes and {totalMajor} major across {seasons.length} seasons</span>
        </div>
      </div>

      <div className="chart" role="img" aria-label="Atlantic hurricanes by year and ENSO phase, 2007 through 2025">
        <div className="chartin">
          <div className="bars">
            {seasons.map((season) => (
              <div
                className="bcol"
                key={season.y}
                title={`${season.y} · ${season.ph} — ${season.h} hurricanes, ${season.m} major (Cat 3+)`}
                aria-label={`${season.y}, ${season.ph}: ${season.h} hurricanes, ${season.m} major`}
              >
                <span className="bval">{season.h}</span>
                <div className="bar2" style={{ height: `${(season.h / maximum) * 100}%`, background: PHASES[season.g as Phase].color }}>
                  <i style={{ height: `${(season.m / season.h) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="byr">{seasons.map((season) => <span key={season.y}>{season.y}</span>)}</div>
        </div>
      </div>

      <div className="atllegend">
        {(Object.entries(PHASES) as [Phase, (typeof PHASES)[Phase]][]).map(([phase, value]) => (
          <div className="lg" key={phase}><span className="sw" style={{ background: value.color }} />{value.label}</div>
        ))}
        <div className="lg"><span className="sw major-swatch" />Dark base = major hurricanes (Cat 3+)</div>
      </div>

      <div className="world-strip card pad">
        <div className="wtitle">WORLD · EQUAL EARTH — true-area projection</div>
        <svg viewBox="0 0 1000 486" preserveAspectRatio="xMidYMid meet" role="img" aria-label="World map showing Kenya and the Niño 3.4 region">
          <path className="world-land" d="M125 96 L245 48 L355 64 L430 118 L386 188 L278 208 L190 178 Z M420 205 L505 165 L610 188 L670 248 L605 318 L500 300 L448 260 Z M650 80 L760 45 L865 86 L890 156 L810 190 L720 164 Z M555 330 L625 322 L682 385 L650 445 L575 425 Z" />
          <path className="world-land" d="M300 230 L356 248 L330 352 L285 410 L250 340 Z M730 220 L820 205 L900 260 L870 330 L790 318 Z" />
          <rect className="nino-box" x="125" y="218" width="138" height="48" rx="3" />
          <circle className="kenya-ring" cx="655" cy="260" r="17" />
          <circle className="kenya-dot" cx="655" cy="260" r="6.5" />
        </svg>
        <div className="world-caption"><span><i className="kenya-key" />Kenya</span><span><i className="nino-key" />Niño 3.4 · +1.8 °C</span><span>Equal Earth · true area</span></div>
      </div>

      <h3 className="h atl-section-title">Annual breakdown, 2007–2025</h3>
      <div className="tablewrap">
        <table className="atl">
          <thead><tr><th>Year</th><th>ENSO phase (winter / peak season)</th><th>Total hurricanes</th><th>Major (Cat 3+)</th><th>Season intensity</th></tr></thead>
          <tbody>
            {sorted.map((season) => (
              <tr key={season.y}>
                <td className="num">{season.y}</td>
                <td><span className={`ph ${season.g}`}>{season.ph}</span></td>
                <td className="num">{season.h}</td>
                <td className="num">{season.m}</td>
                <td><span className="bar"><i style={{ width: `${(season.h / maximum) * 100}%`, background: PHASES[season.g as Phase].color }} /></span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="h atl-section-title">Key observations &amp; climate context</h3>
      <div className="ins">
        <div><b className="elnino-text">El Niño suppression</b><p>Strong El Niño years 2015 and 2009 produced just 4 and 3 hurricanes, respectively, as elevated Atlantic wind shear can inhibit storm development.</p></div>
        <div><b className="elnino-text">The 2023 outlier</b><p>Despite a rapidly strengthening El Niño, record-warm Atlantic sea-surface temperatures accompanied a hyperactive 20-hurricane season.</p></div>
        <div><b className="lanina-text">La Niña powerhouses</b><p>La Niña years included 21 hurricanes in 2021 and 14 each in 2020 and 2022. The 2022 season logged 9 major hurricanes, the most in this record.</p></div>
        <div><b className="benefit-text">The wider ENSO signal</b><p>ENSO affects weather patterns around the world. Compare the Atlantic record with Kenya’s historical impacts and the 2026 outlook in the mapper.</p></div>
      </div>
      <p className="hint atl-source">Read the averages with care: transition years are grouped by their dominant peak-season signal. Source: <a href="https://www.nhc.noaa.gov/data/" target="_blank" rel="noopener noreferrer">NOAA / NHC HURDAT2</a>.</p>
    </section>
  );
}
