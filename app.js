(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Hero: tap to toggle between the finished room and the 3D model (hover does it on desktop). */
  var hero = document.querySelector(".hero");
  if (hero) {
    var hint = hero.querySelector(".hero__hint");
    var toggle = function () {
      var on = hero.getAttribute("aria-pressed") !== "true";
      hero.setAttribute("aria-pressed", String(on));
      if (hint) hint.textContent = on ? "Show the finished room" : "Show the 3D model";
    };
    hero.addEventListener("click", toggle);
    hero.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
  }

  /* Pricing calculator */
  var PACKAGES = {
    home: [
      { name: "Quick Refresh", blurb: "Love your space again, mostly with what you already have.", rate: 1.0, min: 350, time: "1–2 weeks", featured: false,
        items: ["Video chat + photo walkthrough", "New layout & styling plan", "A shopping list of the right pieces", "1 round of changes"] },
      { name: "Full Room", blurb: "The whole thing, designed start to finish.", rate: 2.0, min: 800, time: "2–4 weeks", featured: true,
        items: ["Measured floor plan & furniture layout", "Mood board + 3D views of your room", "Paint, lighting & materials picked", "Full shopping list", "2 rounds of changes"] },
      { name: "Reno-Ready", blurb: "Design plus drawings your contractor can build from.", rate: 3.5, min: 2500, time: "4–8 weeks", featured: false,
        items: ["Everything in Full Room", "A palette that flows room to room", "Contractor-ready drawings", "Install-day checklist", "3 rounds of changes"] }
    ],
    office: [
      { name: "First Office", blurb: "Your first real office, set up and ready on day one.", rate: 0.5, min: 750, time: "2–3 weeks", featured: false,
        items: ["Desk & seating layout", "Furniture & equipment list", "Colors & finishes that feel like your brand", "1 round of changes"] },
      { name: "Growing Team", blurb: "A full plan for a team that's getting bigger.", rate: 0.9, min: 2000, time: "3–5 weeks", featured: true,
        items: ["Spots to focus, meet and hang out", "Mood board + 3D views", "Lighting, acoustics & power plan", "Furniture list ready to order", "2 rounds of changes"] },
      { name: "Next Floor", blurb: "Planned for your next big hiring push.", rate: 1.5, min: 5000, time: "5–8 weeks", featured: false,
        items: ["Everything in Growing Team", "A plan for future headcount", "Drawings for your contractor & landlord", "Move-in checklist", "3 rounds of changes"] }
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
    var check = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>';
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
          "<ul>" + p.items.map(function (it) { return "<li>" + check + "<span>" + esc(it) + "</span></li>"; }).join("") + "</ul>" +
          '<a href="#contact" class="choose">I want this one</a></article>';
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

  /* Booking form: opens the visitor's email app, pre-filled. */
  var form = document.getElementById("book-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var d = new FormData(form);
      var body = "Name: " + d.get("name") + "\nEmail: " + d.get("email") + "\nDesigning: " + d.get("type") +
        "\nApprox. size: " + (d.get("size") || "?") + " sq ft\n\n" + d.get("notes");
      window.location.href = "mailto:suntracey0327@gmail.com?subject=" +
        encodeURIComponent("Free call request: " + d.get("type")) + "&body=" + encodeURIComponent(body);
    });
  }

  /* Compare sliders (one or more per page) */
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
