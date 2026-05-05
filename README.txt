HUMAN RIGHTS GLOBE
==================

A self-contained interactive web project for HIST/HRTS 3301 (Halperin, SMU).


HOW TO RUN
----------

OPTION A — Local server (recommended; required by some browsers because the
project loads JSON via fetch):

    cd human-rights-globe
    python -m http.server 8000

then open http://localhost:8000 in Chrome / Firefox / Edge.

OPTION B — Some browsers (e.g. recent Firefox with file:// fetch enabled, or
Edge with appropriate flags) will let you double-click index.html. If the page
loads but you see a "Could not load data/eras.json" message, fall back to the
local-server option above.


WHAT YOU NEED TO ADD BEFORE PRESENTING
--------------------------------------

1. Globe textures — drop these into assets/textures/ :
     earth-blue-marble.jpg     (NASA Blue Marble or alternative)
     earth-topology.png        (optional bump map; can be omitted)

   The globe will still render with a black sphere if the texture is missing.

2. Audio files — drop the MP3s referenced in data/eras.json (songCatalog
   block) into assets/audio/ . The filenames there are just defaults; edit
   the songCatalog if your filenames differ. Verify usage rights before
   submitting.

3. Era images — into assets/images/ . Reference them in eras.json under each
   era's "images" array, with matching "imageCaptions".

4. The historical commentary, captions, sources, scale statistics, and the
   project's argument in data/eras.json. Every field marked [YOU WRITE] or
   [YOU CITE] is yours to fill from the course readings (Kendi, Dunbar-Ortiz,
   Friedlander, Power, Kiernan, Banner, Betts & Collier, Cook, Robertson,
   Black, Harris) and your lecture notes.

5. The artist statement (one-page PDF) saved as ARTIST_STATEMENT.pdf next to
   index.html.

The course prohibits generative AI on submitted work. Keep timestamped drafts
of your prose as you go.


FILE LAYOUT
-----------

human-rights-globe/
  index.html              entry point
  README.txt              this file
  css/style.css           all styling
  js/main.js              entry / wiring
  js/globe.js             Globe.gl setup
  js/timeline.js          timeline scrubber & autoplay
  js/panel.js             side panel content rendering
  js/audio.js             era audio playback
  data/eras.json          all era data + song catalog
  data/arcs.json          (optional) migration / forced-movement arcs
  lib/globe.gl.min.js     downloaded Globe.gl (no CDN at runtime)
  assets/audio/           MP3s
  assets/images/          archival images
  assets/textures/        globe texture (and optional bump map)
  assets/fonts/           self-hosted fonts (optional)


SUBMISSION
----------

1. Live URL — drag this folder onto Netlify Drop (https://app.netlify.com/drop)
2. Zipped folder — right-click human-rights-globe/, "Send to → Compressed"
3. ARTIST_STATEMENT.pdf — alongside the zip
4. Email body to professor — both access methods + a short note on what the
   project is.

Have a USB-drive backup with you in class in case wifi flakes during the demo.
