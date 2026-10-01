/* ============================================================
   STARTRADER — InstrumentAdditionalContent
   Renders the long-form Polish section that sits below an instrument
   page's existing panels. Content is data-only, keyed by page id, in
   js/content-pl-additional.js (generated from the approved workbook by
   tools/build-pl-additional.py) — this file holds no copy.

   Block types (workbook Column E -> HTML):
     h1 -> <h2 class="ia-title">  the page already owns its <h1>
     h2 -> <h2>    h3 -> <h3>    p -> <p>
     li -> <li>, consecutive items grouped into one <ul>

   Inline handling, display only (the data stays verbatim):
     Column G links wrap the first occurrence of their anchor text;
     "--" shows as an en dash and *text* as emphasis.
   ============================================================ */
(function () {
  "use strict";

  var DATA = window.PL_ADDITIONAL || {};

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function typo(s) {
    return s.replace(/--/g, "–").replace(/\*([^*]+)\*/g, "<em>$1</em>");
  }

  /* escape → swap each anchor for a token → typography → links back in */
  function inline(text, links) {
    var s = esc(text), tags = [];
    (links || []).forEach(function (l, i) {
      var a = esc(l.text), at = s.indexOf(a);
      if (at < 0) return;
      tags.push('<a href="' + esc(l.href) + '">' + typo(a) + '</a>');
      s = s.slice(0, at) + "\u0000" + i + "\u0000" + s.slice(at + a.length);
    });
    s = typo(s);
    return s.replace(/\u0000(\d+)\u0000/g, function (_, i) { return tags[i]; });
  }

  function html(id) {
    var I = window.I18N;
    var page = DATA[id];
    if (!page || !(I && I.isPL)) return "";

    var titleId = "ia-title-" + id, out = "", list = "";
    function flush() { if (list) { out += '<ul class="ia-list">' + list + '</ul>'; list = ""; } }

    page.blocks.forEach(function (b) {
      var body = inline(b.text, b.links);
      if (b.t === "li") { list += "<li>" + body + "</li>"; return; }
      flush();
      if (b.t === "h1") out += '<h2 class="ia-title" id="' + titleId + '">' + body + '</h2>';
      else if (b.t === "h2") out += "<h2>" + body + "</h2>";
      else if (b.t === "h3") out += "<h3>" + body + "</h3>";
      else out += "<p>" + body + "</p>";
    });
    flush();

    var hasTitle = page.blocks.some(function (b) { return b.t === "h1"; });
    return '<section class="panel pad ia" lang="pl"' + (hasTitle ? ' aria-labelledby="' + titleId + '"' : '') +
      ' data-source="' + esc(page.source) + '"><div class="ia-body">' + out + '</div></section>';
  }

  window.InstrumentAdditionalContent = { html: html, has: function (id) { return !!DATA[id]; } };
})();
