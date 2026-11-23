'use client';

import DATA from './data.json';

const NEWS = [
  {
    ts: '2026-11-14T09:00+03:00', county: 'Turkana', kind: 'flood', stat: '>100 homes',
    title: 'Flash floods destroy more than 100 homes',
    body: 'Over 100 families were left without shelter and transport was disrupted across several areas. Police carrying KCSE exam papers were stranded for more than an hour on Friday.',
    src: 'Citizen Digital', url: 'https://citizen.digital/article/floods-destroy-over-100-homes-in-turkana-sweep-away-livestock-in-tana-river-n393919',
  },
  {
    ts: '2026-11-13T18:08+03:00', county: 'Tana River', kind: 'flood', stat: '>300 households',
    title: 'Wardesa river bursts its banks; 300+ households hit',
    body: 'Floodwater reached Eldera, Kono Ramadha and Mata Wardesa. The Kono Ramadha-Mlanjo road is cut off and Kenya Red Cross teams are assessing needs while warning communities downstream.',
    src: 'The Star / Kenya Red Cross', url: 'https://www.the-star.co.ke/news/2026-11-13-over-300-households-affected-as-floods-hits-tana-river',
  },
  {
    ts: '2026-11-14T08:30+03:00', county: 'Tana River', kind: 'livelihood', stat: '200+ livestock',
    title: 'Kote village cut off; 200+ livestock swept away',
    body: 'Overnight rain took goats and household goods from Kote. One resident counted 23 animals left of about 300. The village is unreachable by road, and police vehicles could not get through.',
    src: 'Citizen Digital', url: 'https://citizen.digital/article/floods-destroy-over-100-homes-in-turkana-sweep-away-livestock-in-tana-river-n393919',
  },
  {
    ts: '2026-11-14T10:00+03:00', county: 'Kenya', kind: 'forecast', stat: 'Rain continues',
    title: 'KMD: rainfall to persist into next week',
    body: 'The Kenya Meteorological Department expects the rains to continue, so further flooding remains possible along the Tana and in Turkana.',
    src: 'KMD via Citizen Digital', url: 'https://citizen.digital/article/floods-destroy-over-100-homes-in-turkana-sweep-away-livestock-in-tana-river-n393919',
  },
] as const;

function newsWhen(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Nairobi',
  }) + ' EAT';
}

export default function NewsView({ onCounty }: { onCounty: (county: string) => void }) {
  const items = [...NEWS].sort((a, b) => {
    const forecastDifference = (a.kind === 'forecast' ? 1 : 0) - (b.kind === 'forecast' ? 1 : 0);
    if (forecastDifference) return forecastDifference;
    return new Date(b.ts).getTime() - new Date(a.ts).getTime();
  });
  const counties = [...new Set(items.filter((item) => item.county !== 'Kenya').map((item) => item.county))];

  return (
    <section className="card pad news-view">
      <div className="atlhead">
        <div>
          <h2 className="h news-title"><span className="ndot" />BREAKING · FLOOD IMPACTS</h2>
          <p className="atlsub">What the OND rains are doing on the ground, county by county. Curated from Kenyan outlets and the Kenya Red Cross as reports are confirmed — not an automated feed.</p>
        </div>
        <span className="hint">Updated 14 Nov 2026 · 10:00 EAT</span>
      </div>

      <div className="nkpis">
        <div className="nkpi"><b>{items.length}</b><span>reports logged</span></div>
        <div className="nkpi"><b>{counties.length}</b><span>counties with flood reports</span></div>
        <div className="nkpi"><b>&gt;300</b><span>households affected, Tana River</span></div>
        <div className="nkpi"><b>&gt;100</b><span>homes destroyed, Turkana</span></div>
      </div>

      <div className="nfeed">
        {items.map((item) => {
          const validCounty = Object.prototype.hasOwnProperty.call(DATA.boundaries, item.county);
          return (
            <article className={`nitem ${item.kind}`} key={`${item.ts}-${item.title}`}>
              <div className="nmeta">
                {item.county === 'Kenya' ? (
                  <span className="nchip national">National</span>
                ) : (
                  <button
                    className="nchip"
                    type="button"
                    disabled={!validCounty}
                    onClick={() => onCounty(item.county)}
                  >{item.county}</button>
                )}
                <time dateTime={item.ts}>{newsWhen(item.ts)}</time>
              </div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <div className="nfoot"><span className="nstat">{item.stat}</span><a href={item.url} target="_blank" rel="noopener noreferrer">{item.src} ↗</a></div>
            </article>
          );
        })}
      </div>

      <p className="nsrc">
        Figures are as reported by each outlet; they are not independently verified and often change as assessments complete. Tana River and Turkana are both top-tier counties in the <b>2026 outlook</b>; this is the event that model was built for. Click a county name to open its 2026 record.
      </p>
    </section>
  );
}
