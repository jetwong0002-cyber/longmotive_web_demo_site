/* <lm-ahu-viewer src="assets/plantroom_bim.glb">
   Longmotive AHU room BIM viewer.
   Loads a Draco-compressed glTF 2.0 model with no lights/environment of its own,
   supplies IBL + key light, indexes every node's glTF `extras` (category / system /
   element / unit_tag), and exposes filtering, selection and a scrubbed exploded view.
   The GLB carries 295 node-translation channels: t=0 installed, t=1 separated —
   we never play the clip, we scrub it from the slider. */
(function () {
const CDNS = ['https://esm.sh/three@0.160.0', 'https://esm.run/three@0.160.0'];
const DRACO = 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/gltf/';

const SYS = {
  MECH:   { label: 'Mechanical',      color: '#00b0f0', hex: 0x2f97c9 },
  ELEC:   { label: 'Electrical',      color: '#f2a33c', hex: 0xc98a37 },
  FIRE:   { label: 'Fire protection', color: '#e0483c', hex: 0xb84438 },
  STRUCT: { label: 'Structure',       color: '#8fa3b8', hex: 0x7d8fa3 },
  ARCH:   { label: 'Architectural',   color: '#c9dcf2', hex: 0xa8b8c8 }
};
const SYS_ORDER = ['MECH', 'ELEC', 'FIRE', 'STRUCT', 'ARCH'];

async function loadLibs() {
  let err;
  for (const base of CDNS) {
    try {
      const THREE = await import(/* @vite-ignore */ base);
      const [oc, gl, dl, re] = await Promise.all([
        import(/* @vite-ignore */ base + '/examples/jsm/controls/OrbitControls.js'),
        import(/* @vite-ignore */ base + '/examples/jsm/loaders/GLTFLoader.js'),
        import(/* @vite-ignore */ base + '/examples/jsm/loaders/DRACOLoader.js'),
        import(/* @vite-ignore */ base + '/examples/jsm/environments/RoomEnvironment.js')
      ]);
      return { THREE, OrbitControls: oc.OrbitControls, GLTFLoader: gl.GLTFLoader,
               DRACOLoader: dl.DRACOLoader, RoomEnvironment: re.RoomEnvironment };
    } catch (e) { err = e; }
  }
  throw err;
}

class LMAhuViewer extends HTMLElement {
  connectedCallback() {
    if (this._wired) return; this._wired = true;
    this._reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sh = this.attachShadow({ mode: 'open' });
    sh.innerHTML = TEMPLATE;
    this.$ = (s) => sh.querySelector(s);
    this._sysOff = new Set(); this._catOff = new Set(); this._unit = null;
    this._explode = 0; this._colorBy = false; this._sel = null; this._hover = null;
    this._view = 'iso';

    this.$('.reset').addEventListener('click', () => this.resetView());
    this.$('.vplan').addEventListener('click', () => this.setView('plan'));
    this.$('.viso').addEventListener('click', () => this.setView('iso'));
    this.$('.walls').addEventListener('click', () => this.toggleCat('Wall'));
    this.$('.railtab').addEventListener('click', () => this.setRail(this.$('.wrap').classList.contains('railhid')));
    this.$('.colorby').addEventListener('click', () => this.setColorBy(!this._colorBy));
    this.$('.showall').addEventListener('click', () => this.showAll());
    this.$('.filtoggle').addEventListener('click', () => this.$('.rail').classList.toggle('open'));
    this.$('.railclose').addEventListener('click', () => this.$('.rail').classList.remove('open'));
    this.$('.propclose').addEventListener('click', () => this.select(null));
    const sl = this.$('.slider');
    sl.addEventListener('input', () => this.setExplode(+sl.value));
    this.$('.expreset').addEventListener('click', () => { sl.value = 0; this.setExplode(0); });
    this.$('.file').addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      if (f) this.loadFrom(URL.createObjectURL(f), f.name);
    });
    this.addEventListener('dragover', (e) => { e.preventDefault(); this.$('.wrap').classList.add('drop'); });
    this.addEventListener('dragleave', () => this.$('.wrap').classList.remove('drop'));
    this.addEventListener('drop', (e) => {
      e.preventDefault(); this.$('.wrap').classList.remove('drop');
      const f = e.dataTransfer.files && e.dataTransfer.files[0];
      if (f && /\.(glb|gltf)$/i.test(f.name)) this.loadFrom(URL.createObjectURL(f), f.name);
    });
    this.tabIndex = 0;
    this.addEventListener('keydown', (e) => this.onKey(e));

    this._ro = new ResizeObserver(() => this.onResize());
    this._ro.observe(this);
    const start = () => { if (!this._started) { this._started = true; this.init(); } };
    setTimeout(start, 0);
  }

  disconnectedCallback() {
    this._dead = true;
    if (this._ro) this._ro.disconnect();
    if (this._renderer) { this._renderer.setAnimationLoop(null); this._renderer.dispose(); }
    if (this._controls) this._controls.dispose();
    if (this._scene) this._scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      const m = o.material; if (m) (Array.isArray(m) ? m : [m]).forEach((x) => x.dispose());
    });
    if (this._draco) this._draco.dispose();
  }

  status(html, spin) {
    const el = this.$('.status');
    el.innerHTML = html || '';
    el.classList.toggle('on', !!html);
    el.classList.toggle('spin', !!spin);
  }

  async init() {
    this.status('<span class="s-line">Loading 3D engine</span>', true);
    let libs;
    try { libs = await loadLibs(); } catch (e) {
      return this.status('<span class="s-title">3D engine unavailable</span><span class="s-line">The three.js module could not be fetched from the CDN.</span>');
    }
    if (this._dead) return;
    this.T = libs.THREE;
    const T = this.T;
    const canvas = this.$('canvas');
    const r = this._renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    r.outputColorSpace = T.SRGBColorSpace;
    r.toneMapping = T.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    r.shadowMap.enabled = true;
    r.shadowMap.type = T.PCFSoftShadowMap;

    const scene = this._scene = new T.Scene();
    const pmrem = new T.PMREMGenerator(r);
    scene.environment = pmrem.fromScene(new libs.RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const key = new T.DirectionalLight(0xffffff, 2.1);
    key.position.set(6, 11, 7); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.0006; key.shadow.normalBias = 0.02;
    scene.add(key, key.target);
    this._key = key;
    scene.add(new T.HemisphereLight(0xdfeaf5, 0x1a2836, 0.55));
    const rim = new T.DirectionalLight(0x9fd6f5, 0.55); rim.position.set(-8, 5, -6); scene.add(rim);

    const cam = this._camera = new T.PerspectiveCamera(45, 1, 0.05, 400);
    const ctrl = this._controls = new libs.OrbitControls(cam, canvas);
    ctrl.enableDamping = true; ctrl.dampingFactor = 0.075;
    ctrl.zoomSpeed = 2.4;
    if ('zoomToCursor' in ctrl) ctrl.zoomToCursor = true;
    ctrl.maxPolarAngle = Math.PI * 0.495; ctrl.panSpeed = 0.8;
    ctrl.addEventListener('change', () => { this._dirty = true; });
    ctrl.addEventListener('start', () => canvas.classList.add('drag'));
    ctrl.addEventListener('end', () => canvas.classList.remove('drag'));

    this._ray = new T.Raycaster(); this._ptr = new T.Vector2(); this._tint = new Map();
    canvas.addEventListener('pointermove', (e) => {
      const b = canvas.getBoundingClientRect();
      this._ptr.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1);
      this._pick = true; this._dirty = true;
    });
    canvas.addEventListener('pointerleave', () => { this.hover(null); });
    canvas.addEventListener('click', () => { this.select(this._hover); });

    this.onResize();
    r.setAnimationLoop(() => this.frame());

    this._gltfLoader = new libs.GLTFLoader();
    this._draco = new libs.DRACOLoader();
    this._draco.setDecoderPath(DRACO);
    this._gltfLoader.setDRACOLoader(this._draco);
    this.loadFrom(this.getAttribute('src') || 'assets/plantroom_bim.glb');
  }

  loadFrom(url, label) {
    this.status('<span class="s-line">Loading model' + (label ? ' \u00b7 ' + label : '') + '</span><span class="s-pct">0%</span>', true);
    this._gltfLoader.load(url, (gltf) => this.onModel(gltf), (ev) => {
      if (ev.total) {
        const p = this.$('.s-pct');
        if (p) p.textContent = Math.round((ev.loaded / ev.total) * 100) + '%';
      }
    }, (err) => {
      const draco = /draco/i.test(String(err && err.message));
      this.status('<span class="s-title">Model could not be loaded</span>' +
        '<span class="s-line">' + (draco
          ? 'The Draco decoder could not be fetched, so the compressed geometry cannot be read. An uncompressed re-export of the GLB would load without it.'
          : 'Expected <code>' + (this.getAttribute('src') || 'assets/plantroom_bim.glb') + '</code>.') +
        '</span><span class="s-line">Drop a <b>.glb</b> here, or <button class="pick2">choose a file</button>.</span>');
      const p2 = this.$('.pick2'); if (p2) p2.addEventListener('click', () => this.$('.file').click());
    });
  }

  onModel(gltf) {
    if (this._dead) return;
    const T = this.T;
    if (this._model) { this._scene.remove(this._model); }
    const model = this._model = gltf.scene;
    this._scene.add(model);

    // index every node's glTF extras
    const parts = this._parts = [];
    const catCount = new Map(), sysCount = new Map(), units = new Set();
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true; o.receiveShadow = true;
      let d = o.userData, p = o.parent;
      while ((!d || !d.category) && p) { if (p.userData && p.userData.category) d = p.userData; p = p.parent; }
      d = d || {};
      const rec = {
        obj: o,
        category: d.category || 'Unclassified',
        system: SYS[d.system] ? d.system : (d.system || 'ARCH'),
        element: d.element || o.name || 'element',
        unit: d.unit_tag || null
      };
      o.userData._rec = rec;
      o.userData.baseMat = o.material;
      parts.push(rec);
      catCount.set(rec.category, (catCount.get(rec.category) || 0) + 1);
      sysCount.set(rec.system, (sysCount.get(rec.system) || 0) + 1);
      if (rec.unit) units.add(rec.unit);
    });
    this._catCount = catCount; this._sysCount = sysCount;
    this._units = [...units].sort();

    // perimeter walls get their own material so they can fade as the camera moves in
    this._fadeParts = parts.filter((p) => p.category === 'Wall' || p.category === 'Kerb');
    if (this._fadeParts.length) {
      const m = this._fadeParts[0].obj.material.clone();
      m.transparent = true; m.opacity = 1;
      this._wallMat = m;
      this._fadeParts.forEach((p) => { p.obj.userData.baseMat = m; p.obj.material = m; });
    }

    // exploded-view animation — bind every channel, never play it
    this._mixer = null; this._clipDur = 0;
    if (gltf.animations && gltf.animations.length) {
      this._mixer = new T.AnimationMixer(model);
      gltf.animations.forEach((clip) => {
        const a = this._mixer.clipAction(clip);
        a.setLoop(T.LoopOnce, 1); a.clampWhenFinished = true; a.enabled = true; a.play();
        this._clipDur = Math.max(this._clipDur, clip.duration);
      });
      this._mixer.setTime(0); this._mixer.update(0);
    }
    this.$('.explode').style.display = this._mixer ? '' : 'none';

    // frame it — the room shell is closed, so the soffit starts hidden
    ['Soffit'].forEach((c) => { if (catCount.has(c)) this._catOff.add(c); });
    const key = this._key;
    const box = this.visibleBox(true);
    const size = box.getSize(new T.Vector3()), c = box.getCenter(new T.Vector3());
    this._center = c; this._radius = Math.max(size.length() * 0.5, 1);
    key.target.position.copy(c);
    key.position.set(c.x + this._radius * 0.9, c.y + this._radius * 1.3, c.z + this._radius * 0.85);
    const sc = key.shadow.camera, e = this._radius * 1.35;
    sc.left = -e; sc.right = e; sc.top = e; sc.bottom = -e; sc.near = 0.5; sc.far = this._radius * 5; sc.updateProjectionMatrix();

    this.buildUI();
    const cb = this.getAttribute('color-by');
    if (cb !== null && cb !== 'false') this.setColorBy(true);
    this.resetView();
    this.status('');
    this.$('.wrap').classList.add('ready');
    const n = parts.length;
    this.$('.count').textContent = n + ' elements \u00b7 ' + catCount.size + ' categories';
  }

  buildUI() {
    const sysWrap = this.$('.systems'); sysWrap.innerHTML = '';
    SYS_ORDER.filter((s) => this._sysCount.get(s)).forEach((s) => {
      const b = document.createElement('button');
      b.className = 'chip on'; b.dataset.sys = s;
      b.innerHTML = '<i class="sw" style="background:' + SYS[s].color + '"></i>' + s +
        '<em>' + this._sysCount.get(s) + '</em>';
      b.title = SYS[s].label;
      b.addEventListener('click', () => this.toggleSys(s));
      sysWrap.appendChild(b);
    });

    const uw = this.$('.unitrow');
    if (this._units.length) {
      uw.innerHTML = '';
      const all = document.createElement('button');
      all.className = 'chip sm on'; all.textContent = 'ALL';
      all.addEventListener('click', () => this.setUnit(null));
      uw.appendChild(all);
      this._units.forEach((u) => {
        const b = document.createElement('button');
        b.className = 'chip sm'; b.dataset.unit = u; b.textContent = u;
        b.addEventListener('click', () => this.setUnit(this._unit === u ? null : u));
        uw.appendChild(b);
      });
      this.$('.unitsec').style.display = '';
    } else this.$('.unitsec').style.display = 'none';

    const list = this.$('.cats'); list.innerHTML = '';
    [...this._catCount.entries()].sort((a, b) => b[1] - a[1]).forEach(([cat, n]) => {
      const row = document.createElement('div');
      row.className = 'row'; row.dataset.cat = cat;
      row.innerHTML = '<button class="tog" aria-pressed="true"><i></i></button>' +
        '<span class="nm">' + cat + '</span><span class="n">' + n + '</span>' +
        '<button class="only">Only</button>';
      row.querySelector('.tog').addEventListener('click', () => this.toggleCat(cat));
      row.querySelector('.nm').addEventListener('click', () => this.toggleCat(cat));
      row.querySelector('.only').addEventListener('click', () => this.onlyCat(cat));
      list.appendChild(row);
    });
    this.applyFilters();
  }

  toggleSys(s) { this._sysOff.has(s) ? this._sysOff.delete(s) : this._sysOff.add(s); this.applyFilters(); }
  toggleCat(c) { this._catOff.has(c) ? this._catOff.delete(c) : this._catOff.add(c); this.applyFilters(); }
  onlyCat(c) {
    const all = [...this._catCount.keys()];
    const soloed = this._catOff.size === all.length - 1 && !this._catOff.has(c);
    this._catOff = new Set(soloed ? [] : all.filter((x) => x !== c));
    this.applyFilters();
  }
  setUnit(u) { this._unit = u; this.applyFilters(); }
  showAll() { this._sysOff.clear(); this._catOff.clear(); this._unit = null; this.applyFilters(); }

  applyFilters() {
    let vis = 0;
    this._parts.forEach((p) => {
      const on = !this._sysOff.has(p.system) && !this._catOff.has(p.category) &&
        (!this._unit || p.unit === this._unit);
      p.obj.visible = on; if (on) vis++;
    });
    this.$('.systems').querySelectorAll('.chip').forEach((b) => b.classList.toggle('on', !this._sysOff.has(b.dataset.sys)));
    this.$('.cats').querySelectorAll('.row').forEach((r) => {
      const off = this._catOff.has(r.dataset.cat);
      r.classList.toggle('off', off);
      r.querySelector('.tog').setAttribute('aria-pressed', String(!off));
    });
    this.$('.unitrow').querySelectorAll('.chip').forEach((b) => b.classList.toggle('on', (b.dataset.unit || null) === this._unit));
    const wb = this.$('.walls'), wallsOff = this._catOff.has('Wall');
    wb.style.display = this._catCount.has('Wall') ? '' : 'none';
    wb.textContent = wallsOff ? 'Show walls' : 'Hide walls';
    wb.classList.toggle('on', wallsOff);
    this.$('.visible').textContent = vis + ' visible';
    if (this._sel && !this._sel.obj.visible) this.select(null);
    this._dirty = true;
  }

  setColorBy(on) {
    this._colorBy = on;
    const T = this.T;
    if (on && !this._sysMats) {
      this._sysMats = {};
      Object.keys(SYS).forEach((s) => {
        this._sysMats[s] = new T.MeshStandardMaterial({ color: SYS[s].hex, roughness: 0.72, metalness: 0.06 });
      });
    }
    this._parts.forEach((p) => { p.obj.material = this.matFor(p); });
    if (this._hover) this.paint(this._hover, 0x00b0f0, 0.55);
    if (this._sel) this.paint(this._sel, 0x00b0f0, 0.9);
    this.$('.colorby').classList.toggle('on', on);
    this._dirty = true;
  }

  matFor(p) {
    if (this._colorBy && p.obj.userData.baseMat !== this._wallMat) return this._sysMats[p.system] || this._sysMats.ARCH;
    return p.obj.userData.baseMat;
  }
  paint(p, hex, inten) {
    const base = this.matFor(p);
    if (hex == null) { p.obj.material = base; return; }
    const k = base.uuid + '|' + hex + '|' + inten;
    let m = this._tint.get(k);
    if (!m) { m = base.clone(); m.emissive = new this.T.Color(hex); m.emissiveIntensity = inten; this._tint.set(k, m); }
    p.obj.material = m;
  }

  hover(p) {
    if (this._hover === p) return;
    if (this._hover && this._hover !== this._sel) this.paint(this._hover, null);
    this._hover = p;
    if (p && p !== this._sel) this.paint(p, 0x00b0f0, 0.55);
    this.$('canvas').style.cursor = p ? 'pointer' : '';
    const t = this.$('.tip');
    if (p) { t.textContent = p.element + ' \u00b7 ' + p.category; t.classList.add('on'); }
    else t.classList.remove('on');
    this._dirty = true;
  }

  select(p) {
    if (this._sel) this.paint(this._sel, this._sel === this._hover ? 0x00b0f0 : null, 0.55);
    this._sel = p;
    const panel = this.$('.props');
    if (!p) {
      panel.classList.remove('on');
      if (this._box) { this._scene.remove(this._box); this._box = null; }
      this._dirty = true; return;
    }
    this.paint(p, 0x00b0f0, 0.9);
    this.$('.p-el').textContent = p.element;
    this.$('.p-cat').textContent = p.category;
    this.$('.p-sys').innerHTML = '<i class="sw" style="background:' + (SYS[p.system] ? SYS[p.system].color : '#8fa3b8') + '"></i>' +
      p.system + ' \u2014 ' + (SYS[p.system] ? SYS[p.system].label : 'Other');
    this.$('.p-unit').textContent = p.unit || '\u2014';
    this.$('.p-unitrow').style.opacity = p.unit ? '1' : '.45';
    panel.classList.add('on');
    this.updateBox();
  }

  updateBox() {
    const T = this.T;
    if (this._box) { this._scene.remove(this._box); this._box = null; }
    if (!this._sel) return;
    const b = new T.Box3().setFromObject(this._sel.obj);
    const h = new T.Box3Helper(b, new T.Color(0x00b0f0));
    h.material.depthTest = false; h.material.transparent = true; h.material.opacity = 0.9;
    h.renderOrder = 999;
    this._scene.add(h); this._box = h; this._dirty = true;
  }

  setExplode(v) {
    this._explode = v;
    this.$('.expval').textContent = v + '%';
    if (this._mixer && this._clipDur) {
      this._mixer.setTime((v / 100) * this._clipDur);
      this._mixer.update(0);
    }
    this.updateBox();
    this._dirty = true;
  }

  visibleBox(pretend) {
    const T = this.T, box = new T.Box3(), tmp = new T.Box3();
    this._parts.forEach((p) => {
      const on = pretend
        ? !this._sysOff.has(p.system) && !this._catOff.has(p.category) && (!this._unit || p.unit === this._unit)
        : p.obj.visible;
      if (!on) return;
      tmp.setFromObject(p.obj);
      if (!tmp.isEmpty()) box.union(tmp);
    });
    if (box.isEmpty()) box.setFromObject(this._model);
    return box;
  }

  setRail(open) {
    this.$('.wrap').classList.toggle('railhid', !open);
    const t = this.$('.railtab');
    t.innerHTML = open ? '&#10094;' : '&#10095;';
    t.setAttribute('aria-expanded', String(open));
    const lbl = (open ? 'Hide' : 'Show') + ' filter panel';
    t.setAttribute('aria-label', lbl); t.setAttribute('title', lbl);
  }

  setView(mode) {
    this._view = mode;
    this.$('.vplan').classList.toggle('on', mode === 'plan');
    this.$('.viso').classList.toggle('on', mode === 'iso');
    this.resetView();
  }

  resetView() {
    const T = this.T;
    if (!this._parts) return;
    const box = this.visibleBox();
    const c = box.getCenter(new T.Vector3());
    const R = Math.max(box.getSize(new T.Vector3()).length() * 0.5, 0.6);
    const s = box.getSize(new T.Vector3());
    this._center = c; this._radius = R;
    const tan = Math.tan((this._camera.fov * Math.PI / 180) / 2);
    this._camera.near = Math.max(R / 400, 0.02); this._camera.far = R * 22;
    this._camera.updateProjectionMatrix();
    this._controls.target.copy(c);
    this._controls.minDistance = R * 0.06; this._controls.maxDistance = R * 6;
    if (this._view === 'plan') {
      const a = this._camera.aspect || 1;
      const d = Math.max((s.z / 2) / tan, (s.x / 2) / (tan * a)) * 1.12;
      this._camera.position.set(c.x, c.y + d, c.z + d * 0.0015);
    } else {
      const dist = R / Math.sin((this._camera.fov * Math.PI / 180) / 2) * 0.66;
      this._camera.position.set(c.x + dist * 0.72, c.y + dist * 0.42, c.z + dist * 0.72);
    }
    this._controls.update();
    this._dirty = true;
  }

  onKey(e) {
    const k = e.key.toLowerCase();
    if (k === 'r') { this.resetView(); e.preventDefault(); }
    else if (k === 'escape') this.select(null);
    else if (k === 'c') this.setColorBy(!this._colorBy);
    else if (k === 'a') this.showAll();
    else if (k === 'p') this.setView('plan');
    else if (k === 'i') this.setView('iso');
    else if (k === 'w') this.toggleCat('Wall');
    else if (k === '[' || k === ']') {
      const sl = this.$('.slider');
      sl.value = Math.max(0, Math.min(100, +sl.value + (k === ']' ? 10 : -10)));
      this.setExplode(+sl.value); e.preventDefault();
    }
  }

  onResize() {
    if (!this._renderer) return;
    const w = this.clientWidth || 1, h = this.clientHeight || 1;
    this._renderer.setSize(w, h, false);
    this._camera.aspect = w / h; this._camera.updateProjectionMatrix();
    this.$('.wrap').classList.toggle('narrow', w < 900);
    this._dirty = true;
  }

  frame() {
    if (this._dead) return;
    this._controls.update();
    if (this._wallMat && this._radius) {
      const d = this._camera.position.distanceTo(this._controls.target);
      const far = this._radius * 1.0, near = this._radius * 0.45;
      const o = Math.max(0.06, Math.min(1, (d - near) / (far - near)));
      if (Math.abs(o - this._wallMat.opacity) > 0.002) {
        this._wallMat.opacity = o;
        this._wallMat.depthWrite = o > 0.97;
        this._dirty = true;
      }
    }
    if (this._pick && this._parts) {
      this._pick = false;
      this._ray.setFromCamera(this._ptr, this._camera);
      const hits = this._ray.intersectObject(this._model, true);
      let rec = null;
      for (const h of hits) { if (h.object.visible && h.object.userData._rec) { rec = h.object.userData._rec; break; } }
      this.hover(rec);
    }
    if (this._dirty) { this._dirty = false; this._renderer.render(this._scene, this._camera); }
  }
}

