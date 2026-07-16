/* ============================================================
   STARTRADER — Instruments explorer (table)
   ============================================================ */
(function () {
  "use strict";

  var state = { cat: "all", q: "", limit: 10 };
  var PAGE = 10;

  /* ---------- helpers ---------- */
  function fmt(n, dp) { return Number(n).toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp }); }
  function seeded(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () { h += 0x6d2b79f5; var t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function sparkPoints(sym, trend, n) {
    var rnd = seeded(sym), pts = [], v = 50;
    for (var i = 0; i < n; i++) { v += (rnd() - 0.5) * 15 + trend * 1.3; v = Math.max(8, Math.min(92, v)); pts.push(v); }
    return pts;
  }
  function sparkPath(pts, w, h) {
    var max = Math.max.apply(null, pts), min = Math.min.apply(null, pts), rng = (max - min) || 1, step = w / (pts.length - 1), d = "";
    pts.forEach(function (p, i) { d += (i ? "L" : "M") + (i * step).toFixed(1) + " " + (h - ((p - min) / rng) * (h - 6) - 3).toFixed(1) + " "; });
    return d;
  }
  function catLabel(id) { var c = window.CATEGORIES.find(function (c) { return c.id === id; }); return c ? c.label : id; }
  function shortBadge(it) {
    if (it.cat === "forex" || it.cat === "crypto" || it.cat === "metals") return it.sym.split("/")[0].slice(0, 4);
    return it.sym.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase();
  }
  function arrow(up) {
    return up ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M7 14l5-5 5 5"/></svg>'
              : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M7 10l5 5 5-5"/></svg>';
  }
  function halfSpread(it) { return it.spread * Math.pow(10, -Math.max(0, it.dp - 1)) / 2; }

  /* ---------- filters ---------- */
  var TOP = window.MOST_TRADED_TOP || [];
  function renderFilters() {
    var el = document.getElementById("filters");
    el.innerHTML = window.CATEGORIES.map(function (c) {
      var count = c.id === "all" ? TOP.length : window.INSTRUMENTS.filter(function (i) { return i.cat === c.id; }).length;
      return '<button class="chip' + (c.id === state.cat ? " active" : "") + '" data-cat="' + c.id + '">' +
        '<span class="ico">' + c.ico + '</span>' + c.label + ' <span class="cnt">' + count + '</span></button>';
    }).join("");
    el.querySelectorAll(".chip").forEach(function (b) {
      b.addEventListener("click", function () { state.cat = b.dataset.cat; state.limit = PAGE; renderFilters(); renderTable(); });
    });
  }

  /* ---------- one row ---------- */
  function rowHTML(it, idx) {
    var up = it.chg >= 0;
    var hs = halfSpread(it);
    var bid = it.price - hs, ask = it.price + hs;
    var pts = sparkPoints(it.sym + it.id, it.trend, 26), d = sparkPath(pts, 116, 34);
    var col = up ? "#0ca678" : "#e5484d";
    var showTag = state.cat === "all";
    return '' +
      '<tr class="row" data-href="instrument.html?symbol=' + it.id + '" style="animation-delay:' + Math.min(idx, 20) * 22 + 'ms">' +
        '<td class="left">' +
          '<div class="inst">' +
            '<span class="ic" style="background:linear-gradient(135deg,' + it.grad[0] + ',' + it.grad[1] + ')"><span>' + shortBadge(it) + '</span></span>' +
            '<div class="meta"><span class="sym">' + it.sym + '</span><span class="nm">' + it.name + '</span></div>' +
            (showTag ? '<span class="tag">' + catLabel(it.cat) + '</span>' : '') +
          '</div>' +
        '</td>' +
        '<td><span class="px tnum" data-base="' + bid + '" data-dp="' + it.dp + '" data-cur="' + it.cur + '">' + (it.cur ? '<span class="cur">' + it.cur + '</span>' : '') + fmt(bid, it.dp) + '</span></td>' +
        '<td><span class="px tnum" data-base="' + ask + '" data-dp="' + it.dp + '" data-cur="' + it.cur + '">' + (it.cur ? '<span class="cur">' + it.cur + '</span>' : '') + fmt(ask, it.dp) + '</span></td>' +
        '<td class="spread tnum"><b>' + it.spread + '</b></td>' +
        '<td><span class="chg ' + (up ? "up" : "down") + ' tnum">' + arrow(up) + (up ? "+" : "") + it.chg.toFixed(2) + '%</span></td>' +
        '<td><span class="spark"><svg viewBox="0 0 116 34" preserveAspectRatio="none"><path class="ln" d="' + d + '" stroke="' + col + '"/></svg></span></td>' +
        '<td><a class="trade" href="instrument.html?symbol=' + it.id + '">Trade <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></td>' +
      '</tr>';
  }

  /* ---------- render table ---------- */
  function renderTable() {
    var tbody = document.getElementById("tbody");
    var wrap = document.getElementById("loadMoreWrap");
    var q = state.q.trim().toLowerCase();

    // "Most Traded" (all) shows a curated top-10 when idle; a search widens to the
    // whole universe so every instrument stays findable from any tab.
    var base;
    if (state.cat === "all") {
      base = q ? window.INSTRUMENTS : TOP.map(function (id) {
        return window.INSTRUMENTS.filter(function (x) { return x.id === id; })[0];
      }).filter(Boolean);
    } else {
      base = window.INSTRUMENTS.filter(function (it) { return it.cat === state.cat; });
    }
    var list = base.filter(function (it) {
      return !q || it.sym.toLowerCase().indexOf(q) > -1 || it.name.toLowerCase().indexOf(q) > -1;
    });

    // section subtitle reflects the full catalogue (55), independent of the active tab
    document.getElementById("resultCount").textContent = window.INSTRUMENTS.length;

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="7"><div class="empty"><div class="big">🔍</div>No instruments match “' + state.q + '”.</div></td></tr>';
      wrap.innerHTML = ""; return;
    }

    var shown = list.slice(0, state.limit);
    tbody.innerHTML = shown.map(rowHTML).join("");
    setupSparkLengths(tbody);

    tbody.querySelectorAll("tr.row").forEach(function (tr) {
      tr.addEventListener("click", function (e) {
        if (e.target.closest("a")) return;
        location.href = tr.dataset.href;
      });
    });

    if (list.length > state.limit) {
      var remaining = list.length - state.limit;
      wrap.innerHTML = '<button class="load-more" id="loadMore">Show ' + Math.min(PAGE, remaining) + ' more <span class="lm-count">' + state.limit + ' of ' + list.length + '</span></button>';
      document.getElementById("loadMore").addEventListener("click", function () { state.limit += PAGE; renderTable(); });
    } else {
      wrap.innerHTML = list.length > PAGE ? '<span class="all-loaded">Showing all ' + list.length + ' instruments</span>' : "";
    }
  }

  function setupSparkLengths(scope) {
    scope.querySelectorAll(".spark .ln").forEach(function (p) {
      try { p.style.setProperty("--len", p.getTotalLength()); } catch (e) { p.style.setProperty("--len", 200); }
    });
  }

  /* ---------- ticker ---------- */
  function renderTicker() {
    var t = document.getElementById("ticker");
    var items = window.INSTRUMENTS.filter(function (i) { return ["forex", "metals", "commodities", "indices", "shares"].indexOf(i.cat) > -1; }).slice(0, 18);
    var one = items.map(function (it) {
      var up = it.chg >= 0;
      return '<span class="tick"><span class="s">' + it.sym + '</span><span class="p">' + (it.cur || "") + fmt(it.price, it.dp) + '</span>' +
        '<span class="c ' + (up ? "up" : "down") + '">' + (up ? "▲ +" : "▼ ") + it.chg.toFixed(2) + '%</span></span>';
    }).join("");
    t.innerHTML = one + one;
  }

  /* ---------- live prices ---------- */
  function liveTick() {
    document.querySelectorAll("#tbody .px").forEach(function (el) {
      if (Math.random() > 0.28) return;
      var base = parseFloat(el.dataset.base), dp = parseInt(el.dataset.dp, 10), cur = el.dataset.cur;
      var drift = (Math.random() - 0.5) * base * 0.0008, next = base + drift;
      el.dataset.base = next;
      el.innerHTML = (cur ? '<span class="cur">' + cur + '</span>' : "") + fmt(next, dp);
      el.classList.remove("fu", "fd"); void el.offsetWidth; el.classList.add(drift >= 0 ? "fu" : "fd");
    });
  }

  /* ---------- hero counters ---------- */
  function animateCount(el, target) {
    if (!el) return;
    var dur = 1000, t0 = null;
    function set(v) { el.textContent = v.toLocaleString("en-US"); }
    function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / dur); set(Math.floor((1 - Math.pow(1 - p, 3)) * target)); if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
    setTimeout(function () { set(target); }, dur + 120);
  }

  /* ---------- init ---------- */
  function init() {
    renderFilters();
    renderTicker();
    renderTable();
    animateCount(document.getElementById("mInstruments"), window.INSTRUMENTS.length);
    animateCount(document.getElementById("mClasses"), window.CATEGORIES.length - 1);

    var search = document.getElementById("search");
    search.addEventListener("input", function () { state.q = search.value; state.limit = PAGE; renderTable(); });

    setInterval(liveTick, 2400);
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
