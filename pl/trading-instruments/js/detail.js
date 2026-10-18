/* ============================================================
   STARTRADER — Instrument detail page (light theme)
   Reads ?symbol=<id> and renders full instrument info + chart
   Chart supports a Candles / Line switch with a dated x-axis.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- language ----------
     In Polish every string below that the workbook covers is read from
     I.inst(id) — the instrument's own sheet, verbatim. The spec labels the
     workbook does not define (Leverage, Margin, Day Range, …) come from the
     shared per-language specLabels block in content-pl.js. */
  var I = window.I18N;
  function link(url) { return I ? I.href(url) : url; }
  var SPEC = (I && I.ui && I.ui.specLabels) || {};
  function label(key, en) { return SPEC[key] || en; }

  function qs(name) { return new URLSearchParams(location.search).get(name); }
  function catLabel(id) {
    var localized = I && I.catLabel(id);
    if (localized) return localized;
    var c = window.CATEGORIES.find(function (c) { return c.id === id; });
    return c ? c.label : id;
  }
  function shortBadge(it) {
    if (it.cat === "forex" || it.cat === "crypto" || it.cat === "metals") return it.sym.split("/")[0].slice(0, 4);
    return it.sym.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase();
  }
  function marginPct(lev) {
    var m = /1:(\d+)/.exec(lev || "");
    if (!m) return "—";
    var pct = 100 / parseInt(m[1], 10);
    return (pct < 1 ? pct.toFixed(2) : (pct % 1 ? pct.toFixed(1) : pct.toFixed(0))) + "%";
  }
  function bcell(k, v) { return '<div class="bi"><div class="k">' + k + '</div><div class="v">' + v + '</div></div>'; }

  function variantDesc(raw) {
    if (/\.m\+$/.test(raw)) return "Prime ECN · metals feed";
    if (/\.c$/.test(raw)) return "Cent account";
    if (/\+$/.test(raw)) return "Prime ECN · raw spreads";
    if (/#$/.test(raw)) return "ECN · raw spreads";
    if (/\.bc$/.test(raw)) return "Blockchain / crypto feed";
    if (/\.z$/.test(raw)) return "Zero-spread account";
    if (/\.r$/.test(raw)) return "Raw-spread account";
    if (/\.i$/.test(raw)) return "Index-priced feed";
    if (/\.m$/.test(raw)) return "Metals-priced feed";
    if (/\.crp$/.test(raw)) return "Corporate feed";
    if (/\.24H$/i.test(raw)) return "24-hour trading";
    if (/ft$/i.test(raw)) return "Futures contract";
    if (/\.XTKS$/.test(raw)) return "Tokyo Stock Exchange";
    return "Standard account";
  }

  /* ---------- About section content (row 24) ---------- */
  var about = {
    forex: "is one of the most actively traded currency pairs in the global foreign-exchange market. Prices are driven by interest-rate differentials, macroeconomic data and central-bank policy. Trade it around the clock, five days a week, with deep liquidity and tight spreads.",
    metals: "is a benchmark precious-metal contract widely used as a store of value and a hedge against inflation and market volatility. Its price reacts to real yields, the US dollar and safe-haven demand.",
    indices: "tracks the performance of a basket of leading listed companies, giving you diversified exposure to an entire economy or sector in a single trade. Index CFDs let you go long or short with competitive margins.",
    energies: "is a globally traded energy benchmark whose price responds to supply-and-demand dynamics, OPEC+ policy, inventories and geopolitics.",
    commodities: "is a globally traded commodity whose price is shaped by supply-and-demand fundamentals, weather, seasonality and global growth. It offers portfolio diversification and trending opportunities.",
    shares: "lets you trade the price movements of a leading listed company without owning the underlying stock. Share CFDs offer flexible leverage and the ability to go long or short around earnings and news.",
    crypto: "is a leading digital asset traded 24/7 across global venues. Crypto CFDs let you speculate on price movements — up or down — with leverage and no need for a wallet or exchange account.",
    etf: "is an exchange-traded fund giving diversified exposure to a basket of assets or a theme in a single instrument. ETF CFDs let you trade long or short with competitive conditions."
  };

  var DRIVERS = {
    forex: ["Central-bank interest-rate decisions (Fed, ECB, BoE)", "Inflation, employment and GDP releases", "Trade balances and cross-border capital flows", "Risk sentiment and geopolitical events"],
    metals: ["US dollar strength and real bond yields", "Inflation and safe-haven demand", "Central-bank reserve buying", "Geopolitical and macro-economic risk"],
    indices: ["Corporate earnings and forward guidance", "Monetary policy and interest rates", "Economic growth and jobs data", "Sector rotation and market sentiment"],
    commodities: ["Global supply-and-demand balances", "Weather, seasonality and harvests", "OPEC+ and production decisions", "US dollar strength and inventory data"],
    shares: ["Company earnings and forward guidance", "Sector and industry trends", "Interest rates and the macro backdrop", "News flow and market sentiment"],
    crypto: ["Network adoption and on-chain flows", "Regulation and spot-ETF developments", "Global risk appetite and liquidity", "Macro conditions and the US dollar"],
    etf: ["Performance of the underlying basket", "Fund inflows, outflows and rebalancing", "Interest rates and the macro backdrop", "Sector and thematic trends"]
  };

  function whyPoints(it) {
    return [
      "Competitive spreads with deep institutional liquidity",
      "Leverage up to " + it.leverage + " — margin from " + marginPct(it.leverage),
      "Go long or short to trade both rising and falling markets",
      "Trade " + it.hours + " with sub-30ms execution on MT4, MT5 & STAR Web Trading"
    ];
  }

  var ICO_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M20 6L9 17l-5-5"/></svg>';
  var ICO_DOT = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4"/></svg>';
  function ulist(items, icon) {
    return '<ul class="about-list">' + items.map(function (t) { return '<li>' + icon + '<span>' + t + '</span></li>'; }).join("") + '</ul>';
  }

  /* ============================================================ RELATED */

  function relatedTable(list) {
    if (!list.length) return "";
    var cols = (I && I.ui && I.ui.columns) || [];
    var rows = list.map(function (it) {
      var p = I && I.inst(it.id);
      var sym = (p && p.sym) || it.sym, name = (p && p.name) || it.name;
      var url = link("instrument.html?symbol=" + it.id);
      return '<tr class="row" data-href="' + url + '">' +
        '<td class="left"><div class="inst"><span class="ic" style="background:linear-gradient(135deg,' + it.grad[0] + ',' + it.grad[1] + ')"><span>' + ((p && p.badge) || shortBadge(it)) + '</span></span>' +
          '<div class="meta"><span class="sym">' + sym + '</span>' +
            (name && name !== sym ? '<span class="nm">' + name + '</span>' : '') + '</div></div></td>' +
        '<td><a class="trade" href="' + url + '">' + (cols[6] || "Trade") + ' <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></td></tr>';
    }).join("");
    return '<div class="rel-table"><div class="table-scroll"><table class="instruments" style="min-width:0">' +
      '<thead><tr><th class="left">' + (cols[0] || "Instrument") + '</th><th><span class="sr-only">' + (cols[6] || "Trade") + '</span></th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }


  /* ============================================================ PAGE */

  function render(it) {
    /* p = this instrument's workbook sheet (Polish); null in English */
    var p = I && I.inst(it.id);
    if (p) { I.applyMeta(it.id); } else { document.title = it.sym + " — " + it.name + " | STARTRADER"; }

    var sym = (p && p.sym) || it.sym;
    var name = (p && p.name) || it.name;
    var home = link("index.html");
    var crumb = p ? p.crumb : ["Instruments", catLabel(it.cat), it.sym];
    var variants = p ? p.variants : it.variants.map(function (v) { return [v, variantDesc(v)]; });

    document.getElementById("app").innerHTML =
      '<nav class="breadcrumb"><a href="' + home + '">' + crumb[0] + '</a><span class="sep">›</span>' +
        '<a href="' + home + '">' + crumb[1] + '</a><span class="sep">›</span><span class="cur">' + crumb[2] + '</span></nav>' +

      '<div class="d-hero">' +
        '<div class="d-main panel">' +
          '<div class="d-head">' +
            '<div class="d-badge" style="background:linear-gradient(135deg,' + it.grad[0] + ',' + it.grad[1] + ')">' + ((p && p.badge) || shortBadge(it)) + '</div>' +
            /* a few sheets give the same string for the title and the name line */
            '<div class="d-title"><h1>' + sym + '</h1><div class="sub">' + (name === sym ? "" : name + " ") +
              '<span class="pill">' + ((p && p.cat) || catLabel(it.cat)) + '</span></div></div>' +
          '</div>' +
          '<div class="tv-chart" id="tvChart"></div>' +
        '</div>' +

        '<div class="d-side">' +
          '<div class="quote-card panel"><h2>' + ((p && p.quoteHead) || "Live Quote") + '</h2>' +
            '<div class="tv-quote" id="tvQuote"></div>' +
            '<div class="d-cta"><a href="#" class="btn btn-sell">' + ((p && p.sell) || "Sell") + '</a>' +
              '<a href="#" class="btn btn-buy">' + ((p && p.buy) || "Buy") + '</a></div>' +
          '</div>' +
          '<div class="d-banner">' +
            bcell(label("tradeSym", "Trading Symbol"), (p && p.tradeSym) || it.sym) +
            bcell(label("leverage", "Leverage"), ((p && p.levPrefix) || "Up to") + " " + it.leverage) +
            bcell(label("margin", "Margin"), ((p && p.marginPrefix) || "from") + " " + marginPct(it.leverage)) +
            bcell(label("hours", "Trading Hours (GMT)"), it.hours) +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="panel pad" style="margin-top:16px"><h2>' + ((p && p.aboutHead) || ("About " + it.sym)) + '</h2>' +
        '<div class="muted">' + ((p && p.aboutName) || it.name) + '</div>' +
        '<p>' + (p ? p.about : '<b>' + it.sym + '</b> ' + (about[it.cat] || "")) + '</p>' +
        '<div class="about-cols">' +
          '<div><div class="about-sub">' + ((p && p.whyHead) || ("Why trade " + it.sym + " with STARTRADER")) + '</div>' +
            ulist(p ? p.why : whyPoints(it), ICO_CHECK) + '</div>' +
          '<div><div class="about-sub">' + ((p && p.driversHead) || "Key market drivers") + '</div>' +
            ulist(p ? p.drivers : (DRIVERS[it.cat] || []), ICO_DOT) + '</div>' +
        '</div>' +
      '</div>' +

      (variants && variants.length ?
        '<div class="panel pad" style="margin-top:16px"><h2>' + ((p && p.symbolsHead) || "Available Symbols") + '</h2>' +
          '<div class="muted">' + (p ? p.symbolsIntro :
            "The same instrument is offered on " + variants.length + " account type" + (variants.length > 1 ? "s" : "") +
            " / data feed" + (variants.length > 1 ? "s" : "") + ". Symbol suffixes vary by platform and account.") + '</div>' +
          '<div class="vgrid">' + variants.map(function (v) {
            return '<div class="vitem"><span class="vsym">' + v[0] + '</span><span class="vdesc">' + v[1] + '</span></div>';
          }).join("") + '</div></div>' : "") +

      /* long-form PL section from the content workbook (empty for other pages / EN) */
      (window.InstrumentAdditionalContent ? window.InstrumentAdditionalContent.html(it.id) : "") +

      '<div class="related"><h2>' + ((p && p.relatedHead) || ("Related in " + catLabel(it.cat))) + '</h2>' +
        relatedTable(window.INSTRUMENTS.filter(function (x) { return x.cat === it.cat && x.id !== it.id; }).slice(0, 4)) +
        '<a href="' + home + '" class="btn btn-outline back-btn">' +
          /* the workbook's own back label already carries its arrow */
          (p ? p.back : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M11 18l-6-6 6-6"/></svg> Back to all instruments') +
        '</a>' +
      '</div>';

    var tv = window.TV && window.TV.symbol(it.id);
    if (tv) {
      window.TV.embed(document.getElementById("tvQuote"), "single-quote", { symbol: tv, width: "100%", isTransparent: true, colorTheme: "light" });
      window.TV.embed(document.getElementById("tvChart"), "advanced-chart", {
        autosize: true, symbol: tv, interval: "D", timezone: "Etc/UTC", theme: "light", style: "1",
        hide_side_toolbar: true, allow_symbol_change: false, save_image: false, calendar: false,
        support_host: "https://www.tradingview.com"
      });
    }

    document.querySelectorAll(".rel-table tr.row").forEach(function (tr) {
      tr.addEventListener("click", function (e) { if (e.target.closest("a")) return; location.href = tr.dataset.href; });
    });
  }

  function notFound(id) {
    document.getElementById("app").innerHTML =
      '<div class="empty" style="padding:120px 20px"><div class="big">🧭</div>' +
      '<h2 style="font-size:24px;margin-bottom:8px;color:var(--navy)">Instrument not found</h2>' +
      '<p style="margin-bottom:22px">We couldn\'t find “' + (id || "") + '”.</p>' +
      '<a href="' + link("index.html") + '" class="btn btn-primary">Browse all instruments</a></div>';
  }

  function init() {
    /* ?tvwidgetsymbol= arrives from a TradingView Market Data row click */
    var id = (window.PL_STATIC && window.PL_STATIC.id) || qs("symbol") ||
      (window.TV && window.TV.idFor(qs("tvwidgetsymbol")));
    var it = window.INSTRUMENTS.find(function (x) { return x.id === id; });
    if (!it) return notFound(id);
    render(it);
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
