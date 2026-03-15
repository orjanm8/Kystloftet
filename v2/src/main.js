import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';
import maplibregl from 'maplibre-gl';
import { LAWS, ZONE_LABELS, filterLawsByZone, countLaws } from './laws.js';

// ─── Kommunedokumenter – Arendal ─────────────────────────────────────────────
const MUNICIPAL_DOCS = [
  {
    title: 'Kommuneplanens arealdel 2023–2033',
    docs: [
      {
        name: 'Kommuneplanens arealdel',
        desc: 'Overordnet plan for arealbruk i Arendal, inkl. sjøarealer og strandsone',
        url: 'https://www.arendal.kommune.no/politikk-og-medvirkning/kommunens-planer/arealdel/',
        type: 'link',
      },
      {
        name: 'Planbestemmelser (PDF)',
        desc: 'Juridisk bindende bestemmelser – Kommuneplanens arealdel 2023–2033',
        url: 'https://www.arendal.kommune.no/_f/p1/i5917f255-7513-4b25-97a8-34659f731ff4/vedlegg-2-kommuneplanbestemmelser-januar-2023-27012023.pdf',
        type: 'pdf',
      },
      {
        name: 'Planbeskrivelse 2023–2033 (PDF)',
        desc: 'Beskrivelse av planens innhold, vurderinger og konsekvenser',
        url: 'https://www.arendal.kommune.no/_f/p1/i4bf2f64d-bba0-4be8-a20f-e981b90a3def/planbeskrivelse-2023-2033-ny-horing-justert-etter-vedtak-25januar-2023.pdf',
        type: 'pdf',
      },
      {
        name: 'Arealstrategier (PDF)',
        desc: 'Forslag til arealstrategier for Arendal kommune',
        url: 'https://www.arendal.kommune.no/_f/p1/i7802d02f-55bc-45cb-9819-8d71e0da3168/kommuneplan-arealdel-forslag-til-arealstrategier-arendal-kommune.pdf',
        type: 'pdf',
      },
      {
        name: 'Revisjon av arealdelen (pågående)',
        desc: 'Informasjon om pågående revisjonsarbeid av kommuneplanens arealdel',
        url: 'https://www.arendal.kommune.no/politikk-og-medvirkning/kommunens-planer/ny-kommuneplan-revisjon-av-kommuneplanens-arealdel/',
        type: 'link',
      },
    ],
  },
  {
    title: 'Kommunedelplaner',
    docs: [
      {
        name: 'Kommunedelplan for småbåthavner',
        desc: 'Plan for småbåthavner og uthavner i Arendal kommune',
        url: 'https://www.arendal.kommune.no/politikk-og-organisasjon/kommuneplan-planer-og-styringsdokumenter/kommunedelplaner/smabathavner/',
        type: 'link',
      },
      {
        name: 'Kommunedelplan småbåthavner 2010–2020 (PDF)',
        desc: 'Gjeldende kommunedelplan for småbåthavner med bestemmelser',
        url: 'https://www.arendal.kommune.no/_f/p1/iac3d68a9-5dc5-41d8-83b8-833dd001c559/Kommunedelplan_smaabaathavner_2010-2020.pdf',
        type: 'pdf',
      },
      {
        name: 'Alle kommunedelplaner',
        desc: 'Oversikt over alle kommunedelplaner i Arendal',
        url: 'https://www.arendal.kommune.no/politikk-og-organisasjon/kommuneplan-planer-og-styringsdokumenter/kommunedelplaner/',
        type: 'link',
      },
    ],
  },
  {
    title: 'Reguleringsplaner (sjø og kyst)',
    docs: [
      {
        name: 'Arendal havn – reguleringsplan',
        desc: 'Vedtatt reguleringsplan for Arendal havn',
        url: 'https://www.arendal.kommune.no/tjenester/plan-bygg-og-eiendom/reguleringsplaner/vedtatte-reguleringsplaner/arendal-havn-del-av.22121.aspx',
        type: 'link',
      },
      {
        name: 'Innseiling Arendal (under arbeid)',
        desc: 'Reguleringsplan for innseiling til Arendal – pågående planarbeid',
        url: 'https://www.arendal.kommune.no/tjenester/plan-bygg-og-eiendom/reguleringsplaner/reguleringsplaner-under-arbeid/innseiling-arendal.26864.aspx',
        type: 'link',
      },
      {
        name: 'Paddelandet småbåthavn',
        desc: 'Vedtatt reguleringsplan for Paddelandet småbåthavn',
        url: 'https://www.arendal.kommune.no/tjenester/plan-bygg-og-eiendom/reguleringsplaner/vedtatte-reguleringsplaner/paddelandet-smabathavn.8621.aspx',
        type: 'link',
      },
      {
        name: 'Alle vedtatte reguleringsplaner',
        desc: 'Søk i alle vedtatte reguleringsplaner i Arendal kommune',
        url: 'https://www.arendal.kommune.no/tjenester/plan-bygg-og-eiendom/reguleringsplaner/vedtatte-reguleringsplaner/',
        type: 'link',
      },
    ],
  },
  {
    title: 'Kart og eiendomsinformasjon',
    docs: [
      {
        name: 'Eiendomsinformasjon og kart – Arendal',
        desc: 'Kommunens karttjenester, eiendomsdata og arealformål',
        url: 'https://www.arendal.kommune.no/tjenester/plan-bygg-og-eiendom/eiendomsinformasjon-og-kart/',
        type: 'link',
      },
      {
        name: 'Geonorge – nasjonale arealdata',
        desc: 'Kartverkets portal for arealplaner, geografiske data og WMS-tjenester',
        url: 'https://www.geonorge.no/',
        type: 'link',
      },
      {
        name: 'Fiskeridirektoratets kart',
        desc: 'Akvakulturlokaliteter, fiskerigrenser og marine sjødata',
        url: 'https://kart.fiskeridir.no/',
        type: 'link',
      },
      {
        name: 'Miljødirektoratets naturbase',
        desc: 'Verneområder, marine reservater og naturverdier langs kysten',
        url: 'https://naturbase.no/',
        type: 'link',
      },
    ],
  },
];

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

