# -*- coding: utf-8 -*-
"""Build the Super El Nino Mapper (Kenya) single-file interactive HTML."""
import json, math, os

HERE = os.path.dirname(os.path.abspath(__file__))
GEO = os.path.join(HERE, 'assets', 'kenya_counties.geojson')
OUT = os.path.join(HERE, 'index.html')

gj = json.load(open(GEO, encoding='utf-8'))

# ---------- projection (Mercator) ----------
def merc(lon, lat):
    x = math.radians(lon)
    y = math.log(math.tan(math.pi/4 + math.radians(lat)/2))
    return x, y

# gather bounds
minx=miny=1e9; maxx=maxy=-1e9
def walk(coords):
    global minx,miny,maxx,maxy
    for c in coords:
        if isinstance(c[0], (int,float)):
            x,y=merc(c[0],c[1])
            minx=min(minx,x); maxx=max(maxx,x); miny=min(miny,y); maxy=max(maxy,y)
        else:
            walk(c)

for f in gj['features']:
    walk(f['geometry']['coordinates'])

W = 1000.0
pad = 14.0
scale = (W - 2*pad) / (maxx - minx)
H = (maxy - miny) * scale + 2*pad

def proj(lon, lat):
    x, y = merc(lon, lat)
    px = pad + (x - minx) * scale
    py = pad + (maxy - y) * scale
    return px, py

def ring_path(ring, prec=1):
    pts=[]
    for i,(lon,lat) in enumerate(ring):
        px,py=proj(lon,lat)
        pts.append(('M' if i==0 else 'L')+f"{px:.{prec}f} {py:.{prec}f}")
    pts.append('Z')
    return ''.join(pts)

def poly_path(poly):
    return ''.join(ring_path(r) for r in poly)

paths={}
centroids={}
for f in gj['features']:
    name=f['properties']['shapeName']
    g=f['geometry']
    d=''
    if g['type']=='Polygon':
        d=poly_path(g['coordinates'])
        # centroid from outer ring bounding box
        xs=[c[0] for c in g['coordinates'][0]]; ys=[c[1] for c in g['coordinates'][0]]
    else:
        d=''.join(poly_path(p) for p in g['coordinates'])
        big=max(g['coordinates'], key=lambda p: len(p[0]))
        xs=[c[0] for c in big[0]]; ys=[c[1] for c in big[0]]
    cx,cy=proj(sum(xs)/len(xs), sum(ys)/len(ys))
    paths[name]=d
    centroids[name]=[round(cx,1),round(cy,1)]

# ---------- impact data ----------
# tier: severe | high | moderate | watch | minimal ; benefit: bool
D2015 = {
 'Tana River': ('severe','Lower Tana River burst its banks repeatedly through Nov-Dec 2015; tens of thousands displaced, prolonged food & NFI response.', False),
 'Garissa': ('severe','River Tana overflow; Dadaab refugee complex inundated; 1,000+ families displaced; relief access roads cut.', True),
 'Kisumu': ('severe','River Nyando burst its banks; floodplain villages (Nyando, Nyakach, Awasi) evacuated; SMS + loudspeaker early warnings.', False),
 'Busia': ('high','Budalangi floodplain and Nzoia basin flooded; chronic El Niño flood zone.', False),
 'Siaya': ('high','Lake Victoria basin flooding; crop and property losses.', False),
 'Homa Bay': ('high','Flood-prone areas mapped; residents in risk zones alerted; lake-basin floods.', False),
 'Migori': ('high','Western Kenya flooding; eroded soils, damaged crops and livestock (ICPAC).', False),
 'Bungoma': ('high','Western Kenya flooding; soil erosion, infrastructure and crop damage (ICPAC).', False),
 'Kakamega': ('moderate','Western Kenya rains; localized flooding.', False),
 'Vihiga': ('moderate','Western Kenya rains; localized flooding.', False),
 'Narok': ('high','Deadliest county: 10+ killed in Nov 2015 flooding; Kanteiya landslide buried a family; drainage expansion.', False),
 'Nakuru': ('moderate','Rift Valley rains; localized flooding around lakes and low-lying areas.', False),
 'Kericho': ('moderate','>50 mm/24h forecast; highland flooding.', False),
 'Bomet': ('moderate','Rift Valley rains; flooding reported.', True),
 'Nandi': ('moderate','Rift Valley rains; localized flooding.', False),
 'Uasin Gishu': ('moderate','Eldoret recorded ~70 mm in 24 h (WMO); urban flooding.', False),
 'Trans Nzoia': ('moderate','Nzoia basin rains; localized flooding.', False),
 'Elgeyo-Marakwet': ('watch','Kerio Valley rains; watch zone.', False),
 'West Pokot': ('watch','North Rift rains; watch zone.', False),
 'Turkana': ('moderate','Arid north-west; localized flash floods and lake/river rises.', False),
 'Mandera': ('high','North-eastern flood zone; riverine flooding; 85%+ above-normal rain probability.', False),
 'Wajir': ('high','North-eastern flood zone; WFP pre-positioned logistics support.', True),
 'Marsabit': ('high','North-eastern flood zone; WFP logistics support; also benefited from rains.', True),
 'Isiolo': ('moderate','North-eastern/upper Tana zone; also benefited from increased rainfall.', True),
 'Samburu': ('high','WFP seconded logistics staff to this flood-prone county.', False),
 'Baringo': ('high','WFP logistics support; Kerio/Baringo lakes rose; also benefited from rains.', True),
 'Laikipia': ('watch','Rift Valley watch zone.', False),
 'Kilifi': ('high','Seasonal river flooded a village; ~50 households displaced; coastal flooding.', False),
 'Kwale': ('high','Coastal flooding; chronic El Niño flood zone.', False),
 'Lamu': ('high','~53 mm in 24 h (WMO); coastal and road flooding; Lamu-Garsen road cut.', False),
 'Mombasa': ('high','Coastal flooding; flagged high-risk in national contingency plan.', False),
 'Taita Taveta': ('moderate','Voi recorded ~85 mm in 24 h (WMO); flooding.', False),
 'Nairobi': ('high','Nairobi River overflowed; Ruai IDP camp displaced 60; flood-prone infrastructure mapped.', False),
 'Kajiado': ('moderate','Southern Rift; localized flooding; also benefited from rains.', True),
 'Machakos': ('watch','Arid zone; increased rainfall largely beneficial.', True),
 'Makueni': ('high','Reported among the most affected by flooding.', False),
 'Kitui': ('moderate','KRCS used El Niño rains for seed distribution; Mutomo flooding.', True),
 'Meru': ('high','Flooding reported in Meru and surrounding areas.', False),
 'Tharaka': ('watch','Eastern watch zone.', False),
 'Embu': ('watch','Eastern watch zone.', False),
 'Kirinyaga': ('watch','Central watch zone.', False),
 'Nyeri': ('watch','Central watch zone.', False),
 'Murang\'a': ('watch','Central watch zone; landslide risk in highlands.', False),
 'Kiambu': ('watch','Central watch zone; urban flooding.', False),
 'Nyandarua': ('watch','Central watch zone.', False),
 'Nyamira': ('moderate','Nyanza highlands; localized flooding.', False),
 'Kisii': ('moderate','Nyanza highlands; localized flooding.', False),
}

