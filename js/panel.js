/* panel.js — side panel for an era's content.
   All prose is pulled from eras.json. Placeholder text is rendered in dim/italic
   so the user can immediately see what they still need to write.
*/

window.HRPanel = (function () {
  const PLACEHOLDER_RX = /^\[YOU\s+(WRITE|CITE)\]/i;

  function isPlaceholder(s) {
    return typeof s !== 'string' || s.trim() === '' || PLACEHOLDER_RX.test(s.trim());
  }

  function escape(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function span(text, opts = {}) {
    const cls = isPlaceholder(text) ? 'placeholder' : '';
    return `<span class="${cls}">${escape(text || '[YOU WRITE]')}</span>`;
  }

  function renderEra(era, songCatalog) {
    const spanLabel = era.ongoing
      ? `${era.startYear}–present`
      : `${era.startYear}–${era.endYear}`;

    const geographyLabel = (era.regions && era.regions.length)
      ? era.regions.map(r => escape(r.name)).join(' · ')
      : (era.primaryCoords ? `${era.primaryCoords.lat.toFixed(2)}, ${era.primaryCoords.lng.toFixed(2)}` : '');

    const commentaryHtml = isPlaceholder(era.commentary)
      ? `<p class="era-commentary placeholder">[YOU WRITE — historical commentary drawn from your readings: ${escape(era.primaryReading || 'course readings')}.]</p>`
      : `<p class="era-commentary">${escape(era.commentary)}</p>`;

    const statHtml = isPlaceholder(era.scaleStat)
      ? `<p class="era-stat placeholder">[YOU WRITE — scale statistic]</p>`
      : `<p class="era-stat">${escape(era.scaleStat)}</p>`;

    const images = (era.images || []).map((src, i) => {
      const cap = (era.imageCaptions || [])[i];
      const capHtml = isPlaceholder(cap)
        ? `<p class="era-image-caption placeholder">[YOU WRITE caption]</p>`
        : `<p class="era-image-caption">${escape(cap)}</p>`;
      return `<div>
        <div class="era-image-frame">
          <img src="${escape(src)}" alt="" onerror="this.style.display='none';this.parentNode.innerHTML='[image not yet placed]';" />
        </div>
        ${capHtml}
      </div>`;
    }).join('');

    const songButtons = (era.songs || []).map(songId => {
      const song = songCatalog && songCatalog[songId];
      const label = song ? `${song.title} — ${song.artist}` : songId;
      return `<button class="era-song-btn" data-song-id="${escape(songId)}">${escape(label)}</button>`;
    }).join('');

    const sources = (era.sources || []).map(s => `<li>${isPlaceholder(s) ? '<span class="placeholder">[YOU CITE]</span>' : escape(s)}</li>`).join('');

    return `
      <h2 class="era-title">${escape(era.title || '[YOU WRITE: era title]')}</h2>
      <div class="era-span ${era.ongoing ? 'ongoing' : ''}">${escape(spanLabel)} &nbsp;·&nbsp; ${geographyLabel}</div>

      <section class="era-section">
        ${statHtml}
      </section>

      <section class="era-section">
        ${commentaryHtml}
      </section>

      ${images ? `<section class="era-section">
        <h3>Images</h3>
        <div class="era-images">${images}</div>
      </section>` : ''}

      ${songButtons ? `<section class="era-section">
        <h3>Listen</h3>
        <div class="era-songs">${songButtons}</div>
      </section>` : ''}

      <section class="era-section">
        <h3>Reading</h3>
        <p>${span(era.primaryReading)}</p>
      </section>

      ${sources ? `<section class="era-section">
        <h3>Sources</h3>
        <ul class="era-sources">${sources}</ul>
      </section>` : ''}
    `;
  }

  function create({ panel, content, closeBtn, onClose, onSongClick }) {
    function open(era, songCatalog) {
      content.innerHTML = renderEra(era, songCatalog || {});
      panel.classList.remove('panel-hidden');
      content.scrollTop = 0;
      // wire song buttons
      content.querySelectorAll('.era-song-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-song-id');
          if (typeof onSongClick === 'function') onSongClick(id, era);
        });
      });
    }
    function close() {
      panel.classList.add('panel-hidden');
      if (typeof onClose === 'function') onClose();
    }
    closeBtn.addEventListener('click', close);
    return { open, close };
  }

  return { create };
})();
