import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';
import maplibregl from 'maplibre-gl';
import { LAWS } from './laws.js';

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

// ─── Map ─────────────────────────────────────────────────────────────────────
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
  center: [10.75, 59.91],
  zoom: 5,
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');

// ─── Markers (no popup) ───────────────────────────────────────────────────────
let activeMarker = null;

function placeMarker(lngLat, color) {
  if (activeMarker) activeMarker.remove();
  activeMarker = new maplibregl.Marker({ color }).setLngLat(lngLat).addTo(map);
}

// ─── Search ──────────────────────────────────────────────────────────────────
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

// ─── Drawing ─────────────────────────────────────────────────────────────────
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

function formatArea(km2) {
  if (km2 < 0.001) return `${Math.round(km2 * 1e6).toLocaleString('nb-NO')} m²`;
  if (km2 < 1) return `${(km2 * 100).toFixed(1)} ha`;
  return `${km2.toFixed(2)} km²\u00a0(${Math.round(km2 * 100).toLocaleString('nb-NO')}\u00a0ha)`;
}

function updateDrawSources() {
  const pts = draw.points;

  // Preview line while drawing
  const lineCoords = pts.length >= 2 ? pts : [];
  map.getSource('draw-line').setData({
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: lineCoords },
  });

  // Finished polygon fill
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
  if (drawBtn) {
    drawBtn.textContent = 'Avbryt tegning';
    drawBtn.classList.add('active');
  }
}

function finishPolygon() {
  if (draw.points.length < 3) return;
  draw.active = false;
  draw.finished = true;
  map.getCanvas().style.cursor = '';
  updateDrawSources();
  if (drawBtn) {
    drawBtn.textContent = 'Slett polygon';
    drawBtn.classList.remove('active');
  }
  const area = polygonAreaKm2(draw.points);
  showLawPanel(area);
}

function clearDraw() {
  draw.active = false;
  draw.finished = false;
  draw.points = [];
  map.getCanvas().style.cursor = '';
  updateDrawSources();
  hideLawPanel();
  if (drawBtn) {
    drawBtn.textContent = 'Tegn polygon';
    drawBtn.classList.remove('active');
  }
}

function handleMapClick(e) {
  if (!draw.active) return;
  clearTimeout(clickTimer);
  const pt = [e.lngLat.lng, e.lngLat.lat];
  clickTimer = setTimeout(() => {
    draw.points.push(pt);
    updateDrawSources();
  }, 180);
}

function handleMapDblclick(e) {
  if (!draw.active) return;
  e.preventDefault();
  clearTimeout(clickTimer);
  // Remove last point added by the second click of the double-click
  if (draw.points.length > 0) draw.points.pop();
  if (draw.points.length >= 3) {
    finishPolygon();
  }
}

function handleMapMousemove(e) {
  if (!draw.active || draw.points.length === 0) return;
  const cursor = [e.lngLat.lng, e.lngLat.lat];
  const pts = [...draw.points, cursor];
  map.getSource('draw-line').setData({
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: pts },
  });
}

// ─── Law panel ───────────────────────────────────────────────────────────────
let lawPanel = null;

function buildLawPanel() {
  const panel = document.createElement('div');
  panel.id = 'law-panel';
  panel.className = 'law-panel';

  const header = document.createElement('div');
  header.className = 'law-panel-header';

  const title = document.createElement('div');
  title.className = 'law-panel-title';
  title.innerHTML = '<span class="law-panel-icon">⚖️</span> Gjeldende regelverk';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'law-panel-close';
  closeBtn.innerHTML = '✕';
  closeBtn.title = 'Lukk';
  closeBtn.addEventListener('click', () => {
    clearDraw();
  });

  header.appendChild(title);
  header.appendChild(closeBtn);
  panel.appendChild(header);

  const areaInfo = document.createElement('div');
  areaInfo.id = 'law-area-info';
  areaInfo.className = 'law-area-info';
  panel.appendChild(areaInfo);

  const intro = document.createElement('p');
  intro.className = 'law-intro';
  intro.textContent =
    'Følgende lover og forskrifter er relevante for det markerte området. Klikk på en paragraf for å gå direkte til lovdata.no.';
  panel.appendChild(intro);

  const lawsContainer = document.createElement('div');
  lawsContainer.className = 'law-categories';

  LAWS.forEach(cat => {
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
        const a = document.createElement('a');
        a.href = par.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.innerHTML = `<strong>${par.ref}</strong> – ${par.desc}`;
        li.appendChild(a);
        parList.appendChild(li);
      });
      lawEl.appendChild(parList);

      body.appendChild(lawEl);
    });

    section.appendChild(body);
    lawsContainer.appendChild(section);
  });

  panel.appendChild(lawsContainer);
  document.getElementById('map').appendChild(panel);
  lawPanel = panel;
}

function showLawPanel(areaKm2) {
  if (!lawPanel) return;
  const info = document.getElementById('law-area-info');
  info.innerHTML = `<span class="area-label">Areal:</span> <strong>${formatArea(areaKm2)}</strong>`;
  lawPanel.classList.add('open');
}

function hideLawPanel() {
  if (lawPanel) lawPanel.classList.remove('open');
}

// ─── Layer switcher ───────────────────────────────────────────────────────────
let currentBase = 'osm';

function buildLayerSwitcher() {
  const wrap = document.createElement('div');
  wrap.className = 'map-control layer-switcher';

  Object.entries(BASE_LAYERS).forEach(([id, layer]) => {
    const btn = document.createElement('button');
    btn.textContent = layer.label;
    if (id === currentBase) btn.classList.add('active');
    btn.addEventListener('click', () => {
      if (id === currentBase) return;
      map.getSource('base').setTiles(layer.tiles);
      currentBase = id;
      wrap.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
    wrap.appendChild(btn);
  });

  document.getElementById('map').appendChild(wrap);
}

// ─── Search bar ───────────────────────────────────────────────────────────────
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

// ─── Draw control ────────────────────────────────────────────────────────────
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
    if (draw.finished) {
      clearDraw();
    } else if (draw.active) {
      clearDraw();
    } else {
      startDraw();
    }
  });

  const hint = document.createElement('span');
  hint.className = 'draw-hint';
  hint.id = 'draw-hint';

  wrap.appendChild(btn);
  wrap.appendChild(hint);
  document.getElementById('map').appendChild(wrap);
}

// ─── Init ────────────────────────────────────────────────────────────────────
map.on('load', () => {
  map.addSource('draw-line', { type: 'geojson', data: emptyFeature('LineString') });
  map.addSource('draw-fill', { type: 'geojson', data: emptyFeature('Polygon') });

  map.addLayer({
    id: 'draw-fill-layer',
    type: 'fill',
    source: 'draw-fill',
    paint: { 'fill-color': '#2563eb', 'fill-opacity': 0.12 },
  });
  map.addLayer({
    id: 'draw-outline-layer',
    type: 'line',
    source: 'draw-fill',
    paint: { 'line-color': '#2563eb', 'line-width': 2 },
  });
  map.addLayer({
    id: 'draw-line-layer',
    type: 'line',
    source: 'draw-line',
    paint: { 'line-color': '#2563eb', 'line-width': 2, 'line-dasharray': [4, 3] },
  });

  map.on('click', handleMapClick);
  map.on('dblclick', handleMapDblclick);
  map.on('mousemove', handleMapMousemove);

  buildLayerSwitcher();
  buildSearchBar();
  buildDrawControl();
  buildLawPanel();
});
