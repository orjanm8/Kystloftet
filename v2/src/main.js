import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';
import maplibregl from 'maplibre-gl';

// ---------------------------------------------------------------------------
// Base layer definitions
// ---------------------------------------------------------------------------
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
    tiles: [
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    ],
    attribution: '© <a href="https://www.esri.com">Esri</a>',
    maxzoom: 19,
  },
};

// ---------------------------------------------------------------------------
// Kystverket WMS overlay
// ---------------------------------------------------------------------------
const kystverketWMS =
  'https://wms.kystverket.no/v1/wms?' +
  'SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap' +
  '&FORMAT=image/png&TRANSPARENT=true&SRS=EPSG:3857' +
  '&LAYERS=nautiske_kart' +
  '&WIDTH={width}&HEIGHT={height}' +
  '&BBOX={bbox-epsg-3857}';

// ---------------------------------------------------------------------------
// Map
// ---------------------------------------------------------------------------
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
      {
        id: 'kystverket-layer',
        type: 'raster',
        source: 'kystverket',
        paint: { 'raster-opacity': 0.85 },
      },
    ],
  },
  center: [10.75, 59.91],
  zoom: 5,
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');

// ---------------------------------------------------------------------------
// Layer switcher
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Search + geolocation bar
// ---------------------------------------------------------------------------
let marker = null;

function placeMarker(lngLat, color, popupText) {
  if (marker) marker.remove();
  marker = new maplibregl.Marker({ color })
    .setLngLat(lngLat)
    .setPopup(new maplibregl.Popup({ offset: 25 }).setText(popupText))
    .addTo(map);
  marker.togglePopup();
}

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
    placeMarker(lngLat, '#2563eb', data[0].display_name);
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
      placeMarker(lngLat, '#dc2626', 'Min posisjon');
      map.flyTo({ center: lngLat, zoom: 14 });
    },
    err => console.error('Geolokasjon feilet:', err),
    { enableHighAccuracy: true },
  );
}

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

// ---------------------------------------------------------------------------
// Init controls after map loads
// ---------------------------------------------------------------------------
map.on('load', () => {
  buildLayerSwitcher();
  buildSearchBar();
});
