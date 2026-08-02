// THE IRREGULAR — Field Edition
// The masthead & standing info. Everything a visitor sees that isn't a
// dispatch, brief, quote, or morgue entry lives here. Edit this file the way
// you'd edit the flag on the front page.
module.exports = {
  identity: {
    name: 'PRAJWAL',
    title: 'ARCHITECT · BIMSTER · DEVELOPER',
    tagline: 'HARDCORE COMPUTATIONAL DESIGNER — ELEVATING AEC WITH SEAMLESS CODING',
    email: 'hello@prajwalbkumar.com',
    base: 'DUBAI, UAE',
    github: 'prajwalbkumar',
    stats: { years: '7+', projects: '50+', countries: 8 }
  },

  birthday: '1999-10-03',
  lastUpdated: '2026.07.12',
  based: { label: 'DUBAI', lat: 25.2048, lon: 55.2708 },

  cv: {
    blurb: 'Architect with a lifelong passion for tech, deeply engaged in computational design for the AEC industry. Seven years dedicated to solving uncharted problems, driven by the exhilaration of computational design. Quietly confident, naturally curious, perpetually improving my chops one design problem at a time.',
    experience: [
      { period: '2022 — NOW', role: 'Architect | Computational Designer', org: 'Dar · Sidara Company', mode: 'Full Time · On-Site' },
      { period: '2022 — NOW', role: 'Industry Guide · BIM Professional Course', org: 'Novatr (prev. Oneistox)', mode: 'Part Time · Remote' },
      { period: '2020 — 2022', role: 'Architect', org: 'Studio Symbiosis, India', mode: 'Full Time · On-Site' },
      { period: '2020 — 2022', role: 'Junior Architect', org: 'Thomas Associates, India', mode: 'Full Time · On-Site' },
      { period: '2020', role: 'Architectural Intern', org: 'Apostrophe A+uD, India', mode: 'Full Time · On-Site' }
    ],
    education: [
      { period: '2016 — 2021', role: 'Bachelor of Architecture', org: 'Lovely Professional University, India', mode: 'Grade 8.19' },
      { period: 'CERT', role: 'BIM Professional Course · C01', org: 'Novatr, India', mode: 'Certified' },
      { period: 'CERT', role: 'Rhinoceros 3D Certified Training', org: 'INTO Design, India', mode: 'ID RH4001' }
    ],
    specializations: [
      { name: 'Systems Thinking', count: 12, desc: 'Leveraging systems and computational thinking to analyze problems and integrate computational design for efficient solutions.' },
      { name: 'Complex Geometries', count: 126, desc: 'Architectural marvels with intricate forms — sculptural facades to parametric structures, innovation seamlessly integrated.' },
      { name: 'Precision AEC Coding', count: 8, desc: 'Custom plugins and tools for seamless workflow enhancement across Architecture, Engineering and Construction.' }
    ],
    skills: [
      { name: 'Rhinoceros', level: 5 },
      { name: 'Grasshopper', level: 5 },
      { name: 'Revit', level: 5 },
      { name: 'Dynamo', level: 4 },
      { name: 'Rhino.Inside.Revit', level: 4 },
      { name: 'Python', level: 4 }
    ],
    testimonial: {
      quote: 'Prajwal stands out in computational design, effortlessly harmonizing creativity with technical mastery. He consistently delivers exceptional results, showcasing a distinctive blend of precision and creative finesse.',
      attr: 'AMIT GUPTA — FOUNDING PARTNER, STUDIO SYMBIOSIS'
    }
  },

  // IATA → detail. Exactly one entry must have home:true.
  airports: {
    DXB: { name: 'Dubai Intl', lat: 25.2532, lon: 55.3657, icao: 'OMDB', home: true },
    CMB: { name: 'Colombo Bandaranaike', lat: 7.1808, lon: 79.8841, icao: 'VCBI' },
    MCT: { name: 'Muscat Intl', lat: 23.5933, lon: 58.2844, icao: 'OOMS' },
    DOH: { name: 'Doha Hamad', lat: 25.2731, lon: 51.6081, icao: 'OTHH' },
    IST: { name: 'Istanbul', lat: 41.2753, lon: 28.7519, icao: 'LTFM' },
    TBS: { name: 'Tbilisi', lat: 41.6692, lon: 44.9547, icao: 'UGTB' },
    LIS: { name: 'Lisbon Humberto Delgado', lat: 38.7742, lon: -9.1342, icao: 'LPPT' },
    AMS: { name: 'Amsterdam Schiphol', lat: 52.3105, lon: 4.7683, icao: 'EHAM' },
    SIN: { name: 'Singapore Changi', lat: 1.3644, lon: 103.9915, icao: 'WSSS' },
    NRT: { name: 'Tokyo Narita', lat: 35.7719, lon: 140.3929, icao: 'RJAA' }
  },

  // One line per flight. The globe, the plane animation, the legend chips,
  // the flight stats, the logbook, and every city dossier all derive from this.
  flights: [
    { fl: 'EK 650', from: 'DXB', to: 'CMB', date: '2026.03' },
    { fl: 'EK 862', from: 'DXB', to: 'MCT', date: '2025.10' },
    { fl: 'EK 847', from: 'DXB', to: 'DOH', date: '2025.12' },
    { fl: 'EK 121', from: 'DXB', to: 'IST', date: '2025.09' },
    { fl: 'FZ 713', from: 'DXB', to: 'TBS', date: '2025.11' },
    { fl: 'EK 191', from: 'DXB', to: 'LIS', date: '2026.02' },
    { fl: 'EK 145', from: 'DXB', to: 'AMS', date: '2025.12' },
    { fl: 'EK 354', from: 'DXB', to: 'SIN', date: '2025.08' },
    { fl: 'EK 318', from: 'DXB', to: 'NRT', date: '2025.06' }
  ],

  // Projects panel — status-dot rows in the flow.
  projects: [
    { st: 'active', name: 'Field Dispatch' },
    { st: 'active', name: 'The Irregular' },
    { st: 'active', name: 'pyRevit Automation' },
    { st: 'shipped', name: 'BIM Health Dashboard' },
    { st: 'paused', name: 'CloudYourKitchen' },
    { st: 'shelved', name: 'Point Cloud Pipeline' }
  ],

  // Pinned band — the two panels that sit above the dispatch flow.
  about: '<span class="fg">Prajwal.</span> Architect and BIM professional, Dubai. Working in the overlap between buildings and code — Revit, pyRevit, Rhino, Grasshopper, and lately the open web. This is where random thoughts get laid out.',
  now: 'Building <span class="fg">The Irregular</span>. Learning web development properly through The Odin Project. Dubai is heating up. The next trip is unplanned, which is the correct state for it to be in.',

  // Flow panels — authored inline here, HTML strings allowed.
  hobbies: '<span class="fg">DJing</span> — Friday nights, controller and a room. <span class="fg">Aviation</span> — flight tracking, spotting, knowing the registration before the livery resolves. <span class="fg">Photography</span> — see section 03. <span class="fg">The gym</span> — five days, non-negotiable.',
  // Static fallback for Now Playing — used when /api/nowplaying (Spotify
  // proxy, see README) isn't configured or the fetch fails.
  nowPlaying: { title: '', artist: '', genre: '' },
  reading: { title: 'Thinking in Systems', author: 'Donella H. Meadows', page: 142, total: 218 },
  challenge: { name: '75 HARD', day: 34, total: 75, startDate: '2026.06.08', active: true },
  bucket: [
    { text: 'Japan in cherry season', done: false },
    { text: 'Build an app 1,000 people use', done: false },
    { text: 'Surf in Sri Lanka', done: true },
    { text: 'A340 before they retire it', done: false },
    { text: 'Publish the point cloud pipeline', done: false },
    { text: 'DJ a full set to a real room', done: true }
  ],
  toys: [
    { st: 'active', name: 'WHOOP 4.0', note: 'recovery telemetry' },
    { st: 'shipped', name: 'DDJ CONTROLLER', note: 'Friday duty' },
    { st: 'shipped', name: 'MIRRORLESS', note: 'unnamed until the photos deserve it' },
    { st: 'paused', name: 'MECH KEYBOARD', note: 'the instrument' }
  ],

  // ── Site / SEO / deploy (site-wide, not personal copy) ──
  site: {
    title: 'THE IRREGULAR',
    tagline: 'FIELD EDITION — A COMPUTATIONAL FIELD',
    description: 'Dispatches on architecture, BIM automation, travel, and code, from Prajwal — Dubai.',
    url: 'https://theirregular.com',
    lang: 'en',
    vol: 'II',
    rev: 24,
    est: '2026'
  },
  social: {
    email: 'hello@prajwalbkumar.com',
    github: 'https://github.com/prajwalbkumar',
    linkedin: '',
    instagram: ''
  },
  seo: { ogImage: '/assets/og-default.png', twitterCard: 'summary_large_image' },

  // Dark tokens — the ONLY place a hex/rgba palette value is allowed to live.
  // .eleventy.js's fieldTokens shortcode emits these into a <style>:root> block;
  // field.css contains only rules derived from the CSS custom properties.
  tokens: {
    bg: '#0a0b0d',
    bg2: '#0f1114',
    fg: '#e9ebe6',
    ink: '233,235,230',
    accRgb: '204,255,0',
    acc: '#ccff00',
    card: 'rgba(15,17,20,.5)',
    panelBg: 'rgba(15,17,20,.85)',
    overlayBg: 'rgba(10,11,13,.92)'
  }
};
