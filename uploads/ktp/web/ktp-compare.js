/*!
 * <ktp-compare> — a dependency-free before/after image slider.
 * Part of the KTP Progression asset pack. No build step, no framework.
 *
 *   <script type="module" src="ktp-compare.js"></script>
 *
 *   <ktp-compare
 *     before="media/compare/hallB-roof-before-1600.webp"
 *     after="media/compare/hallB-roof-after-1600.webp"
 *     before-label="26 Aug 2025" after-label="14 Dec 2025"
 *     ratio="1600/900" start="50"></ktp-compare>
 *
 * Attributes
 *   before, after            image URLs (required)
 *   before-srcset, after-srcset, sizes   responsive image hints (optional)
 *   before-label, after-label            corner captions (optional)
 *   alt-before, alt-after                alt text (defaults to the labels)
 *   ratio                    aspect ratio, default "1600/900"
 *   start                    initial divider position 0–100, default 50
 *   no-sweep                 hide the sweep button
 *   sweep-label              button text, default "Sweep"
 *
 * Properties / methods / events
 *   el.value  -> Number 0–100 (get/set)
 *   el.sweep()                animate across and back
 *   'change'  -> CustomEvent{ detail:{ value } }
 *
 * Theming (CSS custom properties, set on the element or an ancestor)
 *   --ktp-radius, --ktp-divider, --ktp-knob-size, --ktp-knob-bg, --ktp-knob-fg,
 *   --ktp-label-bg, --ktp-label-fg, --ktp-label-size, --ktp-focus,
 *   --ktp-btn-fg, --ktp-btn-border, --ktp-font
 *
 * Shadow parts: image, divider, knob, label, button
 */
const TPL = document.createElement('template');
TPL.innerHTML = `
<style>
  :host{
    --_radius: var(--ktp-radius, 0px);
    --_divider: var(--ktp-divider, rgba(255,255,255,.92));
    --_knob: var(--ktp-knob-size, 38px);
    --_knobbg: var(--ktp-knob-bg, rgba(255,255,255,.94));
    --_knobfg: var(--ktp-knob-fg, #14181f);
    --_labbg: var(--ktp-label-bg, rgba(12,13,12,.72));
    --_labfg: var(--ktp-label-fg, #fff);
    --_labsz: var(--ktp-label-size, 11px);
    --_focus: var(--ktp-focus, #a1522b);
    --_font: var(--ktp-font, ui-monospace, SFMono-Regular, Menlo, monospace);
    display:block; position:relative;
  }
  :host([hidden]){display:none}
  .box{
    position:relative; overflow:hidden; border-radius:var(--_radius);
    aspect-ratio:var(--_ratio, 1600/900); background:#c9c4bc;
    touch-action:pan-y; cursor:ew-resize; outline:none;
  }
  .box:focus-visible{ box-shadow:inset 0 0 0 2px var(--_focus) }
  img{
    position:absolute; inset:0; width:100%; height:100%; object-fit:cover;
    display:block; user-select:none; -webkit-user-drag:none;
  }
  .clip{ position:absolute; inset:0; clip-path:inset(0 calc(100% - var(--_p,50%)) 0 0) }
  .divider{
    position:absolute; top:0; bottom:0; left:var(--_p,50%); width:2px;
    background:var(--_divider); box-shadow:0 0 0 1px rgba(0,0,0,.35);
    transform:translateX(-1px); pointer-events:none;
  }
  .knob{
    position:absolute; top:50%; left:0; width:var(--_knob); height:var(--_knob);
    margin:calc(var(--_knob) / -2) 0 0 calc(var(--_knob) / -2);
    border-radius:50%; background:var(--_knobbg); box-shadow:0 2px 10px rgba(0,0,0,.4);
  }
  .knob::before, .knob::after{
    content:""; position:absolute; top:50%; margin-top:-5px; width:0; height:0;
    border-top:5px solid transparent; border-bottom:5px solid transparent;
  }
  .knob::before{ border-right:7px solid var(--_knobfg); left:calc(var(--_knob) * .22) }
  .knob::after { border-left:7px solid var(--_knobfg);  right:calc(var(--_knob) * .22) }
  .lab{
    position:absolute; top:11px; font-family:var(--_font); font-size:var(--_labsz);
    letter-spacing:.09em; padding:4px 9px; color:var(--_labfg); background:var(--_labbg);
    border-radius:3px; pointer-events:none; white-space:nowrap;
  }
  .lab.a{ left:11px } .lab.b{ right:11px }
  .lab:empty{ display:none }
  .bar{ display:flex; margin-top:10px }
  .bar[hidden]{ display:none }
  button{
    font:inherit; font-family:var(--_font); font-size:11.5px; letter-spacing:.09em;
    text-transform:uppercase; background:transparent; color:var(--ktp-btn-fg, inherit);
    border:1px solid var(--ktp-btn-border, currentColor); border-radius:6px;
    padding:7px 13px; cursor:pointer;
  }
  button:focus-visible{ outline:2px solid var(--_focus); outline-offset:2px }
  @media (prefers-reduced-motion: reduce){ .divider{ transition:none } }
</style>
<div class="box" part="box" tabindex="0" role="slider"
     aria-valuemin="0" aria-valuemax="100" aria-orientation="horizontal">
  <img class="after" part="image" decoding="async" loading="lazy">
  <div class="clip"><img class="before" part="image" decoding="async" loading="lazy"></div>
  <span class="lab a" part="label"></span>
  <span class="lab b" part="label"></span>
  <div class="divider" part="divider"><span class="knob" part="knob"></span></div>
</div>
<div class="bar"><button type="button" part="button"></button></div>
`;

