(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* Scroll reveals */
  var reveals = document.querySelectorAll("[data-r]");
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* 3D modeled living room for the title page (CSS 3D boxes, no libraries) */
  var room = document.getElementById("room3d");
  var rstage = room && room.querySelector(".room3d__stage");
  var yaw = -28, pitch = -15, yawT = -28, rdrag = false, rlast = 0;
  if (rstage) {
    var W = 600, H = 300, D = 460;
    var sh = [0.86, 1, 0.9, 0.8, 1.08, 0.7];
    var box = function (x, y, z, w, h, d, c, faces, radius) {
      var el = document.createElement("div"); el.className = "bx";
      el.style.transform = "translate3d(" + (x - W / 2) + "px," + (H / 2 - y - h) + "px," + (z - D / 2) + "px)";
      var f = [[w, h, ""], [w, h, "translateZ(" + d + "px)"], [d, h, "rotateY(-90deg)"], [d, h, "translateX(" + w + "px) rotateY(-90deg)"], [w, d, "rotateX(90deg)"], [w, d, "translateY(" + h + "px) rotateX(90deg)"]];
      f.forEach(function (s, i) {
        var a = document.createElement("i");
        a.style.cssText = "width:" + s[0] + "px;height:" + s[1] + "px;transform:" + (s[2] || "none") + ";background:" + ((faces && faces[i]) || c) + ";filter:brightness(" + sh[i] + ")" + (radius ? ";border-radius:" + radius : "");
        el.appendChild(a);
      });
      rstage.appendChild(el);
    };
    var wall = "#EDE7DD", oak = "#DCCDB6", stone = "#BEB8AE", moss = "#666B33", cord = "#4B332A", cognac = "#A9592E", chrome = "#C9CCCE", dark = "#1D1D1D";
    box(-8, -8, -8, W + 16, 8, D + 8, oak);                                  // floor
    box(-8, 0, -8, W + 16, H, 8, wall);                                      // back wall
    box(-8, 0, 0, 8, H, D, wall);                                            // left wall
    box(W, 0, 0, 8, H, 190, wall);                                           // right wall (short)
    box(0, 0, 150, 2, 250, 250, "#3A3C3D", { 3: "linear-gradient(#B9C6CC 0 62%, #CDBFA8 62% 100%)" });   // window
    box(2, 200, 150, 3, 50, 250, "#35373A");                                 // blind
    box(215, 0, 0, 170, 262, 16, stone);                                     // fireplace wall
    box(243, 150, 16, 114, 64, 4, dark);                                     // TV
    box(240, 62, 16, 120, 32, 3, dark, { 1: "radial-gradient(ellipse at 50% 95%, #FFB347 0 14%, #C8501A 30%, #1D1D1D 62%)" }); // fire
    box(170, 140, 0, 5, 60, 5, dark); box(425, 140, 0, 5, 60, 5, dark);      // sconces
    box(W - 3, 0, 60, 3, 215, 70, "#F3CC8E");                                // warm doorway
    box(60, 0, 140, 480, 3, 280, moss);                                      // rug
    box(70, 0, 190, 100, 42, 200, cord, null, "10px");                       // sofa seat
    box(50, 0, 190, 34, 82, 200, cord, null, "12px");                        // sofa back
    box(96, 42, 205, 44, 26, 44, "#8D7362", null, "8px");                    // cushion
    box(440, 0, 250, 86, 38, 92, cognac, null, "12px");                      // lounge chair seat
    box(500, 0, 250, 40, 88, 92, cognac, null, "14px");                      // lounge chair back
    box(470, 38, 274, 30, 26, 44, "#7A3B5E", null, "6px");                   // striped cushion
    box(250, 46, 240, 130, 4, 92, "rgba(90,84,78,0.55)");                    // glass top
    [[252, 242], [374, 242], [252, 326], [374, 326]].forEach(function (p) { box(p[0], 0, p[1], 4, 46, 4, chrome); });
    box(268, 50, 262, 16, 18, 16, "#FFE7BF", null, "8px 8px 2px 2px");       // mushroom lamp
    box(318, 50, 290, 40, 3, 28, "#F2EEE6");                                 // open book
    box(425, 0, 70, 24, 46, 24, "#F1F0EC");                                  // marble lamp base
    box(435, 46, 80, 4, 222, 4, chrome);                                     // lamp pole
    box(350, 264, 80, 89, 4, 4, chrome);                                     // lamp arm
    box(332, 238, 68, 34, 28, 28, chrome, null, "14px 14px 4px 4px");        // lamp shade
    box(110, 0, 400, 54, 38, 30, "rgba(40,36,34,0.85)");                     // record rack
    box(190, 3, 410, 46, 8, 34, "#E9E4DC");                                  // books
    var fit = function () { rstage.style.setProperty("--k", (room.clientWidth / 860).toFixed(3)); };
    fit(); window.addEventListener("resize", fit);
    rstage.style.setProperty("--ry", yaw); rstage.style.setProperty("--rx", pitch);
    if (!reduce) {
      room.addEventListener("pointerdown", function (e) { rdrag = true; rlast = e.clientX; });
      window.addEventListener("pointermove", function (e) { if (rdrag) { yawT = clamp(yawT + (e.clientX - rlast) * 0.4, -62, -4); rlast = e.clientX; } }, { passive: true });
      window.addEventListener("pointerup", function () { rdrag = false; });
      window.addEventListener("pointercancel", function () { rdrag = false; });
    }
  }

  /* Motion: 3D hero scene, scroll flip, spinning ring. One animation loop. */
  var stage = document.querySelector(".scene__stage");
  var flip = document.getElementById("flip");
  var ring = document.getElementById("ring");
  var spin = ring && ring.querySelector(".ring__spin");
  var px = 0, py = 0, rx = 4, ry = -14;
  var angle = 0, vel = 0.1, dragging = false, lastX = 0, moved = 0;

  if (!reduce) {
    window.addEventListener("pointermove", function (e) {
      px = e.clientX / window.innerWidth - 0.5;
      py = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });

    if (ring) {
      ring.addEventListener("pointerdown", function (e) { dragging = true; moved = 0; lastX = e.clientX; });
      window.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        var dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx);
        angle += dx * 0.3; vel = dx * 0.3;
      }, { passive: true });
      var end = function () { dragging = false; };
      window.addEventListener("pointerup", end);
      window.addEventListener("pointercancel", end);
      ring.addEventListener("click", function (e) { if (moved > 6) e.preventDefault(); });
      ring.addEventListener("dragstart", function (e) { e.preventDefault(); });
    }

    var frame = function (t) {
      if (stage) {
        var sp = clamp(window.scrollY / window.innerHeight, 0, 1);
        var tx = 4 - py * 9 - sp * 6;
        var ty = -14 + px * 14 + sp * 26 + Math.sin(t / 1900) * 2.5;
        rx += (tx - rx) * 0.06; ry += (ty - ry) * 0.06;
        stage.style.setProperty("--rx", rx.toFixed(2));
        stage.style.setProperty("--ry", ry.toFixed(2));
      }
      if (rstage) {
        var tgt = clamp(yawT + (rdrag ? 0 : px * 14 + Math.sin(t / 2600) * 5) + clamp(window.scrollY / window.innerHeight, 0, 1) * 18, -64, -2);
        yaw += (tgt - yaw) * 0.07;
        rstage.style.setProperty("--ry", yaw.toFixed(2));
        rstage.style.setProperty("--rx", (pitch - py * 5).toFixed(2));
      }
      if (flip) {
        var r = flip.getBoundingClientRect();
        var span = flip.offsetHeight - window.innerHeight;
        var p = span > 0 ? clamp(-r.top / span, 0, 1) : 0;
        var q = clamp((p - 0.12) / 0.62, 0, 1);
        q = q * q * (3 - 2 * q);
        flip.style.setProperty("--p", q.toFixed(3));
      }
      if (spin) {
        if (!dragging) { vel += (0.1 - vel) * 0.03; angle += vel; }
        spin.style.setProperty("--a", angle.toFixed(2));
      }
      window.requestAnimationFrame(frame);
    };
    window.requestAnimationFrame(frame);

    /* Tilt on hover for pricing cards and tagged images */
    document.addEventListener("pointermove", function (e) {
      var el = e.target.closest && e.target.closest("[data-tilt]");
      if (!el) return;
      var b = el.getBoundingClientRect();
      el.style.setProperty("--ty", (((e.clientX - b.left) / b.width - 0.5) * 9).toFixed(2) + "deg");
      el.style.setProperty("--tx", ((0.5 - (e.clientY - b.top) / b.height) * 9).toFixed(2) + "deg");
    }, { passive: true });
    document.addEventListener("pointerout", function (e) {
      var el = e.target.closest && e.target.closest("[data-tilt]");
      if (el && !el.contains(e.relatedTarget)) { el.style.setProperty("--tx", "0deg"); el.style.setProperty("--ty", "0deg"); }
    });
  }

  /* Pricing calculator */
  var PACKAGES = {
    home: [
      { name: "Quick Refresh", blurb: "A designer's eye on the room you already have.", rate: 1.0, min: 350, time: "1–2 weeks", featured: false,
        items: ["Design consult by video", "New furniture layout", "Color, decor & styling direction", "Curated shopping list", "1 round of changes"] },
      { name: "Full Room", blurb: "Complete interior design for the rooms you choose.", rate: 2.0, min: 800, time: "2–4 weeks", featured: true,
        items: ["Concept & mood board", "Space plan & furniture layout", "Furniture, lighting, rugs & decor selected", "Paint, materials & finishes palette", "3D views of your room", "Shopping list & styling notes", "2 rounds of changes"] },
      { name: "Reno-Ready", blurb: "Full design for a remodel: kitchens, baths and built-ins.", rate: 3.5, min: 2500, time: "4–8 weeks", featured: false,
        items: ["Everything in Full Room", "Cabinetry, tile, fixtures & appliance selections", "Lighting plan", "Drawings & specs for your contractor", "Check-ins during construction", "3 rounds of changes"] }
    ],
    office: [
      { name: "First Office", blurb: "Your first real office, designed and ready for day one.", rate: 0.5, min: 750, time: "2–3 weeks", featured: false,
        items: ["Desk & seating layout", "Furniture & lighting selected", "Colors & finishes that fit your brand", "Shopping list ready to order", "1 round of changes"] },
      { name: "Growing Team", blurb: "Complete workplace design for a team that's getting bigger.", rate: 0.9, min: 2000, time: "3–5 weeks", featured: true,
        items: ["Concept & mood board", "Zones to focus, meet and hang out", "Furniture, lighting & decor selected", "Materials, acoustics & power plan", "3D views of the space", "2 rounds of changes"] },
      { name: "Next Floor", blurb: "Full design planned around your next big hiring push.", rate: 1.5, min: 5000, time: "5–8 weeks", featured: false,
        items: ["Everything in Growing Team", "A plan for future headcount", "Drawings & specs for contractor and landlord", "Move-in styling checklist", "3 rounds of changes"] }
    ]
  };
  var COPY = {
    home: { label: "How big is the space?", hint: "Just the rooms you want designed. A living room is usually around 250–400 sq ft.",
      note: "This covers the design. You buy furniture and pay contractors directly, and I never add a markup." },
    office: { label: "How big is your office?", hint: "The usable floor area. Not sure? It's usually on your lease.",
      note: "This covers the design. You buy furniture, IT and build-out directly from vendors, and I never add a markup." }
  };
  var cards = document.getElementById("cards");
  if (cards) {
    var aud = "home";
    var sizes = { home: 1200, office: 3000 };
    var input = document.getElementById("sqft");
    var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); };
    var money = function (n) { return "$" + Math.round(n).toLocaleString("en-US"); };
    var render = function () {
      var size = sizes[aud] > 0 ? sizes[aud] : 0;
      cards.innerHTML = PACKAGES[aud].map(function (p) {
        var raw = p.rate * size, total = Math.max(raw, p.min);
        return '<article class="card' + (p.featured ? " card--featured" : "") + '">' +
          (p.featured ? '<span class="badge">Most people pick this</span>' : "") +
          "<h3>" + esc(p.name) + "</h3>" +
          '<p class="card__blurb">' + esc(p.blurb) + "</p>" +
          '<div class="card__rate"><strong>$' + p.rate.toFixed(2) + "</strong><span>per sq ft</span></div>" +
          '<p class="card__fee">Your price: ' + money(total) + (raw < p.min ? " (minimum)" : "") + "</p>" +
          '<p class="card__meta">' + money(p.min) + " minimum · ready in " + esc(p.time) + "</p>" +
          "<ul>" + p.items.map(function (it) { return "<li>" + esc(it) + "</li>"; }).join("") + "</ul>" +
          '<a href="../#contact" class="choose">Choose this</a></article>';
      }).join("");
      document.getElementById("sqft-label").textContent = COPY[aud].label;
      document.getElementById("sqft-hint").textContent = COPY[aud].hint;
      document.getElementById("footnote").textContent = COPY[aud].note;
    };
    document.querySelectorAll(".tab").forEach(function (b) {
      b.addEventListener("click", function () {
        aud = b.getAttribute("data-aud");
        document.querySelectorAll(".tab").forEach(function (t) { t.setAttribute("aria-pressed", String(t === b)); });
        input.value = sizes[aud] || "";
        render();
      });
    });
    input.addEventListener("input", function () {
      var v = Number(input.value);
      sizes[aud] = v > 0 ? v : 0;
      render();
    });
    render();
  }

  /* Contact form: opens the visitor's email app, pre-filled. */
  var form = document.getElementById("book-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var d = new FormData(form);
      var body = "Name: " + d.get("name") + "\nEmail: " + d.get("email") + "\nThinking about: " + d.get("type") +
        "\nRough size: " + (d.get("size") || "?") + " sq ft\n\n" + d.get("notes");
      window.location.href = "mailto:suntracey0327@gmail.com?subject=" +
        encodeURIComponent("Hello from the TSD site: " + d.get("type")) + "&body=" + encodeURIComponent(body);
    });
  }

  /* Compare sliders on the project page */
  document.querySelectorAll(".compare").forEach(function (compare) {
    var range = compare.querySelector("input[type=range]");
    var top = compare.querySelector(".compare__model");
    var divider = compare.querySelector(".compare__divider");
    var set = function () {
      var v = Number(range.value);
      top.style.clipPath = "inset(0 " + (100 - v) + "% 0 0)";
      divider.style.left = v + "%";
      range.setAttribute("aria-valuetext", v + "% 3D model");
    };
    range.addEventListener("input", set);
    set();
  });
})();
