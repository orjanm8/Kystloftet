/**
 * Kystloftet – Applikasjonslogikk
 *
 * Bruker Leaflet.js for kart, Leaflet.draw for tegneverktøy,
 * Turf.js for geografiske beregninger, og Geonorge API for
 * å finne kommune/fylke for valgt område.
 */

// ─── KONFIGURASJON ───────────────────────────────────────────────────────────

const KARTVERKET_TOPO =
  "https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png";
const KARTVERKET_GREY =
  "https://cache.kartverket.no/v1/wmts/1.0.0/topograatone/default/webmercator/{z}/{y}/{x}.png";
const OSM_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const ATTRIBUTION_KARTVERKET =
  '&copy; <a href="https://kartverket.no">Kartverket</a>';
const ATTRIBUTION_OSM =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// Geonorge kommuneinfo API – finner kommune fra koordinat
const GEONORGE_PUNKT_URL =
  "https://ws.geonorge.no/kommuneinfo/v1/punkt?koordsys=4326&nord={lat}&ost={lon}";

// Norges grunnlinje (ca. bounding box) – brukes til enkel sjø-deteksjon
const NORWAY_BBOX = {
  minLat: 57.5,
  maxLat: 81.0,
  minLon: 4.0,
  maxLon: 31.5,
};

// ─── KART INITIALISERING ─────────────────────────────────────────────────────

const map = L.map("map", {
  center: [58.461, 8.766], // Arendal – pilotkommune
  zoom: 12,
  zoomControl: true,
});

// Kartlag
const layers = {
  topo: L.tileLayer(KARTVERKET_TOPO, {
    attribution: ATTRIBUTION_KARTVERKET,
    maxZoom: 18,
  }),
  grey: L.tileLayer(KARTVERKET_GREY, {
    attribution: ATTRIBUTION_KARTVERKET,
    maxZoom: 18,
  }),
  osm: L.tileLayer(OSM_URL, {
    attribution: ATTRIBUTION_OSM,
    maxZoom: 19,
  }),
};

// Start med topo
layers.topo.addTo(map);
let activeLayer = "topo";

// Bytt kartlag
document.querySelectorAll('input[name="basemap"]').forEach((radio) => {
  radio.addEventListener("change", (e) => {
    map.removeLayer(layers[activeLayer]);
    activeLayer = e.target.value;
    layers[activeLayer].addTo(map);
  });
});

// ─── TEGNELAG OG KONTROLLER ──────────────────────────────────────────────────

const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

const SHAPE_STYLE = {
  color: "#0369a1",
  fillColor: "#0ea5e9",
  fillOpacity: 0.25,
  weight: 2,
};

// Opprett handlers direkte – ingen DrawControl nødvendig
const polygonHandler = new L.Draw.Polygon(map, {
  allowIntersection: false,
  showArea: true,
  shapeOptions: SHAPE_STYLE,
});

const circleHandler = new L.Draw.Circle(map, {
  shapeOptions: SHAPE_STYLE,
  showRadius: true,
  metric: true,
});

// ─── AKTIV TEGNE-HANDLER ─────────────────────────────────────────────────────

let activeDrawHandler = null;

function startDraw(type) {
  if (activeDrawHandler) {
    activeDrawHandler.disable();
    activeDrawHandler = null;
  }

  document.querySelectorAll(".tool-btn").forEach((b) =>
    b.classList.remove("active")
  );

  if (type === "polygon") {
    activeDrawHandler = polygonHandler;
    document.getElementById("btn-polygon").classList.add("active");
  } else if (type === "circle") {
    activeDrawHandler = circleHandler;
    document.getElementById("btn-circle").classList.add("active");
  }

  if (activeDrawHandler) activeDrawHandler.enable();
}

document.getElementById("btn-polygon").addEventListener("click", () =>
  startDraw("polygon")
);
document.getElementById("btn-circle").addEventListener("click", () =>
  startDraw("circle")
);
document.getElementById("btn-clear").addEventListener("click", clearSelection);

// ─── TEGNING FULLFØRES ───────────────────────────────────────────────────────

map.on(L.Draw.Event.CREATED, (e) => {
  drawnItems.clearLayers();
  drawnItems.addLayer(e.layer);

  activeDrawHandler = null;
  document.querySelectorAll(".tool-btn").forEach((b) =>
    b.classList.remove("active")
  );

  handleAreaSelected(e.layer, e.layerType);
});

// ─── HÅNDTER VALGT OMRÅDE ────────────────────────────────────────────────────

