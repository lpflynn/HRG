/* audio.js — minimal era-audio player.
   Song catalog is provided at init (loaded from eras.json's "songCatalog" or built from era.songs).
   Files live under assets/audio/<id>.mp3 (or whatever extension you provide).
*/

window.HRAudio = (function () {
  function create({ playerEl, audioEl, titleEl, eraEl, toggleBtn, closeBtn, catalog }) {
    let currentId = null;
    let currentEraTitle = '';

    function show() { playerEl.classList.remove('audio-hidden'); }
    function hide() { playerEl.classList.add('audio-hidden'); }

    function setIcon(playing) {
      toggleBtn.innerHTML = playing ? '&#10074;&#10074;' : '&#9658;';
    }

    function play(songId, eraTitle) {
      const song = catalog[songId];
      if (!song) {
        console.warn(`[audio] unknown song id: ${songId}`);
        return;
      }
      if (currentId !== songId) {
        currentId = songId;
        currentEraTitle = eraTitle || '';
        audioEl.src = song.file || `assets/audio/${songId}.mp3`;
        titleEl.textContent = `${song.title} — ${song.artist}`;
        eraEl.textContent = eraTitle || '';
      }
      audioEl.play().catch(err => {
        console.warn('[audio] play blocked or file missing:', err.message);
      });
      setIcon(true);
      show();
    }

    function pause() {
      audioEl.pause();
      setIcon(false);
    }

    function toggle() {
      if (audioEl.paused) {
        if (currentId) audioEl.play().catch(()=>{});
        setIcon(!audioEl.paused);
      } else {
        audioEl.pause();
        setIcon(false);
      }
    }

    function close() {
      audioEl.pause();
      audioEl.removeAttribute('src');
      audioEl.load();
      currentId = null;
      hide();
      setIcon(false);
    }

    audioEl.addEventListener('ended', () => setIcon(false));
    audioEl.addEventListener('play',  () => setIcon(true));
    audioEl.addEventListener('pause', () => setIcon(false));
    toggleBtn.addEventListener('click', toggle);
    closeBtn.addEventListener('click', close);

    return { play, pause, toggle, close };
  }

  return { create };
})();
