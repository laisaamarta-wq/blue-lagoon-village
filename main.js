/* Blue Lagoon Village — a calm motion language.
   Native scroll, no smooth-scroll library. Three scroll-driven moments carry the journey (the approach, the descent,
   the water sequence); everything else arrives with a slow dissolve or a line lifting out of its mask, once. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrow = () => innerWidth <= 900;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- hero film: the right size for the screen ---------- */
  // best codec the browser can decode: AV1, then HEVC, then H.264 — same picture, smallest file
  const heroVideo = $('[data-hero-video]');
  const can = t => { try { return !!document.createElement('video').canPlayType(t).replace('no', ''); } catch (e) { return false; } };
  const AV1 = can('video/mp4; codecs="av01.0.08M.08"'), HEVC = can('video/mp4; codecs="hvc1.1.6.L120.90"');
  const pick = (d, sm) => {
    const k = sm ? 'srcSm' : 'srcLg', a = sm ? 'srcSmAv1' : 'srcAv1', h = sm ? 'srcSmHevc' : 'srcHevc';
    return (AV1 && d[a]) || (HEVC && d[h]) || d[k];
  };
  if (narrow() && heroVideo.dataset.posterSm) heroVideo.poster = heroVideo.dataset.posterSm;
  heroVideo.src = pick(heroVideo.dataset, narrow());
  heroVideo.play().catch(() => {});
  new IntersectionObserver(([e]) => { e.isIntersecting ? heroVideo.play().catch(() => {}) : heroVideo.pause(); }).observe(heroVideo);

  /* ---------- other films load and play only near the viewport ---------- */
  // narrow screens get their own crop (and poster) where one exists
  if (narrow()) $$('video[data-poster-sm]').forEach(v => { if (v !== heroVideo) v.poster = v.dataset.posterSm; });
  const srcFor = v => (narrow() && v.dataset.srcSm) ? v.dataset.srcSm : v.dataset.src;
  const vio = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) {
      if (!v.src && v.dataset.src) v.src = srcFor(v);
      v.play().catch(() => {});
    } else v.pause();
  }), { rootMargin: '400px 0px' });
  $$('video[data-src]').forEach(v => { if (!v.closest('[data-descend]')) vio.observe(v); });

  /* ---------- navigation ---------- */
  const nav = $('[data-nav]'), menu = $('[data-menu]'), menuBtn = $('[data-menu-btn]'), hero = $('[data-hero]');
  let pastHero = false;
  const syncNav = () => nav.classList.toggle('is-solid', pastHero || !menu.hidden);
  new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting; syncNav(); }, { rootMargin: '-80px 0px 0px 0px' }).observe(hero);
  menuBtn.addEventListener('click', () => {
    const open = menu.hidden;
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? 'Close' : 'Menu';
    document.documentElement.style.overflow = open ? 'hidden' : '';
    syncNav();
  });
  $$('a', menu).forEach(a => a.addEventListener('click', () => menuBtn.click()));

  // active section indicator
  const navMap = { stay: $('#stay'), water: $('#water'), retreat: $('#retreat'), place: $('#place'), contact: $('#contact') };
  const navLinks = $$('[data-nav-link]');
  const aio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const key = Object.keys(navMap).find(k => navMap[k] === e.target);
    navLinks.forEach(a => a.classList.toggle('is-active', a.dataset.navLink === key));
  }), { rootMargin: '-45% 0px -45% 0px' });
  Object.values(navMap).forEach(el => el && aio.observe(el));

  if (!hasGsap || reduced) {
    // still useful without motion: chapters update, films play, rooms and booking work
    document.body.classList.remove('is-loading');
    setupDescendStill(); setupWaterNative(); setupRooms(); setupBooking();
    return;
  }

  /* =========================================================
     MOTION
     ========================================================= */
  const E_OUT = 'power3.out', E_IO = 'power3.inOut';
  gsap.defaults({ ease: E_OUT, duration: 1.1 });

  /* ---------- 01 · arrival: the film fades up, the words follow ---------- */
  document.body.classList.remove('is-loading');
  const heroLines = $$('.hero__title .line > span');
  gsap.timeline({ defaults: { ease: 'power2.out' } })
    .fromTo('[data-hero-media]', { opacity: 0 }, { opacity: 1, duration: 1.6 }, 0)
    .fromTo(heroLines, { yPercent: 104 }, { yPercent: 0, duration: 1.2, stagger: .1, ease: 'expo.out' }, .35)
    .fromTo('[data-hero-fade]', { opacity: 0 }, { opacity: 1, duration: 1.2, stagger: .12 }, .6)
    .fromTo(nav, { opacity: 0 }, { opacity: 1, duration: 1 }, .5);

  // leaving the hero: only the words dissolve; the film stays put
  gsap.to('.hero__inner', { opacity: 0, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '45% top', scrub: true } });

  /* ---------- reveals: lines lift once, pictures dissolve in ---------- */
  const below = el => el.getBoundingClientRect().top > innerHeight * .92;
  $$('[data-lines]').forEach(h => {
    const parts = h.innerHTML.split(/<br\s*\/?>/i);
    h.innerHTML = parts.map(p => `<span class="line"><span>${p}</span></span>`).join('');
    if (!below(h)) return;
    gsap.from($$('.line > span', h), { yPercent: 104, duration: 1.2, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%' } });
  });
  $$('[data-fade]').forEach(el => {
    if (!below(el)) return;
    gsap.from(el, { opacity: 0, y: 10, duration: 1, scrollTrigger: { trigger: el, start: 'top 92%' } });
  });
  $$('[data-tide]').forEach(m => {
    if (!below(m)) return;
    const inner = m.querySelector('img,video');
    gsap.timeline({ scrollTrigger: { trigger: m, start: 'top 90%' } })
      .from(m, { opacity: 0, duration: 1.4, ease: 'power2.out' }, 0)
      .from(inner, { scale: 1.035, duration: 2, ease: 'power2.out' }, 0);
  });

  /* ---------- 02 · approach: the view widens as you come closer ---------- */
  const approach = $('[data-approach]');
  gsap.fromTo('[data-approach-frame]', { '--ci': '13%', '--cs': 1.16 }, { '--ci': '0%', '--cs': 1, ease: 'none',
    scrollTrigger: { trigger: '[data-approach-frame]', start: 'top bottom', end: 'top 16%', scrub: true } });

  /* ---------- 03 · descend: one continuous move, hillside → lagoon → water ---------- */
  const descend = $('[data-descend]');
  const layers = $$('[data-d-layer]', descend);
  const dv = layers.map(l => $('video', l));
  const words = $$('[data-d-word]', descend);
  const steps = $$('[data-d-step]', descend);
  let dNear = false, dP = 0;
  // only the layers you can actually see are decoding
  const dWindows = [[-1, .56], [.16, .9], [.56, 2]];
  const syncDescendVideos = () => dv.forEach((v, i) => {
    const on = dNear && dP >= dWindows[i][0] && dP <= dWindows[i][1];
    if (on) { if (!v.src) v.src = srcFor(v); if (v.paused) v.play().catch(() => {}); }
    else if (!v.paused) v.pause();
  });
  new IntersectionObserver(([e]) => {
    dNear = e.isIntersecting;
    if (dNear) dv.forEach(v => { if (!v.src) { v.preload = 'auto'; v.src = srcFor(v); } });
    syncDescendVideos();
  }, { rootMargin: '600px 0px' }).observe(descend);
  const setStep = n => steps.forEach((s, k) => s.classList.toggle('is-on', k === n));
  gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: descend, start: 'top top', end: 'bottom bottom', scrub: .9, invalidateOnRefresh: true,
      onUpdate: s => { dP = s.progress; setStep(dP < .37 ? 0 : dP < .7 ? 1 : 2); syncDescendVideos(); } } })
    // hillside: the camera leans in
    .fromTo(dv[0], { scale: 1 }, { scale: 1.12, duration: .52, ease: 'sine.inOut' }, 0)
    .to(words[0], { opacity: 0, y: -14, duration: .12, ease: 'sine.inOut' }, .2)
    // the lagoon rises into the frame from below through a soft edge, as if the camera tilts down the slope
    .fromTo(layers[1], { y: () => layers[1].offsetHeight }, { y: 0, duration: .3, ease: 'sine.inOut' }, .22)
    .fromTo('[data-d-in]', { y: () => -layers[1].offsetHeight }, { y: 0, duration: .3, ease: 'sine.inOut' }, .22)
    .to(dv[0], { yPercent: -10, duration: .3, ease: 'sine.inOut' }, .22)
    .fromTo(dv[1], { scale: 1.22, yPercent: 6 }, { scale: 1.04, yPercent: 0, duration: .32, ease: 'sine.out' }, .22)
    .fromTo(words[1], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .12, ease: 'sine.inOut' }, .36)
    // and down into it: the lagoon keeps coming closer until it becomes the water
    .to(dv[1], { scale: 1.75, duration: .32, ease: 'sine.in' }, .54)
    .to(words[1], { opacity: 0, y: -14, duration: .1, ease: 'sine.inOut' }, .6)
    .fromTo(layers[2], { opacity: 0 }, { opacity: 1, duration: .22, ease: 'sine.inOut' }, .64)
    .fromTo(dv[2], { scale: 1.3 }, { scale: 1, duration: .28, ease: 'sine.out' }, .64)
    .fromTo(words[2], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .12, ease: 'sine.inOut' }, .74)
    .to(dv[2], { scale: 1.05, duration: .08 }, .92)
    .to('[data-d-deep]', { opacity: .5, duration: .12, ease: 'sine.in' }, .88);

  /* ---------- 04 · the water: a horizontal sequence (vertical scroll drives it) ---------- */
  const water = $('[data-water]'), track = $('[data-water-track]'), wBar = $('[data-water-bar]'), wN = $('[data-water-n]');
  const wFigs = $$('figure.w-panel', track);
  const setWN = () => {
    const c = innerWidth * .5; let best = 0, bd = 1e9;
    wFigs.forEach((f, i) => { const r = f.getBoundingClientRect(); const d = Math.abs(r.left + r.width / 2 - c); if (d < bd) { bd = d; best = i; } });
    wN.textContent = String(best + 1).padStart(2, '0');
  };
  {
    const dist = () => track.scrollWidth - innerWidth;
    const size = () => { water.style.height = `${dist() * (narrow() ? 1.35 : 1.15) + innerHeight}px`; };
    size();
    const tween = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: water, start: 'top top', end: 'bottom bottom', scrub: .6, invalidateOnRefresh: true, onRefreshInit: size,
      onUpdate: s => { wBar.style.transform = `scaleX(${s.progress})`; setWN(); } } });
    // each picture drifts slightly against the movement
    $$('.media > img, .media > video', track).forEach(m => {
      gsap.fromTo(m, { xPercent: 3.5 }, { xPercent: -3.5, ease: 'none', scrollTrigger: { trigger: m.closest('.w-panel'), containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
    });
    // the intro lifts away as the sequence begins
    gsap.to('.w-intro', { opacity: .25, ease: 'none', scrollTrigger: { trigger: '.w-intro', containerAnimation: tween, start: 'center 30%', end: 'right left', scrub: true } });
  }

  /* ---------- 05 · villas: the film settles as it arrives ---------- */
  gsap.fromTo('.villas__media', { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '[data-villas]', start: 'top bottom', end: 'center center', scrub: true } });
  gsap.to('.villas__copy', { yPercent: -24, ease: 'none', scrollTrigger: { trigger: '[data-villas]', start: 'top top', end: 'bottom top', scrub: true } });

  /* ---------- 06 · morning: the window opens; the small view drifts at its own pace ---------- */
  gsap.fromTo('[data-morning-glass]', { '--sh': '17%', '--ms': 1.14 }, { '--sh': '0%', '--ms': 1, ease: 'none',
    scrollTrigger: { trigger: '[data-morning]', start: 'top 85%', end: 'top 5%', scrub: true } });
  if (!narrow()) gsap.fromTo('[data-morning-detail]', { yPercent: 22 }, { yPercent: -16, ease: 'none',
    scrollTrigger: { trigger: '[data-morning]', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* ---------- 07 · retreat: the film comes to rest, then the words arrive over it ---------- */
  gsap.fromTo('[data-retreat-media]', { scale: 1.14 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '[data-retreat]', start: 'top bottom', end: 'top top', scrub: true } });

  /* ---------- gazipaşa: the lagoon moves slowly inside the letters ---------- */
  const word = $('[data-place-word]');
  gsap.fromTo(word, { '--bp': '25%' }, { '--bp': '65%', ease: 'none', scrollTrigger: { trigger: word, start: 'top bottom', end: 'bottom top', scrub: true } });

  /* ---------- 08 · finale: the lagoon opens out, slowly ---------- */
  gsap.fromTo('[data-finale-media]', { scale: 1.06 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '[data-finale]', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  setupRooms();
  setupBooking();
  addEventListener('load', () => ScrollTrigger.refresh());

  /* =========================================================
     ROOMS — explorer + immersive detail
     ========================================================= */
  function setupRooms() {
    const ROOMS = [
      { name: 'Romantic Double Room', specs: [['Size', '30 m²'], ['Guests', '2'], ['Bed', 'Queen'], ['Bath', 'Whirlpool tub'], ['View', 'Sea']],
        views: [['The room', 'romantic-room', '58% 50%'], ['The pool at dusk', 'pool-sunset', '50% 55%'], ['The cove below', 'lagoon-stairs', '40% 50%']] },
      { name: 'Villa · Garden · Sea View', specs: [['Size', 'about 105 m²'], ['Bedrooms', '2'], ['Guests', 'up to 5'], ['Outside', 'Garden, sea view'], ['Kitchen', 'Kitchenette']],
        views: [['The room', 'room-sea-wide', '60% 50%'], ['Second bedroom', 'twin-room', '50% 50%'], ['The garden', 'villa-garden', '70% 50%']] },
      { name: 'Villa · Terrace · Sea View', specs: [['Size', 'about 135 m²'], ['Bedrooms', '3'], ['Guests', 'up to 6'], ['Outside', 'Terrace, sea view'], ['Kitchen', 'Kitchenette']],
        views: [['The room', 'room-terrace-view', '30% 50%'], ['The terrace', 'room-view', '60% 50%'], ['The sea', 'pool-sea', '50% 60%']] },
    ];
    const stage = $('[data-stage]'), stageImgs = $$('[data-stage-img]'), stageN = $('[data-stage-n]');
    const peek = $('[data-peek-img]');
    // decode every room picture up front, so switching rooms never waits on an image
    const warm = () => stageImgs.forEach(im => { if (im.decode) im.decode().catch(() => {}); });
    if ('requestIdleCallback' in window) requestIdleCallback(warm, { timeout: 2500 }); else setTimeout(warm, 1200);
    ROOMS.forEach(r => { const im = new Image(); im.src = `assets/img/${r.views[1][1]}-960.webp`; });
    let active = 0;
    const setActive = i => {
      if (i === active) return; active = i;
      stageImgs.forEach((im, k) => im.classList.toggle('is-on', k === i));
      stageN.textContent = String(i + 1).padStart(2, '0');
      $$('[data-tick]').forEach((t, k) => t.classList.toggle('is-on', k === i));
    };
    const rooms = $$('.room');
    if (hasGsap && !reduced) {
      rooms.forEach((li, i) => ScrollTrigger.create({ trigger: li, start: 'top 50%', end: 'bottom 50%', onToggle: s => s.isActive && setActive(i) }));
    } else {
      const rio = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && setActive(+e.target.dataset.room)), { rootMargin: '-45% 0px -45% 0px' });
      rooms.forEach(li => rio.observe(li));
    }
    // hover: the stage shows the view from this room
    rooms.forEach((li, i) => {
      li.addEventListener('pointerenter', () => {
        const v = ROOMS[i].views[1];
        peek.src = `assets/img/${v[1]}-960.webp`;
        stage.classList.add('is-peek');
      });
      li.addEventListener('pointerleave', () => stage.classList.remove('is-peek'));
    });

    // immersive detail
    const detail = $('[data-detail]'), slides = $('[data-detail-slides]');
    let cur = 0, room = 0, timer = 0, lastFocus = null;
    function show(n) {
      const imgs = $$('img', slides);
      cur = (n + imgs.length) % imgs.length;
      imgs.forEach((im, k) => im.classList.toggle('is-on', k === cur));
      $('[data-detail-n]').textContent = String(cur + 1).padStart(2, '0');
      $('[data-detail-label]').textContent = ROOMS[room].views[cur][0];
      clearTimeout(timer);
      if (!reduced) timer = setTimeout(() => show(cur + 1), 5200);
    }
    function open(i, opener) {
      room = i; lastFocus = opener;
      const r = ROOMS[i];
      slides.innerHTML = r.views.map(([label, base, pos]) => `<img src="assets/img/${base}.webp" srcset="assets/img/${base}-960.webp 960w, assets/img/${base}.webp 1600w" sizes="100vw" alt="${label}" style="object-position:${pos}">`).join('');
      $('[data-detail-num]').textContent = String(i + 1).padStart(2, '0');
      $('[data-detail-name]').textContent = r.name;
      $('[data-detail-total]').textContent = String(r.views.length).padStart(2, '0');
      $('[data-detail-specs]').innerHTML = r.specs.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
      detail.hidden = false; document.documentElement.style.overflow = 'hidden';
      requestAnimationFrame(() => requestAnimationFrame(() => { detail.classList.add('is-open'); show(0); }));
      $('[data-detail-close]').focus({ preventScroll: true, focusVisible: false });
    }
    function close() {
      clearTimeout(timer);
      detail.classList.remove('is-open'); document.documentElement.style.overflow = '';
      setTimeout(() => { detail.hidden = true; slides.innerHTML = ''; }, 600);
      lastFocus && lastFocus.focus({ preventScroll: true });
    }
    $$('[data-explore]').forEach(b => b.addEventListener('click', () => open(+b.dataset.explore, b)));
    stage.addEventListener('click', () => open(active, $(`[data-explore="${active}"]`)));
    stage.style.cursor = 'pointer';
    $('[data-detail-close]').addEventListener('click', close);
    $('[data-detail-next]').addEventListener('click', () => show(cur + 1));
    $('[data-detail-prev]').addEventListener('click', () => show(cur - 1));
    $('[data-detail-ask]').addEventListener('click', () => { close(); window.__openBook({ room: ROOMS[room].name }); });
    let sx = 0;
    slides.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    slides.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1)); });
    addEventListener('keydown', e => {
      if (detail.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') show(cur + 1);
      if (e.key === 'ArrowLeft') show(cur - 1);
    });
  }

  /* =========================================================
     BOOKING
     ========================================================= */
  function setupBooking() {
    const book = $('[data-book-panel]'), form = $('[data-book-form]'), done = $('[data-book-done]'), err = $('[data-form-err]');
    let lastFocus = null;
    function openBook(prefill = {}) {
      lastFocus = document.activeElement;
      if (!menu.hidden) menuBtn.click();
      form.hidden = false; done.hidden = true; err.textContent = '';
      Object.entries(prefill).forEach(([k, v]) => { if (v && form.elements[k]) form.elements[k].value = v; });
      if (window.__syncDates) window.__syncDates();
      book.hidden = false; document.documentElement.style.overflow = 'hidden';
      requestAnimationFrame(() => requestAnimationFrame(() => book.classList.add('is-open')));
      $('.book__x', book).focus({ preventScroll: true, focusVisible: false });
    }
    function closeBook() {
      book.classList.remove('is-open'); document.documentElement.style.overflow = '';
      setTimeout(() => { book.hidden = true; }, 800);
      lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
    }
    window.__openBook = openBook;
    $$('[data-book]').forEach(b => b.addEventListener('click', () => openBook()));
    $$('[data-book-close]').forEach(b => b.addEventListener('click', closeBook));
    $('[data-quickbook]').addEventListener('submit', e => {
      e.preventDefault();
      const f = e.target.elements;
      openBook({ in: f.in.value, out: f.out.value, guests: f.guests.value });
    });
    const today = new Date().toISOString().slice(0, 10);
    $$('input[type="date"]').forEach(i => i.min = today);

    // date fields: an obvious tap target with a calendar icon and a readable date,
    // because an empty native date input shows nothing at all on iPhone
    const ICON = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="1.5" y="2.8" width="13" height="11.7" rx="1"/><path d="M1.5 6.3h13M5 1.2v3M11 1.2v3"/></svg>';
    const fmtDate = v => new Date(v + 'T12:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const dateFields = $$('input[type="date"]').map(input => {
      const box = document.createElement('span');
      box.className = 'dfield';
      input.replaceWith(box);
      box.append(input);
      box.insertAdjacentHTML('beforeend', '<span class="dfield__txt"></span>' + ICON);
      const txt = $('.dfield__txt', box);
      const sync = () => { txt.textContent = input.value ? fmtDate(input.value) : 'Select date'; box.classList.toggle('is-empty', !input.value); };
      input.addEventListener('input', sync); input.addEventListener('change', sync);
      box.addEventListener('click', e => { if (e.target !== input && input.showPicker) { try { input.showPicker(); } catch (err) { input.focus(); } } });
      input.addEventListener('click', () => { if (input.showPicker) { try { input.showPicker(); } catch (err) {} } });
      sync();
      return { input, sync };
    });
    window.__syncDates = () => dateFields.forEach(d => d.sync());
    // leaving can't come before arriving
    [['q-in', 'q-out'], ['book-in', 'book-out']].forEach(([a, b]) => {
      const i = document.getElementById(a), o = document.getElementById(b);
      if (!i || !o) return;
      i.addEventListener('change', () => { o.min = i.value || today; if (o.value && o.value <= i.value) { o.value = ''; window.__syncDates(); } });
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const f = form.elements;
      if (!f.in.value || !f.out.value) { err.textContent = 'Add your arrival and departure dates.'; return; }
      if (f.out.value <= f.in.value) { err.textContent = 'Your departure date needs to be after your arrival.'; return; }
      if (!f.name.value.trim()) { err.textContent = 'Add your name so we know who to write to.'; return; }
      if (!/^\S+@\S+\.\S+$/.test(f.email.value)) { err.textContent = 'Add an email address we can reply to.'; return; }
      const fmt = d => new Date(d + 'T12:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
      const nights = Math.round((new Date(f.out.value) - new Date(f.in.value)) / 864e5);
      $('[data-book-summary]').textContent = `${f.room.value}, ${fmt(f.in.value)} to ${fmt(f.out.value)} (${nights} night${nights > 1 ? 's' : ''}), ${f.guests.value} guest${f.guests.value > 1 ? 's' : ''}.`;
      form.hidden = true; done.hidden = false;
    });
    addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      if (!book.hidden) closeBook();
      else if (!menu.hidden) menuBtn.click();
    });
  }

  /* without scroll-driven motion: the descent is one still frame, the water scrolls sideways by hand */
  function setupDescendStill() {
    const v = $('[data-d-layer="0"] video');
    if (v) { v.src = srcFor(v); vio.observe(v); }
  }
  function setupWaterNative() {
    const t = $('[data-water-track]'), st = $('[data-water-stage]');
    t.style.overflowX = 'auto'; t.style.width = 'auto'; t.style.scrollSnapType = 'x mandatory';
    $('[data-water]').style.height = 'auto';
    st.style.position = 'relative'; st.style.height = 'auto'; st.style.paddingBlock = '12vh';
  }
})();
