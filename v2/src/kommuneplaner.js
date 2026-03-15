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

  // ── Flere kommuner legges til her ─────────────────────────────────────────
  // (Kristiansand, Bergen, Stavanger, Tromsø m.fl. – se TODO)

};

/** Returnerer kuraterte planer for en kommune, eller null hvis ukjent. */
export function finnKommunePlaner(kommunenavnNorsk) {
  const nokkel = kommunenavnNorsk
    .toLowerCase()
    .replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a')
    .replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  return KOMMUNEPLANER[nokkel] ?? null;
}
