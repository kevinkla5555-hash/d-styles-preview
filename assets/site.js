/* D-Styles — site.js (geen externe libraries, geen cookies) */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Lokaal openen (file://): mappen-links naar index.html laten wijzen */
  if (location.protocol === "file:") {
    $$("a[href]").forEach(a => {
      const h = a.getAttribute("href");
      if (!/^(https?:|mailto:|tel:|#)/.test(h) && (h.endsWith("/") || h === "." || h === "..")) {
        a.setAttribute("href", h.replace(/\/?$/, "/") + "index.html");
      }
    });
  }

  /* Afbeelding die niet laadt: geen kapot icoon tonen */
  $$("img").forEach(img => img.addEventListener("error", () => img.classList.add("failed"), { once: true }));

  /* Header */
  const header = $(".site-header");
  const intro = $(".intro");
  const toggle = $(".menu-toggle"), menu = $("#menu");
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("scrolled", scrollY > 10);
    // Homepage: transparante header boven het openingsbeeld, daarna weer licht
    const pastIntro = !intro || scrollY > intro.offsetTop + intro.offsetHeight - header.offsetHeight;
    header.classList.toggle("solid", pastIntro || (menu && menu.classList.contains("open")));
  };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* Foto's rustig laten verschijnen zodra ze binnen zijn */
  $$('img[loading="lazy"]').forEach(img => {
    const done = () => img.classList.add("is-loaded");
    if (img.complete) done(); else { img.addEventListener("load", done, { once: true }); img.addEventListener("error", done, { once: true }); }
  });

  if (toggle && menu) {
    const set = open => { menu.classList.toggle("open", open); toggle.setAttribute("aria-expanded", open); toggle.textContent = open ? "Sluiten" : "Menu"; onScroll(); };
    toggle.addEventListener("click", () => set(!menu.classList.contains("open")));
    $$("a", menu).forEach(a => a.addEventListener("click", () => set(false)));
    addEventListener("keydown", e => { if (e.key === "Escape") set(false); });
  }

  /* Projecten filteren */
  const pf = $("[data-project-filters]");
  if (pf) {
    const items = $$(".project[data-cat]");
    $$("button", pf).forEach(b => b.addEventListener("click", () => {
      $$("button", pf).forEach(x => x.setAttribute("aria-pressed", x === b));
      items.forEach(p => p.hidden = b.dataset.filter !== "all" && p.dataset.cat !== b.dataset.filter);
    }));
  }

  /* Kunst: filteren, sorteren, weergave */
  const artGrid = $("#art-grid");
  if (artGrid) {
    const cards = $$(".art-card", artGrid);
    const state = { orient: "all", mat: "all", sort: "new" };
    const count = $("#art-count"), empty = $("#art-empty");
    const apply = () => {
      let shown = 0;
      cards.forEach(c => {
        const saleOnly = $("[data-sale-toggle]") && $("[data-sale-toggle]").getAttribute("aria-pressed") === "true";
        const ok = (state.orient === "all" || c.dataset.orient === state.orient) && (state.mat === "all" || c.dataset.mat === state.mat) && (!saleOnly || c.dataset.sale === "1");
        c.hidden = !ok; if (ok) shown++;
      });
      const by = { new: (a, b) => b.dataset.year - a.dataset.year || a.dataset.i - b.dataset.i,
                   low: (a, b) => a.dataset.price - b.dataset.price,
                   high: (a, b) => b.dataset.price - a.dataset.price,
                   big: (a, b) => b.dataset.area - a.dataset.area };
      cards.slice().sort(by[state.sort]).forEach(c => artGrid.appendChild(c));
      if (count) count.textContent = shown === 1 ? "1 werk" : `${shown} werken`;
      if (empty) empty.hidden = shown > 0;
    };
    $$("[data-orient]", $("#art-filters")).forEach(b => b.addEventListener("click", () => {
      $$("[data-orient]", $("#art-filters")).forEach(x => x.setAttribute("aria-pressed", x === b));
      state.orient = b.dataset.orient; apply();
    }));
    const mat = $("#art-mat"), sort = $("#art-sort");
    mat && mat.addEventListener("change", () => { state.mat = mat.value; apply(); });
    sort && sort.addEventListener("change", () => { state.sort = sort.value; apply(); });
    document.addEventListener("art-filter", apply);
    apply();

    const sw = $("[data-view-switch]");
    if (sw) $$("button", sw).forEach(b => b.addEventListener("click", () => {
      $$("button", sw).forEach(x => x.setAttribute("aria-pressed", x === b));
      const wall = b.dataset.view === "wall";
      $("#view-grid").hidden = wall; $("#view-wall").hidden = !wall;
      if (wall) layoutWalls();
    }));
  }

  /* Muur op ware grootte: werken centraal op 145 cm, bank als referentie */
  const CENTER = 115, WALL = 262;
  function layoutWalls() {
    $$(".true-wall").forEach(wall => {
      const c = parseFloat(getComputedStyle(wall).getPropertyValue("--cm")) || 1.9;
      $$(".work", wall).forEach(el => {
        const W = +el.dataset.w, H = +el.dataset.h;
        const frame = $(".frame", el), label = $(".label", el);
        el.style.width = W * c + "px";
        frame.style.width = W * c + "px"; frame.style.height = H * c + "px";
        frame.style.top = (CENTER - H / 2) * c + "px";
        label.style.top = (CENTER + H / 2) * c + 14 + "px";
      });
      const ref = $(".scale-ref", wall);
      if (ref) {
        const svg = $("svg", ref);
        ref.style.width = 200 * c + "px"; svg.style.width = 200 * c + "px"; svg.style.height = 80 * c + "px";
        $(".label", ref).style.top = (WALL - 80) * c - 26 + "px";
      }
    });
  }
  layoutWalls();
  addEventListener("resize", layoutWalls);
  $$("[data-wall-dir]").forEach(b => b.addEventListener("click", () => {
    const wall = $("#" + b.dataset.target);
    wall.scrollBy({ left: +b.dataset.wallDir * wall.clientWidth * .7, behavior: reduced ? "auto" : "smooth" });
  }));

  /* Kunstwerkpagina: miniaturen */
  const stage = $("#art-stage-img");
  $$(".thumbs button").forEach(t => t.addEventListener("click", () => {
    $$(".thumbs button").forEach(x => x.setAttribute("aria-current", x === t));
    stage.src = t.dataset.src; stage.alt = t.dataset.alt;
    stage.closest("button").dataset.index = t.dataset.index;
  }));

  /* Lightbox */
  const lb = $("#lightbox");
  if (lb) {
    const img = $("img", lb);
    let group = [], idx = 0;
    const show = i => { idx = (i + group.length) % group.length; img.src = group[idx].src; img.alt = group[idx].alt; };
    $$("[data-lightbox]").forEach(btn => btn.addEventListener("click", () => {
      const name = btn.dataset.lightbox;
      group = JSON.parse($(`script[data-gallery="${name}"]`).textContent);
      show(+btn.dataset.index || 0);
      lb.showModal();
    }));
    $(".close", lb).addEventListener("click", () => lb.close());
    $(".prev", lb).addEventListener("click", () => show(idx - 1));
    $(".next", lb).addEventListener("click", () => show(idx + 1));
    lb.addEventListener("click", e => { if (e.target === lb || e.target.tagName === "FIGURE") lb.close(); });
    lb.addEventListener("keydown", e => { if (e.key === "ArrowLeft") show(idx - 1); if (e.key === "ArrowRight") show(idx + 1); });
  }

  /* Projecten: raster of lijst, met meebewegende foto bij de lijst */
  const pv = $("[data-project-view]");
  if (pv) {
    const grid = $("#p-grid"), list = $("#p-list"), float = $("#p-float");
    $$("button", pv).forEach(b => b.addEventListener("click", () => {
      $$("button", pv).forEach(x => x.setAttribute("aria-pressed", x === b));
      const asList = b.dataset.view === "list";
      grid.hidden = asList; list.hidden = !asList;
    }));
    if (float && matchMedia("(hover: hover) and (min-width: 761px)").matches) {
      let x = 0, y = 0, cx = 0, cy = 0, raf = 0;
      const loop = () => {
        cx += (x - cx) * (reduced ? 1 : .18); cy += (y - cy) * (reduced ? 1 : .18);
        float.style.transform = `translate(${cx + 28}px, ${cy - float.offsetHeight / 2}px)`;
        raf = Math.abs(x - cx) + Math.abs(y - cy) > .5 ? requestAnimationFrame(loop) : 0;
      };
      $$("a", list).forEach(a => {
        a.addEventListener("mouseenter", () => { float.src = a.dataset.img; float.classList.add("on"); });
        a.addEventListener("mouseleave", () => float.classList.remove("on"));
      });
      list.addEventListener("mousemove", e => { x = e.clientX; y = e.clientY; if (!raf) raf = requestAnimationFrame(loop); });
    }
  }

  /* Kunstwerk aan de wand: voorbeeldkamer met wandkleuren, of eigen foto op ware grootte */
  const viz = $(".viz");
  if (viz) {
    const tabs = $$('[role="tab"]', viz);
    tabs.forEach(tab => tab.addEventListener("click", () => {
      tabs.forEach(t => { const on = t === tab; t.setAttribute("aria-selected", on); $("#" + t.getAttribute("aria-controls")).hidden = !on; });
    }));
    const room = $(".room", viz);
    $$(".swatch", viz).forEach(s => s.addEventListener("click", () => {
      $$(".swatch", viz).forEach(x => x.setAttribute("aria-pressed", x === s));
      room.style.setProperty("--wall", s.dataset.wall); room.style.setProperty("--line-c", s.dataset.line);
    }));
    const file = $("#own-file"), photo = $("#own-photo"), piece = $("#own-piece"), cm = $("#own-cm");
    const W = +viz.dataset.w;
    const scale = () => { const wall = Math.max(80, +cm.value || 400); piece.style.width = Math.min(100, W / wall * 100) + "%"; };
    cm.addEventListener("input", scale); scale();
    file.addEventListener("change", () => {
      const f = file.files && file.files[0]; if (!f) return;
      const bg = $(".own-bg", photo); bg.src = URL.createObjectURL(f); photo.hidden = false;
    });
    // slepen met muis, vinger of pijltjestoetsen
    let drag = null;
    piece.addEventListener("pointerdown", e => {
      const r = photo.getBoundingClientRect(), p = piece.getBoundingClientRect();
      drag = { ox: e.clientX - p.left, oy: e.clientY - p.top, r }; piece.setPointerCapture(e.pointerId);
    });
    piece.addEventListener("pointermove", e => {
      if (!drag) return;
      const { r, ox, oy } = drag;
      piece.style.left = Math.max(0, Math.min(r.width - piece.offsetWidth, e.clientX - r.left - ox)) / r.width * 100 + "%";
      piece.style.top = Math.max(0, Math.min(r.height - piece.offsetHeight, e.clientY - r.top - oy)) / r.height * 100 + "%";
    });
    piece.addEventListener("pointerup", () => drag = null);
    piece.addEventListener("keydown", e => {
      const step = e.shiftKey ? 5 : 1, k = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      if (!k) return; e.preventDefault();
      piece.style.left = (parseFloat(piece.style.left) || 35) + k[0] + "%"; piece.style.top = (parseFloat(piece.style.top) || 22) + k[1] + "%";
    });
  }

  /* Contactformulier: opent een ingevulde e-mail (geen server of cookies nodig) */
  const form = $("#contact-form");
  if (form) form.addEventListener("submit", e => {
    e.preventDefault();
    const f = new FormData(form);
    const subject = `${f.get("onderwerp")} – ${f.get("naam")}`;
    const body = `Naam: ${f.get("naam")}\nTelefoon: ${f.get("telefoon") || "-"}\nOnderwerp: ${f.get("onderwerp")}\n\n${f.get("bericht")}`;
    location.href = `mailto:info@d-styles.nl?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
})();

/* ---------- verkoop ---------- */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* Tweede beeld van een kunstwerk pas laden bij de eerste hover (scheelt data) */
  $$(".art-card").forEach(card => card.addEventListener("pointerenter", () => {
    const h = $("img.hover[data-src]", card);
    if (h && !h.getAttribute("src")) h.src = h.dataset.src;
  }, { once: true }));

  /* Filter: werken in de aanbieding */
  const saleBtn = $("[data-sale-toggle]");
  if (saleBtn) saleBtn.addEventListener("click", () => {
    const on = saleBtn.getAttribute("aria-pressed") !== "true";
    saleBtn.setAttribute("aria-pressed", on);
    document.dispatchEvent(new CustomEvent("art-filter"));
  });

  /* Vaste koopbalk zodra de koopknoppen uit beeld zijn */
  const bar = $("#buybar"), actions = $(".art-info .actions");
  if (bar && actions && "IntersectionObserver" in window) {
    let past = false, nearFoot = false;
    const update = () => { const on = past && !nearFoot; bar.classList.toggle("on", on); bar.setAttribute("aria-hidden", !on); $("a", bar).tabIndex = on ? 0 : -1; };
    new IntersectionObserver(([en]) => { past = !en.isIntersecting && en.boundingClientRect.top < 0; update(); }).observe(actions);
    new IntersectionObserver(([en]) => { nearFoot = en.isIntersecting; update(); }).observe($("footer"));
  }
})();
