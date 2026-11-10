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

  /* Depth photo: the real room photo with a depth map, so it shifts in 3D as you look around */
  var depthEl = document.getElementById("depth");
  var drawDepth = null, ddrag = false, dlastX = 0, dlastY = 0, dox = 0, doy = 0, dtx = 0, dty = 0;
  if (depthEl && !reduce) {
    (function () {
      var cv = depthEl.querySelector("canvas");
      var gl = cv.getContext("webgl", { antialias: false }) || cv.getContext("experimental-webgl");
      if (!gl) return;
      var sh = function (type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
      var pr = gl.createProgram();
      gl.attachShader(pr, sh(gl.VERTEX_SHADER, "attribute vec2 a;varying vec2 v;void main(){v=a*0.5+0.5;gl_Position=vec4(a,0.,1.);}"));
      gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, "precision mediump float;varying vec2 v;uniform sampler2D i;uniform sampler2D d;uniform vec2 o;void main(){vec2 uv=(v-0.5)/1.07+0.5;vec2 p=uv;for(int k=0;k<4;k++){float z=texture2D(d,p).r;p=uv+o*(z-0.32);}gl_FragColor=texture2D(i,clamp(p,0.002,0.998));}"));
      gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
      gl.useProgram(pr);
      var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(pr, "a"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      var uo = gl.getUniformLocation(pr, "o");
      gl.uniform1i(gl.getUniformLocation(pr, "i"), 0); gl.uniform1i(gl.getUniformLocation(pr, "d"), 1);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      var ready = 0;
      var tex = function (unit, src) {
        var im = new Image();
        im.onload = function () {
          var t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im);
          if (++ready === 2) { size(); depthEl.classList.add("on"); }
        };
        im.src = src;
      };
      var size = function () {
        var r = Math.min(window.devicePixelRatio || 1, 2);
        cv.width = Math.round(depthEl.clientWidth * r); cv.height = Math.round(depthEl.clientHeight * r);
        gl.viewport(0, 0, cv.width, cv.height);
      };
      window.addEventListener("resize", size);
      tex(0, "assets/hero-room.jpg"); tex(1, "assets/hero-room-depth.jpg");
      depthEl.addEventListener("pointerdown", function (e) { ddrag = true; dlastX = e.clientX; dlastY = e.clientY; });
      window.addEventListener("pointermove", function (e) {
        if (!ddrag) return;
        dtx = clamp(dtx + (e.clientX - dlastX) / 260, -1, 1); dty = clamp(dty + (e.clientY - dlastY) / 260, -1, 1);
        dlastX = e.clientX; dlastY = e.clientY;
      }, { passive: true });
      var up = function () { ddrag = false; };
      window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
      drawDepth = function (t) {
        if (ready < 2) return;
        var b = depthEl.getBoundingClientRect();
        if (b.bottom < 0 || b.top > window.innerHeight) return;
        var gx = dtx + (ddrag ? 0 : px * 1.6 + Math.sin(t / 2400) * 0.35), gy = dty + (ddrag ? 0 : py * 1.2);
        dox += (clamp(gx, -1.2, 1.2) - dox) * 0.08; doy += (clamp(gy, -1.2, 1.2) - doy) * 0.08;
        gl.uniform2f(uo, dox * 0.026, -doy * 0.018);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        depthEl.style.setProperty("--ty", (dox * 5).toFixed(2) + "deg"); depthEl.style.setProperty("--tx", (-doy * 4).toFixed(2) + "deg");
      };
    })();
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
      if (drawDepth) drawDepth(t);
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