D2009 = {
 'Turkana': ('severe','Turkana East (Katilu, Nakwamoru): ~20,000 people affected, 5 dead, 6,664 houses destroyed, 800+ acres of crops lost.', False),
 'Baringo': ('high','Marigat 400+ households flooded; Mogotio/Koibatek 136 households; East Pokot - River Nginyang burst its banks.', False),
 'West Pokot': ('high','Kongelai: 160+ households affected, 60 houses destroyed; Kenya-Sudan road cut.', False),
 'Nakuru': ('high','Naivasha flash floods (Kikopey/Gilgil) - 150 households; Rongai flooded.', False),
 'Narok': ('moderate','Oloipito highland rains: 75 households affected, 60 displaced, 1 death.', False),
 'Kajiado': ('moderate','Kajiado North: 3 children swept away; 3 deaths reported.', False),
 'Kisumu': ('severe','Nyando/Lower Nyakach: 250 households displaced, 1,674 at risk; cholera concerns.', False),
 'Busia': ('moderate','Budalangi floodplain affected; chronic El Niño flood zone.', False),
 'Bungoma': ('moderate','Nzoia basin flooding.', False),
 'Kakamega': ('moderate','Western Kenya rains; localized flooding.', False),
 'Vihiga': ('moderate','Western Kenya rains; localized flooding.', False),
 'Trans Nzoia': ('moderate','Nzoia basin flooding.', False),
 'Nandi': ('moderate','North Rift rains; localized flooding.', False),
 'Elgeyo-Marakwet': ('moderate','North Rift rains; localized flooding.', False),
 'Uasin Gishu': ('watch','North Rift watch zone.', False),
 'Kitui': ('moderate','Mutomo: households displaced by flooding (Lower Eastern).', False),
 'Nairobi': ('moderate','CBD, Kibera, Mukuru, Mathare flooded (22 Dec 2009); 4 dead; roads blocked.', False),
 'Mandera': ('high','Heavy rains in Mandera district; 1,271 households (5,000 people) displaced regionally; aid roads cut.', False),
 'Garissa': ('high','Dadaab refugee complex flooded; >1,000 families affected around River Tana.', False),
 'Tana River': ('high','River Tana burst its banks 30 Oct 2009, flooding Bura and Wardei villages.', False),
 'Wajir': ('moderate','North-eastern rains; localized flooding.', False),
 'Isiolo': ('moderate','Northern flood-prone zone.', False),
 'Marsabit': ('moderate','Moyale area flooding.', False),
 'Kilifi': ('high','Malindi district: heavy rains, displacement (with Mandera & Tana River).', False),
 'Lamu': ('moderate','Coastal flooding; watch zone.', False),
 'Mombasa': ('watch','Coastal watch zone.', False),
 'Kwale': ('watch','Coastal flood-prone zone.', False),
 'Taita Taveta': ('watch','Coastal/inland watch zone.', False),
 'Murang\'a': ('moderate','Muranga East: landslide killed a schoolgirl (3 Nov 2009).', False),
 'Homa Bay': ('moderate','Nyanza lake-basin floods.', False),
 'Migori': ('moderate','Nyanza lake-basin floods.', False),
 'Siaya': ('moderate','Nyanza lake-basin floods.', False),
 'Nyamira': ('moderate','Nyanza highlands flooding.', False),
 'Kisii': ('moderate','Nyanza highlands flooding.', False),
 'Samburu': ('watch','North Rift watch zone.', False),
 'Laikipia': ('watch','Rift Valley watch zone.', False),
 'Embu': ('watch','Eastern watch zone.', False),
 'Tharaka': ('watch','Eastern watch zone.', False),
 'Meru': ('watch','Eastern watch zone.', False),
 'Kirinyaga': ('watch','Central watch zone.', False),
 'Nyeri': ('watch','Central watch zone.', False),
 'Kiambu': ('watch','Central watch zone.', False),
 'Nyandarua': ('watch','Central watch zone.', False),
 'Bomet': ('watch','Rift Valley watch zone.', False),
 'Kericho': ('watch','Rift Valley watch zone.', False),
 'Machakos': ('watch','Eastern watch zone.', False),
 'Makueni': ('watch','Eastern watch zone.', False),
}

def pack(d):
    out={}
    for k,(tier,note,ben) in d.items():
        out[k]={'tier':tier,'note':note,'benefit':bool(ben)}
    return out

# ---------- 2026 outlook (forecast) ----------
RANK_SCORE={'severe':100,'high':75,'moderate':45,'watch':25}
FC_W={'veryhigh':100,'high':75,'moderate':50,'low':30}

FC_BAND={}
for n in ['Mandera','Wajir','Garissa','Isiolo','Marsabit','Tana River']:
    FC_BAND[n]='veryhigh'
for n in ['Kisumu','Siaya','Homa Bay','Migori','Busia','Bungoma','Kakamega','Vihiga','Nyamira','Kisii',
          'Nandi','Kericho','Bomet','Nakuru','Narok','Laikipia','Trans Nzoia','Uasin Gishu',
          'Nairobi','Kiambu',"Murang'a",'Nyeri','Kirinyaga','Nyandarua','Embu','Tharaka','Meru',
          'Machakos','Kitui','Makueni','Kajiado','Mombasa','Kwale','Kilifi','Lamu','Taita Taveta']:
    FC_BAND[n]='high'
