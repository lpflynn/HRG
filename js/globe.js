/* globe.js — Globe.gl wrapper.
   Owns: pins, rings, arcs, camera. Stateless about which era is "active";
   that's the timeline's job. Exposes setActiveEras / setFocusedEra / flyTo.
*/

window.HRGlobe = (function () {
  const TEXTURE_URL  = 'assets/textures/earth-blue-marble.jpg';
  const BUMP_URL     = 'assets/textures/earth-topology.png';

  function pinFlatColor(era) {
    return era && era.color ? era.color : '#d4a04a';
  }

  function create(container) {
    const globe = Globe()(container)
      .globeImageUrl(TEXTURE_URL)
      .bumpImageUrl(BUMP_URL)
      .backgroundColor('#050608')
      .showAtmosphere(true)
      .atmosphereColor('lightskyblue')
      .atmosphereAltitude(0.13);

    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.35;
    globe.controls().enableDamping = true;
    globe.controls().dampingFactor = 0.08;

    function escapeHtml(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    globe
      .htmlElementsData([])
      .htmlLat(d => d.lat)
      .htmlLng(d => d.lng)
      .htmlAltitude(0.005)
      .htmlElement(d => {
        const el = document.createElement('div');
        el.className = 'era-pin';
        el.style.setProperty('--pin-color', d.color);
        el.innerHTML = [
          '<span class="era-pin-pulse"></span>',
          '<span class="era-pin-dot"></span>',
          '<span class="era-pin-label">' + escapeHtml(d.shortLabel || d.title) + '</span>'
        ].join('');
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          if (onPinClickCb) onPinClickCb(d.eraId);
        });
        return el;
      });

    globe
      .ringsData([])
      .ringLat(d => d.lat)
      .ringLng(d => d.lng)
      .ringColor(() => t => `rgba(255,255,255,${1 - t})`)
      .ringMaxRadius(5)
      .ringPropagationSpeed(2)
      .ringRepeatPeriod(1500);

    globe
      .arcsData([])
      .arcStartLat(d => d.from.lat)
      .arcStartLng(d => d.from.lng)
      .arcEndLat(d => d.to.lat)
      .arcEndLng(d => d.to.lng)
      .arcColor(() => ['rgba(212,160,74,0.6)', 'rgba(212,160,74,0.05)'])
      .arcDashLength(0.4)
      .arcDashGap(2)
      .arcDashAnimateTime(2200)
      .arcStroke(0.4);

    globe
      .polygonsData([])
      .polygonGeoJsonGeometry(d => d.geometry)
      .polygonAltitude(0.008)
      .polygonCapColor(d => d.color)
      .polygonSideColor(() => 'rgba(0,0,0,0.0)')
      .polygonStrokeColor(d => d.strokeColor)
      .polygonsTransitionDuration(800);

    let onPinClickCb = null;

    function expandErasToPoints(eras) {
      const points = [];
      for (const era of eras) {
        if (era.ongoing && Array.isArray(era.regions) && era.regions.length) {
          for (const r of era.regions) {
            points.push({
              lat: r.lat,
              lng: r.lng,
              color: pinFlatColor(era),
              shortLabel: era.shortLabel || era.title,
              title: era.title,
              eraId: era.id
            });
          }
        } else if (era.primaryCoords) {
          points.push({
            lat: era.primaryCoords.lat,
            lng: era.primaryCoords.lng,
            color: pinFlatColor(era),
            shortLabel: era.shortLabel || era.title,
            title: era.title,
            eraId: era.id
          });
        }
      }
      return points;
    }

    return {
      raw: globe,

      setActiveEras(eras) {
        globe.htmlElementsData(expandErasToPoints(eras));
      },

      setFocusedEra(era) {
        if (!era) {
          globe.ringsData([]);
          return;
        }
        const coords = era.primaryCoords ||
          (era.regions && era.regions[0]) ||
          { lat: 0, lng: 0 };
        globe.ringsData([{ lat: coords.lat, lng: coords.lng }]);
      },

      flyTo(coords, ms) {
        if (!coords) return;
        globe.pointOfView(
          { lat: coords.lat, lng: coords.lng, altitude: 1.6 },
          ms || 1500
        );
      },

      setArcs(arcs) {
        globe.arcsData(Array.isArray(arcs) ? arcs : []);
      },

      setPolygons(items) {
        globe.polygonsData(Array.isArray(items) ? items : []);
      },

      onPinClick(cb) { onPinClickCb = cb; },

      setAutoRotate(on) {
        globe.controls().autoRotate = !!on;
      },

      setAutoRotateSpeed(speed) {
        globe.controls().autoRotateSpeed = speed;
      },

      resize() {
        globe.width(container.clientWidth);
        globe.height(container.clientHeight);
      }
    };
  }

  return { create };
})();
