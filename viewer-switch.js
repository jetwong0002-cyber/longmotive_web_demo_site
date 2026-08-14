/* viewer-switch.js — the room switcher that replaced the flat 16-link strip.

   The strip used to be sixteen identical mono-caps links wrapping onto two rows
   (70px tall at 1280, on top of a 60px header) with no grouping and no hover.
   This is one 41px control naming the room you are in; the full list drops as a
   panel of thumbnails, so a room is picked by RECOGNISING it rather than reading
   a label — which is the point of a page whose content is things to look at.

   The list, the styles and the behaviour all live here, and every page carries
   only `<lm-viewer-switch data-current="KEY"></lm-viewer-switch>`. Sixteen inline
   copies is what the old strip was, and adding a viewer meant editing sixteen
   files; now it means adding one row to VIEWERS below.

   IT IS A CUSTOM ELEMENT WITH A SHADOW ROOT, and that is not decoration. These
   pages render their header through the DC runtime (React). Writing innerHTML
   into a plain <div> that React owns made it throw
   "removeChild ... not a child of this node" on the next reconcile and the whole
   page died. React does not manage the inside of a custom element, so the shadow
   root is the only safe place to build. Page CSS variables still inherit in.

   Posters are PHOTOGRAPHS of the real rooms, reusing the project card images in
   assets/img/projects/ through the POSTER map below. They were renders captured
   from each page's own canvas, which had the nice property of showing exactly
   what you get when you click; it was not worth what it cost, because several of
   the models do not read at thumbnail size and one viewer cannot be framed at
   all (ahu-viewer.js:138 locks its camera). The tile now shows the real room and
   the viewer behind it is a model of that room.

   The map points at the full-size project photos rather than 256x160 crops of
   them, so there is one copy of each photo in the repo and nothing to rebuild
   when one is replaced. They cost nothing until the panel is opened: it is
   [hidden] until then, and a display:none subtree fetches no backgrounds.

   ADDING A VIEWER MEANS TWO EDITS: a row in VIEWERS and an entry in POSTER. A
   viewer missing from POSTER still gets a tile — an empty grey one.

   THE PAGE'S <header> MUST BE POSITIONED, at a z-index above the viewer card.
   It carries backdrop-filter:blur(10px), which makes it a stacking context, so
   the z-index:30 below is trapped inside it and cannot lift the panel over the
   page. While the header was static the panel dropped BEHIND the viewer on every
   one of these pages — it opened, it was just invisible. The pages now say
   position:relative;z-index:40 on the header; keep that when adding one. */
