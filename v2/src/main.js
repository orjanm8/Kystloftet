import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';
import maplibregl from 'maplibre-gl';
import { LAWS, ZONE_LABELS, filterLawsByZone, countLaws } from './laws.js';
import { finnKommunePlaner } from './kommuneplaner.js';

// ─── Base layers ─────────────────────────────────────────────────────────────
const BASE_LAYERS = {
  osm: {
    label: 'OSM',
    tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxzoom: 19,
  },
  graatone: {
    label: 'Gråtone',
    tiles: [
      'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    ],
    attribution: '© <a href="https://carto.com">CARTO</a> © OpenStreetMap',
    maxzoom: 19,
  },
  topo: {
    label: 'Topografi',
    tiles: ['https://tile.opentopomap.org/{z}/{x}/{y}.png'],
    attribution: '© <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxzoom: 17,
  },
  satellitt: {
    label: 'Satellitt',
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
    attribution: '© <a href="https://www.esri.com">Esri</a>',
    maxzoom: 19,
  },
};

const kystverketWMS =
  'https://wms.kystverket.no/v1/wms?' +
  'SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap' +
  '&FORMAT=image/png&TRANSPARENT=true&SRS=EPSG:3857' +
  '&LAYERS=nautiske_kart' +
  '&WIDTH={width}&HEIGHT={height}' +
  '&BBOX={bbox-epsg-3857}';

// ─── WMS GetFeatureInfo – lag som kan forespørres ────────────────────────────
const WMS_QUERYABLE = [
  { layerId: 'kystverket-layer', wmsUrl: 'https://wms.kystverket.no/v1/wms',                                                      layer: 'nautiske_kart',             label: 'Nautiske kart (Kystverket)' },
  { layerId: 'admhavn-layer',    wmsUrl: 'https://wms.geonorge.no/skwms1/wms.havnedata',                                          layer: 'administrativthavneomrade', label: 'Adm. havneområde' },
  { layerId: 'farts-layer',      wmsUrl: 'https://wms.geonorge.no/skwms1/wms.havnedata',                                          layer: 'fartsrestriksjoner',        label: 'Fartsrestriksjoner' },
  { layerId: 'akva-layer',       wmsUrl: 'https://gis.fiskeridir.no/server/services/fiskeridirWMS_akva/MapServer/WMSServer',       layer: 'akvakultur_lokaliteter',    label: 'Akvakulturlokaliteter',     infoFormat: 'text/html' },
  { layerId: 'vern-layer',       wmsUrl: 'https://kart.miljodirektoratet.no/arcgis/services/vern/MapServer/WMSServer',             layer: 'naturvern_omrade',          label: 'Naturvernområder',          infoFormat: 'application/geo+json' },
];

// ─── Map (sentrert på Arendal / Aust-Agder) ───────────────────────────────────
const map = new maplibregl.Map({
  container: 'map',
  style: {
    version: 8,
    sources: {
      base: {
        type: 'raster',
        tiles: BASE_LAYERS.osm.tiles,
        tileSize: 256,
        attribution: BASE_LAYERS.osm.attribution,
        maxzoom: BASE_LAYERS.osm.maxzoom,
      },
      kystverket: {
        type: 'raster',
        tiles: [kystverketWMS],
        tileSize: 256,
        attribution: '© <a href="https://www.kystverket.no">Kystverket</a>',
      },
    },
    layers: [
      { id: 'base-layer', type: 'raster', source: 'base' },
      { id: 'kystverket-layer', type: 'raster', source: 'kystverket', paint: { 'raster-opacity': 0.85 } },
    ],
  },
  center: [8.77, 58.46],   // Arendal
  zoom: 10,
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');

const geolocateCtrl = new maplibregl.GeolocateControl({
  positionOptions: { enableHighAccuracy: false },
  trackUserLocation: false,
  showAccuracyCircle: true,
});
map.addControl(geolocateCtrl, 'top-right');
geolocateCtrl.on('error', e => {
  const msg = e.code === 1
    ? 'Geolokasjon ble avslått. Gå til nettleserinnstillinger → Site Settings → Location og tillat for denne siden.'
    : 'Kunne ikke hente posisjon: ' + e.message;
  showMapNotice(msg);
});

function showMapNotice(text) {
  let el = document.getElementById('map-notice');
  if (!el) {
    el = document.createElement('div');
    el.id = 'map-notice';
    el.style.cssText =
      'position:absolute;bottom:40px;left:50%;transform:translateX(-50%);' +
      'background:#1e293b;color:#f1f5f9;padding:10px 16px;border-radius:8px;' +
      'font-size:13px;max-width:340px;text-align:center;z-index:100;' +
      'box-shadow:0 4px 12px rgba(0,0,0,.4);';
    document.getElementById('map').appendChild(el);
  }
  el.textContent = text;
  el.style.display = 'block';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.display = 'none'; }, 8000);
}

// ─── Markers (uten popup) ────────────────────────────────────────────────────
let activeMarker = null;

function placeMarker(lngLat, color) {
  if (activeMarker) activeMarker.remove();
  activeMarker = new maplibregl.Marker({ color }).setLngLat(lngLat).addTo(map);
}

// ─── Søk ─────────────────────────────────────────────────────────────────────
async function doSearch(query) {
  const q = query.trim();
  if (!q) return;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'no' } },
    );
    const data = await res.json();
    if (!data.length) return;
    const lngLat = [parseFloat(data[0].lon), parseFloat(data[0].lat)];
    placeMarker(lngLat, '#2563eb');
    map.flyTo({ center: lngLat, zoom: 12 });
  } catch (e) {
    console.error('Søk feilet:', e);
  }
}


