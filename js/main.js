/* main.js — entry point. Loads data, instantiates modules, wires events. */

(function () {
  const MIN_YEAR = 1400;
  const MAX_YEAR = 2030;
  const DWELL_MS = 5000; // pause this long on each newly-activated era during autoplay

  let eras = [];
  let arcs = [];
  let songCatalog = {};
  let focusedEraId = null;
  let previousActiveIds = new Set();
  let countryFeatures = []; // GeoJSON features keyed by ADM0_A3
  let dwellQueue = [];
  let dwellTimer = null;

  let globe, timeline, panel, audio;

  function activeEras(year) {
    return eras.filter(e => {
      const end = e.ongoing ? MAX_YEAR : e.endYear;
      return year >= e.startYear && year <= end;
    });
  }

  function findEra(id) {
    return eras.find(e => e.id === id) || null;
  }

  function focusEra(era) {
    if (!era) return;
    focusedEraId = era.id;
    panel.open(era, songCatalog);
    globe.setFocusedEra(era);
    globe.setAutoRotateSpeed(0.06); // very slow drift while reading
    const coords = era.primaryCoords || (era.regions && era.regions[0]) || null;
    if (coords) globe.flyTo(coords, 1500);
  }

  function skipToNextEvent() {
    // when autoplay starts in a dead zone (no active eras), jump straight
    // to the next year that has activity so the audience isn't watching empty
    if (!timeline) return;
    let y = timeline.currentYear;
    if (activeEras(y).length > 0) return;
    while (y < MAX_YEAR && activeEras(y).length === 0) y++;
    if (y > timeline.currentYear && activeEras(y).length > 0) {
      timeline.setYear(y);
    }
  }

  function clearDwellQueue() {
    dwellQueue = [];
    if (dwellTimer) {
      clearTimeout(dwellTimer);
      dwellTimer = null;
    }
  }

  function processDwellQueue() {
    dwellTimer = null;
    // user paused / scrubbed during dwell → bail
    if (!timeline || !timeline.isPlaying) {
      dwellQueue = [];
      return;
    }
    if (!dwellQueue.length) {
      timeline.resumeAdvance();
      return;
    }
    const era = dwellQueue.shift();
    focusEra(era);
    dwellTimer = setTimeout(processDwellQueue, DWELL_MS);
  }

  function setsEqual(a, b) {
    if (a.size !== b.size) return false;
    for (const x of a) if (!b.has(x)) return false;
    return true;
  }

  function hexToRgba(hex, alpha) {
    const m = String(hex).replace('#','').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (!m) return `rgba(212,160,74,${alpha})`;
    const r = parseInt(m[1],16), g = parseInt(m[2],16), b = parseInt(m[3],16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function buildPolygonItems(active) {
    if (!countryFeatures.length) return [];
    // each country claimed by the first (chronologically earliest) active era listing it
    const claimed = new Map();
    for (const era of active) {
      if (!Array.isArray(era.countries)) continue;
      for (const code of era.countries) {
        if (!claimed.has(code)) claimed.set(code, era);
      }
    }
    const items = [];
    for (const f of countryFeatures) {
      const code = f.properties && (f.properties.ADM0_A3 || f.properties.SOV_A3);
      if (!code) continue;
      const era = claimed.get(code);
      if (!era) continue;
      items.push({
        geometry: f.geometry,
        color: hexToRgba(era.color, 0.42),
        strokeColor: hexToRgba(era.color, 0.85),
        eraId: era.id
      });
    }
    return items;
  }

  function onYearChange(year) {
    const list = activeEras(year);
    const currentIds = new Set(list.map(e => e.id));

    // only repaint pins/polygons when the active set actually changes
    // (otherwise every year-tick triggers transition animations → visible jitter)
    if (!setsEqual(currentIds, previousActiveIds)) {
      globe.setActiveEras(list);
      globe.setPolygons(buildPolygonItems(list));
    }

    const isAutoplaying = timeline && timeline.isPlaying;

    if (isAutoplaying) {
      // guided-tour: queue all newly-active eras, dwell on each so the
      // audience has time to read before the timeline keeps moving
      const newlyActive = list.filter(e => !previousActiveIds.has(e.id));
      if (newlyActive.length) {
        dwellQueue.push(...newlyActive);
        if (!dwellTimer && !timeline.advancePaused) {
          timeline.pauseAdvance();
          processDwellQueue();
        }
      }
    } else {
      // manual scrub: kill any queued tour, close panel if its era is gone
      clearDwellQueue();
      if (focusedEraId && !currentIds.has(focusedEraId)) {
        panel.close();
      }
    }

    previousActiveIds = currentIds;
  }

  function onPinClick(eraId) {
    const era = findEra(eraId);
    if (!era) return;
    clearDwellQueue();
    if (timeline) timeline.stop(); // pause autoplay when user takes manual control
    focusEra(era);
  }

  function onPanelClose() {
    focusedEraId = null;
    globe.setFocusedEra(null);
    globe.setAutoRotateSpeed(0.35); // back to ambient drift
    clearDwellQueue();
    if (timeline) timeline.resumeAdvance();
  }

  function onSongClick(songId, era) {
    audio.play(songId, era ? era.title : '');
  }

  async function loadJSON(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
    return res.json();
  }

  async function init() {
    // ---- load data ----
    let erasData;
    try {
      erasData = await loadJSON('data/eras.json');
    } catch (err) {
      console.error(err);
      document.getElementById('globe-container').innerHTML =
        '<div style="color:#a09c92;padding:40px;font-family:sans-serif">' +
        'Could not load <code>data/eras.json</code>. If you opened this via <code>file://</code>, ' +
        'serve it instead: <code>python -m http.server 8000</code> from this folder.' +
        '</div>';
      return;
    }
    eras = erasData.eras || [];
    songCatalog = erasData.songCatalog || {};

    try {
      const arcsData = await loadJSON('data/arcs.json');
      arcs = arcsData.arcs || [];
    } catch { /* arcs file is optional */ }

    try {
      const geo = await loadJSON('data/world-countries.geojson');
      countryFeatures = (geo && geo.features) || [];
    } catch (err) {
      console.warn('[main] world-countries.geojson missing — region shading disabled');
    }

    // ---- modules ----
    globe = HRGlobe.create(document.getElementById('globe-container'));
    globe.onPinClick(onPinClick);
    if (arcs.length) globe.setArcs(arcs);

    timeline = HRTimeline.create({
      slider:         document.getElementById('timeline-slider'),
      yearDisplay:    document.getElementById('year-display'),
      playToggle:     document.getElementById('play-toggle'),
      playIcon:       document.getElementById('play-icon'),
      bandsContainer: document.getElementById('timeline-bands'),
      minYear: MIN_YEAR,
      maxYear: MAX_YEAR,
      onChange: onYearChange,
      onPlayStart: skipToNextEvent
    });
    timeline.renderBands(eras);

    panel = HRPanel.create({
      panel:    document.getElementById('side-panel'),
      content:  document.getElementById('panel-content'),
      closeBtn: document.getElementById('panel-close'),
      onClose:  onPanelClose,
      onSongClick
    });

    audio = HRAudio.create({
      playerEl: document.getElementById('audio-player'),
      audioEl:  document.getElementById('audio-element'),
      titleEl:  document.getElementById('audio-title'),
      eraEl:    document.getElementById('audio-era'),
      toggleBtn: document.getElementById('audio-toggle'),
      closeBtn:  document.getElementById('audio-close'),
      catalog: songCatalog
    });

    // ---- about overlay ----
    const aboutBtn     = document.getElementById('about-btn');
    const aboutOverlay = document.getElementById('about-overlay');
    const aboutClose   = document.getElementById('about-close');
    aboutBtn.addEventListener('click',   () => aboutOverlay.classList.remove('overlay-hidden'));
    aboutClose.addEventListener('click', () => aboutOverlay.classList.add('overlay-hidden'));
    aboutOverlay.addEventListener('click', (e) => {
      if (e.target === aboutOverlay) aboutOverlay.classList.add('overlay-hidden');
    });

    // initial paint
    onYearChange(timeline.currentYear);

    // resize
    window.addEventListener('resize', () => globe.resize());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
