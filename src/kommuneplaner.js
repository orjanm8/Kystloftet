/**
 * Kuraterte plandokumenter per kommune – direkte fra kommunenes egne nettsider.
 *
 * Nøkkel: normalisert kommunenavn (lowercase, æ→ae, ø→o, å→a, mellomrom fjernet)
 * Dette matcher municipalitySlug()-funksjonen i main.js.
 *
 * Kategorier:
 *   'arealplan'  – kommuneplanens arealdel, samfunnsdel, kommunedelplaner
 *   'sjø'        – sjøareal, havneplan, småbåthavner, kyst, akvakultur
 *   'regulering' – vedtatte og aktive reguleringsplaner
 *   'kart'       – kartportaler og innsynsverktøy
 */

export const KOMMUNEPLANER = {

  // ── Arendal ────────────────────────────────────────────────────────────────
  arendal: {
    planer: [
      // Arealplan
      {
        name: 'Kommuneplanens arealdel 2023–2033',
        desc: 'Vedtatt 27. april 2023. Juridisk bindende arealplan for hele kommunen, inkludert sjøareal.',
        url: 'https://www.arendal.kommune.no/politikk-og-medvirkning/kommunens-planer/arealdel/',
        type: 'link',
        kat: 'arealplan',
      },
      {
        name: 'Planbestemmelser – arealdel 2023–2033 (PDF)',
        desc: 'Juridisk bindende bestemmelser og retningslinjer til kommuneplanens arealdel.',
        url: 'https://www.arendal.kommune.no/_f/p1/i5917f255-7513-4b25-97a8-34659f731ff4/vedlegg-2-kommuneplanbestemmelser-januar-2023-27012023.pdf',
        type: 'pdf',
        kat: 'arealplan',
      },
      {
        name: 'Planbeskrivelse – arealdel 2023–2033 (PDF)',
        desc: 'Beskrivelse av planinnholdet, konsekvenser og gjennomgang av arealdelen.',
        url: 'https://www.arendal.kommune.no/_f/p1/i4bf2f64d-bba0-4be8-a20f-e981b90a3def/planbeskrivelse-2023-2033-ny-horing-justert-etter-vedtak-25januar-2023.pdf',
        type: 'pdf',
        kat: 'arealplan',
      },
      {
        name: 'Revisjon av kommuneplanens arealdel 2024–2034',
        desc: 'Begrenset revisjon under arbeid – plantekniske forbedringer og nye temakart.',
        url: 'https://www.arendal.kommune.no/politikk-og-medvirkning/kommunens-planer/ny-kommuneplan-revisjon-av-kommuneplanens-arealdel/',
        type: 'link',
        kat: 'arealplan',
      },
      // Sjø og kyst
      {
        name: 'Kommunedelplan for småbåthavner',
        desc: 'Plan for småbåthavner, slipper, marinaer og offentlige brygger i Arendal.',
        url: 'https://www.arendal.kommune.no/politikk-og-organisasjon/kommuneplan-planer-og-styringsdokumenter/kommunedelplaner/smabathavner/',
        type: 'link',
        kat: 'sjø',
      },
      {
        name: 'Eydehavn havne- og industriområde (reguleringsplan under arbeid)',
        desc: 'Nye kaifronter og havneutvikling ved Eydehavn / Eyde material park.',
        url: 'https://www.arendal.kommune.no/tjenester/plan-bygg-og-eiendom/reguleringsplaner/reguleringsplaner-under-arbeid/eydehavn-havne-og-industriomrade.25143.aspx',
        type: 'link',
        kat: 'sjø',
      },
      // Regulering
      {
        name: 'Vedtatte reguleringsplaner',
        desc: 'Oversikt over alle vedtatte reguleringsplaner i Arendal.',
        url: 'https://www.arendal.kommune.no/tjenester/plan-bygg-og-eiendom/reguleringsplaner/vedtatte-reguleringsplaner/',
        type: 'link',
        kat: 'regulering',
      },
      // Kart
      {
        name: 'Arendalskart – kart og eiendomsinformasjon',
        desc: 'Kommunens kartløsning med reguleringsplaner, sjøkart, ortofoto og eiendomsinfo.',
        url: 'https://www.arendal.kommune.no/tjenester/plan-bygg-og-eiendom/eiendomsinformasjon-og-kart/',
        type: 'link',
        kat: 'kart',
      },
      {
        name: 'Kartportal – Arendal kommune (ArcGIS)',
        desc: 'Åpen kartportal med geodata, WMS/WFS-tjenester og nedlastbare datasett.',
        url: 'https://kartportal-arendal-kom.hub.arcgis.com/',
        type: 'link',
        kat: 'kart',
      },
    ],
  },

  // ── Kristiansand ───────────────────────────────────────────────────────────
  kristiansand: {
    planer: [
      {
        name: 'Kommuneplanens arealdel – Kristiansand',
        desc: 'Gjeldende arealdel med plankart og bestemmelser for hele kommunen.',
        url: 'https://www.kristiansand.kommune.no/kommuneplanens-arealdel',
        type: 'link', kat: 'arealplan',
      },
      {
        name: 'Kommunedelplaner – vedtatte',
        desc: 'Alle vedtatte kommunedelplaner, inkl. sjø- og kystplaner.',
        url: 'https://www.kristiansand.kommune.no/tema/kommuneplanen/kommunedelplaner-vedtatte/',
        type: 'link', kat: 'arealplan',
      },
      {
        name: 'Reguleringsplaner – Kristiansand',
        desc: 'Søk i og se gjeldende reguleringsplaner for kommunen.',
        url: 'https://www.kristiansand.kommune.no/navigasjon/politikk-og-organisasjon/planer-og-strategier/kommuneplanen/',
        type: 'link', kat: 'regulering',
      },
    ],
  },

  // ── Bergen ─────────────────────────────────────────────────────────────────
  bergen: {
    planer: [
      {
        name: 'Kommuneplanens arealdel – Bergen',
        desc: 'Gjeldende arealdel med plankart og bestemmelser for Bergen kommune.',
        url: 'https://www.bergen.kommune.no/omkommunen/arealplaner/gjeldende-planer/kommuneplanens-arealdel',
        type: 'link', kat: 'arealplan',
      },
      {
        name: 'Kommunedelplaner – Bergen',
        desc: 'Vedtatte kommunedelplaner inkl. for kyst og sjøareal.',
        url: 'https://www.bergen.kommune.no/omkommunen/arealplaner/gjeldende-planer/kommunedelplaner',
        type: 'link', kat: 'arealplan',
      },
      {
        name: 'Finn reguleringsplaner – Bergen',
        desc: 'Søk i alle reguleringsplaner for Bergen.',
        url: 'https://www.bergen.kommune.no/omkommunen/arealplaner/gjeldende-planer/finn-planer',
        type: 'link', kat: 'regulering',
      },
      {
        name: 'Arealplaner – oversikt Bergen',
        desc: 'Samlet oversikt over alle arealplaner i Bergen kommune.',
        url: 'https://www.bergen.kommune.no/omkommunen/arealplaner',
        type: 'link', kat: 'kart',
      },
    ],
  },

  // ── Stavanger ──────────────────────────────────────────────────────────────
  stavanger: {
    planer: [
      {
        name: 'Kommuneplanens arealdel – Stavanger',
        desc: 'Gjeldende kommuneplan med arealdel og bestemmelser.',
        url: 'https://www.stavanger.kommune.no/kommuneplan',
        type: 'link', kat: 'arealplan',
      },
      {
        name: 'Kommuneplanens samfunnsdel 2025',
        desc: 'Overordnet mål og retning for samfunnsutviklingen i Stavanger.',
        url: 'https://www.stavanger.kommune.no/samfunnsdelen',
        type: 'link', kat: 'arealplan',
      },
      {
        name: 'Rulleringsarbeid KPA 2027',
        desc: 'Ny kommuneplanens arealdel under utarbeidelse – med sjø og kyst.',
        url: 'https://www.stavanger.kommune.no/kpa2027/',
        type: 'link', kat: 'arealplan',
      },
      {
        name: 'Reguleringsplaner – Stavanger',
        desc: 'Oversikt og søk i reguleringsplaner for Stavanger.',
        url: 'https://www.stavanger.kommune.no/samfunnsutvikling/planer/reguleringsplaner/',
        type: 'link', kat: 'regulering',
      },
    ],
  },

  // ── Tromsø ─────────────────────────────────────────────────────────────────
  tromso: {
    planer: [
      {
        name: 'Arealplan – Tromsø',
        desc: 'Kommuneplanens arealdel og tilhørende planbestemmelser.',
        url: 'https://tromso.kommune.no/bygg-vei-og-eiendom/planer-kart-og-regler/arealplan',
        type: 'link', kat: 'arealplan',
      },
      {
        name: 'Vedtatte planer – Tromsø',
        desc: 'Alle vedtatte kommunale planer, inkl. reguleringsplaner og kommunedelplaner.',
        url: 'https://tromso.kommune.no/bygg-vei-og-eiendom/planer-kart-og-regler/vedtatte-planer',
        type: 'link', kat: 'regulering',
      },
      {
        name: 'Sentrale planer og styringsdokumenter',
        desc: 'Overordnede planer for Tromsø kommune.',
        url: 'https://tromso.kommune.no/sentraleplaner',
        type: 'link', kat: 'arealplan',
      },
    ],
  },

  // ── Bodø ───────────────────────────────────────────────────────────────────
  bodo: {
    planer: [
      {
        name: 'Kommuneplanens arealdel 2026–2038 (under arbeid)',
        desc: 'Ny arealdel under rullering – inkl. sjø og kystsoneplanlegging.',
        url: 'https://bodo.kommune.no/politikk-medvirkning-og-planer/planer-og-strategier/planprosesser/kommuneplanens-arealdel-2026-2038/',
        type: 'link', kat: 'arealplan',
      },
      {
        name: 'Informasjon om arealplaner – Bodø',
        desc: 'Veiledning om arealplaner og planprosesser i Bodø.',
        url: 'https://bodo.kommune.no/tjenester/plan-bygg-og-eiendom/arealplaner/informasjon-om-arealplaner-og-prosesser/',
        type: 'link', kat: 'arealplan',
      },
      {
        name: 'Planprosesser – Bodø',
        desc: 'Oversikt over pågående og vedtatte planprosesser i kommunen.',
        url: 'https://bodo.kommune.no/politikk-medvirkning-og-planer/planer-og-strategier/planprosesser/',
        type: 'link', kat: 'regulering',
      },
    ],
  },

  // ── Sandefjord ─────────────────────────────────────────────────────────────
  sandefjord: {
    planer: [
      {
        name: 'Kommuneplanens arealdel 2023–2035 – Sandefjord',
        desc: 'Gjeldende arealdel med planbestemmelser og plankart.',
        url: 'https://www.sandefjord.kommune.no/engasjer-deg/planer/overordnede-planer/kommuneplanen/kommuneplanens-arealdel/',
        type: 'link', kat: 'arealplan',
      },
      {
        name: 'Kommuneplan – Sandefjord',
        desc: 'Overordnet kommuneplan med samfunnsdel og arealdel.',
        url: 'https://www.sandefjord.kommune.no/engasjer-deg/planer/overordnede-planer/kommuneplanen/',
        type: 'link', kat: 'arealplan',
      },
    ],
  },

  // ── Larvik ─────────────────────────────────────────────────────────────────
  larvik: {
    planer: [
      {
        name: 'Kommuneplanens arealdel – Larvik',
        desc: 'Gjeldende arealdel med plankart og bestemmelser.',
        url: 'https://www.larvik.kommune.no/politikk/planer-og-strategier/kommuneplanens-arealdel/',
        type: 'link', kat: 'arealplan',
      },
      {
        name: 'Reguleringsplaner – Larvik',
        desc: 'Søk og finn reguleringsplaner for Larvik.',
        url: 'https://www.larvik.kommune.no/plan-bygg-brann-og-eiendom/reguleringsplaner/',
        type: 'link', kat: 'regulering',
      },
    ],
  },

  // ── Fredrikstad ────────────────────────────────────────────────────────────
  fredrikstad: {
    planer: [
      {
        name: 'Kommuneplanens arealdel – Fredrikstad',
        desc: 'Gjeldende arealdel med planbestemmelser og plankart.',
        url: 'https://www.fredrikstad.kommune.no/tjenester/samfunn-planarbeid-medvirkning/planer-strategier-og-retningslinjer/kommuneplanens-arealdel/',
        type: 'link', kat: 'arealplan',
      },
      {
        name: 'Kommuneplanens samfunnsdel – Fredrikstad',
        desc: 'Overordnet mål og retning for Fredrikstads utvikling.',
        url: 'https://www.fredrikstad.kommune.no/samfunnsdel',
        type: 'link', kat: 'arealplan',
      },
      {
        name: 'Reguleringsplaner – Fredrikstad',
        desc: 'Gjeldende reguleringsplaner for Fredrikstad.',
        url: 'https://www.fredrikstad.kommune.no/tjenester/byggesak-regulering-og-kart/reguleringsplaner/',
        type: 'link', kat: 'regulering',
      },
    ],
  },

  // ── Haugesund ──────────────────────────────────────────────────────────────
  haugesund: {
    planer: [
      {
        name: 'Kommuneplan – Haugesund',
        desc: 'Gjeldende kommuneplan med samfunnsdel og arealdel.',
        url: 'https://www.haugesund.kommune.no/organisasjonen/om-haugesund-kommune/planer-og-rapporter/kommuneplan/',
        type: 'link', kat: 'arealplan',
      },
      {
        name: 'Prosess ny arealdel – Haugesund',
        desc: 'Rullering av kommuneplanens arealdel – inkl. sjø og kyst.',
        url: 'https://www.haugesund.kommune.no/organisasjonen/om-haugesund-kommune/planer-og-rapporter/prosess-ny-arealdel-til-kommuneplanen/',
        type: 'link', kat: 'arealplan',
      },
      {
        name: 'Innsyn i arealplaner – Haugesund',
        desc: 'Kartbasert innsynsløsning for reguleringsplaner og arealformål.',
        url: 'https://www.haugesund.kommune.no/plan-bygg-bolig-og-eiendom/kart-og-eiendomsinformasjon/innsyn-i-arealplaner/',
        type: 'link', kat: 'kart',
      },
    ],
  },

  // ── Molde ──────────────────────────────────────────────────────────────────
  molde: {
    planer: [
      {
        name: 'Kommuneplanens arealdel – Molde',
        desc: 'Gjeldende arealdel med plankart og bestemmelser.',
        url: 'https://www.molde.kommune.no/horinger-planer-og-samfunnsutvikling/planer-og-samfunnsutvikling/kommuneplan/kommuneplanens-arealdel/',
        type: 'link', kat: 'arealplan',
      },
      {
        name: 'Ny arealdel 2028–2040 (under arbeid)',
        desc: 'Rullering av kommuneplanens arealdel for neste planperiode.',
        url: 'https://www.molde.kommune.no/horinger-planer-og-samfunnsutvikling/vare-satsingsomrader/flere-satsingsomrader-og-prosjekter/kommuneplanens-arealdel-2028-2040/ny-arealdel-2028-2040/',
        type: 'link', kat: 'arealplan',
      },
      {
        name: 'Finn reguleringsplan – Molde',
        desc: 'Søk i reguleringsplaner for Molde kommune.',
        url: 'https://www.molde.kommune.no/byggesak-arealplan-og-eiendom/areal-og-reguleringsplaner/finn-reguleringsplan/',
        type: 'link', kat: 'regulering',
      },
    ],
  },

  // ── Ålesund ────────────────────────────────────────────────────────────────
  alesund: {
    planer: [
      {
        name: 'Kommuneplan – Ålesund',
        desc: 'Gjeldende kommuneplan med arealdel og samfunnsdel.',
        url: 'https://alesund.kommune.no/politikk-og-samfunnsutvikling/planane-til-kommunen/kommuneplan/',
        type: 'link', kat: 'arealplan',
      },
      {
        name: 'Ny arealdel 2027–2040 (under arbeid)',
        desc: 'Ålesund mot 2040 – rullering av kommuneplanens arealdel.',
        url: 'https://alesund.kommune.no/politikk-og-samfunnsutvikling/planane-til-kommunen/alesund-mot-2040/ny-arealdel-2027-2040/',
        type: 'link', kat: 'arealplan',
      },
      {
        name: 'Reguleringsplanar – Ålesund',
        desc: 'Oversikt og søk i reguleringsplaner for Ålesund.',
        url: 'https://alesund.kommune.no/plan-bygg-og-eigedom/reguleringsplanar/',
        type: 'link', kat: 'regulering',
      },
      {
        name: 'Arealplankart og planinnsyn – Ålesund',
        desc: 'Kartbasert innsynsverktøy for arealplaner og reguleringsplaner.',
        url: 'https://alesund.kommune.no/plan-bygg-og-eigedom/kartdata-og-eigedomsinformasjon/arealplankart/',
        type: 'link', kat: 'kart',
      },
    ],
  },

  // ── Kristiansund ───────────────────────────────────────────────────────────
  kristiansund: {
    planer: [
      {
        name: 'Planer og rapporter – Kristiansund',
        desc: 'Oversikt over kommunale planer og styringsdokumenter.',
        url: 'https://www.kristiansund.kommune.no/organisasjon/planer-og-rapporter/',
        type: 'link', kat: 'arealplan',
      },
      {
        name: 'Finn reguleringsplan – Kristiansund',
        desc: 'Søk i gjeldende reguleringsplaner for Kristiansund.',
        url: 'https://www.kristiansund.kommune.no/tjenester/plan-bygg-og-eiendom/planforslag-og-planendring/finn-reguleringsplan/',
        type: 'link', kat: 'regulering',
      },
      {
        name: 'Kilder til bruk i planlegging – Kristiansund',
        desc: 'Ressurser og kartdata for arealplanlegging i Kristiansund.',
        url: 'https://www.kristiansund.kommune.no/tjenester/plan-bygg-og-eiendom/planforslag-og-planendring/kilder-til-bruk-i-planlegging/',
        type: 'link', kat: 'kart',
      },
    ],
  },

};

/** Returnerer kuraterte planer for en kommune, eller null hvis ukjent. */
export function finnKommunePlaner(kommunenavnNorsk) {
  const nokkel = kommunenavnNorsk
    .toLowerCase()
    .replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a')
    .replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  return KOMMUNEPLANER[nokkel] ?? null;
}