// ─── Stedsanalyse – sone OG kommune fra én Nominatim-forespørsel ──────────────
// (ws.geonorge.no/kommuneinfo støtter ikke CORS fra nettleser)
async function analyzeLocation(centroid) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${centroid[1]}&lon=${centroid[0]}&format=json`,
      { headers: { 'Accept-Language': 'no' }, signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return { zone: 'sea', municipality: null };
    const data = await res.json();
    if (data.error) return { zone: 'sea', municipality: null };

    const addr = data.address || {};
    const cls  = data.class;
    const type = data.type;

    // ── Sone ──────────────────────────────────────────────────────────────────
    let zone;
    if (addr.sea || addr.ocean || addr.bay || type === 'sea' || type === 'ocean') zone = 'sea';
    else if (cls === 'natural' && ['water', 'bay', 'strait', 'fjord', 'inlet'].includes(type)) zone = 'coastal';
    else if (cls === 'waterway') zone = 'coastal';
    else if (addr.road || addr.suburb || addr.residential || addr.village || addr.town || addr.city) zone = 'land';
    else if (addr.municipality || addr.county || addr.country_code === 'no') zone = 'coastal';
    else zone = 'sea';

    // ── Kommunenavn – Nominatim er inkonsistent for Norge ────────────────────
    // Ref: https://github.com/osm-search/Nominatim/issues/1017
    // Moderne Nominatim: addr.municipality = kommunenavn, addr.state = fylke
    // Eldre/quirky: addr.county = kommunenavn, addr.state = fylke
    let kommunenavn =
      addr.municipality ||
      addr.city         ||
      addr.town         ||
      null;

    // Norsk quirk: når addr.state er satt men addr.municipality mangler,
    // inneholder addr.county faktisk kommunenavnet (ikke fylket)
    if (!kommunenavn && addr.state && addr.county) kommunenavn = addr.county;

    // Siste utvei: parse display_name ("..., Kommunenavn, Fylke, Norge")
    if (!kommunenavn && data.display_name) {
      const parts = data.display_name.split(',').map(s => s.trim());
      const noIdx = parts.findLastIndex(
        p => p.toLowerCase() === 'norge' || p.toLowerCase() === 'norway',
      );
      if (noIdx >= 2) kommunenavn = parts[noIdx - 2];
    }

    const county = addr.state || (addr.county !== kommunenavn ? addr.county : null) || null;
    const municipality = kommunenavn ? { kommunenavnNorsk: kommunenavn, county } : null;

    return { zone, municipality };
  } catch {
    return { zone: 'unknown', municipality: null };
  }
}

// Konverter kommunenavn til enkel URL-slug (æ→ae, ø→o, å→a, mellomrom fjernes)
function municipalitySlug(name) {
  return name
    .toLowerCase()
    .replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a')
    .replace(/\s+/g, '').replace(/[^a-z0-9-]/g, '');
}

// ─── Dynamisk Plandokumenter-panel ───────────────────────────────────────────
function buildDocSection(title, docs) {
  const details = document.createElement('details');
  details.className = 'law-category';
  details.open = true;

  const summary = document.createElement('summary');
  summary.className = 'law-category-header';
  summary.innerHTML = `<span>📂</span><span>${title}</span>`;
  details.appendChild(summary);

  const body = document.createElement('div');
  body.className = 'law-category-body';

  docs.forEach(doc => {
    const item = document.createElement('div');
    item.className = 'doc-item';

    const link = document.createElement('a');
    link.href = doc.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = `doc-link${doc.type === 'pdf' ? ' doc-pdf' : ''}`;
    const icon = doc.type === 'pdf'
      ? '<span class="doc-type-badge">PDF</span>'
      : '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';
    link.innerHTML = `${doc.name} ${icon}`;

    const desc = document.createElement('p');
    desc.className = 'doc-desc';
    desc.textContent = doc.desc;

    item.appendChild(link);
    item.appendChild(desc);
    body.appendChild(item);
  });

  details.appendChild(body);
  return details;
}

// ─── Hjelpefunksjoner for datahenting ────────────────────────────────────────

async function hentViaProxy(url) {
  const proxyer = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
  ];
  for (const proxy of proxyer) {
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 12000);
      const res = await fetch(proxy, { signal: ctrl.signal });
      clearTimeout(tid);
      if (res.ok) return res.text();
    } catch (_) { /* prøv neste */ }
  }
  return null;
}

// Henter kommunenummer (4-siffer) fra Kartverket for et koordinatpunkt
async function hentKommunenummer(lat, lon) {
  const url =
    `https://ws.geonorge.no/kommuneinfo/v1/punkt` +
    `?nord=${lat}&ost=${lon}&koordsys=4326`;
  try {
    const tekst = await hentViaProxy(url);
    if (!tekst) return null;
    const data = JSON.parse(tekst);
    return data.kommunenummer || null;
  } catch {
    return null;
  }
}