function goToMyPosition() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    pos => {
      const lngLat = [pos.coords.longitude, pos.coords.latitude];
      placeMarker(lngLat, '#dc2626');
      map.flyTo({ center: lngLat, zoom: 14 });
    },
    err => console.error('Geolokasjon feilet:', err),
    { enableHighAccuracy: true },
  );
}

// ─── Sone-deteksjon via Nominatim ─────────────────────────────────────────────
async function detectZone(centroid) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${centroid[1]}&lon=${centroid[0]}&format=json`,
      { headers: { 'Accept-Language': 'no' }, signal: AbortSignal.timeout(6000) },
    );
    if (!res.ok) return 'sea';
    const data = await res.json();
    if (data.error) return 'sea';

    const addr = data.address || {};
    const cls = data.class;
    const type = data.type;

    // Åpent hav
    if (addr.sea || addr.ocean || addr.bay || type === 'sea' || type === 'ocean') return 'sea';

    // Sjøareal (fjord, sund, bukt)
    if (cls === 'natural' && ['water', 'bay', 'strait', 'fjord', 'inlet'].includes(type)) return 'coastal';
    if (cls === 'waterway') return 'coastal';

    // Tydelig landadresse
    if (addr.road || addr.suburb || addr.residential || addr.village || addr.town || addr.city) return 'land';

    // Har kommune/fylke men ingen spesifikk adresse → kystnær sone
    if (addr.municipality || addr.county || addr.country_code === 'no') return 'coastal';

    return 'sea';
  } catch {
    return 'unknown';
  }
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

  // Vis panel med loading-tilstand mens sonen detekteres
  showLawPanel(area, null);

  const zone = await detectZone(centroid);
  updatePanelZone(zone, area);
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
  if (!draw.active) return;
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
        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: coords },
          properties: { ...el.tags, osm_id: el.id },
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

  // Tab: Plandokumenter
  const tabDokumenter = document.createElement('div');
  tabDokumenter.id = 'tab-dokumenter';
  tabDokumenter.className = 'law-categories';
  tabDokumenter.style.display = 'none';
  buildDocPanel(tabDokumenter);
  panel.appendChild(tabDokumenter);

  document.getElementById('map').appendChild(panel);
  lawPanel = panel;
}

function buildDocPanel(container) {
  const intro = document.createElement('p');
  intro.className = 'law-intro';
  intro.textContent = 'Relevante plandokumenter og kartressurser for Arendal kommune og marine sjøarealer.';
  container.appendChild(intro);

  MUNICIPAL_DOCS.forEach(section => {
    const details = document.createElement('details');
    details.className = 'law-category';
    details.open = true;

    const summary = document.createElement('summary');
    summary.className = 'law-category-header';
    summary.innerHTML = `<span>📂</span><span>${section.title}</span>`;
    details.appendChild(summary);

    const body = document.createElement('div');
    body.className = 'law-category-body';

    section.docs.forEach(doc => {
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
    container.appendChild(details);
  });
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

function buildLayerSwitcher() {
  const wrap = document.createElement('div');
  wrap.className = 'map-control layer-switcher';

  // Kartlag-knapper
  Object.entries(BASE_LAYERS).forEach(([id, layer]) => {
    const btn = document.createElement('button');
    btn.textContent = layer.label;
    if (id === currentBase) btn.classList.add('active');
    btn.addEventListener('click', () => {
      if (id === currentBase) return;
      map.getSource('base').setTiles(layer.tiles);
      currentBase = id;
      wrap.querySelectorAll('button.base-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
    btn.classList.add('base-btn');
    wrap.appendChild(btn);
  });

  // Separator
  const sep = document.createElement('span');
  sep.className = 'layer-sep';
  wrap.appendChild(sep);

  // Havner og kaier-avkrysningsboks
  const label = document.createElement('label');
  label.className = 'harbour-toggle';
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.id = 'harbour-cb';
  cb.addEventListener('change', e => {
    harboursEnabled = e.target.checked;
    map.setLayoutProperty('harbours-layer', 'visibility', harboursEnabled ? 'visible' : 'none');
    map.setLayoutProperty('harbours-labels', 'visibility', harboursEnabled ? 'visible' : 'none');
    if (harboursEnabled) fetchHarbours();
    else map.getSource('harbours').setData({ type: 'FeatureCollection', features: [] });
  });
  const cbLabel = document.createElement('span');
  cbLabel.textContent = '⚓ Havner og kaier';
  label.appendChild(cb);
  label.appendChild(cbLabel);
  wrap.appendChild(label);

  document.getElementById('map').appendChild(wrap);
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

  const posBtn = document.createElement('button');
  posBtn.title = 'Min posisjon';
  posBtn.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>';
  posBtn.addEventListener('click', goToMyPosition);

  wrap.appendChild(input);
  wrap.appendChild(searchBtn);
  wrap.appendChild(posBtn);
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
});
