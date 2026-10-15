/* ============================================================
   STARTRADER — language switch (EN / PL)

   Polish copy is NOT authored here. Every PL string comes verbatim
   from js/content-pl.js, which is generated from the approved
   workbook ("Final PL" column) by tools/build-pl-content.py.

   Anything the workbook does not cover — site navigation, footer,
   the risk warning, a handful of explorer/detail micro-labels —
   stays in English on purpose rather than being machine-translated.

   Selection order: ?lang= → localStorage → "en".
   ============================================================ */
(function () {
  "use strict";

  var KEY = "startrader_lang";
  var SUPPORTED = ["en", "pl"];
  var LABELS = { en: "EN", pl: "PL" };

  function normalize(v) { return SUPPORTED.indexOf(String(v || "").toLowerCase()) > -1 ? String(v).toLowerCase() : null; }

  function stored() {
    try { return normalize(localStorage.getItem(KEY)); } catch (e) { return null; }
  }
  function persist(v) {
    try { localStorage.setItem(KEY, v); } catch (e) {}
  }

  var fromUrl = normalize(new URLSearchParams(location.search).get("lang"));
  var lang = fromUrl || stored() || "en";
  if (fromUrl) persist(fromUrl);

  var C = window.PL_CONTENT || { ui: { en: {}, pl: {} }, instruments: {}, meta: {} };
  var isPL = lang === "pl";

  /* keep the choice on every internal link so a shared URL keeps its language */
  function href(url) {
    if (!isPL) return url;
    return url + (url.indexOf("?") > -1 ? "&" : "?") + "lang=pl";
  }

  function set(next) {
    next = normalize(next);
    if (!next || next === lang) return;
    persist(next);
    var url = new URL(location.href);
    if (next === "en") url.searchParams.delete("lang");
    else url.searchParams.set("lang", next);
    location.href = url.toString();
  }

  /* ---------- language button (injected into the navbar) ---------- */
  var GLOBE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 2.6 15 0 18-2.6-3-2.6-15.4 0-18z"/></svg>';

  function buttonHTML() {
    return '<div class="lang-switch" role="group" aria-label="Language / Język">' +
      '<span class="lang-globe">' + GLOBE + '</span>' +
      SUPPORTED.map(function (v) {
        return '<button type="button" class="lang-opt' + (v === lang ? " active" : "") + '" data-lang="' + v + '"' +
          ' aria-pressed="' + (v === lang) + '" lang="' + v + '">' + LABELS[v] + '</button>';
      }).join("") +
      '</div>';
  }

  function bindButton(scope) {
    (scope || document).querySelectorAll(".lang-opt").forEach(function (b) {
      b.addEventListener("click", function () { set(b.dataset.lang); });
    });
  }

  /* ---------- page metadata (workbook "Page Index" columns) ---------- */
  function applyMeta(key) {
    if (!isPL) return;
    var m = C.meta && C.meta[key];
    if (!m) return;
    if (m.title) document.title = m.title;
    var d = document.querySelector('meta[name="description"]');
    if (d && m.description) d.setAttribute("content", m.description);
  }

  window.I18N = {
    lang: lang,
    isPL: isPL,
    ui: (C.ui && C.ui[lang]) || {},
    /* per-instrument workbook block, or null in English */
    inst: function (id) { return isPL && C.instruments ? C.instruments[id] || null : null; },
    catLabel: function (catId) {
      var order = ["all", "forex", "commodities", "indices", "metals", "shares", "etf"];
      var chips = (C.ui && C.ui[lang] && C.ui[lang].chips) || [];
      var i = order.indexOf(catId);
      return i > -1 && chips[i] ? chips[i] : null;
    },
    href: href,
    set: set,
    buttonHTML: buttonHTML,
    bindButton: bindButton,
    applyMeta: applyMeta
  };

  document.documentElement.lang = lang;
  document.documentElement.setAttribute("data-lang", lang);
})();