function buildKommunePanel(container, navn, county, kuratert, kommunenummer, lat, lon, isCoastal) {
  const KAT_TITTEL = {
    arealplan: `${navn} – Kommuneplan og arealdel`,
    sjø:       `${navn} – Sjø, havn og kyst`,
    regulering:`${navn} – Reguleringsplaner`,
    kart:      `${navn} – Kart og innsynsverktøy`,
  };

  if (kuratert) {
    // ── Kuraterte lenker fra kommunens egne nettsider ─────────────────────
    const grupper = {};
    for (const plan of kuratert.planer) {
      (grupper[plan.kat] ??= []).push(plan);
    }
    for (const kat of ['arealplan', 'sjø', 'regulering', 'kart']) {
      if (grupper[kat]?.length) {
        container.appendChild(buildDocSection(KAT_TITTEL[kat], grupper[kat]));
      }
    }
  } else if (kommunenummer) {
    // ── Fallback: presise lenker til arealplaner.no med kommunenummer ─────
    container.appendChild(buildDocSection(`${navn} – Planportaler`, [
      {
        name: `Kommuneplanens arealdel – ${navn}`,
        desc: 'Gjeldende arealdel med planbestemmelser og plankart (arealplaner.no)',
        url: `https://www.arealplaner.no/${kommunenummer}/arealplaner`,
        type: 'link',
      },
      {
        name: `Kommunekart – ${navn}`,
        desc: 'Kartbasert innsynsløsning med alle reguleringsplaner og arealformål',
        url: `https://kommunekart.com/?urlParams=${municipalitySlug(navn)}`,
        type: 'link',
      },
    ]));
  } else {
    // ── Siste fallback: navnebasert ───────────────────────────────────────
    container.appendChild(buildDocSection(`${navn} – Planportaler`, [
      {
        name: `${navn} kommunes planside`,
        desc: 'Kommuneplaner, reguleringsplaner og arealplaner på kommunens nettsted',
        url: `https://www.${municipalitySlug(navn)}.kommune.no/`,
        type: 'link',
      },
      {
        name: `Kommunekart – ${navn}`,
        desc: 'Kartbasert innsynsløsning med alle reguleringsplaner og arealformål',
        url: `https://kommunekart.com/?urlParams=${municipalitySlug(navn)}`,
        type: 'link',
      },
    ]));
  }

  // ── Sjø og kyst – nasjonale ressurser (alltid ved coastal/sea) ───────────
  if (isCoastal) {
    container.appendChild(buildDocSection(`${navn} – Sjø og kyst (nasjonalt)`, [
      {
        name: 'Fiskeridirektoratets kart – akvakultur og fiskeri',
        desc: 'Oppdrettslokaliteter, akvakulturtillatelser, fiskerigrenser og marine data',
        url: 'https://kart.fiskeridir.no/',
        type: 'link',
      },
      {
        name: 'Havbruksdata.no – akvakulturregister',
        desc: 'Oversikt over alle oppdrettslokaliteter langs kysten med tillatelser',
        url: 'https://www.havbruksdata.no/',
        type: 'link',
      },
      {
        name: 'Geonorge kart – dette området',
        desc: 'Nasjonalt planregister sentrert på polygonets posisjon',
        url: `https://www.geonorge.no/kart/?zoom=12&lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`,
        type: 'link',
      },
    ]));
  }
}

async function buildDynamicDocPanel(container, municipality, zone, centroid) {
  container.innerHTML = '';

  const [lon, lat] = centroid;
  const isSea = zone === 'sea';
  const isCoastal = zone === 'coastal' || zone === 'sea';

  if (!municipality || !municipality.kommunenavnNorsk) {
    const p = document.createElement('p');
    p.className = 'law-intro';
    p.textContent = isSea
      ? 'Polygonen er tegnet i åpent hav uten kommunetilhørighet. Bruk nasjonale ressurser nedenfor.'
      : 'Kommuneinformasjon ikke tilgjengelig for dette området. Prøv å flytte polygonen litt.';
    container.appendChild(p);
  } else {
    const { kommunenavnNorsk: navn, county } = municipality;

    const intro = document.createElement('p');
    intro.className = 'law-intro';
    intro.innerHTML = `Plandokumenter for <strong>${navn} kommune</strong>${county ? ` · ${county}` : ''}.`;
    container.appendChild(intro);

    // Sjekk kuratert database først (ingen nettverkskall)
    const kuratert = finnKommunePlaner(navn);

    if (kuratert) {
      // Kjent kommune – vis kuraterte lenker direkte
      buildKommunePanel(container, navn, county, kuratert, null, lat, lon, isCoastal);
    } else {
      // Ukjent kommune – hent kommunenummer fra Kartverket
      const loadingEl = document.createElement('div');
      loadingEl.className = 'doc-loading-section';
      loadingEl.innerHTML = `
        <div class="doc-loading-row">
          <span class="doc-spinner"></span>
          Henter kommunenummer fra Kartverket…
        </div>`;
      container.appendChild(loadingEl);

      const kommunenummer = await hentKommunenummer(lat, lon);
      loadingEl.remove();

      buildKommunePanel(container, navn, county, null, kommunenummer, lat, lon, isCoastal);
    }
  }

  // ── Nasjonale registre (alltid vist) ─────────────────────────────────────
  container.appendChild(buildDocSection('Nasjonale registre', [
    {
      name: 'Miljødirektoratets naturbase',
      desc: 'Verneområder, marine reservater, naturverdier og kystsonedata',
      url: 'https://naturbase.no/',
      type: 'link',
    },
    {
      name: 'Statsforvalteren – plan og bygg',
      desc: 'Statlig innsigelsesmyndighet og nasjonale planretningslinjer',
      url: 'https://www.statsforvalteren.no/',
      type: 'link',
    },
    {
      name: 'Kystverket – farvannsdata',
      desc: 'Nautiske kart, merking og farvannsforvaltning',
      url: 'https://www.kystverket.no/navigasjon-og-losjeneste/',
      type: 'link',
    },
  ]));
}

function updateDocPanel(municipality, zone, centroid) {
  if (!lawPanel) return;
  const container = lawPanel.querySelector('#tab-dokumenter');
  buildDynamicDocPanel(container, municipality, zone, centroid);
}

// ─── Tegning ─────────────────────────────────────────────────────────────────
const draw = { active: false, points: [], finished: false };
let drawBtn = null;
let clickTimer = null;

function emptyFeature(type) {
  return { type: 'Feature', geometry: { type, coordinates: type === 'Polygon' ? [[]] : [] } };
}

function polygonAreaKm2(coords) {
  const toRad = d => d * Math.PI / 180;
  const R = 6371;
  let area = 0;
  for (let i = 0, n = coords.length; i < n; i++) {
    const [lng1, lat1] = coords[i];
    const [lng2, lat2] = coords[(i + 1) % n];
    area += toRad(lng2 - lng1) * (2 + Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)));
  }
  return Math.abs((area * R * R) / 2);
}

function polygonCentroid(coords) {
  const n = coords.length;
  let lng = 0, lat = 0;
  coords.forEach(([lo, la]) => { lng += lo; lat += la; });
  return [lng / n, lat / n];
}

