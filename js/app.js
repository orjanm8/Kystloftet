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

// ─── POLYGON-TEGNING (egenimplementert) ──────────────────────────────────────

const POLYGON_STYLE = {
  color: "#0369a1",
  fillColor: "#0ea5e9",
  fillOpacity: 0.25,
  weight: 2,
};

let drawingActive = false;
let drawPoints = [];
let drawPolyline = null;
let drawPreviewLine = null;

function startPolygon() {
  if (drawingActive) {
    cancelDrawing();
    return;
  }
  drawingActive = true;
  drawPoints = [];
  document.getElementById("btn-polygon").classList.add("active");
  document.getElementById("status-text").textContent =
    "Klikk for å legge til punkter – dobbeltklikk for å fullføre";
  map.getContainer().style.cursor = "crosshair";
  map.doubleClickZoom.disable();
  map.on("click", onMapClick);
  map.on("dblclick", onMapDblClick);
  map.on("mousemove", onMapMouseMove);
}

function onMapClick(e) {
  drawPoints.push(e.latlng);
  if (drawPolyline) {
    drawPolyline.setLatLngs(drawPoints);
  } else {
    drawPolyline = L.polyline(drawPoints, { color: "#0369a1", weight: 2 }).addTo(map);
  }
}

function onMapMouseMove(e) {
  if (drawPoints.length === 0) return;
  const preview = [...drawPoints, e.latlng];
  if (drawPreviewLine) {
    drawPreviewLine.setLatLngs(preview);
  } else {
    drawPreviewLine = L.polyline(preview, {
      color: "#0369a1",
      weight: 1,
      dashArray: "6,6",
      opacity: 0.5,
    }).addTo(map);
  }
}

function onMapDblClick() {
  // Dobbelt-klikk fyrer to click-events først – fjern det siste
  if (drawPoints.length > 0) drawPoints.pop();
  if (drawPoints.length < 3) {
    cancelDrawing();
    return;
  }
  finishDrawing();
}

function stopDrawListeners() {
  map.off("click", onMapClick);
  map.off("dblclick", onMapDblClick);
  map.off("mousemove", onMapMouseMove);
  map.getContainer().style.cursor = "";
  map.doubleClickZoom.enable();
}

function finishDrawing() {
  stopDrawListeners();
  if (drawPolyline) { map.removeLayer(drawPolyline); drawPolyline = null; }
  if (drawPreviewLine) { map.removeLayer(drawPreviewLine); drawPreviewLine = null; }

  const polygon = L.polygon(drawPoints, POLYGON_STYLE);
  drawnItems.clearLayers();
  drawnItems.addLayer(polygon);

  drawingActive = false;
  drawPoints = [];
  document.getElementById("btn-polygon").classList.remove("active");

  handleAreaSelected(polygon, "polygon");
}

function cancelDrawing() {
  stopDrawListeners();
  if (drawPolyline) { map.removeLayer(drawPolyline); drawPolyline = null; }
  if (drawPreviewLine) { map.removeLayer(drawPreviewLine); drawPreviewLine = null; }
  drawingActive = false;
  drawPoints = [];
  document.getElementById("btn-polygon").classList.remove("active");
  document.getElementById("status-text").textContent =
    "Tegn et område i kartet for å søke";
}

document.getElementById("btn-polygon").addEventListener("click", startPolygon);
document.getElementById("btn-clear").addEventListener("click", clearSelection);

// ─── HÅNDTER VALGT OMRÅDE ────────────────────────────────────────────────────