const TEMPLATE = `<style>
  :host{display:block;position:relative;width:100%;height:100%;overflow:hidden;
    font-family:'IBM Plex Sans',system-ui,sans-serif;color:#e8f1fa;outline:none}
  :host(:focus-visible){outline:2px solid #00b0f0;outline-offset:-2px}
  *{box-sizing:border-box}
  .wrap{position:absolute;inset:0;
    background:radial-gradient(120% 100% at 50% 0%,#12304f 0%,#0a1c31 48%,#061424 100%)}
  .wrap.drop:after{content:'Drop .glb to load';position:absolute;inset:12px;z-index:9;
    display:flex;align-items:center;justify-content:center;border:2px dashed #00b0f0;border-radius:6px;
    background:rgba(6,20,36,.72);font-family:'IBM Plex Mono',monospace;font-size:12px;
    letter-spacing:.12em;text-transform:uppercase;color:#7fd4ff}
  canvas{position:absolute;inset:0;display:block;width:100%;height:100%;touch-action:none;cursor:grab}
  canvas.drag{cursor:grabbing !important}

  .topbar{position:absolute;top:12px;left:12px;right:12px;z-index:4;display:flex;gap:8px;align-items:center;flex-wrap:wrap;pointer-events:none}
  .topbar>*{pointer-events:auto}
  .spacer{flex:1}
  .meta{display:flex;gap:10px;align-items:center;font-family:'IBM Plex Mono',monospace;font-size:10px;
    letter-spacing:.1em;text-transform:uppercase;color:#6f93bb;padding:0 2px}
  .meta b{color:#9dc4e6;font-weight:600}

  button{font:inherit;color:inherit;background:none;border:none;cursor:pointer}
  .btn{display:inline-flex;align-items:center;gap:7px;height:30px;padding:0 12px;border-radius:3px;
    border:1px solid rgba(126,170,214,.28);background:rgba(9,26,45,.82);backdrop-filter:blur(8px);
    font-family:'IBM Plex Mono',monospace;font-size:10.5px;font-weight:600;letter-spacing:.1em;
    text-transform:uppercase;color:#bcd8f0;transition:border-color .15s,background .15s,color .15s}
  .btn:hover{border-color:#00b0f0;color:#fff}
  .btn:active{transform:translateY(1px)}
  .btn.on{background:#0f52a0;border-color:#0f52a0;color:#fff}
  .btn:focus-visible{outline:2px solid #00b0f0;outline-offset:2px}
  .filtoggle{display:none}

  .rail{position:absolute;top:54px;left:12px;bottom:12px;z-index:5;width:258px;display:flex;flex-direction:column;
    background:rgba(7,26,46,.9);backdrop-filter:blur(12px);border:1px solid rgba(126,170,214,.2);
    border-top:3px solid #00b0f0;border-radius:4px;overflow:hidden;opacity:0;transform:translateX(-8px);
    transition:opacity .25s,transform .25s;pointer-events:none}
  .wrap.ready .rail{opacity:1;transform:none;pointer-events:auto}
  .wrap.ready.railhid .rail{opacity:0;transform:translateX(-14px);pointer-events:none}
  .railtab{position:absolute;top:96px;left:270px;z-index:6;width:19px;height:46px;display:flex;
    align-items:center;justify-content:center;padding:0;
    border:1px solid rgba(126,170,214,.2);border-left:none;border-radius:0 3px 3px 0;
    background:rgba(7,26,46,.9);backdrop-filter:blur(12px);color:#7fd4ff;font-size:11px;line-height:1;
    opacity:0;transition:left .25s,opacity .2s,border-color .15s,color .15s}
  .wrap.ready .railtab{opacity:1}
  .railtab:hover{border-color:#00b0f0;color:#fff}
  .railtab:focus-visible{outline:2px solid #00b0f0;outline-offset:2px}
  .wrap.railhid .railtab{left:12px;border-left:1px solid rgba(126,170,214,.2);border-radius:3px}
  .rail h4{margin:0;padding:13px 14px 8px;font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;
    letter-spacing:.14em;text-transform:uppercase;color:#5f86ae;display:flex;align-items:center;gap:8px}
  .rail h4:before{content:'';width:14px;height:2px;background:#00b0f0;flex:none}
  .railclose{display:none}
  .systems,.unitrow{display:flex;flex-wrap:wrap;gap:5px;padding:0 12px 12px}
  .chip{display:inline-flex;align-items:center;gap:6px;padding:5px 8px;border-radius:2px;
    border:1px solid rgba(126,170,214,.22);background:rgba(255,255,255,.03);
    font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:600;letter-spacing:.07em;color:#7f9cbb;
    transition:all .15s}
  .chip em{font-style:normal;opacity:.6;font-size:9px}
  .chip:hover{border-color:#00b0f0;color:#e8f1fa}
  .chip.on{background:rgba(0,176,240,.14);border-color:rgba(0,176,240,.55);color:#e8f1fa}
  .chip:focus-visible{outline:2px solid #00b0f0;outline-offset:2px}
  .chip.sm{padding:4px 8px}
  .chip .sw{width:9px;height:9px;border-radius:1px;flex:none;opacity:.85}
  .unitsec{border-top:1px solid rgba(126,170,214,.13)}

  .catsec{border-top:1px solid rgba(126,170,214,.13);flex:1;min-height:0;display:flex;flex-direction:column}
  .cats{flex:1;min-height:0;overflow:auto;padding:0 6px 8px;scrollbar-width:thin;scrollbar-color:#2a4767 transparent}
  .cats::-webkit-scrollbar{width:7px}
  .cats::-webkit-scrollbar-thumb{background:#2a4767;border-radius:4px}
  .row{display:flex;align-items:center;gap:8px;padding:4px 6px;border-radius:2px;transition:background .12s}
  .row:hover{background:rgba(255,255,255,.045)}
  .row .tog{width:13px;height:13px;flex:none;border:1px solid rgba(126,170,214,.5);border-radius:2px;
    display:flex;align-items:center;justify-content:center;padding:0}
  .row .tog i{width:7px;height:7px;background:#00b0f0;border-radius:1px;transition:opacity .12s}
  .row.off .tog i{opacity:0}
  .row .tog:focus-visible{outline:2px solid #00b0f0;outline-offset:2px}
  .row .nm{flex:1;font-size:11.5px;line-height:1.35;color:#cfe1f2;cursor:pointer;overflow:hidden;
    text-overflow:ellipsis;white-space:nowrap}
  .row.off .nm,.row.off .n{color:#587ba0;opacity:.6}
  .row .n{font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:#5f86ae;min-width:22px;text-align:right}
  .row .only{font-family:'IBM Plex Mono',monospace;font-size:8.5px;letter-spacing:.1em;text-transform:uppercase;
    padding:2px 5px;border-radius:2px;opacity:0;transition:opacity .12s;color:#5f86ae}
  .row:hover .only,.row .only:focus-visible{opacity:1}
  .row .only:hover{background:#0f52a0;color:#fff}
  .railfoot{padding:9px 12px;border-top:1px solid rgba(126,170,214,.13);display:flex;gap:8px;align-items:center}
  .visible{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:#5f86ae;flex:1}

  .props{position:absolute;top:54px;right:12px;z-index:5;width:288px;max-width:calc(100% - 24px);
    background:rgba(7,26,46,.92);backdrop-filter:blur(12px);border:1px solid rgba(126,170,214,.2);
    border-left:3px solid #00b0f0;border-radius:4px;padding:14px 16px 15px;
    opacity:0;transform:translateY(-6px);transition:opacity .2s,transform .2s;pointer-events:none}
  .props.on{opacity:1;transform:none;pointer-events:auto}
  .props .ph{display:flex;align-items:flex-start;gap:10px;margin-bottom:11px}
  .props h3{margin:0;flex:1;font-family:'Barlow Semi Condensed',sans-serif;font-weight:700;font-size:19px;
    line-height:1.12;letter-spacing:.02em;text-transform:uppercase;color:#fff;word-break:break-word}
  .propclose{font-size:16px;line-height:1;color:#5f86ae;padding:2px 4px}
  .propclose:hover{color:#fff}
  .props dl{margin:0;display:grid;grid-template-columns:74px 1fr;gap:7px 12px;align-items:baseline}
  .props dt{font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:600;letter-spacing:.12em;
    text-transform:uppercase;color:#5f86ae}
  .props dd{margin:0;font-size:12.5px;line-height:1.4;color:#dcebf8;display:flex;align-items:center;gap:7px}
  .props dd.mono{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.05em;color:#7fd4ff}
  .props .sw{width:9px;height:9px;border-radius:1px;flex:none}

  .explode{position:absolute;left:50%;transform:translateX(-50%);bottom:14px;z-index:5;
    display:flex;align-items:center;gap:12px;padding:9px 15px;border-radius:4px;
    background:rgba(7,26,46,.9);backdrop-filter:blur(12px);border:1px solid rgba(126,170,214,.2);
    opacity:0;transition:opacity .25s;pointer-events:none;max-width:calc(100% - 24px)}
  .wrap.ready .explode{opacity:1;pointer-events:auto}
  .explode label{font-family:'IBM Plex Mono',monospace;font-size:9.5px;font-weight:600;letter-spacing:.13em;
    text-transform:uppercase;color:#5f86ae;white-space:nowrap}
  .slider{-webkit-appearance:none;appearance:none;width:min(240px,38vw);height:3px;border-radius:2px;
    background:linear-gradient(90deg,#00b0f0,#2a4767);outline:none;cursor:pointer}
  .slider::-webkit-slider-thumb{-webkit-appearance:none;width:15px;height:15px;border-radius:50%;
    background:#fff;border:3px solid #00b0f0;cursor:grab}
  .slider::-moz-range-thumb{width:12px;height:12px;border-radius:50%;background:#fff;border:3px solid #00b0f0;border-color:#00b0f0}
  .slider:focus-visible{outline:2px solid #00b0f0;outline-offset:4px}
  .expval{font-family:'IBM Plex Mono',monospace;font-size:11px;color:#7fd4ff;min-width:38px;text-align:right}
  .expreset{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;
    color:#5f86ae;padding:3px 6px;border-radius:2px}
  .expreset:hover{color:#fff;background:rgba(255,255,255,.07)}

  .tip{position:absolute;left:50%;transform:translateX(-50%);bottom:62px;z-index:4;
    padding:5px 10px;border-radius:2px;background:rgba(6,20,36,.9);border:1px solid rgba(0,176,240,.35);
    font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.06em;color:#7fd4ff;
    opacity:0;transition:opacity .15s;pointer-events:none;white-space:nowrap;max-width:calc(100% - 24px);
    overflow:hidden;text-overflow:ellipsis}
  .tip.on{opacity:1}

  .hint{position:absolute;right:14px;bottom:14px;z-index:3;text-align:right;
    font-family:'IBM Plex Mono',monospace;font-size:9px;line-height:1.8;letter-spacing:.1em;
    text-transform:uppercase;color:#3f628a;pointer-events:none}

  .status{position:absolute;inset:0;z-index:8;display:none;flex-direction:column;align-items:center;
    justify-content:center;gap:9px;text-align:center;padding:32px;background:rgba(6,20,36,.86)}
  .status.on{display:flex}
  .s-title{font-family:'Barlow Semi Condensed',sans-serif;font-weight:700;font-size:22px;letter-spacing:.03em;
    text-transform:uppercase;color:#fff}
  .s-line{font-size:13px;line-height:1.6;color:#9dc4e6;max-width:46ch}
  .s-line code{font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:#7fd4ff;
    background:rgba(0,176,240,.1);padding:1px 5px;border-radius:2px}
  .s-pct{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.14em;color:#00b0f0}
  .status button{color:#7fd4ff;text-decoration:underline;font-size:13px}
  .status.spin .s-line:first-child:before{content:'';display:inline-block;width:9px;height:9px;margin-right:9px;
    border:2px solid rgba(0,176,240,.3);border-top-color:#00b0f0;border-radius:50%;animation:lmspin .8s linear infinite}
  @keyframes lmspin{to{transform:rotate(360deg)}}
  .file{display:none}

  .wrap.narrow .rail{top:12px;bottom:12px;left:12px;width:min(272px,calc(100% - 24px));
    transform:translateX(-108%);opacity:1;pointer-events:none;box-shadow:0 18px 46px rgba(0,0,0,.5)}
  .wrap.narrow .rail.open{transform:none;pointer-events:auto}
  .wrap.narrow .railclose{display:block;position:absolute;top:8px;right:8px;font-size:16px;color:#5f86ae;padding:4px 7px;z-index:2}
  .wrap.narrow .filtoggle{display:inline-flex}
  .wrap.narrow .railtab{display:none}
  .wrap.narrow .props{top:auto;bottom:64px;right:12px;left:12px;width:auto;max-width:none}
  .wrap.narrow .hint{display:none}
  .wrap.narrow .meta{display:none}
  .wrap.narrow .explode{left:12px;right:12px;transform:none;bottom:12px;justify-content:space-between}
  .wrap.narrow .slider{flex:1;width:auto}
  .wrap.narrow .tip{display:none}
  @media (prefers-reduced-motion: reduce){*{transition:none !important;animation:none !important}}
</style>
<div class="wrap">
  <canvas></canvas>
  <div class="topbar">
    <button class="btn filtoggle">Filters</button>
    <button class="btn reset" title="Reset view (R)">Reset view</button>
    <button class="btn vplan" title="Plan view (P)">Plan</button>
    <button class="btn viso on" title="3D view (I)">3D</button>
    <button class="btn walls" title="Show or hide the perimeter walls (W)">Hide walls</button>
    <button class="btn colorby" title="Colour by system (C)">Colour by system</button>
    <span class="spacer"></span>
    <span class="meta"><b class="count"></b></span>
  </div>
  <aside class="rail">
    <button class="railclose" aria-label="Close filters">&#10005;</button>
    <h4>System</h4>
    <div class="systems"></div>
    <div class="unitsec"><h4>Unit tag</h4><div class="unitrow"></div></div>
    <div class="catsec">
      <h4>Category</h4>
      <div class="cats"></div>
    </div>
    <div class="railfoot"><span class="visible"></span><button class="btn showall">Show all</button></div>
  </aside>
  <button class="railtab" aria-label="Hide filter panel" aria-expanded="true" title="Hide filter panel">&#10094;</button>
  <aside class="props">
    <div class="ph"><h3 class="p-el"></h3><button class="propclose" aria-label="Close">&#10005;</button></div>
    <dl>
      <dt>Category</dt><dd class="p-cat"></dd>
      <dt>System</dt><dd class="p-sys"></dd>
      <dt class="p-unitrow">Unit tag</dt><dd class="p-unit mono"></dd>
    </dl>
  </aside>
  <div class="tip"></div>
  <div class="explode">
    <label for="ex">Explode</label>
    <input id="ex" class="slider" type="range" min="0" max="100" value="0" step="1" aria-label="Explode assembly">
    <span class="expval">0%</span>
    <button class="expreset">Reset</button>
  </div>
  <div class="hint">Drag orbit &#183; Right-drag pan &#183; Scroll zoom<br>W walls &#183; P plan &#183; I 3D &#183; R reset</div>
  <div class="status"></div>
  <input class="file" type="file" accept=".glb,.gltf,model/gltf-binary">
</div>`;

if (!customElements.get('lm-ahu-viewer')) customElements.define('lm-ahu-viewer', LMAhuViewer);
})();