function formatArea(km2) {
  if (km2 < 0.001) return `${Math.round(km2 * 1e6).toLocaleString('nb-NO')} m²`;
  if (km2 < 1) return `${(km2 * 100).toFixed(1)} ha`;
  return `${km2.toFixed(2)} km²\u00a0(${Math.round(km2 * 100).toLocaleString('nb-NO')}\u00a0ha)`;
}

function updateDrawSources() {
  const pts = draw.points;
  map.getSource('draw-line').setData({
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: pts.length >= 2 ? pts : [] },
  });
  if (draw.finished && pts.length >= 3) {
    map.getSource('draw-fill').setData({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [[...pts, pts[0]]] },
    });
  } else {
    map.getSource('draw-fill').setData(emptyFeature('Polygon'));
  }
}

function startDraw() {
  draw.active = true;
  draw.points = [];
  draw.finished = false;
  map.getCanvas().style.cursor = 'crosshair';
  updateDrawSources();
  hideLawPanel();
  if (wmsInfoPanel) wmsInfoPanel.classList.remove('open');
  if (drawBtn) { drawBtn.querySelector('span').textContent = 'Avbryt tegning'; drawBtn.classList.add('active'); }
}

async function finishPolygon() {
  if (draw.points.length < 3) return;
  draw.active = false;
  draw.finished = true;
  map.getCanvas().style.cursor = '';
  updateDrawSources();
  if (drawBtn) { drawBtn.querySelector('span').textContent = 'Slett polygon'; drawBtn.classList.remove('active'); }

  const area = polygonAreaKm2(draw.points);
  const centroid = polygonCentroid(draw.points);

  // Vis panel med loading-tilstand i begge faner
  showLawPanel(area, null);

  // Hent sone + kommunenavn fra én Nominatim-forespørsel
  const { zone, municipality } = await analyzeLocation(centroid);

  updatePanelZone(zone, area);
  updateDocPanel(municipality, zone, centroid);
}

function clearDraw() {
  draw.active = false;
  draw.finished = false;
  draw.points = [];
  map.getCanvas().style.cursor = '';
  updateDrawSources();
  hideLawPanel();
  if (drawBtn) { drawBtn.querySelector('span').textContent = 'Tegn polygon'; drawBtn.classList.remove('active'); }
}

function handleMapClick(e) {
  if (!draw.active) {
    queryWmsFeatureInfo(e);
    return;
  }
  clearTimeout(clickTimer);
  const pt = [e.lngLat.lng, e.lngLat.lat];
  clickTimer = setTimeout(() => { draw.points.push(pt); updateDrawSources(); }, 180);
}

function handleMapDblclick(e) {
  if (!draw.active) return;
  e.preventDefault();
  clearTimeout(clickTimer);
  if (draw.points.length > 0) draw.points.pop();
  if (draw.points.length >= 3) finishPolygon();
}

function handleMapMousemove(e) {
  if (!draw.active || draw.points.length === 0) return;
  const pts = [...draw.points, [e.lngLat.lng, e.lngLat.lat]];
  map.getSource('draw-line').setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: pts } });
}

// ─── WMS GetFeatureInfo-panel ─────────────────────────────────────────────────
let wmsInfoPanel = null;

function buildWmsInfoPanel() {
  const panel = document.createElement('div');
  panel.id = 'wms-info-panel';
  panel.className = 'wms-info-panel';
  panel.innerHTML = `
    <div class="wms-info-header">
      <div class="wms-info-title"><span>🗺</span> Kartinformasjon</div>
      <button class="wms-info-close" title="Lukk">✕</button>
    </div>
    <div class="wms-info-body" id="wms-info-body"></div>`;
  panel.querySelector('.wms-info-close').addEventListener('click', () => {
    panel.classList.remove('open');
  });
  document.getElementById('map').appendChild(panel);
  wmsInfoPanel = panel;
}

function lngLatToMercator(lng, lat) {
  const x = lng * 20037508.34 / 180;
  const y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180) * 20037508.34 / 180;
  return [x, y];
}

function buildGetFeatureInfoUrl(wmsUrl, layerName, bounds, size, pt, infoFormat = 'application/json') {
  const [west, south] = lngLatToMercator(bounds.getWest(), bounds.getSouth());
  const [east, north] = lngLatToMercator(bounds.getEast(), bounds.getNorth());
  return (
    `${wmsUrl}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo` +
    `&LAYERS=${encodeURIComponent(layerName)}&QUERY_LAYERS=${encodeURIComponent(layerName)}` +
    `&SRS=EPSG:3857&BBOX=${west},${south},${east},${north}` +
    `&WIDTH=${size.w}&HEIGHT=${size.h}&X=${Math.round(pt.x)}&Y=${Math.round(pt.y)}` +
    `&INFO_FORMAT=${encodeURIComponent(infoFormat)}&FEATURE_COUNT=5`
  );
}

function extractHtmlBody(html) {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('script, link').forEach(el => el.remove());
    const text = doc.body.textContent.trim();
    if (!text || text.length < 3) return null;
    return doc.body.innerHTML;
  } catch { return null; }
}

function renderWmsProperties(props) {
  const rows = Object.entries(props).filter(([, v]) => v !== null && v !== '');
  if (!rows.length) return '<span style="color:#94a3b8;font-size:12px">Ingen egenskaper</span>';
  return `<table>${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</table>`;
}