(function () {
  var VIEWERS = [
    // key,               label,                 file,                                    group
    ['chiller-plant',    'Chiller plant',        'bim-viewer.dc.html',                     'Cooling'],
    ['chiller-room',     'Chiller room',         'cooling-room-viewer.dc.html',            'Cooling'],
    ['makeup-water',     'Makeup water',         'makeup-water-viewer.dc.html',            'Cooling'],
    ['fp-cooling',       'FP cooling towers',    'fp-cooling-tower-viewer.dc.html',        'Cooling'],
    ['rooftop-fluorine-pump','Rooftop fluorine-pump system','rooftop-fluorine-pump-system-viewer.dc.html','Cooling'],
    ['open-cooling',     'Open cooling towers',  'open-cooling-tower-viewer.dc.html',      'Cooling'],
    ['chilled-tank',     'Chilled-water tanks',  'outdoor-chilled-water-tank-viewer.dc.html','Cooling'],
    ['chiller-piping',   'Chiller piping',       'chiller-piping-viewer.dc.html',            'Cooling'],
    ['ahu-room',         'AHU room',             'ahu-room-viewer.dc.html',                'Air'],
    ['crah-room',        'CRAH room',            'crah-room-viewer.dc.html',               'Air'],
    ['rooftop-ac',       'Rooftop AC units',     'rooftop-ac-outdoor-unit-viewer.dc.html', 'Air'],
    ['rooftop-generator','Rooftop diesel generator','rooftop-diesel-generator-viewer.dc.html','Electrical'],
    ['msb',              'MSB',                  'msb-viewer.dc.html',                     'Electrical'],
    ['generator-plant',  'Generator plant',      'generator-room-viewer.dc.html',          'Electrical'],
    ['ecc-room',         'ECC room',             'ecc-room-viewer.dc.html',                'ELV & controls'],
    ['elv-room',         'ELV room',             'elv-room-viewer.dc.html',                'ELV & controls'],
    ['ba-control-room',  'BA control room',      'ba-control-room-viewer.dc.html',         'ELV & controls'],
    ['telecom-room',     'Telecom access room',  'telecom-access-room-viewer.dc.html',     'ELV & controls'],
    ['pre-action',       'Pre-action valves',    'pre-action-valve-room-viewer.dc.html',   'Fire'],
    ['data-hall',        'Data hall',            'data-hall-viewer.dc.html',               'Data hall']
  ];
  // viewer key -> the room's photo in assets/img/projects/
  var POSTER = {
    'chiller-plant':          'chiller-plant-room.jpg',
    'chiller-room':           'cooling-room.jpg',
    'makeup-water':           'makeup-water-pump.jpg',
    'fp-cooling':             'fluorine-pump-cooling-tower.jpg',
    'rooftop-fluorine-pump':  'fluorine-pump-system.jpg',
    'open-cooling':           'open-cooling-tower.jpg',
    'chilled-tank':           'chilled-water-tank.jpg',
    'chiller-piping':         'chiller-piping.jpg',
    'ahu-room':               'ahu-room.jpg',
    'crah-room':              'crah-room.jpg',
    'rooftop-ac':             'roof-ac-unit.jpg',
    'rooftop-generator':      'roof-diesel-generator.jpg',
    'msb':                    'msb.jpg',
    'generator-plant':        'generator.jpg',
    'ecc-room':               'ecc-room.jpg',
    'elv-room':               'elv-room.jpg',
    'ba-control-room':        'ba-control-room.jpg',
    'telecom-room':           'telecom-access-room.jpg',
    'pre-action':             'pre-action-valve-room.jpg',
    'data-hall':              'data-hall.jpg'
  };

  // discipline colours, taken from the HUD's own PALETTE so the two agree
  var GROUP = {
    'Cooling': '#00b0f0', 'Air': '#0f52a0', 'Electrical': '#f2a63b',
    'ELV & controls': '#3fb984', 'Fire': '#d7524a', 'Data hall': '#8a6fd4'
  };

  var CSS = '\
:host{display:block;position:relative;z-index:30;border-top:1px solid var(--border-subtle);background:rgba(255,255,255,.7)}\
*{box-sizing:border-box}\
.lm-vsbar{max-width:var(--container-max);margin:0 auto;padding:0 var(--gutter)}\
.lm-vsbtn{display:inline-flex;align-items:center;gap:10px;border:0;background:transparent;cursor:pointer;\
  padding:11px 12px 11px 0;font-family:var(--font-display);font-weight:700;font-size:.95rem;\
  letter-spacing:.05em;text-transform:uppercase;color:var(--color-brand);transition:color .15s}\
.lm-vsbtn:hover{color:var(--lm-blue-800)}\
.lm-vsbtn:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px;border-radius:3px}\
.lm-vsnow{color:var(--text-strong)}\
.lm-vscount{font-family:var(--font-mono);font-size:10px;font-weight:600;letter-spacing:.14em;\
  text-transform:uppercase;color:var(--lm-slate-400)}\
.lm-vschev{transition:transform .18s}\
:host(.open) .lm-vschev{transform:rotate(180deg)}\
.lm-vspanel{position:absolute;left:0;right:0;top:100%;background:#fff;\
  border-bottom:1px solid var(--border-subtle);box-shadow:0 18px 40px rgba(13,27,42,.18)}\
.lm-vspanel[hidden]{display:none}\
.lm-vspanel-in{max-width:var(--container-max);margin:0 auto;padding:16px var(--gutter) 20px}\
.lm-vshead{display:flex;align-items:center;gap:9px;font-family:var(--font-mono);font-size:9.5px;\
  font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:var(--lm-slate-400);\
  padding-bottom:10px;margin-bottom:13px;border-bottom:1px solid var(--border-subtle)}\
.lm-vshead b{color:var(--color-brand)}\
.lm-vsgrid{display:grid;grid-template-columns:repeat(8,1fr);gap:14px 12px}\
.lm-vstile{display:block;text-decoration:none;min-width:0}\
.lm-vsshot{display:block;width:100%;aspect-ratio:8/5;border-radius:var(--radius-sm);\
  background:var(--lm-slate-100) center/cover no-repeat;border:2px solid transparent;\
  position:relative;overflow:hidden;transition:border-color .15s,transform .15s}\
.lm-vsshot:after{content:"";position:absolute;left:0;right:0;top:0;height:3px;background:var(--g)}\
.lm-vstile:hover .lm-vsshot{border-color:var(--lm-blue-200);transform:translateY(-2px)}\
.lm-vstile:focus-visible .lm-vsshot{outline:2px solid var(--color-accent);outline-offset:2px}\
.lm-vstile.on .lm-vsshot{border-color:var(--color-accent)}\
.lm-vsname{display:block;margin-top:6px;font-family:var(--font-mono);font-size:9.5px;font-weight:600;\
  letter-spacing:.07em;text-transform:uppercase;color:var(--text-body);line-height:1.35;\
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\
.lm-vstile:hover .lm-vsname{color:var(--color-brand)}\
.lm-vstile.on .lm-vsname{color:var(--color-brand)}\
.lm-vstile.on .lm-vsname:after{content:" \\2022 here";color:var(--color-accent)}\
@media(max-width:1100px){.lm-vsgrid{grid-template-columns:repeat(6,1fr)}}\
@media(max-width:820px){.lm-vsgrid{grid-template-columns:repeat(4,1fr)}}\
@media(max-width:560px){.lm-vsgrid{grid-template-columns:repeat(2,1fr)}}\
@media(prefers-reduced-motion:reduce){.lm-vschev,.lm-vsshot{transition:none}}';

  var CUBE = '<svg width="15" height="16" viewBox="0 0 14 15" fill="none" stroke="currentColor"' +
    ' stroke-width="1.35" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M7 1 13 4.3v6.4L7 14 1 10.7V4.3L7 1Z"/><path d="M1 4.3 7 7.6l6-3.3"/><path d="M7 7.6V14"/></svg>';
  var CHEV = '<svg class="lm-vschev" width="11" height="7" viewBox="0 0 11 7" fill="none"' +
    ' stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"' +
    ' aria-hidden="true"><path d="M1 1.5 5.5 5.5 10 1.5"/></svg>';

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function build(host, root) {
    var cur = host.getAttribute('data-current') || '';
    var me = null, i;
    for (i = 0; i < VIEWERS.length; i++) if (VIEWERS[i][0] === cur) me = VIEWERS[i];

    var tiles = VIEWERS.map(function (v) {
      var on = v[0] === cur;
      return '<a class="lm-vstile' + (on ? ' on' : '') + '" href="' + encodeURI(v[2]) + '"' +
        ' style="--g:' + GROUP[v[3]] + '"' + (on ? ' aria-current="page"' : '') +
        ' title="' + esc(v[1]) + ' · ' + esc(v[3]) + '">' +
        '<span class="lm-vsshot"' + (POSTER[v[0]]
          ? ' style="background-image:url(assets/img/projects/' + encodeURI(POSTER[v[0]]) + ')"' : '') + '></span>' +
        '<span class="lm-vsname">' + esc(v[1]) + '</span></a>';
    }).join('');

    root.innerHTML = '<style>' + CSS + '</style>' +
      '<div class="lm-vsbar"><button class="lm-vsbtn" type="button" aria-expanded="false"' +
      ' aria-controls="lm-vspanel">' + CUBE +
      '<span class="lm-vsnow">' + esc(me ? me[1] : '3D viewers') + '</span>' +
      '<span class="lm-vscount">' + VIEWERS.length + ' models</span>' + CHEV + '</button></div>' +
      '<div class="lm-vspanel" id="lm-vspanel" hidden><div class="lm-vspanel-in">' +
      '<div class="lm-vshead">Interactive 3D models <b>' + VIEWERS.length + '</b></div>' +
      '<div class="lm-vsgrid">' + tiles + '</div></div></div>';

    var btn = root.querySelector('.lm-vsbtn'), panel = root.querySelector('.lm-vspanel');
    function set(open) {
      panel.hidden = !open;
      host.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
    }
    btn.addEventListener('click', function (e) { e.stopPropagation(); set(panel.hidden); });
    document.addEventListener('click', function (e) {
      if (!panel.hidden && e.target !== host && !host.contains(e.target)) set(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) { set(false); btn.focus(); }
    });
  }

  function LMViewerSwitch() { return Reflect.construct(HTMLElement, [], LMViewerSwitch); }
  LMViewerSwitch.prototype = Object.create(HTMLElement.prototype);
  LMViewerSwitch.prototype.constructor = LMViewerSwitch;
  Object.setPrototypeOf(LMViewerSwitch, HTMLElement);
  LMViewerSwitch.prototype.connectedCallback = function () {
    if (this._built) return;
    this._built = 1;
    build(this, this.attachShadow({mode: 'open'}));
  };
  if (!customElements.get('lm-viewer-switch'))
    customElements.define('lm-viewer-switch', LMViewerSwitch);
  window.LMViewerSwitch = {viewers: VIEWERS};
})();
