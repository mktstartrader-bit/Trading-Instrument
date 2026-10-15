/* ============================================================
   STARTRADER — shared navbar + footer (injected into both pages)
   Menu & footer content mirrors startrader.com
   ============================================================ */
(function () {
  "use strict";

  var LOGO = '<img class="logo-img" src="assets/logo.svg" alt="STARTRADER" width="152" height="30" />';

  var caret = '<svg class="caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 9l6 6 6-6"/></svg>';

  function col(h, items) {
    return '<div class="dd-col"><h4>' + h + '</h4>' + items.map(function (i) { return '<a href="#">' + i + '</a>'; }).join("") + '</div>';
  }

  var link = function (url) { return window.I18N ? window.I18N.href(url) : url; };

  var NAV =
    '<div class="wrap"><div class="nav-inner">' +
      '<a class="brand" href="' + link("index.html") + '">' + LOGO + '</a>' +
      '<ul class="menu">' +
        '<li><a href="#">Trading ' + caret + '</a><div class="dropdown mega">' +
          col("Getting Started", ["Account Opening", "Trading Account", "Prime ECN", "Funding &amp; Withdrawal"]) +
          col("Platforms", ["MT5", "MT4", "Copy Trade", "STAR Copy", "STAR Web Trading", "Web Trader", "Mobile Apps", "Pro-Link"]) +
          col("Products", ["Forex", "Commodities", "Metals", "Energies", "Indices", "Shares", "ETFs"]) +
        '</div></li>' +
        '<li><a href="#">Education ' + caret + '</a><div class="dropdown mega">' +
          col("Learn", ["Knowledge Center", "Glossary", "Financial Market Analysis"]) +
          col("Analysis", ["News Room", "Economic Calendar"]) +
          col("Academy", ["Webinars"]) +
        '</div></li>' +
        '<li><a href="#">Promotions ' + caret + '</a><div class="dropdown">' +
          col("Promotions", ["Our Promotions", "STAR Trading League", "Eid Prosperity Boost", "Point Mall", "Deposit Bonuses", "1% Switch Allowance", "VPS"]) +
        '</div></li>' +
        '<li><a href="#">Company ' + caret + '</a><div class="dropdown mega">' +
          col("About", ["Why STARTRADER", "CSR", "Events", "Media Coverage", "Achievements", "Careers", "Help Center", "Contact"]) +
          col("Corporate", ["Regulation", "Legal Documents", "Insurance", "Liquidity Providers"]) +
          col("Partnership", ["Introducing Broker", "Affiliate", "Money Manager", "Institutional"]) +
        '</div></li>' +
      '</ul>' +
      '<div class="nav-right">' +
        (window.I18N ? window.I18N.buttonHTML() : "") +
        '<a href="#" class="btn btn-outline">Login</a>' +
        '<a href="#" class="btn btn-primary">Open Live Account</a>' +
        '<button class="hamburger" id="hamburger" aria-label="Menu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button>' +
      '</div>' +
    '</div></div>';

  function fcol(h, items) {
    return '<div class="footer-col"><h4>' + h + '</h4>' + items.map(function (i) { return '<a href="#">' + i + '</a>'; }).join("") + '</div>';
  }
  function social(label, path) {
    return '<a href="#" aria-label="' + label + '"><svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">' + path + '</svg></a>';
  }
  var S = {
    fb: '<path d="M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0022 12z"/>',
    ig: '<path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 3.2A6.6 6.6 0 1018.6 12 6.6 6.6 0 0012 5.4zm0 10.9A4.3 4.3 0 1116.3 12 4.3 4.3 0 0112 16.3zm6.8-11.2a1.5 1.5 0 11-1.5-1.5 1.5 1.5 0 011.5 1.5z"/>',
    li: '<path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5V9h3zM6.5 7.7A1.7 1.7 0 118.2 6a1.7 1.7 0 01-1.7 1.7zM19 19h-3v-4.9c0-1.2 0-2.7-1.6-2.7s-1.9 1.3-1.9 2.6V19h-3V9h2.9v1.4h.04a3.2 3.2 0 012.9-1.6c3.1 0 3.7 2 3.7 4.7z"/>',
    x: '<path d="M18.2 2h3.3l-7.2 8.3L23 22h-6.6l-5.2-6.8L5.3 22H2l7.7-8.8L1.5 2h6.8l4.7 6.2zm-1.2 18h1.8L7.1 3.8H5.2z"/>',
    yt: '<path d="M23 7.5a3 3 0 00-2.1-2.1C19 4.8 12 4.8 12 4.8s-7 0-8.9.6A3 3 0 001 7.5 31 31 0 00.5 12 31 31 0 001 16.5a3 3 0 002.1 2.1c1.9.6 8.9.6 8.9.6s7 0 8.9-.6a3 3 0 002.1-2.1A31 31 0 0023.5 12 31 31 0 0023 7.5zM9.8 15.3V8.7l5.7 3.3z"/>',
    tk: '<path d="M20 8.3a6.8 6.8 0 01-4-1.3v6.9a5.7 5.7 0 11-5.7-5.7c.3 0 .6 0 .9.1v2.9a2.8 2.8 0 00-.9-.1 2.8 2.8 0 102.8 2.8V2h2.8a4 4 0 004 3.9z"/>',
    sp: '<path d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.6 14.4a.6.6 0 01-.9.2c-2.3-1.4-5.3-1.8-8.8-1a.6.6 0 11-.3-1.2c3.8-.9 7.1-.5 9.7 1.1.3.2.4.6.3.9zm1.2-2.7a.8.8 0 01-1 .3c-2.7-1.6-6.7-2.1-9.9-1.1a.8.8 0 11-.4-1.5c3.6-1.1 8-.6 11.1 1.3.3.2.5.7.2 1zm.1-2.8C14.7 9 8.9 8.8 5.8 9.8a.9.9 0 11-.5-1.8c3.6-1.1 10-.9 13.6 1.3a.9.9 0 01-.9 1.6z"/>'
  };

  var FOOTER =
    '<div class="wrap">' +
      '<div class="footer-top">' +
        '<div class="footer-brand">' +
          '<img class="logo-img foot" src="assets/logo-white.svg" alt="STARTRADER" width="168" height="33" />' +
          '<p>A globally trusted multi-asset broker offering deep liquidity, tight spreads and fast execution across 600+ instruments.</p>' +
          '<div class="socials">' +
            social("Facebook", S.fb) + social("Instagram", S.ig) + social("LinkedIn", S.li) +
            social("X", S.x) + social("YouTube", S.yt) + social("TikTok", S.tk) + social("Spotify", S.sp) +
          '</div>' +
        '</div>' +
        fcol("Conditions", ["Account Opening", "Trading Account", "Prime ECN", "Funding &amp; Withdrawal"]) +
        fcol("Platforms", ["MT5", "MT4", "Copy Trade", "Web Trader", "Mobile Apps", "Pro-Link"]) +
        fcol("Products", ["Forex", "Commodities", "Indices", "Shares", "ETFs"]) +
        fcol("Education", ["Knowledge Center", "News Room", "Economic Calendar", "Webinars"]) +
        fcol("Company", ["Why STARTRADER", "Regulation", "Legal Documents", "Careers", "Help Center", "Contact Us"]) +
      '</div>' +
      '<div class="footer-legal">' +
        '<p class="risk"><b>Risk Warning:</b> CFDs are complex instruments and come with a high risk of losing money rapidly due to leverage. ' +
        'You should consider whether you understand how CFDs work and whether you can afford to take the high risk of losing your money. ' +
        'The STARTRADER group of companies is authorised and regulated across multiple jurisdictions including the UAE, Australia, South Africa, Seychelles, Mauritius and Cyprus. ' +
        'The information on this page is for illustrative and educational purposes only and does not constitute investment advice. Prices shown are indicative.</p>' +
        '<div class="footer-bottom">' +
          '<span>©2026 STARTRADER. All rights reserved.</span>' +
          '<div class="links"><a href="#">Privacy Policy</a><a href="#">Terms &amp; Conditions</a><a href="#">Legal Documents</a><a href="#">Sitemap</a></div>' +
        '</div>' +
      '</div>' +
    '</div>';

  function inject() {
    var nav = document.getElementById("site-nav");
    var foot = document.getElementById("site-footer");
    if (nav) { nav.className = "nav"; nav.id = "site-nav"; nav.innerHTML = NAV; }
    if (foot) { foot.className = "footer"; foot.innerHTML = FOOTER; }
    if (window.I18N) window.I18N.bindButton(nav);

    // scroll shadow
    var navEl = document.getElementById("site-nav");
    if (navEl) {
      window.addEventListener("scroll", function () { navEl.classList.toggle("scrolled", window.scrollY > 6); }, { passive: true });
    }
    // mobile: tapping hamburger jumps to menu (simple graceful fallback)
    var hb = document.getElementById("hamburger");
    if (hb) hb.addEventListener("click", function () { document.querySelector(".search input") && document.querySelector(".search input").focus(); });
  }

  if (document.readyState !== "loading") inject();
  else document.addEventListener("DOMContentLoaded", inject);
})();