for n in ['Turkana','West Pokot','Samburu','Elgeyo-Marakwet']:
    FC_BAND[n]='moderate'

EXPOSURE={
 'Tana River':(98,'Lower-Tana floodplain; the river bursts its banks or backs up in most El Niño years.'),
 'Garissa':(95,'River Tana overflow plus the Dadaab refugee complex sitting on the floodplain.'),
 'Kisumu':(95,'Nyando and lake-basin floodplain; densely settled lowlands (Nyando, Nyakach, Awasi).'),
 'Busia':(92,'Budalangi floodplain on the Nzoia River; chronic backwater flooding.'),
 'Lamu':(86,'Coastal plus Tana delta; the Lamu-Garsen road is cut by floodwater.'),
 'Kilifi':(82,'Coastal seasonal rivers flash-flood; Malindi lowlands inundated.'),
 'Mombasa':(78,'Dense urban drainage failure plus tidal/coastal flooding.'),
 'Nairobi':(82,'River and storm-drain overflow; informal settlements on riparian land.'),
 'Narok':(78,'Rift highlands - landslides and flash floods (as in 2015).'),
 'Turkana':(80,'ASAL flash floods; dry riverbeds (lagas) turn into death traps.'),
 'Mandera':(76,'Riverine flooding; humanitarian access roads cut.'),
 'Wajir':(74,'ASAL flash floods; roads cut off.'),
 'Marsabit':(70,'ASAL flash floods; Moyale corridor.'),
 'Isiolo':(70,'Upper-Tana / Ewaso Nyiro; ASAL flash floods.'),
 'Samburu':(70,'Rift/ASAL rivers; roads cut off.'),
 'Baringo':(76,'Lake Baringo / Kerio rise; Marigat and Mogotio lowlands.'),
 'West Pokot':(72,'Kerio valley; River Nginyang; landslides.'),
 'Homa Bay':(80,'Lake Victoria shoreline and backwater flooding.'),
 'Migori':(74,'Lake basin plus the Migori River.'),
 'Siaya':(80,'Yala swamp and Lake Victoria floodplain.'),
 'Bungoma':(74,'Nzoia basin flooding.'),
 'Kakamega':(62,'Western Kenya rivers; localised flooding.'),
 'Vihiga':(58,'Western highlands; localised flooding.'),
 'Nandi':(58,'Rift valley rivers; localised flooding.'),
 'Kericho':(58,'Highland rivers; localised flooding.'),
 'Bomet':(55,'Highland rivers; localised flooding.'),
 'Nyamira':(52,'Highland rivers; localised flooding.'),
 'Kisii':(52,'Highland rivers; localised flooding.'),
 'Nakuru':(62,'Lakes Nakuru/Naivasha rise; Gilgil and Kikopey flash floods.'),
 'Laikipia':(55,'Rift rivers; localised flooding.'),
 'Nyeri':(52,'Central highlands; localised flooding.'),
 'Kirinyaga':(55,'Tana/Murubara basin.'),
 "Murang'a":(55,'Highland landslide risk.'),
 'Kiambu':(55,'Urban/peri-urban stormwater.'),
 'Nyandarua':(50,'Central highlands; localised flooding.'),
 'Embu':(50,'Mount Kenya foothills; localised flooding.'),
 'Tharaka':(52,'Eastern lowlands; seasonal rivers.'),
 'Meru':(55,'Eastern slopes; flash floods.'),
 'Machakos':(52,'Arid-zone flash floods and cut roads.'),
 'Kitui':(58,'Mutomo and ASAL flash floods.'),
 'Makueni':(58,'Arid-zone flash floods.'),
 'Kajiado':(55,'Rift flash floods sweeping across plains.'),
 'Taita Taveta':(62,'Voi and inland/coastal flooding.'),
 'Trans Nzoia':(62,'Nzoia basin flooding.'),
 'Uasin Gishu':(55,'Urban flooding (Eldoret).'),
 'Elgeyo-Marakwet':(55,'Kerio valley; localised flooding.'),
}

def hist_best(nm):
    a=D2015.get(nm); b=D2009.get(nm)
    va=RANK_SCORE.get(a[0],0) if a else 0
    vb=RANK_SCORE.get(b[0],0) if b else 0
    v=max(va,vb)
    lab='severe' if v>=100 else 'high' if v>=75 else 'moderate' if v>=45 else 'watch' if v>=25 else 'none'
    return v,lab

FC_COUNTIES={}
for nm in paths:
    hs,worst=hist_best(nm)
    fb=FC_BAND.get(nm,'moderate')
    es,er=EXPOSURE.get(nm,(40,'Localised flood exposure.'))
    risk=round(0.40*hs + 0.35*FC_W[fb] + 0.25*es)
    band='extreme' if risk>=80 else 'veryhigh' if risk>=70 else 'high' if risk>=60 else 'elevated' if risk>=45 else 'moderate'
    FC_COUNTIES[nm]={'risk':risk,'band':band,'hist':hs,'fc':FC_W[fb],'exp':es,'fcband':fb,'reason':er,'worst':worst}

FORECAST={
 'label':'2026 Outlook',
 'tag':'Projected HISTORIC El Nino - late 2026',
 'period':'Oct - Dec 2026 short rains (forecast issued Aug - Sep 2026)',
 'kpis':[['ENSO status','El Nino Advisory'],['Very strong event','> 90% chance'],['Historic (since 1950)','75% chance'],['ICPAC OND 2026','Wetter than normal'],['Analogue years','1997 · 2023']],
 'summary':'NOAA CPC (10 Sep 2026): El Nino is strengthening, with a >90% chance of a very strong event in NH fall/winter 2026-27 and a 75% chance of a HISTORIC event exceeding every El Nino since 1950. ICPAC (18 Aug 2026): the Greater Horn of Africa is likely to be wetter than normal in OND 2026 - a 90% chance of enhanced rainfall over north-eastern Kenya and a high chance of >400 mm over central Kenya and the Lake Victoria Basin. KMD projects above-average rainfall and warmer temperatures nationwide from October. This view applies a transparent risk model to project county-level flood risk.',
 'counties':FC_COUNTIES,
 'formula':'Risk (0-100) = 0.40 x historical recurrence + 0.35 x ICPAC/KMD 2026 forecast signal + 0.25 x structural exposure. It is a transparent planning index, not a physics-based hydrological forecast; forecast skill declines for smaller areas and beyond a season.'
}

