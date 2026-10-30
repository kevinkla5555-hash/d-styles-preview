/* D-Styles — motion.js: de premium laag (preloader, soepel scrollen, cursor, reveals, interacties).
   Alles respecteert "minder beweging" en werkt zonder dit bestand ook gewoon. */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const html = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- koptitel: woorden los zetten zodat ze kunnen opkomen ---------- */
  const title = $("#intro-title");
  if (title && !reduced) {
    title.innerHTML = title.textContent.trim().split(/\s+/).map(w => `<span class="w"><span>${w}</span></span>`).join(" ");
  }

  /* ---------- preloader: één keer per sessie, nooit langer dan 1,6 s ---------- */
  const loader = $("#loader");
  const start = performance.now();
  const ready = () => {
    if (loader) loader.classList.add("lift");
    html.classList.remove("loading"); html.classList.add("ready");
    try { sessionStorage.setItem("ds-seen", "1"); } catch (e) {}
    setTimeout(() => loader && loader.remove(), 1000);
  };
  if (html.classList.contains("loading")) {
    const minWait = 1100, maxWait = 1600;
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    const hero = $(".intro-art img");
    const heroReady = hero && !hero.complete ? new Promise(r => { hero.addEventListener("load", r, { once: true }); hero.addEventListener("error", r, { once: true }); }) : Promise.resolve();
    Promise.race([Promise.all([fontsReady, heroReady]), new Promise(r => setTimeout(r, maxWait))])
      .then(() => setTimeout(ready, Math.max(0, minWait - (performance.now() - start))));
  } else {
    if (loader) loader.remove();
    requestAnimationFrame(() => requestAnimationFrame(() => html.classList.add("ready")));
  }

  /* ---------- soepel scrollen (Lenis), niet bij "minder beweging" ---------- */
  let lenis = null;
  if (window.Lenis && !reduced && fine) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, anchors: { offset: -80 } });
    const loop = t => { lenis.raf(t); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    // dialogen en het menu: pagina achter stilzetten
    $$("dialog").forEach(d => { d.addEventListener("close", () => lenis.start()); });
    const mo = new MutationObserver(() => {
      const open = $$("dialog[open]").length || ($("#menu") && $("#menu").classList.contains("open"));
      open ? lenis.stop() : lenis.start();
    });
    $$("dialog").forEach(d => mo.observe(d, { attributes: true, attributeFilter: ["open"] }));
    if ($("#menu")) mo.observe($("#menu"), { attributes: true, attributeFilter: ["class"] });
  }

  /* ---------- header: verbergen bij omlaag scrollen, tonen bij omhoog ---------- */
  const header = $(".site-header"), menu = $("#menu");
  let lastY = scrollY;
  const headerTick = () => {
    const y = scrollY, menuOpen = menu && menu.classList.contains("open");
    header.classList.toggle("menu-open", !!menuOpen);
    if (!menuOpen) header.classList.toggle("hide", y > 140 && y > lastY + 4);
    if (y < lastY - 4) header.classList.remove("hide");
    lastY = y;
  };
  if (header) { addEventListener("scroll", headerTick, { passive: true }); if (menu) new MutationObserver(headerTick).observe(menu, { attributes: true, attributeFilter: ["class"] }); }

  /* ---------- custom cursor ---------- */
  const cur = $("#cursor");
  if (cur && fine && !reduced) {
    html.classList.add("has-cursor");
    const label = $(".cursor-label", cur);
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, raf = 0;
    const tick = () => {
      rx += (x - rx) * .22; ry += (y - ry) * .22;
      cur.style.transform = `translate(${rx}px, ${ry}px)`;
      raf = Math.abs(x - rx) + Math.abs(y - ry) > .2 ? requestAnimationFrame(tick) : 0;
    };
    addEventListener("pointermove", e => {
      x = e.clientX; y = e.clientY; if (!raf) raf = requestAnimationFrame(tick);
      const t = e.target.closest ? e.target : null;
      const lab = t && t.closest("[data-cursor]"), link = t && t.closest("a, button, summary, .swatch, label");
      const field = t && t.closest("input, textarea, select");
      cur.classList.toggle("label", !!lab); cur.classList.toggle("link", !lab && !!link); cur.classList.toggle("hide", !!field || (t && !!t.closest(".art-stage")));
      if (lab) label.textContent = lab.dataset.cursor;
    }, { passive: true });
    document.addEventListener("mouseleave", () => cur.classList.add("hide"));
    document.addEventListener("mouseenter", () => cur.classList.remove("hide"));
  }

  /* ---------- magnetische knoppen ---------- */
  if (fine && !reduced) $$(".btn").forEach(b => {
    b.addEventListener("pointermove", e => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px, ${(e.clientY - r.top - r.height / 2) * .3}px)`;
    });
    b.addEventListener("pointerleave", () => { b.style.transition = "transform .6s cubic-bezier(.2,.8,.2,1)"; b.style.transform = ""; setTimeout(() => b.style.transition = "", 600); });
  });

  /* ---------- reveals bij scrollen ---------- */
  const markReveals = () => {
    const sel = {
      img: ".pillar .img, .project .img, .about-img, .guide-card .img, .masonry button, .art-card .wall, .project-hero, .service img, .art-stage",
      text: ".section-head h2, .page-head h1, .statement blockquote, .prose h2, .contact-grid h2, .about-grid h2, .area-grid h2, .faq h2",
      fade: ".steps li, .ticks, .section-head .lead, .statement .cols p, .pillar h3, .pillar p, .project h2, .project h3, .project span, .art-card h2, .art-card h3, .art-card .meta, .guide-card h2, .guide-card h3, .guide-card p, .faq details, .factsheet div, .quote, .facts, .answer, .prose p, .prose table, .prose ul, .art-info > *, .gallery-foot, .p-list li",
      line: ".steps, .specs, .factsheet"
    };
    for (const [kind, s] of Object.entries(sel)) $$(s).forEach(el => { if (!el.hasAttribute("data-reveal") && !el.closest(".intro")) el.setAttribute("data-reveal", kind); });
    // trapsgewijs binnen een rij of raster
    $$(".project-grid, .art-grid, .steps, .guide-grid, .service-list, .pillars, .masonry, .factsheet, .specs, .p-list, .thumbs").forEach(grid => {
      [...grid.children].forEach((c, i) => $$("[data-reveal]", c).concat(c.hasAttribute("data-reveal") ? [c] : []).forEach(el => el.style.setProperty("--d", `${Math.min(i, 7) * 70}ms`)));
    });
  };
  markReveals();
  if ("IntersectionObserver" in window && !reduced) {
    const onIn = io => entries => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    const io = new IntersectionObserver((en, o) => onIn(o)(en), { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    const ioText = new IntersectionObserver((en, o) => onIn(o)(en), { rootMargin: "0px 0px -6% 0px", threshold: 0 });  // tekst is afgeknipt tot 1 px, dus drempel 0
    $$("[data-reveal], .wordmark").forEach(el => (el.dataset.reveal === "text" ? ioText : io).observe(el));
  } else {
    $$("[data-reveal], .wordmark").forEach(el => el.classList.add("in"));
  }

  /* ---------- 3D-tilt op kunstkaarten ---------- */
  if (fine && !reduced) $$(".art-card").forEach(card => {
    const wall = $(".wall", card), piece = $(".piece", card);
    if (!wall || !piece) return;
    card.addEventListener("pointermove", e => {
      const r = wall.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      piece.style.transform = `translateY(-6px) rotateX(${-py * 9}deg) rotateY(${px * 12}deg)`;
    });
    card.addEventListener("pointerleave", () => piece.style.transform = "");
  });

  /* ---------- loupe op de kunstwerkpagina: textuur van dichtbij ---------- */
  const stageBtn = $(".art-stage button"), stageImg = $("#art-stage-img");
  if (stageBtn && stageImg && fine && !reduced) {
    const loupe = document.createElement("div"); loupe.className = "loupe"; $(".art-stage").appendChild(loupe);
    const Z = 2.4, R = 100;
    const move = e => {
      const r = stageImg.getBoundingClientRect(), s = $(".art-stage").getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      loupe.classList.toggle("on", inside);
      if (!inside) return;
      const x = e.clientX - r.left, y = e.clientY - r.top;
      loupe.style.left = e.clientX - s.left - R + "px"; loupe.style.top = e.clientY - s.top - R + "px";
      loupe.style.backgroundImage = `url("${stageImg.currentSrc || stageImg.src}")`;
      loupe.style.backgroundSize = `${r.width * Z}px ${r.height * Z}px`;
      loupe.style.backgroundPosition = `${-(x * Z - R + 6)}px ${-(y * Z - R + 6)}px`;
    };
    $(".art-stage").addEventListener("pointermove", move);
    $(".art-stage").addEventListener("pointerleave", () => loupe.classList.remove("on"));
  }

  /* ---------- parallax op grote beelden ---------- */
  const px = $$("[data-parallax] img");
  if (px.length && !reduced) {
    const tick = () => {
      px.forEach(im => {
        const r = im.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        im.style.transform = `scale(1.15) translateY(${((r.top + r.height / 2) - innerHeight / 2) * -0.07}px)`;
      });
    };
    addEventListener("scroll", () => requestAnimationFrame(tick), { passive: true }); tick();
  }

  /* ---------- muur op ware grootte: slepen met de muis ---------- */
  $$(".true-wall").forEach(wall => {
    let down = null, moved = false;
    wall.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") return; down = { x: e.clientX, left: wall.scrollLeft }; moved = false; });
    wall.addEventListener("pointermove", e => {
      if (!down) return;
      const dx = e.clientX - down.x;
      if (Math.abs(dx) > 5) { moved = true; wall.classList.add("dragging"); }
      if (moved) wall.scrollLeft = down.left - dx;
    });
    const up = () => { down = null; setTimeout(() => wall.classList.remove("dragging"), 50); };
    wall.addEventListener("pointerup", up); wall.addEventListener("pointerleave", up);
    wall.addEventListener("click", e => { if (moved) { e.preventDefault(); moved = false; } }, true);
  });

  /* ---------- terug naar boven ---------- */
  const fb = $(".foot-bottom");
  if (fb) {
    const a = document.createElement("a"); a.className = "totop"; a.href = "#top"; a.textContent = "Naar boven";
    a.addEventListener("click", e => { e.preventDefault(); lenis ? lenis.scrollTo(0) : scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" }); });
    fb.appendChild(a);
  }
})();