async function queryWmsFeatureInfo(e) {
  if (!wmsInfoPanel || draw.active || draw.finished) return;

  const visibleLayers = WMS_QUERYABLE.filter(cfg => {
    try {
      const vis = map.getLayoutProperty(cfg.layerId, 'visibility');
      return vis == null || vis === 'visible';
    } catch { return false; }
  });
  if (!visibleLayers.length) return;

  const canvas = map.getCanvas();
  const size = { w: canvas.clientWidth, h: canvas.clientHeight };
  const bounds = map.getBounds();

  const body = document.getElementById('wms-info-body');
  body.innerHTML = '<div class="wms-info-loading"><span class="zone-spinner"></span><span>Henter kartinformasjon…</span></div>';
  wmsInfoPanel.classList.add('open');

  const results = await Promise.all(
    visibleLayers.map(async cfg => {
      try {
        const fmt = cfg.infoFormat ?? 'application/json';
        const url = buildGetFeatureInfoUrl(cfg.wmsUrl, cfg.layer, bounds, size, e.point, fmt);
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return { ...cfg, features: [], html: null };
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('json')) {
          const data = await res.json();
          return { ...cfg, features: data.features || [], html: null };
        }
        if (ct.includes('html')) {
          return { ...cfg, features: [], html: extractHtmlBody(await res.text()) };
        }
        return { ...cfg, features: [], html: null };
      } catch {
        return { ...cfg, features: [], html: null };
      }
    }),
  );

  const withData = results.filter(r => r.features.length > 0 || r.html);
  if (!withData.length) {
    body.innerHTML = '<p class="wms-info-empty">Ingen kartinformasjon funnet på dette punktet.</p>';
    return;
  }

  body.innerHTML = '';
  withData.forEach(({ label, features, html }) => {
    const block = document.createElement('div');
    block.className = 'wms-layer-block';
    block.innerHTML = `<div class="wms-layer-name">${label}</div>`;
    if (html) {
      const el = document.createElement('div');
      el.className = 'wms-feature-html';
      el.innerHTML = html;
      block.appendChild(el);
    } else {
      features.forEach(feat => {
        const el = document.createElement('div');
        el.className = 'wms-feature';
        el.innerHTML = renderWmsProperties(feat.properties || {});
        block.appendChild(el);
      });
    }
    body.appendChild(block);
  });
}

// ─── Havner og kaier (Overpass API) ──────────────────────────────────────────
let harboursEnabled = false;
let harbourDebounce = null;

function overpassToGeoJSON(data) {
  return {
    type: 'FeatureCollection',
    features: data.elements
      .map(el => {
        const coords = el.center ? [el.center.lon, el.center.lat] : (el.lon !== undefined ? [el.lon, el.lat] : null);
        if (!coords) return null;
        const t = el.tags || {};
        // Vis kun punkter som har et faktisk navn
        if (!t.name && !t['name:no'] && !t.ref && !t['seamark:name'] && !t['official_name']) return null;
        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: coords },
          properties: { ...t, osm_id: el.id },
        };
      })
      .filter(Boolean),
  };
}

async function fetchHarbours() {
  if (!harboursEnabled) return;
  const b = map.getBounds();
  const query = `[out:json][bbox:${b.getSouth()},${b.getWest()},${b.getNorth()},${b.getEast()}][timeout:20];`
    + `(`
    + `node["amenity"="ferry_terminal"];`
    + `node["harbour"="yes"];`
    + `node["seamark:type"="harbour"];`
    + `node["man_made"="quay"];`
    + `node["man_made"="pier"];`
    + `way["harbour"="yes"];`
    + `way["man_made"="quay"];`
    + `way["landuse"="harbour"];`
    + `);`
    + `out center;`;
  try {
    const res = await fetch(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`,
    );
    const data = await res.json();
    map.getSource('harbours').setData(overpassToGeoJSON(data));
  } catch (e) {
    console.error('Overpass-spørring feilet:', e);
  }
}

function scheduleFetchHarbours() {
  if (!harboursEnabled) return;
  clearTimeout(harbourDebounce);
  harbourDebounce = setTimeout(fetchHarbours, 700);
}

// ─── Regelverkspanel ──────────────────────────────────────────────────────────
let lawPanel = null;
let activeTab = 'regelverk';

function buildLawPanel() {
  const panel = document.createElement('div');
  panel.id = 'law-panel';
  panel.className = 'law-panel';

  // Header
  const header = document.createElement('div');
  header.className = 'law-panel-header';
  header.innerHTML = `
    <div class="law-panel-title"><span class="law-panel-icon">⚖️</span> Regelverk og plandokumenter</div>
    <button class="law-panel-close" title="Lukk og slett polygon">✕</button>`;
  header.querySelector('.law-panel-close').addEventListener('click', clearDraw);
  panel.appendChild(header);

  // Sone + antall lover
  const zoneBanner = document.createElement('div');
  zoneBanner.id = 'zone-banner';
  zoneBanner.className = 'zone-banner loading';
  zoneBanner.innerHTML = '<span class="zone-dot"></span><span id="zone-text">Analyserer område…</span>';
  panel.appendChild(zoneBanner);

  // Areal-info
  const areaInfo = document.createElement('div');
  areaInfo.id = 'law-area-info';
  areaInfo.className = 'law-area-info';
  panel.appendChild(areaInfo);

  // Faner
  const tabs = document.createElement('div');
  tabs.className = 'law-tabs';
  ['regelverk', 'dokumenter'].forEach(tab => {
    const btn = document.createElement('button');
    btn.dataset.tab = tab;
    btn.textContent = tab === 'regelverk' ? 'Regelverk' : 'Plandokumenter';
    btn.className = tab === activeTab ? 'active' : '';
    btn.addEventListener('click', () => {
      activeTab = tab;
      tabs.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
      panel.querySelector('#tab-regelverk').style.display = tab === 'regelverk' ? '' : 'none';
      panel.querySelector('#tab-dokumenter').style.display = tab === 'dokumenter' ? '' : 'none';
    });
    tabs.appendChild(btn);
  });
  panel.appendChild(tabs);

  // Tab: Regelverk
  const tabRegelverk = document.createElement('div');
  tabRegelverk.id = 'tab-regelverk';
  tabRegelverk.className = 'law-categories';
  panel.appendChild(tabRegelverk);

  // Tab: Plandokumenter (innhold fylles dynamisk etter at polygon er tegnet)
  const tabDokumenter = document.createElement('div');
  tabDokumenter.id = 'tab-dokumenter';
  tabDokumenter.className = 'law-categories';
  tabDokumenter.style.display = 'none';
  tabDokumenter.innerHTML = '<div class="doc-loading"><span class="zone-spinner"></span><span>Henter plandokumenter for området…</span></div>';
  panel.appendChild(tabDokumenter);

  document.getElementById('map').appendChild(panel);
  lawPanel = panel;
}


function renderLawsTab(zone) {
  const container = lawPanel.querySelector('#tab-regelverk');
  container.innerHTML = '';

  const intro = document.createElement('p');
  intro.className = 'law-intro';
  intro.textContent = 'Klikk på en paragraf for å gå direkte til lovdata.no.';
  container.appendChild(intro);

  const filtered = filterLawsByZone(zone);

  if (filtered.length === 0) {
    container.innerHTML += '<p class="law-intro">Ingen lover funnet for dette området.</p>';
    return;
  }

  filtered.forEach(cat => {
    const section = document.createElement('details');
    section.className = 'law-category';
    section.open = true;

    const summary = document.createElement('summary');
    summary.className = 'law-category-header';
    summary.innerHTML = `<span>${cat.icon}</span><span>${cat.category}</span>`;
    section.appendChild(summary);

    const body = document.createElement('div');
    body.className = 'law-category-body';

    cat.laws.forEach(law => {
      const lawEl = document.createElement('div');
      lawEl.className = 'law-item';

      const lawName = document.createElement('a');
      lawName.className = 'law-name';
      lawName.href = law.url;
      lawName.target = '_blank';
      lawName.rel = 'noopener noreferrer';
      lawName.innerHTML = `${law.name} <span class="law-ref">${law.ref}</span>`;
      lawEl.appendChild(lawName);

      const lawDesc = document.createElement('p');
      lawDesc.className = 'law-desc';
      lawDesc.textContent = law.desc;
      lawEl.appendChild(lawDesc);

      const parList = document.createElement('ul');
      parList.className = 'law-paragraphs';
      law.paragraphs.forEach(par => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="${par.url}" target="_blank" rel="noopener noreferrer"><strong>${par.ref}</strong> – ${par.desc}</a>`;
        parList.appendChild(li);
      });
      lawEl.appendChild(parList);
      body.appendChild(lawEl);
    });

    section.appendChild(body);
    container.appendChild(section);
  });
}

