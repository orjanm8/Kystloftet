/**
 * Kystloftet – Lovdatabase for kystsonen
 *
 * Hvert lovverk er tagget med:
 *   - topics: fagområder (brukes til filtrering)
 *   - seaZone: true = vises alltid ved sjøarealer
 *   - coastal: true = vises ved kystarealer (land+sjø)
 *   - national: true = alltid relevant uansett posisjon
 */

const LAWS = [
  // ─── HAVBRUK / AKVAKULTUR ────────────────────────────────────────────────
  {
    id: "akvakulturloven",
    title: "Lov om akvakultur (akvakulturloven)",
    shortTitle: "Akvakulturloven",
    year: 2005,
    reference: "LOV-2005-06-17-79",
    description:
      "Regulerer all akvakulturvirksomhet i Norge, inkludert tildeling og bruk av akvakulturtillatelser, krav til drift og plassering av anlegg i sjø.",
    topics: ["havbruk"],
    seaZone: true,
    coastal: true,
    national: false,
    url: "https://lovdata.no/lov/2005-06-17-79",
    keyParagraphs: ["§ 6 Tillatelse", "§ 15 Plassering av akvakulturanlegg"],
  },
  {
    id: "akvakulturdrift",
    title: "Forskrift om drift av akvakulturanlegg (akvakulturdriftsforskriften)",
    shortTitle: "Akvakulturdriftsforskriften",
    year: 2008,
    reference: "FOR-2008-06-17-822",
    description:
      "Detaljerte krav til drift, miljøovervåking, fôring, behandling og rømningssikring for akvakulturanlegg i sjø og ferskvann.",
    topics: ["havbruk"],
    seaZone: true,
    coastal: true,
    national: false,
    url: "https://lovdata.no/forskrift/2008-06-17-822",
    keyParagraphs: ["§ 4 Lokalisering", "§ 36 Miljøovervåking"],
  },
  {
    id: "matloven",
    title: "Lov om matproduksjon og mattrygghet mv. (matloven)",
    shortTitle: "Matloven",
    year: 2003,
    reference: "LOV-2003-12-19-124",
    description:
      "Regulerer mattrygghet for akvatiske organismer og produksjon av sjømat. Sentral for havbruksnæringen.",
    topics: ["havbruk"],
    seaZone: true,
    coastal: true,
    national: false,
    url: "https://lovdata.no/lov/2003-12-19-124",
    keyParagraphs: ["§ 7 Krav til virksomhet"],
  },

  // ─── FISKERI ─────────────────────────────────────────────────────────────
  {
    id: "havressurslova",
    title: "Lov om forvaltning av viltlevande marine ressursar (havressurslova)",
    shortTitle: "Havressurslova",
    year: 2008,
    reference: "LOV-2008-06-06-37",
    description:
      "Regulerer høsting og forvaltning av ville marine ressurser (fisk, skalldyr, sjøpattedyr) i norske farvann og på norsk kontinentalsokkel.",
    topics: ["fiskeri"],
    seaZone: true,
    coastal: true,
    national: false,
    url: "https://lovdata.no/lov/2008-06-06-37",
    keyParagraphs: ["§ 3 Statlig eiendomsrett", "§ 16 Kvoteregulering"],
  },
  {
    id: "deltakerloven",
    title: "Lov om retten til å delta i fiske og fangst (deltakerloven)",
    shortTitle: "Deltakerloven",
    year: 1999,
    reference: "LOV-1999-03-26-15",
    description:
      "Regulerer hvem som kan drive fiske og fangst i norske farvann, herunder krav om aktiv fisker og norsk eierskap.",
    topics: ["fiskeri"],
    seaZone: true,
    coastal: false,
    national: false,
    url: "https://lovdata.no/lov/1999-03-26-15",
    keyParagraphs: ["§ 6 Ervervstillatelse", "§ 12 Adgang til å delta"],
  },
  {
    id: "laksefiskloven",
    title: "Lov om laksefisk og innlandsfisk mv.",
    shortTitle: "Laksefiskloven",
    year: 1992,
    reference: "LOV-1992-05-15-47",
    description:
      "Regulerer fiske etter laks og sjøørret i sjøen og vassdrag. Sentral for kystsoneforvaltning der laksegyter.",
    topics: ["fiskeri", "miljoe"],
    seaZone: true,
    coastal: true,
    national: false,
    url: "https://lovdata.no/lov/1992-05-15-47",
    keyParagraphs: ["§ 33 Fredningsbestemmelser i sjø"],
  },

  // ─── MILJØ / NATURVERN ───────────────────────────────────────────────────
  {
    id: "naturmangfoldloven",
    title: "Lov om forvaltning av naturens mangfold (naturmangfoldloven)",
    shortTitle: "Naturmangfoldloven",
    year: 2009,
    reference: "LOV-2009-06-19-100",
    description:
      "Gir regler om forvaltning av biologisk mangfold på land og i hav, inkludert marine verneområder, fremmede arter og miljørettslige prinsipper.",
    topics: ["miljoe"],
    seaZone: true,
    coastal: true,
    national: true,
    url: "https://lovdata.no/lov/2009-06-19-100",
    keyParagraphs: [
      "§ 8–12 Miljørettslige prinsipper",
      "§ 33 Marine verneområder",
    ],
  },
  {
    id: "forurensningsloven",
    title: "Lov om vern mot forurensninger og om avfall (forurensningsloven)",
    shortTitle: "Forurensningsloven",
    year: 1981,
    reference: "LOV-1981-03-13-6",
    description:
      "Forbyr utslipp som kan forurense det ytre miljø, herunder sjøen. Regulerer krav til tillatelser for virksomheter som kan forurense.",
    topics: ["miljoe"],
    seaZone: true,
    coastal: true,
    national: true,
    url: "https://lovdata.no/lov/1981-03-13-6",
    keyParagraphs: ["§ 7 Plikt til å unngå forurensning", "§ 11 Tillatelse"],
  },
  {
    id: "svalbardmiljoe",
    title: "Lov om miljøvern på Svalbard (svalbardmiljøloven)",
    shortTitle: "Svalbardmiljøloven",
    year: 2001,
    reference: "LOV-2001-06-15-79",
    description:
      "Særregler for miljøvern i sjø og på land på Svalbard. Gjelder ved aktivitet i Svalbards territorialfarvann.",
    topics: ["miljoe"],
    seaZone: true,
    coastal: true,
    national: false,
    url: "https://lovdata.no/lov/2001-06-15-79",
    region: "svalbard",
    keyParagraphs: ["§ 26 Ferdselsrestriksjoner til sjøs"],
  },

  // ─── AREALPLANLEGGING ────────────────────────────────────────────────────
  {
    id: "pbl",
    title: "Lov om planlegging og byggesaksbehandling (plan- og bygningsloven)",
    shortTitle: "Plan- og bygningsloven",
    year: 2008,
    reference: "LOV-2008-06-27-71",
    description:
      "Gir kommunene plikt og myndighet til å planlegge sjøarealer innen grunnlinjen (12 nm). § 1-8 forbyr bygging i 100-metersbeltet langs sjø.",
    topics: ["planlegging"],
    seaZone: true,
    coastal: true,
    national: true,
    url: "https://lovdata.no/lov/2008-06-27-71",
    keyParagraphs: [
      "§ 1-8 Forbud mot tiltak langs sjø og vassdrag",
      "§ 11-7 Arealformål i sjø",
      "§ 12-6 Hensynssoner",
    ],
  },
  {
    id: "havne-farvannsloven",
    title: "Lov om havner og farvann (havne- og farvannsloven)",
    shortTitle: "Havne- og farvannsloven",
    year: 2019,
    reference: "LOV-2019-06-21-70",
    description:
      "Regulerer bruk av farvann, havner, losplikt og sikker sjøtransport langs norskekysten. Kystverket er tilsynsmyndighet.",
    topics: ["planlegging", "fiskeri"],
    seaZone: true,
    coastal: true,
    national: false,
    url: "https://lovdata.no/lov/2019-06-21-70",
    keyParagraphs: [
      "§ 14 Fartsrestriksjoner",
      "§ 27 Tillatelse til tiltak i farvannet",
    ],
  },
  {
    id: "friluftslivet",
    title: "Lov om friluftslivet (friluftsloven)",
    shortTitle: "Friluftsloven",
    year: 1957,
    reference: "LOV-1957-06-28-16",
    description:
      "Sikrer allmennhetens rett til ferdsel og opphold i utmark, herunder langs kysten og i sjøen (allemannsretten).",
    topics: ["planlegging"],
    seaZone: false,
    coastal: true,
    national: true,
    url: "https://lovdata.no/lov/1957-06-28-16",
    keyParagraphs: ["§ 2 Ferdsel i utmark", "§ 7 Teltregel"],
  },

  // ─── ENERGI / OFFSHORE ───────────────────────────────────────────────────
  {
    id: "havenergilova",
    title: "Lov om fornybar energiproduksjon til havs (havenergilova)",
    shortTitle: "Havenergilova",
    year: 2010,
    reference: "LOV-2010-06-04-21",
    description:
      "Regulerer konsesjon og utbygging av fornybar energi til havs, primært havvind. Gjelder i norsk territorialfarvann og på kontinentalsokkelen.",
    topics: ["energi"],
    seaZone: true,
    coastal: false,
    national: false,
    url: "https://lovdata.no/lov/2010-06-04-21",
    keyParagraphs: ["§ 2-1 Konsesjonspliktig virksomhet"],
  },
  {
    id: "petroleumsloven",
    title: "Lov om petroleumsvirksomhet (petroleumsloven)",
    shortTitle: "Petroleumsloven",
    year: 1996,
    reference: "LOV-1996-11-29-72",
    description:
      "Regulerer leting etter og utvinning av petroleum på norsk kontinentalsokkel. Statens eiendomsrett til undersjøiske ressurser.",
    topics: ["energi"],
    seaZone: true,
    coastal: false,
    national: false,
    url: "https://lovdata.no/lov/1996-11-29-72",
    keyParagraphs: ["§ 3-1 Statens eiendomsrett", "§ 3-3 Utvinningstillatelse"],
  },
  {
    id: "kontinentalsokkelloven",
    title: "Lov om vitenskapelig utforskning og undersøkelse etter og utnyttelse av andre undersjøiske naturforekomster enn petroleumsforekomster",
    shortTitle: "Kontinentalsokkelloven",
    year: 1963,
    reference: "LOV-1963-06-21-12",
    description:
      "Norges rettigheter og suverenitet over kontinentalsokkelen for andre undersjøiske ressurser enn petroleum (mineraler, sand, grus m.m.).",
    topics: ["energi", "planlegging"],
    seaZone: true,
    coastal: false,
    national: false,
    url: "https://lovdata.no/lov/1963-06-21-12",
    keyParagraphs: ["§ 1 Statens eiendomsrett"],
  },

  // ─── SJØFART ─────────────────────────────────────────────────────────────
  {
    id: "sjoloven",
    title: "Lov om sjøfarten (sjøloven)",
    shortTitle: "Sjøloven",
    year: 1994,
    reference: "LOV-1994-06-24-39",
    description:
      "Regulerer sjøfart, ansvar, laster, kollisjoner og maritim erstatningsrett. Sentral lov for all kommersiell sjøtransport langs kysten.",
    topics: ["planlegging", "fiskeri"],
    seaZone: true,
    coastal: false,
    national: false,
    url: "https://lovdata.no/lov/1994-06-24-39",
    keyParagraphs: ["§ 151 Kollisjonsansvar"],
  },
];