DATA={
 'boundaries':paths,
 'centroids':centroids,
 'viewBox':[0,0,round(W),round(H)],
 'events':{
   'y2015':{
     'label':'2015-16 El Niño',
     'tag':'Very strong ("Super El Niño")',
     'period':'Oct 2015 - Jan 2016 (OND short rains)',
     'kpis':[['Counties affected','38 of 47'],['People displaced','> 100,000'],['Deaths','112'],['Injuries','73'],['Peak impact','Nov 2015 - 145,200 hit']],
     'summary':'The strongest El Niño since 1997-98. Forecasts triggered the most coordinated pre-season response in Kenya: a national contingency plan (Sept 2015), county action plans, dyke reinforcement, river desilting and SMS early warnings. Flooding and landslides were still deadly - but less severe than feared.',
     'counties':pack(D2015)
   },
   'y2009':{
     'label':'2009-10 El Niño',
     'tag':'Moderate-strong',
     'period':'Oct 2009 - Jan 2010 (short rains)',
     'kpis':[['Pushed by','ICPAC/GHACOF (Aug 2009)'],['KRCS assisted','30,000 people'],['Documented deaths','≥ 14'],['Worst regions','North Rift, South Rift, Nyanza'],['Context','Drought-hit population']],
     'summary':'The predicted El Niño rains began with the 2009 short-rains season, striking communities already weakened by a prolonged drought that had left ~3.8 million people food-insecure. Flash floods hit the Rift Valley, Lake Victoria basin and the coast. Experts judged it less severe than the 1997-98 event.',
     'counties':pack(D2009)
   }
 },
 'forecast':FORECAST,
 'sources':[
  ['NOAA Climate Prediction Center - ENSO Diagnostic Discussion (10 Sep 2026)','https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml'],
  ['ICPAC - "Greater Horn of Africa expected to experience a wetter-than-normal OND 2026 season as El Niño strengthens" (18 Aug 2026)','https://www.icpac.net/news/the-greater-horn-of-africa-is-expected-to-experience-a-wetter-than-normal-october-december-ond-2026-season-as-el-ni%C3%B1o-strengthens/'],
  ['WMO - "El Niño impacts Greater Horn of Africa"','https://wmo.int/media/news/el-nino-impacts-greater-horn-of-africa'],
  ['IRI (Columbia) - ENSO Forecast','https://iri.columbia.edu/our-expertise/climate/forecasts/enso/current/'],
  ['Red Cross Red Crescent Climate Centre (2017) - "Preparing for the 2015-2016 El Niño"','https://www.climatecentre.org/wp-content/uploads/Preparing-for-the-2015-2016-El-Nino.pdf'],
  ['FloodList (18 Nov 2015) - "Kenya: More Heavy Rain Causes Deadly Landslide in Narok County"','https://floodlist.com/africa/kenya-floods-heavy-rain-el-nino-2015'],
  ['IFRC DREF MDRKE011 (6 Jan 2010) - "Kenya: Floods 2010"','https://www.ifrc.org/docs?file=appeals/10/MDRKE011.pdf'],
  ['OCHA (4 Nov 2009) - "Kenya: Floods Situation Report No. 2"','https://www.unocha.org/publications/report/kenya/kenya-floods-situation-report-no-2-04-nov-2009'],
  ['OCHA (21 Apr 2009) - "Kenya: Floods Situation Report No. 1"','https://www.unocha.org/publications/report/kenya/kenya-floods-situation-report-no-1-21-apr-2009'],
  ['Nation Africa - "El Niño: 18 counties flagged as high risk"','https://nation.africa/kenya/climate/el-ni%C3%B1o-18-counties-flagged-as-high-risk-5552916'],
  ['geoBoundaries - Kenya ADM1 (47 county boundaries)','https://www.geoboundaries.org/api/current/gbOpen/KEN/ADM1/']
 ],
 'method':'Tier = documented impact level in the two events (severe / high / moderate / watch / minimal). "Benefit" flags counties where the extra rainfall was reported as largely positive for crops or livestock. "Watch" = national flooding was reported but county-specific detail is limited. Numbers are the ranges quoted by the cited agencies, not exact census figures.'
}

# validate names
gbnames=set(paths.keys())
for ev in DATA['events'].values():
    for k in ev['counties']:
        if k not in gbnames:
            print('WARN unmatched county key:', k)

payload=json.dumps(DATA, ensure_ascii=False, separators=(',',':'))
payload=payload.replace('</','<\\/')

html = r'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Super El Niño Mapper - Kenya</title>
<style>
:root{
  --bg:#070d16; --bg2:#0c1524; --panel:rgba(18,28,44,.82); --line:rgba(120,150,190,.18);
  --ink:#e8eef7; --mut:#93a4bd; --acc:#38bdf8;
  --severe:#e11d48; --high:#f97316; --moderate:#facc15; --watch:#64748b; --minimal:#2b3a4f; --benefit:#34d399;
  --rb-extreme:#ff2d55; --rb-veryhigh:#ff6b35; --rb-high:#ffa62b; --rb-elevated:#ffd166; --rb-moderate:#41506b;
}
*{box-sizing:border-box}
html,body{margin:0;height:100%}
body{
  background:
    radial-gradient(1100px 620px at 12% -8%, rgba(56,189,248,.13), transparent 60%),
    radial-gradient(900px 560px at 96% 4%, rgba(225,29,72,.12), transparent 62%),
    linear-gradient(180deg,var(--bg),var(--bg2));
  color:var(--ink); font:15px/1.5 "Segoe UI",system-ui,-apple-system,"Helvetica Neue",Arial,sans-serif;
  -webkit-font-smoothing:antialiased;
}
.wrap{max-width:1460px;margin:0 auto;padding:22px 22px 60px}
header{display:flex;flex-wrap:wrap;gap:18px;align-items:flex-end;justify-content:space-between;margin-bottom:18px}
.brand h1{margin:0;font-size:26px;letter-spacing:.2px}
.brand h1 b{color:var(--acc)}
.brand p{margin:6px 0 0;color:var(--mut);max-width:760px;font-size:13.5px}
.badge{display:inline-block;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--acc);
  border:1px solid rgba(56,189,248,.35);border-radius:999px;padding:4px 11px;margin-bottom:10px;background:rgba(56,189,248,.07)}
