/* ============================================================
   STARTRADER — Instruments explorer
   Live prices come from TradingView widgets (js/tv.js): a ticker tape in
   the hero and a Market Data table. The category chips above the table
   pick which asset class it lists.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- language ----------
     UI.* comes from the approved workbook (EN + Final PL columns);
     per-instrument names/symbols come from that instrument's sheet. */
  var I = window.I18N;
  var UI = (I && I.ui) || {};
  function link(url) { return I ? I.href(url) : url; }
  function pl(it) { return I ? I.inst(it.id) : null; }
  function dispSym(it) { var p = pl(it); return (p && p.sym) || it.sym; }
  function dispName(it) { var p = pl(it); return (p && p.name) || it.name; }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function catLabel(id) {
    var localized = I && I.catLabel(id);
    if (localized) return localized;
    var c = window.CATEGORIES.find(function (c) { return c.id === id; });
    return c ? c.label : id;
  }

  var TOP = window.MOST_TRADED_TOP || [];
  function byId(id) { return window.INSTRUMENTS.filter(function (x) { return x.id === id; })[0]; }
  function inCat(cat) { return window.INSTRUMENTS.filter(function (it) { return it.cat === cat; }); }
  function tvItem(it) { return { name: window.TV.symbol(it.id), displayName: dispSym(it) }; }
  function hasTV(it) { return !!(it && window.TV && window.TV.symbol(it.id)); }

  /* ---------- live ticker (hero) ---------- */
  function renderTicker() {
    if (!window.TV) return;
    window.TV.embed(document.getElementById("ticker"), "ticker-tape", {
      symbols: TOP.map(byId).filter(hasTV).map(function (it) { return { proName: window.TV.symbol(it.id), title: dispSym(it) }; }),
      showSymbolLogo: true, isTransparent: true, displayMode: "regular", colorTheme: "dark"
    });
  }

  /* ---------- category filter + live market table ---------- */
  var current = "all";
  function catItems(id) { return (id === "all" ? TOP.map(byId) : inCat(id)).filter(hasTV); }

  function renderFilters() {
    var el = document.getElementById("filters");
    if (!el) return;
    el.innerHTML = window.CATEGORIES.map(function (c) {
      var on = c.id === current;
      return '<button type="button" class="chip' + (on ? " active" : "") + '" data-cat="' + c.id + '" aria-pressed="' + on + '">' +
        '<span class="ico" aria-hidden="true">' + c.ico + '</span>' + esc(catLabel(c.id)) +
        ' <span class="cnt">' + catItems(c.id).length + '</span></button>';
    }).join("");
    el.querySelectorAll(".chip").forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.dataset.cat === current) return;
        current = b.dataset.cat;
        renderFilters();
        renderMarket();
      });
    });
  }

  function renderMarket() {
    if (!window.TV) return;
    var items = catItems(current), box = document.getElementById("marketData");
    var groups = [{ name: catLabel(current), symbols: items.map(tvItem) }];
    /* the table is as tall as its rows (header + 36px a row), so a short class leaves no gap */
    if (box) box.style.height = (80 + items.length * 36) + "px";
    window.TV.embed(document.getElementById("marketData"), "market-quotes", {
      width: "100%", height: "100%", symbolsGroups: groups,
      showSymbolLogo: true, isTransparent: true, colorTheme: "light",
      /* a row click opens our instrument page; it receives ?tvwidgetsymbol= */
      largeChartUrl: new URL(link("instrument.html").split("?")[0], location.href).href
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

  /* ---------- static copy (workbook: "Trading Instrument page") ---------- */
  function applyCopy() {
    if (!I) return;
    I.applyMeta("home");
    var set = function (id, html) { var el = document.getElementById(id); if (el && html) el.innerHTML = html; };

    if (UI.heroTitleLead) {
      set("heroTitle", UI.heroTitleLead + (UI.heroTitleAccent ? ' - <span class="accent">' + UI.heroTitleAccent + "</span>" : ""));
    }
    set("heroSub", UI.heroSub);
    if (UI.heroMeta) {
      set("mInstrumentsLabel", UI.heroMeta[0]);
      set("mClassesLabel", UI.heroMeta[1]);
      /* "Egzekucja < 30 ms" — bold everything from the comparison sign on */
      var exec = String(UI.heroMeta[2] || ""), at = exec.indexOf("<");
      set("mExec", at > -1 ? esc(exec.slice(0, at)) + "<b>" + esc(exec.slice(at)) + "</b>" : esc(exec));
    }
    set("explorerTitle", UI.explorerTitle);
    set("explorerSub", UI.explorerSub ? " " + UI.explorerSub : "");

  }

  /* ---------- init ---------- */
  function init() {
    applyCopy();
    renderFilters();
    document.getElementById("resultCount").textContent = window.INSTRUMENTS.length;
    document.documentElement.classList.remove("i18n-wait");
    animateCount(document.getElementById("mInstruments"), window.INSTRUMENTS.length);
    animateCount(document.getElementById("mClasses"), window.CATEGORIES.length - 1);
    renderTicker();
    renderMarket();
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