/**
 * Hent alle unike temaer fra LAWS
 */
function getAllTopics() {
  const topics = new Set();
  LAWS.forEach((law) => law.topics.forEach((t) => topics.add(t)));
  return Array.from(topics);
}

/**
 * Filtrer lover basert på:
 *  - context.isSeaArea   : er området primært sjø?
 *  - context.isCoastal   : er området kyststripet?
 *  - context.regionCode  : eventuell Svalbard-kode
 *  - filterTopic         : brukervalgt fagtema (eller "all")
 */
function filterLaws(context, filterTopic = "all") {
  return LAWS.filter((law) => {
    // Svalbard-spesifikke lover vises kun ved Svalbard
    if (law.region === "svalbard" && !context.isSvalbard) return false;

    // Geografisk relevans – differensier mellom sjøareal og landaReal
    let geoMatch;
    if (context.isSeaArea) {
      // I sjøen: vis alle lover merket seaZone, coastal eller national
      geoMatch = law.national || law.seaZone || law.coastal;
    } else {
      // På land: vis kun nasjonale lover + kystlover som IKKE krever sjøtilgang
      geoMatch = law.national || (law.coastal && !law.seaZone);
    }

    if (!geoMatch) return false;

    // Temafilter
    if (filterTopic !== "all" && !law.topics.includes(filterTopic))
      return false;

    return true;
  });
}
