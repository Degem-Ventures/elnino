import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About · Super El Niño Mapper - Kenya',
  description:
    'About the Kenya county-level El Niño mapper, its data sources, outlook, weather view, and Atlantic ENSO analysis.',
};

const views = [
  {
    href: '/#y2009',
    color: 'var(--watch)',
    title: '2009–10 event',
    description: 'The short-rains flood season, with national reports and county-by-county impacts.',
  },
  {
    href: '/#y2015',
    color: 'var(--severe)',
    title: '2015–16 event',
    description: 'A detailed record of the strongest El Niño since 1997–98 and its impacts across Kenya.',
  },
  {
    href: '/#y2026',
    color: 'var(--high)',
    title: '2026 outlook',
    description: 'A county-level risk index and month-by-month OND timeline based on cited forecast signals.',
  },
  {
    href: '/#hot',
    color: 'var(--moderate)',
    title: 'Chronic hotspots',
    description: 'Counties with documented impacts in both historical El Niño events.',
  },
  {
    href: '/#atl',
    color: 'var(--acc)',
    title: 'Atlantic hurricanes & ENSO',
    description: 'Hurricane seasons from 2007–2025 grouped by their ENSO phase.',
  },
  {
    href: '/#wx',
    color: 'var(--benefit)',
    title: 'Weather',
    description: 'Current conditions and a seven-day outlook for each county, powered by Open-Meteo.',
  },
];

const sources = [
  ['NOAA CPC — ENSO Diagnostic Discussion (10 Sep 2026)', 'https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml'],
  ['ICPAC — wetter-than-normal OND 2026 (18 Aug 2026)', 'https://www.icpac.net/news/the-greater-horn-of-africa-is-expected-to-experience-a-wetter-than-normal-october-december-ond-2026-season-as-el-ni%C3%B1o-strengthens/'],
  ['KMD — OND 2026 forecast (Oct 2026)', 'https://meteo.go.ke/our-products/seasonal-forecast/october-november-december-ond-2026-seasonal-weather-forecast'],
  ['WMO — El Niño impacts Greater Horn of Africa', 'https://wmo.int/media/news/el-nino-impacts-greater-horn-of-africa'],
  ['IRI (Columbia) — ENSO forecast', 'https://iri.columbia.edu/our-expertise/climate/forecasts/enso/current/'],
  ['RC Climate Centre — Preparing for 2015–16', 'https://www.climatecentre.org/wp-content/uploads/Preparing-for-the-2015-2016-El-Nino.pdf'],
  ['FloodList — Narok landslide (18 Nov 2015)', 'https://floodlist.com/africa/kenya-floods-heavy-rain-el-nino-2015'],
  ['Kenya Red Cross — Rainfall Report 17 (Nov 2015)', 'https://reliefweb.int/report/kenya/el-nino-rainfall-monitoring-report-17-november-10-2015'],
  ['WFP — El Niño Situation Report #1 (Dec 2015)', 'https://reliefweb.int/node/1290936'],
  ['IFRC DREF MDRKE011 — Floods 2010', 'https://www.ifrc.org/docs?file=appeals/10/MDRKE011.pdf'],
  ['IFRC EPoA MDRKE036 — Kenya: Floods (4 Jan 2016)', 'https://reliefweb.int/report/kenya/kenya-floods-emergency-plan-action-mdrke036'],
  ['OCHA — Floods Situation Report No. 2 (4 Nov 2009)', 'https://reliefweb.int/report/kenya/kenya-floods-situation-report-no-2-04-nov-2009'],
  ['OCHA — Floods Situation Report No. 2 (5 Jan 2010)', 'https://www.unocha.org/publications/report/kenya/kenya-floods-situation-report-no-2-05-jan-2010'],
  ['OCHA — Floods Situation Report No. 3 (12 Jan 2010)', 'https://www.unocha.org/publications/report/kenya/kenya-floods-situation-report-no-3-12-jan-2010'],
  ['OCHA — Floods Situation Report No. 1 (21 Apr 2009)', 'https://www.unocha.org/publications/report/kenya/kenya-floods-situation-report-no-1-21-apr-2009'],
  ['Nation Africa — El Niño: 18 counties flagged', 'https://nation.africa/kenya/climate/el-ni%C3%B1o-18-counties-flagged-as-high-risk-5552916'],
  ['geoBoundaries — Kenya ADM1 boundaries', 'https://www.geoboundaries.org/api/current/gbOpen/KEN/ADM1/'],
];

