/* Contextual contact shortcut: no timer tied to video duration. */
(() => {
  const links = document.querySelectorAll('.lm-whatsapp');
  if (!links.length) return;
  let frame = 0;
  function update() {
    frame = 0;
    const page = document.querySelector('#dc-root [data-whatsapp-screen]');
    const screen = page?.getAttribute('data-whatsapp-screen');
    const hero = page?.querySelector('.lm-hero-stage')?.closest('section');
    const footer = page?.querySelector('footer');
    const inHero = screen === 'Home' && (!hero || hero.getBoundingClientRect().bottom > 72);
    const inFooter = footer && footer.getBoundingClientRect().top < window.innerHeight;
    const show = ['Home', 'About', 'Projects'].includes(screen)
      && page.getAttribute('data-whatsapp-menu') !== 'true'
      && !inHero && !inFooter;
    links.forEach(link => { link.hidden = !show; });
  }
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule, {passive:true});
  // React mounts and changes screens after boot. Ignore animation style changes.
  new MutationObserver(schedule).observe(document.body, {
    subtree:true, childList:true, attributes:true,
    attributeFilter:['data-whatsapp-screen','data-whatsapp-menu']
  });
  update();
})();
