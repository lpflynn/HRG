/* timeline.js — owns currentYear and isPlaying.
   Emits onChange(year) whenever the year moves (slider or autoplay).
*/

window.HRTimeline = (function () {
  function create({ slider, yearDisplay, playToggle, playIcon, bandsContainer, minYear, maxYear, onChange, onPlayStart, onEnd }) {
    let currentYear = parseInt(slider.value, 10) || minYear;
    let yearFloat = currentYear;
    let isPlaying = false;
    let advancePaused = false; // dwell flag: keeps isPlaying true but freezes year
    let rafId = null;
    let lastTick = 0;
    const yearsPerSecond = 5; // autoplay step rate (full sweep ~2 min)

    function setYear(y, emit = true) {
      const clamped = Math.max(minYear, Math.min(maxYear, Math.round(y)));
      yearFloat = Math.max(minYear, Math.min(maxYear, y));
      if (clamped === currentYear) return;
      currentYear = clamped;
      slider.value = String(currentYear);
      yearDisplay.textContent = String(currentYear);
      if (emit && typeof onChange === 'function') onChange(currentYear);
    }

    function tick(ts) {
      if (!isPlaying) return;
      if (!lastTick) lastTick = ts;
      const dtSec = (ts - lastTick) / 1000;
      lastTick = ts;
      if (!advancePaused) {
        const next = yearFloat + dtSec * yearsPerSecond;
        if (next >= maxYear) {
          setYear(maxYear);
          stop();
          if (typeof onEnd === 'function') onEnd();
          return;
        }
        setYear(next);
      }
      rafId = requestAnimationFrame(tick);
    }

    function pauseAdvance() { advancePaused = true; }
    function resumeAdvance() {
      advancePaused = false;
      lastTick = 0; // don't bill paused time toward dt on next tick
    }

    function play() {
      if (isPlaying) return;
      if (currentYear >= maxYear) setYear(minYear);
      isPlaying = true;
      lastTick = 0;
      yearFloat = currentYear;
      playIcon.innerHTML = '&#10074;&#10074;'; // pause glyph
      playToggle.setAttribute('aria-label', 'Pause autoplay');
      if (typeof onPlayStart === 'function') onPlayStart();
      rafId = requestAnimationFrame(tick);
    }

    function stop() {
      if (!isPlaying) return;
      isPlaying = false;
      advancePaused = false;
      playIcon.innerHTML = '&#9658;'; // play glyph
      playToggle.setAttribute('aria-label', 'Play autoplay');
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    }

    function toggle() { isPlaying ? stop() : play(); }

    slider.addEventListener('input', (e) => {
      stop();
      setYear(parseInt(e.target.value, 10));
    });
    playToggle.addEventListener('click', toggle);

    function renderBands(eras) {
      if (!bandsContainer) return;
      bandsContainer.innerHTML = '';
      const totalSpan = maxYear - minYear;
      for (const era of eras) {
        const start = era.startYear;
        const end = era.ongoing ? maxYear : era.endYear;
        if (end < minYear || start > maxYear) continue;
        const left  = ((Math.max(start, minYear) - minYear) / totalSpan) * 100;
        const width = ((Math.min(end, maxYear) - Math.max(start, minYear)) / totalSpan) * 100;
        const div = document.createElement('div');
        div.className = 'timeline-band' + (era.ongoing ? ' ongoing' : '');
        div.style.left = left + '%';
        div.style.width = width + '%';
        div.title = `${era.title} (${start}–${era.ongoing ? 'present' : end})`;
        bandsContainer.appendChild(div);
      }
    }

    // initial render
    setYear(currentYear, true);

    return {
      get currentYear() { return currentYear; },
      get isPlaying() { return isPlaying; },
      get advancePaused() { return advancePaused; },
      setYear,
      play,
      stop,
      toggle,
      pauseAdvance,
      resumeAdvance,
      renderBands
    };
  }

  return { create };
})();