export default function AboutPage() {
  return (
    <main className="about-wrap">
      <header className="about-top">
        <a className="logolockup" href="/" title="Back to the mapper">
          <span className="logotile">D</span>
          <span className="logoword"><span className="c-d">D</span><span className="c-e">E</span><span className="c-g">G</span><span className="c-e2">E</span><span className="c-m">M</span></span>
          <span className="logodot" />
        </a>
        <nav className="about-nav" aria-label="About page navigation">
          <a href="/#y2026">2026 outlook</a>
          <a href="/#wx">Weather</a>
          <a href="/#atl">Atlantic &amp; ENSO</a>
          <a href="/#hot">Hotspots</a>
          <a className="about-cta" href="/">Open the mapper →</a>
        </nav>
      </header>

      <section className="about-hero">
        <span className="badge">Kenya · County-level · El Niño intelligence</span>
        <h1>El Niño, mapped <b>county by county</b></h1>
        <p className="about-lede">How the <b>2009–10</b> and <b>2015–16</b> El Niño floods affected Kenya’s 47 counties, a transparent county-level <b>2026 outlook</b>, and how ENSO phases Atlantic hurricane seasons.</p>
        <div className="about-actions">
          <a className="about-button primary" href="/">Open the mapper →</a>
          <a className="about-button secondary" href="/#y2026">See the 2026 outlook</a>
        </div>
        <div className="about-stats">
          <div><b>47</b><span>counties mapped</span></div>
          <div><b>2</b><span>historical El Niño events</span></div>
          <div><b>0–100</b><span>2026 county risk index</span></div>
          <div><b>19</b><span>Atlantic seasons by ENSO phase</span></div>
        </div>
      </section>

      <h2 className="about-section-title">Six views inside the mapper</h2>
      <div className="about-cards">
        {views.map((view) => (
          <a className="about-card" href={view.href} key={view.title}>
            <span className="about-card-title"><i style={{ background: view.color }} />{view.title}</span>
            <p>{view.description}</p>
            <span className="about-go">Open view →</span>
          </a>
        ))}
      </div>

      <h2 className="about-section-title">How it was built</h2>
      <section className="about-panel">
        <figure>
          <img src="/assets/process-diagram.png" alt="Data pipeline: historical El Niño records to impact coding, boundaries, interactive map and insight" />
          <figcaption>Data pipeline — from historical El Niño records to the county-level interactive map.</figcaption>
        </figure>
        <ul>
          <li><b>Impact records</b> coded from OCHA, IFRC, Kenya Red Cross, WFP, and reporting on the 2009–10 and 2015–16 events.</li>
          <li><b>Boundaries</b> from geoBoundaries — Kenya ADM1, all 47 counties.</li>
          <li><b>2026 index</b> = 0.40 × historical recurrence + 0.35 × ICPAC/KMD forecast signal + 0.25 × structural exposure.</li>
          <li><b>Atlantic module</b> uses NOAA/NHC HURDAT2 hurricane counts paired with historical ENSO phases.</li>
        </ul>
        <p className="hint about-caveat">The 2026 figure is a transparent planning index, not a physics-based hydrological forecast. Forecast skill declines for smaller areas and farther into the future. Consult the current official sources before making operational decisions.</p>
      </section>

      <h2 className="about-section-title">Method &amp; interpretation</h2>
      <section className="about-panel about-method">
        <p>Tier = documented impact level in the two events (severe / high / moderate / watch / minimal). “Benefit” flags counties where extra rainfall was reported as positive for crops or livestock. “Watch” means national flooding was reported, but county-specific detail is limited. Figures are ranges reported by cited agencies, not exact census totals.</p>
        <p><b>2026 model.</b> Risk (0–100) = 0.40 × historical recurrence + 0.35 × ICPAC/KMD 2026 forecast signal + 0.25 × structural exposure. This is a planning index, not a physics-based hydrological forecast; skill declines at smaller scales and beyond a season.</p>
      </section>

      <h2 className="about-section-title" id="sources">Sources</h2>
      <section className="about-panel">
        <ol className="about-sources">
          {sources.map(([label, url]) => <li key={url}><a href={url} target="_blank" rel="noopener noreferrer">{label}</a></li>)}
        </ol>
      </section>

      <footer className="about-footer">
        <div className="credit"><span className="logotile">D</span><span>Super El Niño Mapper — Kenya · built and maintained by <b>DEGEM</b> · 2026</span></div>
        <nav aria-label="Footer navigation">
          <a href="/">Mapper</a>
          <a href="/about#sources">Sources</a>
          <a href="https://elninomapper.gt.tc/stats.php?key=dgm_7f3c1a9e5b2d48c6&i=1" target="_blank" rel="noopener noreferrer">Visitor stats ↗</a>
        </nav>
      </footer>
    </main>
  );
}
