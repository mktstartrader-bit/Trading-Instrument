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
  function fmt(n, dp) { return Number(n).toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp }); }
  function seeded(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () { h += 0x6d2b79f5; var t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
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
      "Spreads from " + it.spread + " with deep institutional liquidity",
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

  /* ============================================================ CHART */

  /* timeframes (row 11): candle count · per-candle duration · axis label style */
  var MIN = 60000, HR = 3600000, DAY = 86400000;
  var TF = {
    "1m":  { n: 30, step: MIN,       fmt: "time" },
    "5m":  { n: 32, step: 5 * MIN,   fmt: "time" },
    "15m": { n: 32, step: 15 * MIN,  fmt: "time" },
    "30m": { n: 32, step: 30 * MIN,  fmt: "time" },
    "1H":  { n: 30, step: HR,        fmt: "time" },
    "4H":  { n: 30, step: 4 * HR,    fmt: "date" },
    "1D":  { n: 30, step: DAY,       fmt: "date" },
    "1W":  { n: 30, step: 7 * DAY,   fmt: "date" },
    "1M":  { n: 24, step: 30 * DAY,  fmt: "month" }
  };
  var TF_ORDER = ["1m", "5m", "15m", "30m", "1H", "4H", "1D", "1W", "1M"];
  var UP = "#0ca678", DOWN = "#e5484d";
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  /* seeded OHLC walk, scaled so the final close lands on the live price */
  function buildCandles(it, n, range) {
    var rnd = seeded(it.sym + "|" + range + "|" + n);
    var price = it.price, v = price * (0.90 + rnd() * 0.06), arr = [];
    for (var i = 0; i < n; i++) {
      var open = v;
      var vol = price * (0.006 + rnd() * 0.018);
      var close = open + ((rnd() - 0.5) + it.trend * 0.16) * vol * 2;
      var high = Math.max(open, close) + rnd() * vol;
      var low = Math.min(open, close) - rnd() * vol;
      arr.push({ o: open, h: high, l: low, c: close });
      v = close;
    }
    var scale = price / arr[arr.length - 1].c;
    arr.forEach(function (k) { k.o *= scale; k.h *= scale; k.l *= scale; k.c *= scale; });
    return arr;
  }

  function pad2(v) { return (v < 10 ? "0" : "") + v; }

  /* per-candle axis labels ending at "now", scaled to the timeframe */
  function buildDates(range, n) {
    var tf = TF[range] || TF["1D"], now = Date.now(), out = [];
    for (var i = 0; i < n; i++) {
      var d = new Date(now - (n - 1 - i) * tf.step);
      if (tf.fmt === "time") out.push(pad2(d.getHours()) + ":" + pad2(d.getMinutes()));
      else if (tf.fmt === "month") out.push(MON[d.getMonth()] + " '" + String(d.getFullYear()).slice(2));
      else out.push(MON[d.getMonth()] + " " + d.getDate());
    }
    return out;
  }

  function renderChart(it, range, type) {
    var wrap = document.getElementById("chart");
    var n = (TF[range] || TF["1D"]).n;
    var candles = buildCandles(it, n, range);
    var dates = buildDates(range, n);
    var W = 800, H = 300, padTop = 14, padBot = 14, padRight = 58;
    var plotH = H - padTop - padBot, plotW = W - padRight;

    var max, min;
    if (type === "line") {
      var cs = candles.map(function (c) { return c.c; });
      max = Math.max.apply(null, cs); min = Math.min.apply(null, cs);
    } else {
      max = Math.max.apply(null, candles.map(function (c) { return c.h; }));
      min = Math.min.apply(null, candles.map(function (c) { return c.l; }));
    }
    var pad = (max - min) * 0.08 || 1; max += pad; min -= pad;
    var rng = (max - min) || 1, step = plotW / n;
    function Y(v) { return padTop + (max - v) / rng * plotH; }

    var grid = "";
    for (var g = 1; g < 4; g++) { var gy = padTop + (g / 4) * plotH; grid += '<line class="grid-line" x1="0" y1="' + gy.toFixed(1) + '" x2="' + plotW + '" y2="' + gy.toFixed(1) + '"/>'; }

    var body = "", up = it.chg >= 0;
    if (type === "line") {
      var col = up ? UP : DOWN;
      var d = candles.map(function (c, i) { var x = i * step + step / 2; return (i ? "L" : "M") + x.toFixed(1) + " " + Y(c.c).toFixed(1); }).join(" ");
      var firstX = (step / 2).toFixed(1), lastX = ((n - 1) * step + step / 2).toFixed(1);
      body =
        '<defs><linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="' + col + '" stop-opacity="0.20"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>' +
        '<path d="' + d + ' L ' + lastX + ' ' + H + ' L ' + firstX + ' ' + H + ' Z" fill="url(#areaG)"/>' +
        '<path class="area-line" d="' + d + '" style="stroke:' + col + '"/>' +
        '<circle class="cursor-dot" cx="-20" cy="-20" style="fill:' + col + '"/>';
    } else {
      var bodyW = Math.min(step * 0.62, 13);
      candles.forEach(function (c, i) {
        var x = i * step + step / 2, col = c.c >= c.o ? UP : DOWN;
        var yO = Y(c.o), yC = Y(c.c), top = Math.min(yO, yC), hgt = Math.max(1.2, Math.abs(yO - yC));
        body += '<line class="wick" x1="' + x.toFixed(1) + '" y1="' + Y(c.h).toFixed(1) + '" x2="' + x.toFixed(1) + '" y2="' + Y(c.l).toFixed(1) + '" stroke="' + col + '" vector-effect="non-scaling-stroke"/>';
        body += '<rect class="candle" x="' + (x - bodyW / 2).toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + bodyW.toFixed(1) + '" height="' + hgt.toFixed(1) + '" fill="' + col + '"/>';
      });
      body += '<line class="crosshair" x1="-20" y1="' + padTop + '" x2="-20" y2="' + (H - padBot) + '" vector-effect="non-scaling-stroke"/>';
    }

    var yax = '<div class="chart-yaxis">';
    for (var k = 0; k < 5; k++) {
      var val = max - (k / 4) * (max - min), top = (padTop + (k / 4) * plotH) / H * 100;
      yax += '<span class="y-label" style="top:' + top.toFixed(2) + '%">' + (it.cur || "") + fmt(val, it.dp) + '</span>';
    }
    yax += '</div>';

    wrap.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">' + grid + body + '</svg>' + yax + '<div class="chart-tip" id="tip"></div>';

    /* x-axis dates (evenly sampled, laid out across the plot width) */
    var xEl = document.getElementById("chartDates");
    var ticks = 7, xs = "";
    for (var t = 0; t < ticks; t++) { xs += '<span>' + dates[Math.round(t * (n - 1) / (ticks - 1))] + '</span>'; }
    xEl.innerHTML = xs;

    /* line-draw animation */
    if (type === "line") {
      var line = wrap.querySelector(".area-line");
      try { var len = line.getTotalLength(); line.style.strokeDasharray = len; line.style.strokeDashoffset = len; line.getBoundingClientRect(); line.style.transition = "stroke-dashoffset 1.1s cubic-bezier(0.16,1,0.3,1)"; line.style.strokeDashoffset = "0"; } catch (e) {}
    }

    /* hover tooltip */
    var dot = wrap.querySelector(".cursor-dot"), cross = wrap.querySelector(".crosshair"), tip = document.getElementById("tip");
    wrap.onpointermove = function (e) {
      var r = wrap.getBoundingClientRect();
      var idx = Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / r.width) * (n - 1))));
      var c = candles[idx], cx = idx * step + step / 2;
      if (type === "line") {
        var cy = Y(c.c);
        dot.setAttribute("cx", cx); dot.setAttribute("cy", cy); dot.style.opacity = "1";
        tip.style.left = (cx / W) * r.width + "px"; tip.style.top = (cy / H) * r.height + "px";
        tip.innerHTML = '<div class="tt-d">' + dates[idx] + '</div><div class="tt-p">' + (it.cur || "") + fmt(c.c, it.dp) + '</div>';
      } else {
        cross.setAttribute("x1", cx); cross.setAttribute("x2", cx); cross.style.opacity = "1";
        tip.style.left = (cx / W) * r.width + "px"; tip.style.top = (Y(c.h) / H) * r.height + "px";
        tip.innerHTML = '<div class="tt-d">' + dates[idx] + '</div><div class="tt-ohlc">' +
          '<span>O<b>' + fmt(c.o, it.dp) + '</b></span><span>H<b>' + fmt(c.h, it.dp) + '</b></span>' +
          '<span>L<b>' + fmt(c.l, it.dp) + '</b></span><span>C<b>' + fmt(c.c, it.dp) + '</b></span></div>';
      }
      tip.style.opacity = "1";
    };
    wrap.onpointerleave = function () {
      tip.style.opacity = "0";
      if (dot) dot.style.opacity = "0";
      if (cross) cross.style.opacity = "0";
    };
  }

  /* ============================================================ RELATED */

  function relatedTable(list) {
    if (!list.length) return "";
    var cols = (I && I.ui && I.ui.columns) || [];
    var rows = list.map(function (it) {
      var up = it.chg >= 0, p = I && I.inst(it.id);
      var sym = (p && p.sym) || it.sym, name = (p && p.name) || it.name;
      var url = link("instrument.html?symbol=" + it.id);
      return '<tr class="row" data-href="' + url + '">' +
        '<td class="left"><div class="inst"><span class="ic" style="background:linear-gradient(135deg,' + it.grad[0] + ',' + it.grad[1] + ')"><span>' + ((p && p.badge) || shortBadge(it)) + '</span></span>' +
          '<div class="meta"><span class="sym">' + sym + '</span>' +
            (name && name !== sym ? '<span class="nm">' + name + '</span>' : '') + '</div></div></td>' +
        '<td><span class="px tnum">' + (it.cur || "") + fmt(it.price, it.dp) + '</span></td>' +
        '<td><span class="chg ' + (up ? "up" : "down") + ' tnum">' + arrow(up) + (up ? "+" : "") + it.chg.toFixed(2) + '%</span></td>' +
        '<td><a class="trade" href="' + url + '">' + (cols[6] || "Trade") + ' <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></td></tr>';
    }).join("");
    return '<div class="rel-table"><div class="table-scroll"><table class="instruments" style="min-width:600px">' +
      '<thead><tr><th class="left">' + (cols[0] || "Instrument") + '</th><th>Price</th><th>' + (cols[4] || "24h") + '</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  function row(k, v) { return '<div class="row"><span>' + k + '</span><b>' + v + '</b></div>'; }

  /* ============================================================ PAGE */

  function render(it) {
    /* p = this instrument's workbook sheet (Polish); null in English */
    var p = I && I.inst(it.id);
    if (p) { I.applyMeta(it.id); } else { document.title = it.sym + " — " + it.name + " | STARTRADER"; }

    var up = it.chg >= 0, half = halfSpread(it);
    var bidP = it.price - half, askP = it.price + half;
    var dayLow = it.price * 0.988, dayHigh = it.price * 1.011, yLow = it.price * 0.72, yHigh = it.price * 1.28;

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
          '<div class="d-price-row">' +
            '<div class="d-price">' + (it.cur ? '<span class="cur">' + it.cur + '</span>' : '') + fmt(it.price, it.dp) + '</div>' +
            '<div class="d-change ' + (up ? "up" : "down") + '">' + arrow(up) + (up ? "+" : "") + it.chg.toFixed(2) + '%' + (p ? "" : " today") + '</div>' +
          '</div>' +
          '<div class="chart-toolbar">' +
            '<div class="range-tabs" id="rangeTabs">' +
              TF_ORDER.map(function (r) { return '<button data-r="' + r + '"' + (r === "1D" ? ' class="active"' : '') + '>' + r + '</button>'; }).join("") +
            '</div>' +
            '<div class="chart-type">' +
              '<svg class="ct-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 4v4M7 16v4M7 8h0M17 4v6M17 18v2"/><rect x="4" y="8" width="6" height="8" rx="1.5"/><rect x="14" y="10" width="6" height="8" rx="1.5"/></svg>' +
              '<select id="chartType" aria-label="Chart type">' +
                '<option value="candles">' + ((p && p.chartCandle) || "Candles") + '</option>' +
                '<option value="line">' + ((p && p.chartLine) || "Line") + '</option>' +
              '</select>' +
            '</div>' +
          '</div>' +
          '<div class="chart" id="chart"></div>' +
          '<div class="chart-dates" id="chartDates"></div>' +
        '</div>' +

        '<div class="d-side">' +
          '<div class="quote-card panel"><h3>' + ((p && p.quoteHead) || "Live Quote") + '</h3>' +
            '<div class="bidask">' +
              '<div class="ba sell"><div class="lab">' + ((p && p.sell) || "Sell") + '</div><div class="val tnum">' + fmt(bidP, it.dp) + '</div></div>' +
              '<div class="ba buy"><div class="lab">' + ((p && p.buy) || "Buy") + '</div><div class="val tnum">' + fmt(askP, it.dp) + '</div></div>' +
            '</div>' +
            '<div class="d-cta"><a href="#" class="btn btn-sell">' + ((p && p.sell) || "Sell") + '</a>' +
              '<a href="#" class="btn btn-buy">' + ((p && p.buy) || "Buy") + '</a></div>' +
          '</div>' +
          '<div class="d-banner">' +
            bcell(label("tradeSym", "Trading Symbol"), (p && p.tradeSym) || it.sym) +
            bcell(label("leverage", "Leverage"), ((p && p.levPrefix) || "Up to") + " " + it.leverage) +
            bcell(label("margin", "Margin"), ((p && p.marginPrefix) || "from") + " " + marginPct(it.leverage)) +
            bcell(label("hours", "Trading Hours (GMT)"), it.hours) +
          '</div>' +
          '<div class="mini-stats panel">' +
            row(label("dayRange", "Day Range"), fmt(dayLow, it.dp) + " – " + fmt(dayHigh, it.dp)) +
            row(label("weekRange", "52-Week Range"), fmt(yLow, it.dp) + " – " + fmt(yHigh, it.dp)) +
            row(label("changePct", "Change %"), (up ? "+" : "") + it.chg.toFixed(2) + "%") +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="panel pad" style="margin-top:16px"><h3>' + ((p && p.aboutHead) || ("About " + it.sym)) + '</h3>' +
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
        '<div class="panel pad" style="margin-top:16px"><h3>' + ((p && p.symbolsHead) || "Available Symbols") + '</h3>' +
          '<div class="muted">' + (p ? p.symbolsIntro :
            "The same instrument is offered on " + variants.length + " account type" + (variants.length > 1 ? "s" : "") +
            " / data feed" + (variants.length > 1 ? "s" : "") + ". Symbol suffixes vary by platform and account.") + '</div>' +
          '<div class="vgrid">' + variants.map(function (v) {
            return '<div class="vitem"><span class="vsym">' + v[0] + '</span><span class="vdesc">' + v[1] + '</span></div>';
          }).join("") + '</div></div>' : "") +

      /* long-form PL section from the content workbook (empty for other pages / EN) */
      (window.InstrumentAdditionalContent ? window.InstrumentAdditionalContent.html(it.id) : "") +

      '<div class="related"><h3>' + ((p && p.relatedHead) || ("Related in " + catLabel(it.cat))) + '</h3>' +
        relatedTable(window.INSTRUMENTS.filter(function (x) { return x.cat === it.cat && x.id !== it.id; }).slice(0, 4)) +
        '<a href="' + home + '" class="btn btn-outline back-btn">' +
          /* the workbook's own back label already carries its arrow */
          (p ? p.back : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M11 18l-6-6 6-6"/></svg> Back to all instruments') +
        '</a>' +
      '</div>';

    var chartState = { range: "1D", type: "candles" };
    renderChart(it, chartState.range, chartState.type);

    document.querySelectorAll("#rangeTabs button").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll("#rangeTabs button").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active"); chartState.range = b.dataset.r; renderChart(it, chartState.range, chartState.type);
      });
    });
    var typeSel = document.getElementById("chartType");
    if (typeSel) typeSel.addEventListener("change", function () { chartState.type = typeSel.value; renderChart(it, chartState.range, chartState.type); });

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
    var id = qs("symbol");
    var it = window.INSTRUMENTS.find(function (x) { return x.id === id; });
    if (!it) return notFound(id);
    render(it);
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