async function handleAreaSelected(layer, layerType) {
  showLoading();

  let centroid;
  let areaKm2 = null;
  let radiusKm = null;

  try {
    if (layerType === "circle") {
      const center = layer.getLatLng();
      centroid = center;
      radiusKm = (layer.getRadius() / 1000).toFixed(1);
    } else {
      // Polygon – bruk Turf.js for tyngdepunkt og areal
      const geojson = layer.toGeoJSON();
      const turfCentroid = turf.centroid(geojson);
      centroid = {
        lat: turfCentroid.geometry.coordinates[1],
        lng: turfCentroid.geometry.coordinates[0],
      };
      const areaSqM = turf.area(geojson);
      areaKm2 = (areaSqM / 1_000_000).toFixed(2);
    }

    // Hent kommuneinfo fra Geonorge
    const geoInfo = await fetchGeonorgeInfo(centroid.lat, centroid.lng);
    const context = buildContext(centroid, geoInfo);

    displayResults(context, geoInfo, { areaKm2, radiusKm, layerType });
  } catch (err) {
    console.error("Feil ved henting av geoinformasjon:", err);
    // Vis resultater uten kommuneinfo
    const context = buildContext(centroid, null);
    displayResults(context, null, { areaKm2, radiusKm, layerType });
  }
}

// ─── GEONORGE API ───────────────────────────────────────────────────────────

async function fetchGeonorgeInfo(lat, lon) {
  const url = GEONORGE_PUNKT_URL.replace("{lat}", lat).replace("{lon}", lon);
  const response = await fetch(url);
  if (!response.ok) return null; // Punkt er i sjøen eller utenfor Norge
  return response.json();
}

// ─── BYGG KONTEKST FOR LOVFILTRERING ────────────────────────────────────────

function buildContext(centroid, geoInfo) {
  const context = {
    isSeaArea: false,
    isCoastal: false,
    isSvalbard: false,
    kommunenavn: null,
    fylkesnavn: null,
    lat: centroid ? centroid.lat : null,
    lon: centroid ? centroid.lng : null,
  };

  if (!geoInfo) {
    // Ingen kommunetreff = punktet er i sjøen
    context.isSeaArea = true;
    context.isCoastal = true;
  } else {
    context.kommunenavn = geoInfo.kommunenavn;
    context.fylkesnavn = geoInfo.fylkesnavn;
    context.isCoastal = true; // Kystkommune antas

    // Sjekk om det er Svalbard (Longyearbyen = 2111, Svalbard = 2100-serien)
    const knr = geoInfo.kommunenummer || "";
    if (knr.startsWith("21")) context.isSvalbard = true;
  }

  return context;
}

// ─── VIS RESULTATER ─────────────────────────────────────────────────────────

let currentFilter = "all";
let currentContext = null;

function displayResults(context, geoInfo, meta) {
  currentContext = context;

  // Oppdater areainfo
  const areaInfo = document.getElementById("area-info");
  const parts = [];

  if (meta.layerType === "circle" && meta.radiusKm) {
    parts.push(`Sirkelradius: ${meta.radiusKm} km`);
  } else if (meta.areaKm2) {
    parts.push(`Areal: ${meta.areaKm2} km²`);
  }

  if (geoInfo) {
    parts.push(`${geoInfo.kommunenavn} kommune, ${geoInfo.fylkesnavn}`);
  } else {
    parts.push("Sjøareal / utenfor kommunegrense");
  }

  areaInfo.innerHTML = parts
    .map((p) => `<span class="area-chip">${p}</span>`)
    .join("");

  // Oppdater header
  document.getElementById("sidebar-title").textContent =
    geoInfo
      ? `Lovverk – ${geoInfo.kommunenavn}`
      : "Lovverk – Sjøareal";

  renderLawList(context, currentFilter);
  showResults();
}

