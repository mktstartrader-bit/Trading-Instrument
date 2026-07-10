/* ============================================================
   STARTRADER — Instrument detail page (light theme)
   Reads ?symbol=<id> and renders full instrument info + chart
   ============================================================ */
(function () {
  "use strict";

  function qs(name) { return new URLSearchParams(location.search).get(name); }
  function fmt(n, dp) { return Number(n).toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp }); }
  function seeded(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () { h += 0x6d2b79f5; var t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
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
  function marginPct(lev) {
    var m = /1:(\d+)/.exec(lev || "");
    if (!m) return "—";
    var pct = 100 / parseInt(m[1], 10);
    return (pct < 1 ? pct.toFixed(2) : (pct % 1 ? pct.toFixed(1) : pct.toFixed(0))) + "%";
  }
  function bcell(k, v) { return '<div class="bi"><div class="k">' + k + '</div><div class="v">' + v + '</div></div>'; }

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

  function buildChart(it, n) {
    var rnd = seeded(it.sym + n), pts = [], v = 50;
    for (var i = 0; i < n; i++) { v += (rnd() - 0.5) * 14 + it.trend * 0.9; v = Math.max(10, Math.min(90, v)); pts.push(v); }
    return pts;
  }

  function renderChart(it, range) {
    var wrap = document.getElementById("chart");
    var counts = { "1D": 24, "1W": 40, "1M": 60, "1Y": 90 };
    var n = counts[range] || 60, pts = buildChart(it, n);
    var W = 800, H = 300, pad = 8;
    var max = Math.max.apply(null, pts), min = Math.min.apply(null, pts), rng = (max - min) || 1, step = W / (pts.length - 1);
    var coords = pts.map(function (p, i) { return { x: i * step, y: H - pad - ((p - min) / rng) * (H - pad * 2 - 20) }; });
    var d = coords.map(function (c, i) { return (i ? "L" : "M") + c.x.toFixed(1) + " " + c.y.toFixed(1); }).join(" ");
    var area = d + " L " + W + " " + H + " L 0 " + H + " Z";
    var gridLines = "";
    for (var g = 1; g < 4; g++) { var y = (H / 4) * g; gridLines += '<line class="grid-line" x1="0" y1="' + y + '" x2="' + W + '" y2="' + y + '"/>'; }
    var up = it.chg >= 0, col = up ? "#0ca678" : "#e5484d";

    wrap.innerHTML =
      '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">' +
      '<defs><linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + col + '" stop-opacity="0.20"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>' +
      gridLines +
      '<path d="' + area + '" fill="url(#areaG)"/>' +
      '<path class="area-line" d="' + d + '" style="stroke:' + col + '"/>' +
      '<circle class="cursor-dot" cx="-20" cy="-20" style="fill:' + col + '"/>' +
      '</svg><div class="chart-tip" id="tip"></div>';

    var line = wrap.querySelector(".area-line");
    try { var len = line.getTotalLength(); line.style.strokeDasharray = len; line.style.strokeDashoffset = len; line.getBoundingClientRect(); line.style.transition = "stroke-dashoffset 1.1s cubic-bezier(0.16,1,0.3,1)"; line.style.strokeDashoffset = "0"; } catch (e) {}

    var dot = wrap.querySelector(".cursor-dot"), tip = document.getElementById("tip");
    wrap.onpointermove = function (e) {
      var r = wrap.getBoundingClientRect();
      var idx = Math.max(0, Math.min(coords.length - 1, Math.round(((e.clientX - r.left) / r.width) * (coords.length - 1))));
      var c = coords[idx];
      dot.setAttribute("cx", c.x); dot.setAttribute("cy", c.y);
      tip.style.left = (c.x / W) * r.width + "px"; tip.style.top = (c.y / H) * r.height + "px"; tip.style.opacity = "1";
      tip.innerHTML = (it.cur || "") + fmt(it.price * (0.97 + (pts[idx] / 100) * 0.06), it.dp);
    };
    wrap.onpointerleave = function () { tip.style.opacity = "0"; dot.setAttribute("cx", -20); dot.setAttribute("cy", -20); };
  }

  function relatedTable(list) {
    if (!list.length) return "";
    var rows = list.map(function (it) {
      var up = it.chg >= 0;
      return '<tr class="row" data-href="instrument.html?symbol=' + it.id + '">' +
        '<td class="left"><div class="inst"><span class="ic" style="background:linear-gradient(135deg,' + it.grad[0] + ',' + it.grad[1] + ')"><span>' + shortBadge(it) + '</span></span>' +
          '<div class="meta"><span class="sym">' + it.sym + '</span><span class="nm">' + it.name + '</span></div></div></td>' +
        '<td><span class="px tnum">' + (it.cur || "") + fmt(it.price, it.dp) + '</span></td>' +
        '<td><span class="chg ' + (up ? "up" : "down") + ' tnum">' + arrow(up) + (up ? "+" : "") + it.chg.toFixed(2) + '%</span></td>' +
        '<td><a class="trade" href="instrument.html?symbol=' + it.id + '">Trade <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></td></tr>';
    }).join("");
    return '<div class="rel-table"><div class="table-scroll"><table class="instruments" style="min-width:600px">' +
      '<thead><tr><th class="left">Instrument</th><th>Price</th><th>24h</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  function row(k, v) { return '<div class="row"><span>' + k + '</span><b>' + v + '</b></div>'; }
  function spec(k, v) { return '<div class="spec"><div class="k">' + k + '</div><div class="v">' + v + '</div></div>'; }
  function contractSize(cat) {
    return { forex: "100,000", metals: "100 oz", indices: "1 index", commodities: "1,000 units", shares: "1 share", crypto: "1 coin", etf: "1 unit" }[cat] || "1";
  }

  function render(it) {
    document.title = it.sym + " — " + it.name + " | STARTRADER";
    var up = it.chg >= 0, half = halfSpread(it);
    var bidP = it.price - half, askP = it.price + half;
    var dayLow = it.price * 0.988, dayHigh = it.price * 1.011, yLow = it.price * 0.72, yHigh = it.price * 1.28;

    document.getElementById("app").innerHTML =
      '<nav class="breadcrumb"><a href="index.html">Instruments</a><span class="sep">›</span>' +
        '<a href="index.html">' + catLabel(it.cat) + '</a><span class="sep">›</span><span class="cur">' + it.sym + '</span></nav>' +

      '<div class="d-hero">' +
        '<div class="d-main panel">' +
          '<div class="d-head">' +
            '<div class="d-badge" style="background:linear-gradient(135deg,' + it.grad[0] + ',' + it.grad[1] + ')">' + shortBadge(it) + '</div>' +
            '<div class="d-title"><h1>' + it.sym + '</h1><div class="sub">' + it.name + ' <span class="pill">' + catLabel(it.cat) + '</span></div></div>' +
          '</div>' +
          '<div class="d-price-row">' +
            '<div class="d-price">' + (it.cur ? '<span class="cur">' + it.cur + '</span>' : '') + fmt(it.price, it.dp) + '</div>' +
            '<div class="d-change ' + (up ? "up" : "down") + '">' + arrow(up) + (up ? "+" : "") + it.chg.toFixed(2) + '% today</div>' +
          '</div>' +
          '<div class="range-tabs" id="rangeTabs">' +
            '<button data-r="1D">1D</button><button data-r="1W">1W</button><button data-r="1M" class="active">1M</button><button data-r="1Y">1Y</button></div>' +
          '<div class="chart" id="chart"></div>' +
        '</div>' +

        '<div class="d-side">' +
          '<div class="quote-card panel"><h3>Live Quote</h3>' +
            '<div class="bidask">' +
              '<div class="ba sell"><div class="lab">Sell</div><div class="val tnum">' + fmt(bidP, it.dp) + '</div></div>' +
              '<div class="ba buy"><div class="lab">Buy</div><div class="val tnum">' + fmt(askP, it.dp) + '</div></div>' +
            '</div>' +
            '<div class="spread-line">Spread <b>' + it.spread + '</b> · Leverage up to <b>' + it.leverage + '</b></div>' +
            '<div class="d-cta"><a href="#" class="btn btn-sell">Sell</a><a href="#" class="btn btn-buy">Buy</a></div>' +
          '</div>' +
          '<div class="d-banner">' +
            bcell("Trading Symbol", it.sym) +
            bcell("Leverage", "Up to " + it.leverage) +
            bcell("Margin", "from " + marginPct(it.leverage)) +
            bcell("Trading Hours (GMT)", it.hours) +
          '</div>' +
          '<div class="mini-stats panel">' +
            row("Day Range", fmt(dayLow, it.dp) + " – " + fmt(dayHigh, it.dp)) +
            row("52-Week Range", fmt(yLow, it.dp) + " – " + fmt(yHigh, it.dp)) +
            row("Change %", (up ? "+" : "") + it.chg.toFixed(2) + "%") +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="d-grid">' +
        '<div class="panel pad"><h3>Contract Specifications</h3><div class="muted">Key trading conditions for ' + it.sym + '</div>' +
          '<div class="specs">' +
            spec("Symbol", it.sym) + spec("Asset Class", catLabel(it.cat)) + spec("Min. Spread", String(it.spread)) +
            spec("Max. Leverage", it.leverage) + spec("Trading Hours", it.hours) + spec("Contract Size", contractSize(it.cat)) +
          '</div>' +
        '</div>' +
        '<div class="panel pad"><h3>About ' + it.sym + '</h3><div class="muted">' + it.name + '</div>' +
          '<p><b>' + it.sym + '</b> ' + (about[it.cat] || "") + '</p></div>' +
      '</div>' +

      (it.variants && it.variants.length ?
        '<div class="panel pad" style="margin-top:16px"><h3>Available Symbols</h3>' +
          '<div class="muted">' + it.variants.length + ' tradable variant' + (it.variants.length > 1 ? "s" : "") + ' for ' + it.sym + ' (account type / feed)</div>' +
          '<div class="variants">' + it.variants.map(function (v) { return '<span class="vchip">' + v + '</span>'; }).join("") + '</div></div>' : "") +

      '<div class="related"><h3>Related in ' + catLabel(it.cat) + '</h3>' +
        relatedTable(window.INSTRUMENTS.filter(function (x) { return x.cat === it.cat && x.id !== it.id; }).slice(0, 4)) +
        '<a href="index.html" class="btn btn-outline back-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M11 18l-6-6 6-6"/></svg> Back to all instruments</a>' +
      '</div>';

    renderChart(it, "1M");
    document.querySelectorAll("#rangeTabs button").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll("#rangeTabs button").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active"); renderChart(it, b.dataset.r);
      });
    });
    document.querySelectorAll(".rel-table tr.row").forEach(function (tr) {
      tr.addEventListener("click", function (e) { if (e.target.closest("a")) return; location.href = tr.dataset.href; });
    });
  }

  function notFound(id) {
    document.getElementById("app").innerHTML =
      '<div class="empty" style="padding:120px 20px"><div class="big">🧭</div>' +
      '<h2 style="font-size:24px;margin-bottom:8px;color:var(--navy)">Instrument not found</h2>' +
      '<p style="margin-bottom:22px">We couldn\'t find “' + (id || "") + '”.</p>' +
      '<a href="index.html" class="btn btn-primary">Browse all instruments</a></div>';
  }

  function init() {
    var id = qs("symbol");
    var it = window.INSTRUMENTS.find(function (x) { return x.id === id; });
    if (!it) return notFound(id);
    render(it);
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
