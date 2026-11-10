/* Scroll movement for every page. Does nothing when the visitor prefers reduced motion. */
(function () {
  "use strict";
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in window)) return;
  var root = document.documentElement;
  root.classList.add("js");

  /* 1. Things rise into place as they enter the screen; images wipe open. */
  var rise = document.querySelectorAll(
    "main h1, main h2, main .label, .intro p, .intro .text-link, .study h3, .study__note, .hello__text p, .hello__text .text-link, " +
    ".contact__intro, .contact__mail, .pp__lede, .rooms__head .text-link, .room-grid a, .study figure, .steps li, .faq details, " +
    ".hello__pic, .form, .compare, .stack img, .story, .facts, img.wide, .pieces > div"
  );
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  rise.forEach(function (el) {
    var i = 0, s = el;
    while ((s = s.previousElementSibling) && i < 5) i++;
    el.setAttribute("data-m", "");
    el.style.transitionDelay = i * 80 + "ms";
    io.observe(el);
  });

  /* 2. A thin line across the top shows how far down the page you are. */
  var prog = document.createElement("div");
  prog.className = "prog"; prog.setAttribute("aria-hidden", "true");
  document.body.appendChild(prog);

  /* 3. Continuous movement tied to scrolling: the cover photo drifts and zooms, and
        alternating images slide at slightly different speeds. */
  var cover = document.querySelector(".cover img");
  var par = [];
  var add = function (sel, amt) { document.querySelectorAll(sel).forEach(function (el) { par.push({ el: el, amt: amt, y: 0 }); }); };
  add(".room-grid a:nth-child(odd)", -26);
  add(".room-grid a:nth-child(even)", 26);
  add(".study figure:nth-child(2)", 34);
  add(".stack .pair img:nth-child(2)", 40);
  add(".hello__pic", -30);
  add(".steps li:nth-child(even)", 18);

  var ticking = false;
  var update = function () {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight;
    var max = root.scrollHeight - vh;
    prog.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0).toFixed(4) + ")";
    if (cover && y < vh * 1.3) cover.style.transform = "translate3d(0," + (y * 0.3).toFixed(1) + "px,0) scale(" + (1 + (y / vh) * 0.12).toFixed(4) + ")";
    if (window.innerWidth < 720) return;
    for (var i = 0; i < par.length; i++) {
      var p = par[i], r = p.el.getBoundingClientRect();
      if (r.bottom < -120 || r.top > vh + 120) continue;
      var c = (r.top - p.y + r.height / 2) / vh - 0.5;
      p.y = c * p.amt;
      p.el.style.translate = "0 " + p.y.toFixed(1) + "px";
    }
  };
  var onScroll = function () { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();