function showLawPanel(areaKm2, zone) {
  if (!lawPanel) return;
  document.getElementById('law-area-info').innerHTML =
    `<span class="area-label">Areal:</span> <strong>${formatArea(areaKm2)}</strong>`;

  const banner = document.getElementById('zone-banner');
  if (zone === null) {
    banner.className = 'zone-banner loading';
    banner.innerHTML = '<span class="zone-spinner"></span><span id="zone-text">Analyserer område…</span>';
  }

  // Reset docs-tab til loading-tilstand
  const tabDok = lawPanel.querySelector('#tab-dokumenter');
  if (tabDok) {
    tabDok.innerHTML = '<div class="doc-loading"><span class="zone-spinner"></span><span>Henter plandokumenter for området…</span></div>';
  }

  lawPanel.classList.add('open');
}

function updatePanelZone(zone, areaKm2) {
  const info = ZONE_LABELS[zone] || ZONE_LABELS.unknown;
  const count = countLaws(zone);

  const banner = document.getElementById('zone-banner');
  banner.className = `zone-banner zone-${zone}`;
  banner.innerHTML = `
    <div class="zone-row">
      <span class="zone-badge" style="background:${info.color}">${info.label}</span>
      <span class="zone-count"><strong>${count}</strong> lover / forskrifter gjelder</span>
    </div>`;

  renderLawsTab(zone);
}

function hideLawPanel() {
  if (lawPanel) lawPanel.classList.remove('open');
}

// ─── Lagvelger ───────────────────────────────────────────────────────────────
let currentBase = 'osm';

const DATASETS = [
  { id: 'harbour-cb', layerId: null,           label: 'Havner og kaier',       color: '#0c2340', special: 'harbours' },
  { id: 'admhavn-cb', layerId: 'admhavn-layer', label: 'Adm. havneområde',      color: '#2980b9' },
  { id: 'farts-cb',   layerId: 'farts-layer',   label: 'Fartsrestriksjoner',    color: '#c0392b' },
  { id: 'akva-cb',    layerId: 'akva-layer',     label: 'Akvakulturlokaliteter', color: '#27ae60' },
  { id: 'vern-cb',    layerId: 'vern-layer',     label: 'Naturvernområder',      color: '#16a085' },
];