function renderLawList(context, filterTopic) {
  const laws = filterLaws(context, filterTopic);
  const list = document.getElementById("results-list");

  if (laws.length === 0) {
    list.innerHTML = `
      <div class="no-results">
        <p>Ingen lovverk funnet for dette kombinasjonen av område og filter.</p>
        <p>Prøv et annet filter, eller tegn et annet område.</p>
      </div>`;
    return;
  }

  // Grupper etter tema
  const topicLabels = {
    havbruk: "Havbruk / Akvakultur",
    fiskeri: "Fiskeri",
    miljoe: "Miljø og naturvern",
    planlegging: "Arealplanlegging og ferdsel",
    energi: "Energi / Offshore",
  };

  // Finn hvilke temaer som er representert
  const usedTopics = [];
  if (filterTopic === "all") {
    Object.keys(topicLabels).forEach((t) => {
      if (laws.some((l) => l.topics.includes(t))) usedTopics.push(t);
    });
  } else {
    usedTopics.push(filterTopic);
  }

  let html = "";

  if (filterTopic === "all") {
    // Vis gruppert per tema
    usedTopics.forEach((topic) => {
      const topicLaws = laws.filter((l) => l.topics.includes(topic));
      if (topicLaws.length === 0) return;
      html += `<div class="law-group">
        <div class="law-group-header">${topicLabels[topic]}</div>
        ${topicLaws.map(renderLawCard).join("")}
      </div>`;
    });
  } else {
    html = laws.map(renderLawCard).join("");
  }

  list.innerHTML = html;

  // Legg til klikk-handler for å expandere kort
  list.querySelectorAll(".law-card").forEach((card) => {
    card.addEventListener("click", () => card.classList.toggle("expanded"));
  });
}

function renderLawCard(law) {
  const topicBadges = law.topics
    .map(
      (t) => `<span class="badge badge-${t}">${topicBadgeName(t)}</span>`
    )
    .join("");

  const paragraphs =
    law.keyParagraphs && law.keyParagraphs.length
      ? `<div class="key-paragraphs">
          <strong>Sentrale paragrafer:</strong>
          <ul>${law.keyParagraphs.map((p) => `<li>${p}</li>`).join("")}</ul>
        </div>`
      : "";

  return `
    <div class="law-card" data-id="${law.id}">
      <div class="law-card-header">
        <div class="law-title-row">
          <span class="law-ref">${law.reference}</span>
          <span class="law-year">${law.year}</span>
        </div>
        <div class="law-short-title">${law.shortTitle}</div>
        <div class="law-badges">${topicBadges}</div>
      </div>
      <div class="law-card-body">
        <p class="law-description">${law.description}</p>
        ${paragraphs}
        <a href="${law.url}" target="_blank" rel="noopener noreferrer" class="lovdata-link" onclick="event.stopPropagation()">
          Åpne på Lovdata.no →
        </a>
      </div>
    </div>`;
}

function topicBadgeName(t) {
  const names = {
    havbruk: "Havbruk",
    fiskeri: "Fiskeri",
    miljoe: "Miljø",
    planlegging: "Planlegging",
    energi: "Energi",
  };
  return names[t] || t;
}

// ─── FILTER-KNAPPER ──────────────────────────────────────────────────────────

document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach((b) =>
      b.classList.remove("active")
    );
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    if (currentContext) renderLawList(currentContext, currentFilter);
  });
});

// ─── TILSTAND: VIS / SKJUL SEKSJONER ────────────────────────────────────────

function showLoading() {
  document.getElementById("empty-state").classList.add("hidden");
  document.getElementById("results").classList.add("hidden");
  document.getElementById("loading-state").classList.remove("hidden");
  document.getElementById("status-text").textContent = "Henter lovverk…";
}

function showResults() {
  document.getElementById("loading-state").classList.add("hidden");
  document.getElementById("empty-state").classList.add("hidden");
  document.getElementById("results").classList.remove("hidden");
  document.getElementById("status-text").textContent =
    "Klikk på et lovverk for detaljer";
}

function clearSelection() {
  drawnItems.clearLayers();
  currentContext = null;
  currentFilter = "all";

  document.querySelectorAll(".filter-btn").forEach((b) =>
    b.classList.remove("active")
  );
  document.querySelector('[data-filter="all"]').classList.add("active");

  document.getElementById("results").classList.add("hidden");
  document.getElementById("loading-state").classList.add("hidden");
  document.getElementById("empty-state").classList.remove("hidden");
  document.getElementById("area-info").innerHTML = "";
  document.getElementById("sidebar-title").textContent =
    "Lovverk for kystsonen";
  document.getElementById("status-text").textContent =
    "Tegn et område i kartet for å søke";

  if (activeDrawHandler) {
    activeDrawHandler.disable();
    activeDrawHandler = null;
  }
  document.querySelectorAll(".tool-btn").forEach((b) =>
    b.classList.remove("active")
  );
}

// ─── VELKOMST: Zoom til Norskekysten ────────────────────────────────────────
// Kartet starter sentrert på norskekysten – brukeren kan zoome til ønsket område