async function handleAreaSelected(layer, layerType) {
  showLoading();

  let centroid;
  let areaKm2 = null;
  let radiusKm = null;

  try {
    {
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

  if (meta.areaKm2) {
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
  renderStrandsonePanel(context);
  renderMAREANOPanel(context);
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

// ─── VERKTØYKASSE: STRANDSONEBELTET ─────────────────────────────────────────

function renderStrandsonePanel(context) {
  const el = document.getElementById("panel-strandsone");
  const inSea = context.isSeaArea;
  const tag = inSea
    ? `<span class="info-panel-tag tag-sea">I sjøen</span>`
    : `<span class="info-panel-tag tag-land">Kystkommune</span>`;

  const kommuneLink = context.kommunenavn
    ? `<a class="info-link" href="https://www.google.com/search?q=${encodeURIComponent(context.kommunenavn + " kommune strandsoneplan")}" target="_blank" rel="noopener">Søk etter ${context.kommunenavn} kommunes strandsoneplan →</a>`
    : "";

  el.innerHTML = `
    <div class="info-panel-hdr">
      <div class="info-panel-icon">🏖️</div>
      <div class="info-panel-meta">
        <div class="info-panel-title">Strandsonebeltet</div>
        <div class="info-panel-sub">100-metersgrensen fra sjøen</div>
      </div>
      ${tag}
    </div>
    <div class="info-panel-body">
      <p>${inSea
        ? "Polygonet er i sjøen – hele arealet faller innenfor eller grenser til strandsonebeltet. Plan- og bygningsloven § 1-8 forbyr tiltak i 100-metersbeltet langs sjøen uten dispensasjon."
        : "Polygonet er innenfor en kystkommune. Sjekk om arealet faller innenfor 100-metersbeltet langs sjøen – i så fall gjelder bygge- og anleggsforbudet i Plan- og bygningsloven § 1-8."
      }</p>
      <ul class="info-panel-points">
        <li>Bygge- og anleggsforbud i 100-metersbeltet</li>
        <li>Unntak krever dispensasjon fra kommunen</li>
        <li>Kommunal strandsoneplan kan åpne for tiltak i visse soner</li>
        <li>Svalbard og enkelte øykommuner har egne regler</li>
      </ul>
      <div class="info-panel-links">
        <a class="info-link" href="https://lovdata.no/lov/2008-06-27-71/§1-8" target="_blank" rel="noopener">PBL § 1-8 – Forbud mot tiltak langs sjø og vassdrag →</a>
        <a class="info-link" href="https://www.miljodirektoratet.no/ansvarsomrader/arealer/strandsone/" target="_blank" rel="noopener">Miljødirektoratets veiledning om strandsone →</a>
        <a class="info-link" href="https://lovdata.no/lov/2008-06-27-71/§19-2" target="_blank" rel="noopener">PBL § 19-2 – Dispensasjonsregler →</a>
        ${kommuneLink}
      </div>
    </div>`;

  el.onclick = () => el.classList.toggle("expanded");
}

// ─── VERKTØYKASSE: HAVBUNNDATA (MAREANO) ────────────────────────────────────

function renderMAREANOPanel(context) {
  const el = document.getElementById("panel-mareano");
  const lat = context.lat ? context.lat.toFixed(4) : "";
  const lon = context.lon ? context.lon.toFixed(4) : "";

  const coordNote = lat
    ? `<li>Koordinater for valgt område: <strong>${lat}°N, ${lon}°Ø</strong></li>`
    : "";

  el.innerHTML = `
    <div class="info-panel-hdr">
      <div class="info-panel-icon">🔬</div>
      <div class="info-panel-meta">
        <div class="info-panel-title">Havbunndata – MAREANO</div>
        <div class="info-panel-sub">Bunntype, sedimenter og dybde</div>
      </div>
      <span class="info-panel-tag tag-data">Kartdata</span>
    </div>
    <div class="info-panel-body">
      <p>MAREANO kartlegger havbunnen i norske farvann med hensyn til geologi, biologi og kjemi. Data fra Skagerrak og Sørlandskysten er tilgjengelig og dekker Arendal-området.</p>
      <ul class="info-panel-points">
        ${coordNote}
        <li>Bunntype: grus, sand, silt eller leire</li>
        <li>Havbunnsedimenter fra NGU (Norges geologiske undersøkelse)</li>
        <li>Biologiske habitatkart tilgjengelig for deler av kysten</li>
        <li>Dybdedata fra Kartverkets sjøkart</li>
      </ul>
      <div class="info-panel-links">
        <a class="info-link" href="https://www.mareano.no/" target="_blank" rel="noopener">MAREANO – Havbunnskartlegging →</a>
        <a class="info-link" href="https://www.ngu.no/geologiske-undersokelser/hav-og-sjobunngeologi/havbunnsedimenter" target="_blank" rel="noopener">NGU – Havbunnsedimenter →</a>
        <a class="info-link" href="https://kartkatalog.geonorge.no/search?text=MAREANO" target="_blank" rel="noopener">Geonorge – MAREANO-datasett →</a>
        <a class="info-link" href="https://www.kartverket.no/til-sjos/nautiske-publikasjoner/dybdedata" target="_blank" rel="noopener">Kartverket – Dybdedata →</a>
      </div>
    </div>`;

  el.onclick = () => el.classList.toggle("expanded");
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

  if (drawingActive) cancelDrawing();
}

// ─── VELKOMST: Zoom til Norskekysten ────────────────────────────────────────
// Kartet starter sentrert på norskekysten – brukeren kan zoome til ønsket område
