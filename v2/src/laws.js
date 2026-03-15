// Gjeldende regelverk for marine og kystnære arealer i Norge
// Kilde: lovdata.no

const L = id => `https://lovdata.no/lov/${id}`;
const P = (id, par) => `https://lovdata.no/lov/${id}/${par}`;

export const LAWS = [
  {
    id: 'arealplan',
    category: 'Arealplanlegging',
    icon: '🗺️',
    laws: [
      {
        name: 'Plan- og bygningsloven',
        ref: 'LOV-2008-06-27-71',
        url: L('2008-06-27-71'),
        desc: 'Regulerer all arealbruk i sjø og strandsone. Forbyr som hovedregel tiltak innenfor 100-metersbeltet langs sjø.',
        paragraphs: [
          { ref: '§ 1-8', desc: 'Forbud mot tiltak i 100-metersbeltet langs sjø og vassdrag', url: P('2008-06-27-71', '%C2%A71-8') },
          { ref: '§ 11-7', desc: 'Arealformål i kommuneplanens arealdel – sjø og vassdrag, LNFR', url: P('2008-06-27-71', '%C2%A711-7') },
          { ref: '§ 12-5', desc: 'Arealformål i reguleringsplan', url: P('2008-06-27-71', '%C2%A712-5') },
          { ref: '§ 19-2', desc: 'Dispensasjon fra planbestemmelser og loven', url: P('2008-06-27-71', '%C2%A719-2') },
        ],
      },
    ],
  },
  {
    id: 'akvakultur',
    category: 'Havbruk og akvakultur',
    icon: '🐟',
    laws: [
      {
        name: 'Akvakulturloven',
        ref: 'LOV-2005-06-17-79',
        url: L('2005-06-17-79'),
        desc: 'Regulerer all akvakulturvirksomhet i Norge, inkludert tildeling og godkjenning av lokalitetstillatelser.',
        paragraphs: [
          { ref: '§ 2', desc: 'Virkeområde – all akvakultur i og utenfor norsk territorialfarvann', url: P('2005-06-17-79', '%C2%A72') },
          { ref: '§ 4', desc: 'Krav om tillatelse for å drive akvakultur', url: P('2005-06-17-79', '%C2%A74') },
          { ref: '§ 6', desc: 'Krav om godkjenning av lokalitet', url: P('2005-06-17-79', '%C2%A76') },
          { ref: '§ 7', desc: 'Tildeling – kommunens behandling av søknad', url: P('2005-06-17-79', '%C2%A77') },
          { ref: '§ 13', desc: 'Opprydding etter avsluttet drift', url: P('2005-06-17-79', '%C2%A713') },
        ],
      },
      {
        name: 'Matloven',
        ref: 'LOV-2003-12-19-124',
        url: L('2003-12-19-124'),
        desc: 'Stiller krav til hygiene, sporbarhet og produksjonssikkerhet for sjømat, inkludert oppdrettsfisk.',
        paragraphs: [
          { ref: '§ 6', desc: 'Krav til hygiene og produksjonssikkerhet', url: P('2003-12-19-124', '%C2%A76') },
          { ref: '§ 10', desc: 'Sporbarhet i hele produksjonskjeden', url: P('2003-12-19-124', '%C2%A710') },
          { ref: '§ 14', desc: 'Tilsynsmyndighet og kontroll', url: P('2003-12-19-124', '%C2%A714') },
        ],
      },
    ],
  },
  {
    id: 'fiskeri',
    category: 'Fiskeri og høsting',
    icon: '🎣',
    laws: [
      {
        name: 'Havressurslova',
        ref: 'LOV-2008-06-06-37',
        url: L('2008-06-06-37'),
        desc: 'Regulerer høsting og utnyttelse av viltlevende marine ressurser. Fastsetter prinsippet om bærekraftig forvaltning.',
        paragraphs: [
          { ref: '§ 3', desc: 'Prinsippet om bærekraftig forvaltning av marine ressurser', url: P('2008-06-06-37', '%C2%A73') },
          { ref: '§ 7', desc: 'Regulering av fiskeri og høsting', url: P('2008-06-06-37', '%C2%A77') },
          { ref: '§ 16', desc: 'Forbud mot visse redskaper som skader bunnen', url: P('2008-06-06-37', '%C2%A716') },
          { ref: '§ 21', desc: 'Stenging av fiskefelt', url: P('2008-06-06-37', '%C2%A721') },
        ],
      },
      {
        name: 'Deltakerloven',
        ref: 'LOV-1999-03-26-15',
        url: L('1999-03-26-15'),
        desc: 'Regulerer hvem som har adgang til å delta i norske fiskerier.',
        paragraphs: [
          { ref: '§ 4', desc: 'Krav om ervervstillatelse for å drive fiske', url: P('1999-03-26-15', '%C2%A74') },
          { ref: '§ 12', desc: 'Adgang til å delta i kystfiske', url: P('1999-03-26-15', '%C2%A712') },
        ],
      },
    ],
  },
  {
    id: 'naturvern',
    category: 'Naturvern og biologisk mangfold',
    icon: '🌿',
    laws: [
      {
        name: 'Naturmangfoldloven',
        ref: 'LOV-2009-06-19-100',
        url: L('2009-06-19-100'),
        desc: 'Verner naturmangfoldet, inkludert marine habitater og arter. Gir grunnlag for oppretting av marine verneområder.',
        paragraphs: [
          { ref: '§ 7', desc: 'Miljørettslige prinsipper (føre-var, samlet belastning, kostnadene bæres av tiltakshaver)', url: P('2009-06-19-100', '%C2%A77') },
          { ref: '§ 8', desc: 'Kunnskapsgrunnlaget – krav til utredning av konsekvenser', url: P('2009-06-19-100', '%C2%A78') },
          { ref: '§ 33', desc: 'Naturreservat – strengeste verneform', url: P('2009-06-19-100', '%C2%A733') },
          { ref: '§ 37', desc: 'Marine verneområder', url: P('2009-06-19-100', '%C2%A737') },
          { ref: '§ 49', desc: 'Høsting av viltlevende dyr', url: P('2009-06-19-100', '%C2%A749') },
        ],
      },
      {
        name: 'Forurensningsloven',
        ref: 'LOV-1981-03-13-6',
        url: L('1981-03-13-6'),
        desc: 'Regulerer forurensning, utslipp og avfall i sjø og strandsone. Forbyr forurensning uten tillatelse.',
        paragraphs: [
          { ref: '§ 7', desc: 'Plikt til å unngå forurensning', url: P('1981-03-13-6', '%C2%A77') },
          { ref: '§ 8', desc: 'Tillatt forurensning – unntak og tillatelser', url: P('1981-03-13-6', '%C2%A78') },
          { ref: '§ 28', desc: 'Forsøpling i sjø, vassdrag og strandsone', url: P('1981-03-13-6', '%C2%A728') },
          { ref: '§ 74', desc: 'Ansvar for opprydding og erstatning', url: P('1981-03-13-6', '%C2%A774') },
        ],
      },
      {
        name: 'Vannressursloven',
        ref: 'LOV-2000-11-24-82',
        url: L('2000-11-24-82'),
        desc: 'Regulerer vassdrag og grunnvann, inkludert overgangsvann til sjø og kystvannsforekomster.',
        paragraphs: [
          { ref: '§ 1', desc: 'Formål – sikre forsvarlig bruk og forvaltning av vannressursene', url: P('2000-11-24-82', '%C2%A71') },
          { ref: '§ 8', desc: 'Minstevannføring og hensynssoner', url: P('2000-11-24-82', '%C2%A78') },
        ],
      },
    ],
  },
  {
    id: 'farvann',
    category: 'Sjøfart og farvann',
    icon: '⚓',
    laws: [
      {
        name: 'Havne- og farvannsloven',
        ref: 'LOV-2019-06-21-70',
        url: L('2019-06-21-70'),
        desc: 'Regulerer bruk av sjøarealer, ankringsplasser, ferdsel, og tiltak i farvannet.',
        paragraphs: [
          { ref: '§ 6', desc: 'Statens og kommunens ansvar for farvannet', url: P('2019-06-21-70', '%C2%A76') },
          { ref: '§ 14', desc: 'Tillatelse til tiltak i farvannet (installasjoner, mudring, dumping)', url: P('2019-06-21-70', '%C2%A714') },
          { ref: '§ 36', desc: 'Ankring og fortøyning', url: P('2019-06-21-70', '%C2%A736') },
          { ref: '§ 42', desc: 'Fartsbegrensninger i sjøen', url: P('2019-06-21-70', '%C2%A742') },
        ],
      },
      {
        name: 'Sjøloven',
        ref: 'LOV-1994-06-24-39',
        url: L('1994-06-24-39'),
        desc: 'Regulerer sjøfart, skip og ansvar ved ulykker, forurensning og kollisjon.',
        paragraphs: [
          { ref: '§ 151', desc: 'Ansvar for kollisjonsskade', url: P('1994-06-24-39', '%C2%A7151') },
          { ref: '§ 191', desc: 'Begrensning av reder- og skipseieres ansvar', url: P('1994-06-24-39', '%C2%A7191') },
        ],
      },
    ],
  },
  {
    id: 'kulturminner',
    category: 'Kulturminner under vann',
    icon: '🏛️',
    laws: [
      {
        name: 'Kulturminneloven',
        ref: 'LOV-1978-06-09-50',
        url: L('1978-06-09-50'),
        desc: 'Alle kulturminner under vann som er eldre enn 100 år er automatisk fredet – dette gjelder skipsvrak, gjenstander og strukturer.',
        paragraphs: [
          { ref: '§ 4', desc: 'Definisjon av kulturminner og kulturmiljøer', url: P('1978-06-09-50', '%C2%A74') },
          { ref: '§ 9', desc: 'Meldeplikt ved funn av kulturminner', url: P('1978-06-09-50', '%C2%A79') },
          { ref: '§ 14', desc: 'Automatisk fredning av vrak og kulturminner under vann eldre enn 100 år', url: P('1978-06-09-50', '%C2%A714') },
        ],
      },
    ],
  },
  {
    id: 'energi',
    category: 'Energi og havvind',
    icon: '💨',
    laws: [
      {
        name: 'Havenergilova',
        ref: 'LOV-2010-06-04-21',
        url: L('2010-06-04-21'),
        desc: 'Regulerer utbygging og drift av fornybare energianlegg til havs, herunder havvind og bølgekraft.',
        paragraphs: [
          { ref: '§ 2-1', desc: 'Virkeområde – fornybar energiproduksjon til havs', url: P('2010-06-04-21', '%C2%A72-1') },
          { ref: '§ 3-1', desc: 'Åpning av områder for energiproduksjon', url: P('2010-06-04-21', '%C2%A73-1') },
          { ref: '§ 4-1', desc: 'Konsesjon for anlegg til havs', url: P('2010-06-04-21', '%C2%A74-1') },
        ],
      },
    ],
  },
  {
    id: 'miljokrav',
    category: 'Miljøkonsekvensvurdering',
    icon: '📋',
    laws: [
      {
        name: 'Forskrift om konsekvensutredninger',
        ref: 'FOR-2017-06-21-854',
        url: 'https://lovdata.no/forskrift/2017-06-21-854',
        desc: 'Krever konsekvensutredning (KU) for tiltak med vesentlige virkninger på miljø og samfunn, inkludert marine anlegg.',
        paragraphs: [
          { ref: '§ 8', desc: 'Tiltak som alltid skal ha konsekvensutredning (vedlegg I)', url: 'https://lovdata.no/forskrift/2017-06-21-854/%C2%A78' },
          { ref: '§ 10', desc: 'Tiltak som skal vurderes (vedlegg II)', url: 'https://lovdata.no/forskrift/2017-06-21-854/%C2%A710' },
        ],
      },
    ],
  },
];