.tabs{display:flex;gap:8px;flex-wrap:wrap}
.tab{cursor:pointer;border:1px solid var(--line);background:rgba(255,255,255,.03);color:var(--ink);
  padding:9px 15px;border-radius:11px;font-size:13px;transition:.18s;white-space:nowrap}
.tab:hover{border-color:rgba(56,189,248,.5)}
.tab.on{background:linear-gradient(180deg,rgba(56,189,248,.22),rgba(56,189,248,.07));border-color:rgba(56,189,248,.65);box-shadow:0 0 0 1px rgba(56,189,248,.25) inset}
.grid{display:grid;grid-template-columns:1.55fr .95fr;gap:18px}
@media(max-width:1080px){.grid{grid-template-columns:1fr}}
.card{background:var(--panel);border:1px solid var(--line);border-radius:16px;backdrop-filter:blur(9px)}
.mapcard{padding:12px;position:relative;display:flex;flex-direction:column}
#map{width:100%;height:auto;display:block}
.county{stroke:rgba(6,12,22,.85);stroke-width:.7;cursor:pointer;transition:fill .25s, filter .15s, opacity .2s}
.county:hover{filter:brightness(1.28) saturate(1.2)}
.sel{stroke:#fff;stroke-width:1.9}
.dim{opacity:.16}
.cty-label{fill:rgba(9,14,24,.85);font-size:8.4px;font-weight:700;pointer-events:none;paint-order:stroke;stroke:rgba(255,255,255,.55);stroke-width:1.6px}
.benefit-ring{fill:none;stroke:var(--benefit);stroke-width:1.5;stroke-dasharray:3 3;pointer-events:none}
.legendbar{display:flex;flex-wrap:wrap;gap:14px;align-items:center;padding:11px 6px 3px}
.lg{display:flex;align-items:center;gap:7px;font-size:12px;color:var(--mut)}
.sw{width:14px;height:14px;border-radius:4px;display:inline-block;border:1px solid rgba(255,255,255,.16)}
.side{display:flex;flex-direction:column;gap:14px}
.pad{padding:16px 16px}
.h{font-size:12px;letter-spacing:.13em;text-transform:uppercase;color:var(--acc);margin:0 0 10px}
.evtitle{font-size:19px;font-weight:700;margin:0}
.evtag{color:var(--mut);font-size:12.5px;margin:2px 0 0}
.kpis{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:14px}
.kpi{background:rgba(255,255,255,.035);border:1px solid var(--line);border-radius:11px;padding:9px 11px}
.kpi b{display:block;font-size:16px;color:#fff}
.kpi span{font-size:11px;color:var(--mut)}
.summary{margin-top:13px;font-size:13px;color:#c6d2e3}
.detail{min-height:150px}
.dtier{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:3px 9px;border-radius:999px;display:inline-block}
.dname{font-size:18px;font-weight:700;margin:9px 0 3px}
.dnote{font-size:13px;color:#c6d2e3}
.dmeta{font-size:11.5px;color:var(--mut);margin-top:9px}
.chip{display:inline-block;font-size:10.5px;color:var(--acc);border:1px solid rgba(56,189,248,.3);border-radius:999px;padding:2px 9px;margin:6px 6px 0 0}
.chip.g{color:var(--benefit);border-color:rgba(52,211,153,.35)}
.hint{color:var(--mut);font-size:12.5px}
.list{max-height:330px;overflow:auto}
.row{display:flex;align-items:center;gap:9px;padding:6px 7px;border-radius:8px;cursor:pointer}
.row:hover{background:rgba(255,255,255,.05)}
.row .nm{flex:1;font-size:12.5px}
.row .dot{width:9px;height:9px;border-radius:3px}
.bar{height:5px;border-radius:3px;background:rgba(255,255,255,.08);width:64px;overflow:hidden}
.bar i{display:block;height:100%}
.tools{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px}
input[type=search]{background:rgba(255,255,255,.05);border:1px solid var(--line);border-radius:9px;color:var(--ink);
  padding:7px 11px;font-size:12.5px;outline:none;width:100%}
.foot{margin-top:16px;padding:16px;font-size:12.5px;color:var(--mut)}
.foot a{color:#9fd2f5;text-decoration:none;border-bottom:1px dotted rgba(159,210,245,.4)}
.foot a:hover{color:#fff}
.odds{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:6px}
@media(max-width:560px){.odds{grid-template-columns:1fr}}
.tip{position:absolute;pointer-events:none;background:rgba(9,15,26,.96);border:1px solid rgba(120,150,190,.35);
  border-radius:10px;padding:8px 11px;font-size:12.5px;box-shadow:0 10px 30px rgba(0,0,0,.5);opacity:0;transition:opacity .12s;z-index:5;max-width:250px}
.rank{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px}
.rank div{background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:10px;padding:8px 10px}
.rank b{font-size:20px}
.rank span{font-size:11px;color:var(--mut)}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div class="brand">
      <div class="badge">Kenya · County-level · Historical</div>
      <h1>Super El Niño Mapper <b>- Kenya</b></h1>
      <p>How the <b>2015-16</b> and <b>2009-10</b> El Niño events hit Kenya's 47 counties - and a county-level <b>2026 outlook</b> for the projected historic El Niño. Flood hotspots, landslides, disease risk and where the rains helped. Hover a county, click for the record.</p>
    </div>
    <div class="tabs" id="tabs"></div>
  </header>

  <div class="grid">
    <div class="card mapcard">
      <div class="tools">
        <input id="q" type="search" placeholder="Search a county...">
      </div>
      <div style="position:relative">
        <svg id="map" preserveAspectRatio="xMidYMid meet"></svg>
        <div class="tip" id="tip"></div>
      </div>
      <div class="legendbar" id="legend"></div>
    </div>

    <div class="side">
      <div class="card pad">
        <h3 class="h" id="evh">Event</h3>
        <p class="evtitle" id="evtitle"></p>
        <p class="evtag" id="evtag"></p>
        <div class="kpis" id="kpis"></div>
        <p class="summary" id="summary"></p>
      </div>
      <div class="card pad detail" id="detail"></div>
      <div class="card pad">
        <div class="tools" style="justify-content:space-between">
          <h3 class="h" style="margin:0" id="listh">Affected counties</h3>
          <span class="hint" id="listcount" style="margin:0"></span>
        </div>
        <div class="list" id="list"></div>
      </div>
    </div>
  </div>

  <div class="card foot">
    <h3 class="h">How this mapper was built</h3>
    <figure style="margin:6px 0 4px">
      <img src="assets/process-diagram.png" alt="Data pipeline: historical records to impact coding, boundaries, interactive map and insight" style="width:100%;border-radius:10px;border:1px solid var(--line)">
      <figcaption style="font-size:12px;color:var(--mut);margin-top:6px">Data pipeline - from historical El Niño records to the county-level interactive map.</figcaption>
    </figure>
    <h3 class="h" style="margin-top:16px">Method &amp; interpretation</h3>
    <p id="method"></p>
    <h3 class="h" style="margin-top:16px">Sources</h3>
    <div id="sources"></div>
  </div>
</div>

<script>
const DATA = __PAYLOAD__;
const TIER = {severe:{c:'var(--severe)',n:'Severe'},high:{c:'var(--high)',n:'High'},moderate:{c:'var(--moderate)',n:'Moderate'},watch:{c:'var(--watch)',n:'Watch'},minimal:{c:'var(--minimal)',n:'Minimal'}};
const ORDER = ['severe','high','moderate','watch','minimal'];
const rank = {severe:5,high:4,moderate:3,watch:2,minimal:1};
const allNames = Object.keys(DATA.boundaries);

const svg = document.getElementById('map');
const vb = DATA.viewBox;
svg.setAttribute('viewBox', vb.join(' '));

// build county groups
const gCounties = document.createElementNS('http://www.w3.org/2000/svg','g');
const gLabels = document.createElementNS('http://www.w3.org/2000/svg','g');
const gRings = document.createElementNS('http://www.w3.org/2000/svg','g');
svg.appendChild(gCounties); svg.appendChild(gRings); svg.appendChild(gLabels);
const pathEls = {}, ringEls = {}, lblEls = {};

for(const nm of allNames){
  const p = document.createElementNS('http://www.w3.org/2000/svg','path');
  p.setAttribute('d', DATA.boundaries[nm]);
  p.setAttribute('class','county');
  p.dataset.name = nm;
  gCounties.appendChild(p); pathEls[nm]=p;

  const r = document.createElementNS('http://www.w3.org/2000/svg','path');
  r.setAttribute('d', DATA.boundaries[nm]);
  r.setAttribute('class','benefit-ring');
  r.style.display='none';
  gRings.appendChild(r); ringEls[nm]=r;

  const t = document.createElementNS('http://www.w3.org/2000/svg','text');
  t.setAttribute('class','cty-label'); t.setAttribute('text-anchor','middle');
  t.setAttribute('x', DATA.centroids[nm][0]); t.setAttribute('y', DATA.centroids[nm][1]);
  t.textContent = nm; t.style.display='none';
  gLabels.appendChild(t); lblEls[nm]=t;
}

const state = {mode:'y2015', sel:null, q:''};
const cur = ()=> (state.mode in DATA.events) ? DATA.events[state.mode] : null;

function tierOf(nm){ const ev=cur(); const c=ev&&ev.counties[nm]; return c? c.tier : 'minimal'; }
function recOf(nm){ const ev=cur(); return ev ? (ev.counties[nm]||null) : null; }

function render(){
  if(state.mode==='hot'){ return renderHotspots(); }
  if(state.mode==='y2026'){ return renderForecast(); }
  const ev = DATA.events[state.mode];
  document.getElementById('listh').textContent='Affected counties';
  if(!state.sel){ const _l=[...allNames].filter(n=>ev.counties[n]).sort((a,b)=>rank[ev.counties[b].tier]-rank[ev.counties[a].tier]); state.sel=_l[0]||null; }
  // map colours
  for(const nm of allNames){
    const rec = ev.counties[nm];
    const tier = rec? rec.tier : 'minimal';
    pathEls[nm].setAttribute('fill', TIER[tier].c);
    ringEls[nm].style.display = (rec && rec.benefit) ? '' : 'none';
    lblEls[nm].style.display = (rec && (tier==='severe'||tier==='high')) ? '' : 'none';
    pathEls[nm].classList.toggle('sel', state.sel===nm);
    if(state.q){
      pathEls[nm].classList.toggle('dim', !nm.toLowerCase().includes(state.q));
    } else pathEls[nm].classList.remove('dim');
  }
  // header
  document.getElementById('evtitle').textContent = ev.label + ' - ' + ev.tag;
  document.getElementById('evtag').textContent = ev.period;
  document.getElementById('kpis').innerHTML = ev.kpis.map(k=>`<div class="kpi"><b>${k[1]}</b><span>${k[0]}</span></div>`).join('');
  document.getElementById('summary').textContent = ev.summary;

  // legend
  const lg = document.getElementById('legend');
  let h = ORDER.filter(t=>t!=='minimal').map(t=>`<div class="lg"><span class="sw" style="background:${TIER[t].c}"></span>${TIER[t].n}</div>`).join('');
  h += `<div class="lg"><span class="sw" style="background:transparent;border:1.5px dashed var(--benefit)"></span>Rainfall was beneficial</div>`;
  lg.innerHTML = h;

  // ranking
  const affected = allNames.filter(n=>ev.counties[n]).sort((a,b)=>rank[ev.counties[b].tier]-rank[ev.counties[a].tier]||a.localeCompare(b));
  const sev = affected.filter(n=>ev.counties[n].tier==='severe').length;
  const highp = affected.filter(n=>['severe','high'].includes(ev.counties[n].tier)).length;
  const ben = affected.filter(n=>ev.counties[n].benefit).length;
  const counts = {severe:0,high:0,moderate:0,watch:0};
  affected.forEach(n=>counts[ev.counties[n].tier]++);
  document.getElementById('listcount').innerHTML =
    `<b style="color:#fff">${counts.severe+counts.high+counts.moderate}</b> documented (${counts.severe} severe · ${counts.high} high · ${counts.moderate} moderate) · ${counts.watch} watch · ${ben} beneficial`;

  document.getElementById('list').innerHTML = affected.map(n=>{
    const r=ev.counties[n], col=TIER[r.tier].c, w=(rank[r.tier]/5*100);
    return `<div class="row" data-n="${n}"><span class="dot" style="background:${col}"></span><span class="nm">${n}</span>
      <span class="bar"><i style="width:${w}%;background:${col}"></i></span>${r.benefit?'<span style="color:var(--benefit);font-size:11px">✿</span>':''}</div>`;
  }).join('');
  document.querySelectorAll('.row').forEach(el=>el.onclick=()=>select(el.dataset.n));

  renderDetail();
}

function renderDetail(){
  const d = document.getElementById('detail');
  if(!state.sel){ d.innerHTML = `<h3 class="h">County record</h3><p class="hint">Click any county on the map - or a county in the list - to read what happened in this event.</p>`; return; }
  const nm = state.sel, r = recOf(nm);
  const ev = cur();
  if(!r){ d.innerHTML = `<h3 class="h">County record</h3><p class="dname">${nm}</p><p class="dnote">No specific impact record for this event - treated as minimal / not reported.</p>`; return; }
  d.innerHTML = `<span class="dtier" style="background:${TIER[r.tier].c};color:#08101c">${TIER[r.tier].n} impact</span>
    <p class="dname">${nm}</p>
    <p class="dnote">${r.note}</p>
    <div>${r.benefit?'<span class="chip g">✿ rainfall beneficial</span>':''}<span class="chip">${ev.label}</span></div>
    <p class="dmeta">Legend: severe = major flooding/landslides &amp; displacement · high = significant, well-documented impact · moderate = reported localised impact · watch = national flooding, limited county detail.</p>`;
}

function select(nm){ state.sel = nm; render(); }
function hover(nm, e){
  const tip=document.getElementById('tip');
  if(state.mode==='y2026'){ const r=DATA.forecast.counties[nm];
    tip.innerHTML=`<b>${nm}</b><br><span style="color:var(--mut)">2026 risk ${r.risk}/100 · ${r.band}</span>`; tip.style.opacity='1'; return; }
  const r=recOf(nm); const ev=cur();
  const t=r? TIER[r.tier].n : 'Minimal / not reported';
  tip.innerHTML = `<b>${nm}</b><br><span style="color:var(--mut)">${t}${r&&r.benefit?' · beneficial rains':''}</span>`;
  tip.style.opacity='1';
}
svg.addEventListener('mousemove', e=>{
  const tip=document.getElementById('tip');
  const r=svg.getBoundingClientRect();
  const t=e.target.dataset && e.target.dataset.name;
  if(t){ hover(t,e);
    let x=e.clientX-r.left+14, y=e.clientY-r.top+14;
    if(x>r.width-250) x-=270;
    tip.style.left=x+'px'; tip.style.top=y+'px';
  } else tip.style.opacity='0';
});
svg.addEventListener('mouseleave', ()=>document.getElementById('tip').style.opacity='0');
gCounties.addEventListener('click', e=>{ const n=e.target.dataset && e.target.dataset.name; if(n) select(n); });

// tabs
const tabs=document.getElementById('tabs');
[['y2009','2009–10 event'],['y2015','2015–16 event'],['y2026','2026 outlook'],['both','Chronic hotspots']].forEach(([k,label])=>{
  const b=document.createElement('div'); b.className='tab'; b.textContent=label; b.dataset.k=k;
  b.onclick=()=>{ state.mode = (k==='both')?'hot':k; state.sel=null; document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('on',x===b)); render(); };
  tabs.appendChild(b);
});

const RBAND={extreme:'var(--rb-extreme)',veryhigh:'var(--rb-veryhigh)',high:'var(--rb-high)',elevated:'var(--rb-elevated)',moderate:'var(--rb-moderate)'};
const RLAB={extreme:'Extreme',veryhigh:'Very high',high:'High',elevated:'Elevated',moderate:'Moderate'};

function renderForecast(){
  document.getElementById('listh').textContent='Projected 2026 risk';
  const F=DATA.forecast, C=F.counties;
  if(!state.sel){ const _s=[...allNames].sort((a,b)=>C[b].risk-C[a].risk); state.sel=_s[0]||null; }
  for(const nm of allNames){
    const r=C[nm];
    pathEls[nm].setAttribute('fill', RBAND[r.band]);
    ringEls[nm].style.display='none';
    lblEls[nm].style.display=(r.band==='extreme'||r.band==='veryhigh')?'':'none';
    pathEls[nm].classList.toggle('sel', state.sel===nm);
    if(state.q) pathEls[nm].classList.toggle('dim', !nm.toLowerCase().includes(state.q)); else pathEls[nm].classList.remove('dim');
  }
  document.getElementById('evtitle').textContent = F.label+' - '+F.tag;
  document.getElementById('evtag').textContent = F.period;
  document.getElementById('kpis').innerHTML = F.kpis.map(k=>`<div class="kpi"><b>${k[1]}</b><span>${k[0]}</span></div>`).join('');
  document.getElementById('summary').textContent = F.summary;
  document.getElementById('legend').innerHTML = ['extreme','veryhigh','high','elevated','moderate']
    .map(x=>`<div class="lg"><span class="sw" style="background:${RBAND[x]}"></span>${RLAB[x]}</div>`).join('');
  const sorted=[...allNames].sort((a,b)=>C[b].risk-C[a].risk||a.localeCompare(b));
  const top=sorted.filter(n=>C[n].risk>=70).length;
  document.getElementById('listcount').innerHTML = `<b style="color:#fff">${top}</b> counties at very high / extreme risk`;
  document.getElementById('list').innerHTML = sorted.map(n=>{
    const r=C[n], col=RBAND[r.band];
    return `<div class="row" data-n="${n}"><span class="dot" style="background:${col}"></span><span class="nm">${n}</span>
      <span style="font-size:11px;color:var(--mut);margin-right:7px">${r.risk}</span><span class="bar"><i style="width:${r.risk}%;background:${col}"></i></span></div>`;
  }).join('');
  document.querySelectorAll('.row').forEach(el=>el.onclick=()=>{ state.sel=el.dataset.n; render(); });
  renderFDetail();
}

function renderFDetail(){
  const d=document.getElementById('detail');
  if(!state.sel){ d.innerHTML='<h3 class="h">2026 risk model</h3><p class="hint">Click a county to see its projected 2026 flood risk and the three drivers behind the score.</p>'; return; }
  const nm=state.sel, r=DATA.forecast.counties[nm];
  const bar=(lab,v,col)=>`<div style="margin:9px 0 2px"><div style="display:flex;justify-content:space-between;font-size:12px;color:var(--mut)"><span>${lab}</span><span>${v}</span></div><div class="bar" style="width:100%;height:7px"><i style="width:${v}%;background:${col}"></i></div></div>`;
  d.innerHTML=`<span class="dtier" style="background:${RBAND[r.band]};color:#08101c">${r.risk}/100 · ${RLAB[r.band]} risk</span>
    <p class="dname">${nm}</p>
    <p class="dnote">${r.reason}</p>
    ${bar('Historical recurrence', r.hist, 'var(--high)')}
    ${bar('ICPAC / KMD 2026 forecast signal', r.fc, 'var(--acc)')}
    ${bar('Structural exposure', r.exp, 'var(--benefit)')}
    <p class="dmeta">Score = 40% historical + 35% forecast + 25% exposure, rounded to a 0-100 index. Historical input = worst tier recorded in 2015-16 / 2009-10 (${r.worst}).</p>`;
}

function hotspotTiers(){
  // recurrence: worst tier across both events, boosted if in both
  const out={};
  for(const nm of allNames){
    const a=DATA.events.y2015.counties[nm], b=DATA.events.y2009.counties[nm];
    const ra=a?rank[a.tier]:0, rb=b?rank[b.tier]:0;
    const both = !!(a&&b) && ra>=3 && rb>=3;   // documented (severe/high/moderate) in BOTH events
    let r=Math.max(ra,rb);
    if(both) r=Math.min(5,r+1);
    out[nm]={r, both, a, b};
  }
  return out;
}

function renderHotspots(){
  const hs=hotspotTiers();
  // paint by recurrence score
  const color = r=> r>=5?'var(--severe)': r===4?'var(--high)': r===3?'var(--moderate)': r===2?'var(--watch)':'var(--minimal)';
  for(const nm of allNames){
    pathEls[nm].setAttribute('fill', color(hs[nm].r));
    pathEls[nm].classList.remove('sel','dim');
    ringEls[nm].style.display = hs[nm].both? '':'none';
    lblEls[nm].style.display = (hs[nm].both && hs[nm].r>=4)?'':'none';
  }
  document.getElementById('evtitle').textContent = 'Chronic El Niño hotspots';
  document.getElementById('listh').textContent='Recurring counties';
  document.getElementById('evtag').textContent = 'Counties hit in BOTH 2015-16 and 2009-10';
  const bothList = allNames.filter(n=>hs[n].both);
  document.getElementById('kpis').innerHTML =
    `<div class="kpi"><b>${bothList.length}</b><span>counties in both events</span></div>`+
    `<div class="kpi"><b>${allNames.filter(n=>hs[n].r>=4).length}</b><span>highest recurring risk</span></div>`;
  document.getElementById('summary').textContent = 'Counties that flooded in both historical El Niño events are the country\u2019s structural flood hotspots - where river overflow, drainage failure and settlement on floodplains repeat decade after decade. Dashed green rings mark counties recorded in both events.';
  const hl=[['severe','Top recurring hotspots'],['high','High recurring'],['moderate','Moderate'],['watch','Lower / watch'],['minimal','No record']];
  document.getElementById('legend').innerHTML =
    hl.map(x=>`<div class="lg"><span class="sw" style="background:${TIER[x[0]].c}"></span>${x[1]}</div>`).join('')
    + `<div class="lg"><span class="sw" style="background:transparent;border:1.5px dashed var(--benefit)"></span>Recorded in both events</div>`;
  // list by score
  const sorted=[...allNames].filter(n=>hs[n].r>=3).sort((a,b)=>hs[b].r-hs[a].r||a.localeCompare(b));
  document.getElementById('listcount').innerHTML = `<b style="color:#fff">${sorted.length}</b> documented (in ≥1 event) · ${bothList.length} in both`;
  document.getElementById('list').innerHTML = sorted.map(n=>{
    const r=hs[n], col=color(r.r);
    return `<div class="row" data-n="${n}"><span class="dot" style="background:${col}"></span><span class="nm">${n}</span>
      <span class="bar"><i style="width:${r.r/5*100}%;background:${col}"></i></span>${r.both?'<span style="color:var(--benefit);font-size:11px">●</span>':''}</div>`;
  }).join('');
  document.querySelectorAll('.row').forEach(el=>el.onclick=()=>{ state.mode='y2015'; state.sel=el.dataset.n;
    document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('on',x.dataset.k==='y2015')); render();
    document.getElementById('detail').scrollIntoView({behavior:'smooth',block:'center'}); });
  document.getElementById('detail').innerHTML = `<h3 class="h">Chronic hotspots</h3>
    <p class="dnote">Top recurring counties: <b>${sorted.slice(0,8).map(n=>n).join(', ')}</b>.</p>
    <p class="hint" style="margin-top:8px">Click a county to open its 2015-16 record.</p>`;
}

document.getElementById('q').oninput = e=>{ state.q = e.target.value.trim().toLowerCase(); render(); };

document.getElementById('method').textContent = DATA.method + ' 2026 MODEL - ' + DATA.forecast.formula;
document.getElementById('sources').innerHTML = DATA.sources.map(s=>`<div style="margin:5px 0">• <a href="${s[1]}" target="_blank" rel="noopener">${s[0]}</a></div>`).join('');

// init
try{
  const h=location.hash.replace('#','');
  const map={y2009:0,y2015:1,y2026:2,hot:3};
  if(map[h]!==undefined){ document.querySelectorAll('.tab')[map[h]].click(); }
  else { (document.querySelector('.tab[data-k="y2015"]')||document.querySelector('.tab')).click(); }
}catch(e){ (document.querySelector('.tab[data-k="y2015"]')||document.querySelector('.tab')).click(); }
</script>
</body>
</html>
'''

html = html.replace('__PAYLOAD__', payload)
open(OUT,'w',encoding='utf-8').write(html)
print('wrote', OUT, round(len(html)/1024,1),'KB; counties:',len(paths))