const clamp = (n) => Math.max(0, Math.min(100, Number.isFinite(n) ? n : 50));

class KtpCompare extends HTMLElement {
  static get observedAttributes(){
    return ['before','after','before-srcset','after-srcset','sizes',
            'before-label','after-label','alt-before','alt-after',
            'ratio','start','no-sweep','sweep-label'];
  }
  #v = 50; #dragging = false; #raf = 0;

  constructor(){
    super();
    this.attachShadow({mode:'open'}).append(TPL.content.cloneNode(true));
    this.$box    = this.shadowRoot.querySelector('.box');
    this.$before = this.shadowRoot.querySelector('.before');
    this.$after  = this.shadowRoot.querySelector('.after');
    this.$labA   = this.shadowRoot.querySelector('.lab.a');
    this.$labB   = this.shadowRoot.querySelector('.lab.b');
    this.$bar    = this.shadowRoot.querySelector('.bar');
    this.$btn    = this.shadowRoot.querySelector('button');
  }

  connectedCallback(){
    this.#sync();
    this.value = clamp(parseFloat(this.getAttribute('start') ?? '50'));

    this.$box.addEventListener('pointerdown', (e) => {
      this.#dragging = true;
      this.$box.setPointerCapture(e.pointerId);
      this.#fromX(e.clientX);
      e.preventDefault();
    });
    this.$box.addEventListener('pointermove', (e) => { if (this.#dragging) this.#fromX(e.clientX); });
    const stop = () => { this.#dragging = false; };
    this.$box.addEventListener('pointerup', stop);
    this.$box.addEventListener('pointercancel', stop);

    this.$box.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 10 : 2;
      const k = e.key;
      if (k === 'ArrowLeft')      this.value = this.#v - step;
      else if (k === 'ArrowRight')this.value = this.#v + step;
      else if (k === 'PageDown')  this.value = this.#v - 10;
      else if (k === 'PageUp')    this.value = this.#v + 10;
      else if (k === 'Home')      this.value = 0;
      else if (k === 'End')       this.value = 100;
      else return;
      e.preventDefault();
    });

    this.$btn.addEventListener('click', () => this.sweep());
  }

  disconnectedCallback(){ cancelAnimationFrame(this.#raf); }
  attributeChangedCallback(){ if (this.shadowRoot) this.#sync(); }

  get value(){ return this.#v; }
  set value(n){
    this.#v = clamp(parseFloat(n));
    this.$box.style.setProperty('--_p', this.#v.toFixed(2) + '%');
    this.$box.setAttribute('aria-valuenow', Math.round(this.#v));
    this.dispatchEvent(new CustomEvent('change', {detail:{value:this.#v}, bubbles:true}));
  }

  /** Animate from the current position out to the "after" side and back. */
  sweep({duration = 2600} = {}){
    if (matchMedia('(prefers-reduced-motion: reduce)').matches){
      this.value = this.#v > 50 ? 4 : 96;
      return Promise.resolve();
    }
    cancelAnimationFrame(this.#raf);
    return new Promise((resolve) => {
      let t0 = null;
      const step = (ts) => {
        if (t0 === null) t0 = ts;
        const k = Math.min(1, (ts - t0) / duration);
        const e = k < .5 ? 4*k*k*k : 1 - Math.pow(-2*k + 2, 3) / 2;
        this.value = e < .5 ? 50 + (e / .5) * 50 : 100 - ((e - .5) / .5) * 96;
        if (k < 1) this.#raf = requestAnimationFrame(step);
        else { this.value = 4; resolve(); }
      };
      this.#raf = requestAnimationFrame(step);
    });
  }

  #fromX(x){
    const r = this.$box.getBoundingClientRect();
    if (r.width) this.value = ((x - r.left) / r.width) * 100;
  }

  #sync(){
    const a = this.getAttribute('before') ?? '';
    const b = this.getAttribute('after')  ?? '';
    if (this.$before.getAttribute('src') !== a) this.$before.setAttribute('src', a);
    if (this.$after.getAttribute('src')  !== b) this.$after.setAttribute('src', b);
    for (const [el, ss] of [[this.$before,'before-srcset'], [this.$after,'after-srcset']]){
      const v = this.getAttribute(ss);
      if (v) el.setAttribute('srcset', v); else el.removeAttribute('srcset');
    }
    const sizes = this.getAttribute('sizes');
    for (const el of [this.$before, this.$after]){
      if (sizes) el.setAttribute('sizes', sizes); else el.removeAttribute('sizes');
    }
    const la = this.getAttribute('before-label') ?? '';
    const lb = this.getAttribute('after-label')  ?? '';
    this.$labA.textContent = la;
    this.$labB.textContent = lb;
    this.$before.alt = this.getAttribute('alt-before') ?? (la ? `Before: ${la}` : 'Before');
    this.$after.alt  = this.getAttribute('alt-after')  ?? (lb ? `After: ${lb}`  : 'After');
    this.$box.style.setProperty('--_ratio', this.getAttribute('ratio') || '1600/900');
    this.$box.setAttribute('aria-label',
      this.getAttribute('aria-label') || (la && lb ? `Compare ${la} with ${lb}` : 'Before and after comparison'));
    this.$bar.hidden = this.hasAttribute('no-sweep');
    this.$btn.textContent = this.getAttribute('sweep-label') || 'Sweep';
  }
}

if (!customElements.get('ktp-compare')) customElements.define('ktp-compare', KtpCompare);
export default KtpCompare;