function buildLayerSwitcher() {
  const panel = document.createElement('div');
  panel.className = 'dataset-panel';

  // Header
  const hdr = document.createElement('div');
  hdr.className = 'dataset-panel-hdr';
  hdr.innerHTML = '<div class="dataset-panel-title">Datasett</div><div class="dataset-panel-sub">Velg datasett for å vise på kartet</div>';
  panel.appendChild(hdr);

  // Dataset list
  const list = document.createElement('div');
  list.className = 'dataset-list';

  DATASETS.forEach(ds => {
    const item = document.createElement('label');
    item.className = 'dataset-item';
    item.htmlFor = ds.id;

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.id = ds.id;
    cb.className = 'dataset-cb';
    cb.addEventListener('change', e => {
      if (ds.special === 'harbours') {
        harboursEnabled = e.target.checked;
        map.setLayoutProperty('harbours-layer', 'visibility', harboursEnabled ? 'visible' : 'none');
        map.setLayoutProperty('harbours-labels', 'visibility', harboursEnabled ? 'visible' : 'none');
        if (harboursEnabled) fetchHarbours();
        else map.getSource('harbours').setData({ type: 'FeatureCollection', features: [] });
      } else {
        map.setLayoutProperty(ds.layerId, 'visibility', e.target.checked ? 'visible' : 'none');
      }
      item.classList.toggle('active', e.target.checked);
    });

    const dot = document.createElement('span');
    dot.className = 'dataset-dot';
    dot.style.background = ds.color;

    const name = document.createElement('span');
    name.className = 'dataset-name';
    name.textContent = ds.label;

    item.appendChild(cb);
    item.appendChild(dot);
    item.appendChild(name);
    list.appendChild(item);
  });

  panel.appendChild(list);

  // Kartgrunnlag-seksjon
  const baseSep = document.createElement('div');
  baseSep.className = 'dataset-base-sep';
  baseSep.textContent = 'Kartgrunnlag';
  panel.appendChild(baseSep);

  const baseBtns = document.createElement('div');
  baseBtns.className = 'dataset-base-btns';
  Object.entries(BASE_LAYERS).forEach(([id, layer]) => {
    const btn = document.createElement('button');
    btn.textContent = layer.label;
    btn.className = 'dataset-base-btn' + (id === currentBase ? ' active' : '');
    btn.addEventListener('click', () => {
      if (id === currentBase) return;
      map.getSource('base').setTiles(layer.tiles);
      currentBase = id;
      baseBtns.querySelectorAll('.dataset-base-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
    baseBtns.appendChild(btn);
  });
  panel.appendChild(baseBtns);

  document.getElementById('map').appendChild(panel);
}

// ─── Søkefelt ────────────────────────────────────────────────────────────────
function buildSearchBar() {
  const wrap = document.createElement('div');
  wrap.className = 'map-control search-bar';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Søk etter sted…';
  input.addEventListener('keydown', e => e.key === 'Enter' && doSearch(input.value));

  const searchBtn = document.createElement('button');
  searchBtn.title = 'Søk';
  searchBtn.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
  searchBtn.addEventListener('click', () => doSearch(input.value));

  wrap.appendChild(input);
  wrap.appendChild(searchBtn);
  document.getElementById('map').appendChild(wrap);
}

// ─── Tegn-kontroll ────────────────────────────────────────────────────────────
function buildDrawControl() {
  const wrap = document.createElement('div');
  wrap.className = 'map-control draw-control';

  const btn = document.createElement('button');
  btn.className = 'draw-btn';
  btn.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>' +
    '<span>Tegn polygon</span>';
  drawBtn = btn;

  btn.addEventListener('click', () => {
    if (draw.finished || draw.active) clearDraw();
    else startDraw();
  });

  wrap.appendChild(btn);
  document.getElementById('map').appendChild(wrap);
}

// ─── Init ────────────────────────────────────────────────────────────────────
map.on('load', () => {
  // Tegne-lag
  map.addSource('draw-line', { type: 'geojson', data: emptyFeature('LineString') });
  map.addSource('draw-fill', { type: 'geojson', data: emptyFeature('Polygon') });
  map.addLayer({ id: 'draw-fill-layer', type: 'fill', source: 'draw-fill', paint: { 'fill-color': '#2563eb', 'fill-opacity': 0.12 } });
  map.addLayer({ id: 'draw-outline-layer', type: 'line', source: 'draw-fill', paint: { 'line-color': '#2563eb', 'line-width': 2 } });
  map.addLayer({ id: 'draw-line-layer', type: 'line', source: 'draw-line', paint: { 'line-color': '#2563eb', 'line-width': 2, 'line-dasharray': [4, 3] } });

  // Geonorge Havnedata WMS
  // Merk: MapLibre erstatter {bbox-epsg-3857} men IKKE {width}/{height} –
  // Geonorge sin WMS-server er streng og returnerer 400 ved literal {width}.
  // Hardkoder 256 (= tileSize) for å få gyldige GetMap-forespørsler.
  const HAVNEDATA_BASE =
    'https://wms.geonorge.no/skwms1/wms.havnedata?' +
    'SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap' +
    '&FORMAT=image/png&TRANSPARENT=true&SRS=EPSG:3857' +
    '&STYLES=&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}';

  map.addSource('havnedata-wms', {
    type: 'raster',
    tiles: [`${HAVNEDATA_BASE}&LAYERS=havnedata`],
    tileSize: 256,
    attribution: '© <a href="https://kartverket.no">Kartverket / Kystverket – Havnedata</a>',
  });
  map.addLayer({
    id: 'havnedata-layer',
    type: 'raster',
    source: 'havnedata-wms',
    layout: { visibility: 'none' },
    paint: { 'raster-opacity': 0.85 },
  });

  // Administrativt havneområde – polygonlag, synlig i alle zoom-nivåer
  map.addSource('admhavn-wms', {
    type: 'raster',
    tiles: [`${HAVNEDATA_BASE}&LAYERS=administrativthavneomrade`],
    tileSize: 256,
    attribution: '© <a href="https://kartverket.no">Kartverket – Administrativt havneområde</a>',
  });
  map.addLayer({
    id: 'admhavn-layer',
    type: 'raster',
    source: 'admhavn-wms',
    layout: { visibility: 'none' },
    paint: { 'raster-opacity': 0.7 },
  });

  // Fartsrestriksjoner (synlig opp til 1:100 000)
  map.addSource('farts-wms', {
    type: 'raster',
    tiles: [`${HAVNEDATA_BASE}&LAYERS=fartsrestriksjoner`],
    tileSize: 256,
    attribution: '© <a href="https://kartverket.no">Kartverket – Fartsrestriksjoner</a>',
  });
  map.addLayer({
    id: 'farts-layer',
    type: 'raster',
    source: 'farts-wms',
    layout: { visibility: 'none' },
    paint: { 'raster-opacity': 0.85 },
  });

  // Akvakulturlokaliteter (Fiskeridirektoratet)
  const AKVA_WMS_BASE =
    'https://gis.fiskeridir.no/server/services/fiskeridirWMS_akva/MapServer/WMSServer?' +
    'SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap' +
    '&FORMAT=image/png&TRANSPARENT=true&SRS=EPSG:3857' +
    '&STYLES=&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}';
  map.addSource('akva-wms', {
    type: 'raster',
    tiles: [`${AKVA_WMS_BASE}&LAYERS=akvakultur_lokaliteter`],
    tileSize: 256,
    attribution: '© <a href="https://www.fiskeridir.no">Fiskeridirektoratet</a>',
  });
  map.addLayer({
    id: 'akva-layer',
    type: 'raster',
    source: 'akva-wms',
    layout: { visibility: 'none' },
    paint: { 'raster-opacity': 0.85 },
  });

  // Naturvernområder (Miljødirektoratet)
  const VERN_WMS_BASE =
    'https://kart.miljodirektoratet.no/arcgis/services/vern/MapServer/WMSServer?' +
    'SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap' +
    '&FORMAT=image/png&TRANSPARENT=true&SRS=EPSG:3857' +
    '&STYLES=&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}';
  map.addSource('vern-wms', {
    type: 'raster',
    tiles: [`${VERN_WMS_BASE}&LAYERS=naturvern_omrade`],
    tileSize: 256,
    attribution: '© <a href="https://www.miljodirektoratet.no">Miljødirektoratet – Naturvernområder</a>',
  });
  map.addLayer({
    id: 'vern-layer',
    type: 'raster',
    source: 'vern-wms',
    layout: { visibility: 'none' },
    paint: { 'raster-opacity': 0.7 },
  });

  // Havner og kaier-lag
  map.addSource('harbours', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  map.addLayer({
    id: 'harbours-layer',
    type: 'circle',
    source: 'harbours',
    layout: { visibility: 'none' },
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 5, 14, 10],
      'circle-color': '#0c2340',
      'circle-stroke-color': '#fff',
      'circle-stroke-width': 1.5,
      'circle-opacity': 0.9,
    },
  });
  map.addLayer({
    id: 'harbours-labels',
    type: 'symbol',
    source: 'harbours',
    layout: {
      visibility: 'none',
      'text-field': ['coalesce', ['get', 'name'], ['get', 'ref']],
      'text-font': ['Open Sans Regular'],
      'text-size': 11,
      'text-offset': [0, 1.4],
      'text-anchor': 'top',
      'text-optional': true,
    },
    paint: { 'text-color': '#0c2340', 'text-halo-color': '#fff', 'text-halo-width': 1.5 },
  });

  // ─── Havne-popup ved klikk ────────────────────────────────────────────────
  let activeHarbourPopup = null;

  function harbourPopupHtml(name, typeLabel, p, coords, loading) {
    let html = `<div class="harbour-popup">`;
    html += loading
      ? `<span class="popup-name-loading">…</span>`
      : `<strong>${name}</strong>`;
    if (typeLabel) html += `<br/><span class="popup-type">${typeLabel}</span>`;
    if (p.operator) html += `<br/><small class="popup-meta">Operatør: ${p.operator}</small>`;
    if (p.website || p['contact:website']) {
      const site = p.website || p['contact:website'];
      html += `<br/><a href="${site}" target="_blank" rel="noopener noreferrer" class="popup-link">Nettside ↗</a>`;
    }
    html += `<br/><small class="popup-coords">${coords[1].toFixed(5)}° N &nbsp;${coords[0].toFixed(5)}° Ø</small>`;
    html += '</div>';
    return html;
  }

  map.on('click', 'harbours-layer', async e => {
    if (draw.active) return;
    const feature = e.features[0];
    if (!feature) return;

    const coords = feature.geometry.coordinates.slice();
    const p = feature.properties;

    const typeMap = {
      harbour: 'Havn', quay: 'Kai', pier: 'Brygge',
      ferry_terminal: 'Ferjekai', dock: 'Dokk',
    };
    const rawType = p['seamark:type'] || p.man_made || p.amenity || p.harbour || '';
    const typeLabel = typeMap[rawType] || (rawType ? rawType.charAt(0).toUpperCase() + rawType.slice(1) : '');

    // Navn fra OSM-properties (mange norske havner mangler dette)
    let name = p.name || p['name:no'] || p.ref || p['seamark:name'] || p['official_name'] || null;

    if (activeHarbourPopup) activeHarbourPopup.remove();

    // Vis popup umiddelbart – med spinner hvis navn mangler
    activeHarbourPopup = new maplibregl.Popup({ closeButton: true, maxWidth: '240px' })
      .setLngLat(coords)
      .setHTML(harbourPopupHtml(name || '', typeLabel, p, coords, !name))
      .addTo(map);

    // Hvis navn mangler: slå opp via Nominatim reverse geocode
    if (!name) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${coords[1]}&lon=${coords[0]}&format=json`,
          { headers: { 'Accept-Language': 'no' }, signal: AbortSignal.timeout(6000) },
        );
        const data = await res.json();
        if (data && !data.error) {
          // Nominatim kan returnere navn på sjølve elementet
          name = data.name
            || data.address?.harbour
            || data.address?.marina
            || data.address?.pier
            || data.address?.amenity
            || data.address?.man_made
            || null;
        }
      } catch { /* behold spinner som fallback */ }

      // Oppdater popup med funnet navn (eller "Ukjent navn")
      if (activeHarbourPopup && activeHarbourPopup.isOpen()) {
        activeHarbourPopup.setHTML(harbourPopupHtml(name || 'Ukjent navn', typeLabel, p, coords, false));
      }
    }
  });

  map.on('mouseenter', 'harbours-layer', () => { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseleave', 'harbours-layer', () => { map.getCanvas().style.cursor = ''; });

  // Karteventer for tegning og havner
  map.on('click', handleMapClick);
  map.on('dblclick', handleMapDblclick);
  map.on('mousemove', handleMapMousemove);
  map.on('moveend', scheduleFetchHarbours);

  // Bygg UI
  buildLayerSwitcher();
  buildSearchBar();
  buildDrawControl();
  buildLawPanel();
  buildWmsInfoPanel();
});
