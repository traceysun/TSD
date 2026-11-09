(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Scroll journey: the 3D model resolves into the finished room. */
  var journey = document.querySelector(".journey");
  if (journey && !reduce) {
    var photo = journey.querySelector(".journey__photo");
    var model = journey.querySelector(".journey__model");
    var bar = journey.querySelector(".journey__bar");
    var label = journey.querySelector(".journey__label");
    var ticking = false;
    var update = function () {
      ticking = false;
      var r = journey.getBoundingClientRect();
      var span = journey.offsetHeight - window.innerHeight;
      var p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
      var fade = Math.min(1, Math.max(0, (p - 0.12) / 0.7));
      var eased = fade * fade * (3 - 2 * fade);
      var zoom = 1 + 0.06 * p;
      photo.style.opacity = eased.toFixed(3);
      photo.style.transform = "scale(" + zoom + ")";
      model.style.transform = "scale(" + zoom + ")";
      bar.style.transform = "scaleX(" + p.toFixed(3) + ")";
      label.textContent = eased > 0.5 ? "Completed" : "3D model";
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* Pricing calculator */
  var PACKAGES = {
    home: [
      { name: "Refresh", blurb: "Restyle your space using mostly what you have.", rate: 1.0, min: 350, time: "1–2 weeks", featured: false,
        items: ["Video consult + photo review", "Styling plan & furniture layout", "Shoppable list", "1 revision round"] },
      { name: "Full Design", blurb: "A complete design for the spaces you choose.", rate: 2.0, min: 800, time: "2–4 weeks", featured: true,
        items: ["Measured floor plan & furniture layout", "Concept board + 3D model views", "Paint, lighting & material specs", "Full shoppable list", "2 revision rounds"] },
      { name: "Renovation-Ready", blurb: "Design plus drawings your contractor can build from.", rate: 3.5, min: 2500, time: "4–8 weeks", featured: false,
        items: ["Everything in Full Design", "Whole-home palette & flow plan", "Contractor-ready drawings & elevations", "Install-day checklist", "3 revision rounds"] }
    ],
    office: [
      { name: "Launch Office", blurb: "Get a first office working on day one.", rate: 0.5, min: 750, time: "2–3 weeks", featured: false,
        items: ["Desk & seating layout", "Furniture & equipment list", "Brand-aligned color & finish picks", "1 revision round"] },
      { name: "Team Floor", blurb: "A full workplace plan for a growing team.", rate: 0.9, min: 2000, time: "3–5 weeks", featured: true,
        items: ["Zoning: focus, meeting & social areas", "Concept board + 3D model views", "Lighting, acoustics & power plan", "Vendor-ready furniture schedule", "2 revision rounds"] },
      { name: "Scale-Up", blurb: "Multi-zone design planned for your next hiring step.", rate: 1.5, min: 5000, time: "5–8 weeks", featured: false,
        items: ["Everything in Team Floor", "Headcount growth plan", "Contractor & landlord drawings", "Move-in coordination checklist", "3 revision rounds"] }
    ]
  };
  var COPY = {
    home: { label: "Size of the space you want designed", hint: "Floor area of just the rooms you want designed. A living room is often 250–400 sq ft.",
      note: "Home prices cover design only. Furniture and contractor costs are paid directly to vendors, with no markup.", sqft: 1200 },
    office: { label: "Size of your office", hint: "Usable floor area of your office. Not sure? Your lease usually lists it.",
      note: "Office prices cover design only. Furniture, IT and build-out are purchased directly from vendors, with no markup.", sqft: 3000 }
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
          (p.featured ? '<span class="badge">Most popular</span>' : "") +
          "<h3>" + esc(p.name) + "</h3>" +
          '<p class="card__blurb">' + esc(p.blurb) + "</p>" +
          '<div class="card__rate"><strong>$' + p.rate.toFixed(2) + "</strong><span>per sq ft</span></div>" +
          '<p class="card__fee">Your fee: ' + money(total) + (raw < p.min ? " (minimum)" : "") + "</p>" +
          '<p class="card__meta">' + money(p.min) + " minimum · Delivered in " + esc(p.time) + "</p>" +
          "<ul>" + p.items.map(function (it) { return "<li>" + check + "<span>" + esc(it) + "</span></li>"; }).join("") + "</ul>" +
          '<a href="#book" class="choose">Choose ' + esc(p.name) + "</a></article>";
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

  /* Project page compare slider */
  var compare = document.querySelector(".compare");
  if (compare) {
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
  }
})();
