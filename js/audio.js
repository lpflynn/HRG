/* audio.js — era-audio player using Apple Music embeds.
   Each song in eras.json's songCatalog has an `appleMusicUrl` field.
   Paste the share link from Apple Music (... menu → Share → Copy Link).
   Either music.apple.com/... or embed.music.apple.com/... is accepted.
*/

window.HRAudio = (function () {
  function toEmbedUrl(url) {
    if (!url) return '';
    if (url.includes('embed.music.apple.com')) return url;
    return url.replace('music.apple.com', 'embed.music.apple.com');
  }

  function create({ playerEl, iframeEl, eraEl, closeBtn, catalog }) {
    let currentId = null;

    function show() { playerEl.classList.remove('audio-hidden'); }
    function hide() { playerEl.classList.add('audio-hidden'); }

    function play(songId, eraTitle) {
      const song = catalog[songId];
      if (!song) {
        console.warn(`[audio] unknown song id: ${songId}`);
        return;
      }
      const embed = toEmbedUrl(song.appleMusicUrl);
      if (!embed) {
        console.warn(
          `[audio] no appleMusicUrl set for "${songId}" (${song.title}). ` +
          `Paste a music.apple.com share link into data/eras.json → songCatalog.`
        );
        return;
      }
      if (currentId !== songId) {
        currentId = songId;
        iframeEl.src = embed;
        const label = `${song.title} — ${song.artist}`;
        eraEl.textContent = eraTitle ? `${label} · ${eraTitle}` : label;
      }
      show();
    }

    function close() {
      iframeEl.src = '';
      currentId = null;
      hide();
    }

    closeBtn.addEventListener('click', close);

    return { play, close };
  }

  return { create };
})();
