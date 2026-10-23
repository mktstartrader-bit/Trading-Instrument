/* ============================================================
   STARTRADER — market data blocks (plain HTML, no third-party widgets)

   Replaces the TradingView iframes. Every block is ordinary HTML that this
   file renders, so the page owns its markup and styling:
     - ticker tape        <div class="mk-ticker" id="ticker">      (home hero)
     - market table       <div class="mk-market" id="marketData">  (home explorer)
     - live quote         <div class="mk-quote"  id="mkQuote">     (instrument page)
     - price chart        <div class="mk-chart"  id="mkChart">     (instrument page)

   FAKE DATA FOR NOW. All numbers come from MarketData below, which builds
   stable placeholder values from each instrument's demo price in js/data.js.
   To go live, replace the two functions in MarketData with calls to the
   price API; they already return Promises, so the renderers do not change:
     MarketData.quotes(ids)            -> Promise<{ [id]: Quote }>
     MarketData.candles(id, interval)  -> Promise<Candle[]>   (oldest first)
   Quote  = { last, change, changePct, open, high, low, prev, currency, time }
   Candle = { t (ms), o, h, l, c, v }
   Live updates without a re-render: MarketView.update(id, quote) rewrites
   every [data-mk-id="<id>"] [data-mk="<field>"] cell on the page.

   No bid/ask (sell/buy) prices are shown: last price and daily figures only.
   ============================================================ */
(function () {
  "use strict";

  var I = window.I18N;
  var PL = !!(I && I.isPL);
  var LOCALE = PL ? "pl-PL" : "en-US";

  /* labels: the table headers follow the widget the page showed before */
  var T = PL ? {
    name: "Nazwa", last: "Wartość", change: "Zmiana", changePct: "Zmiana%", open: "Otwarcie", high: "Wysoki",
    low: "Niski", prev: "Poprz.", volume: "Wolumen", line: "Linia", candles: "Świece", chartLabel: "Wykres ceny"
  } : {
    name: "Name", last: "Last", change: "Change", changePct: "Chg%", open: "Open", high: "High",
    low: "Low", prev: "Prev", volume: "Volume", line: "Line", candles: "Candles", chartLabel: "Price chart"
  };
  var INTERVALS = [
    { id: "1m", ms: 60e3, bars: 120 }, { id: "30m", ms: 18e5, bars: 120 }, { id: "1h", ms: 36e5, bars: 120 },
    { id: "1D", ms: 864e5, bars: 180 }, { id: "1W", ms: 6048e5, bars: 156 }
  ];

  function byId(id) { return (window.INSTRUMENTS || []).filter(function (x) { return x.id === id; })[0]; }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function link(url) { return I ? I.href(url) : url; }
  function inst(it) { return (I && I.inst(it.id)) || null; }
  function dispSym(it) { var p = inst(it); return (p && p.sym) || it.sym; }
  function dispName(it) { var p = inst(it); return (p && p.name) || it.name; }
  function badge(it) {
    var p = inst(it);
    if (p && p.badge) return p.badge;
    if (it.cat === "forex" || it.cat === "metals") return it.sym.split("/")[0].slice(0, 3);
    return it.sym.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase();
  }
  function currencyOf(it) {
    var s = it.sym.replace("/", "");
    if (it.cat === "forex" || it.cat === "metals") return s.slice(-3);
    if (it.cat === "indices") return "";
    return { "€": "EUR", "¥": "JPY", "£": "GBP" }[it.cur] || "USD";
  }

  function fmt(v, dp) {
    return Number(v).toLocaleString(LOCALE, { minimumFractionDigits: dp, maximumFractionDigits: dp });
  }
  function signed(v, dp) { return (v > 0 ? "+" : v < 0 ? "−" : "") + fmt(Math.abs(v), dp); }
  function dir(v) { return v > 0 ? "up" : v < 0 ? "down" : "flat"; }

  /* ============================================================ DATA (fake) */
  function seeded(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () { h += 0x6d2b79f5; var t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  /* typical daily range by asset class, as a fraction of price */
  var VOL = { forex: 0.006, metals: 0.012, commodities: 0.02, indices: 0.011, shares: 0.03, etf: 0.025 };

  function fakeQuote(it) {
    var rng = seeded("q|" + it.id), last = it.price, changePct = it.chg;
    var prev = last / (1 + changePct / 100), range = (VOL[it.cat] || 0.01) * last;
    var open = prev + (rng() - 0.5) * range * 0.3;
    var high = Math.max(last, open) + rng() * range * 0.4, low = Math.min(last, open) - rng() * range * 0.4;
    return { last: last, change: last - prev, changePct: changePct, open: open, high: high, low: low, prev: prev,
      currency: currencyOf(it), time: Date.now() };
  }

  function fakeCandles(it, interval) {
    var iv = INTERVALS.filter(function (x) { return x.id === interval; })[0] || INTERVALS[3];
    var rng = seeded("c|" + it.id + "|" + iv.id), n = iv.bars;
    var step = (VOL[it.cat] || 0.01) * Math.sqrt(iv.ms / 864e5) * 0.55;
    var drift = (rng() - 0.5) * step * 0.25, closes = [it.price];
    for (var i = 1; i < n; i++) closes.unshift(closes[0] * (1 - drift - (rng() - 0.5) * 2 * step));
    var end = Math.floor(Date.now() / iv.ms) * iv.ms, out = [], baseVol = 4e4 + rng() * 9e5;
    for (i = 0; i < n; i++) {
      var c = closes[i], o = i ? closes[i - 1] : c * (1 + (rng() - 0.5) * step);
      var wick = c * step * 0.6;
      out.push({ t: end - (n - 1 - i) * iv.ms, o: o, c: c,
        h: Math.max(o, c) + rng() * wick, l: Math.min(o, c) - rng() * wick,
        v: Math.round(baseVol * (0.35 + rng() * 1.3)) });
    }
    return out;
  }

  /* --- swap these two for the price API --- */
  var MarketData = {
    quotes: function (ids) {
      var out = {};
      ids.forEach(function (id) { var it = byId(id); if (it) out[id] = fakeQuote(it); });
      return Promise.resolve(out);
    },
    candles: function (id, interval) {
      var it = byId(id);
      return Promise.resolve(it ? fakeCandles(it, interval) : []);
    }
  };

  /* ============================================================ RENDER */
  function logo(it) {
    return '<span class="mk-logo" aria-hidden="true" style="background:linear-gradient(135deg,' + it.grad[0] + ',' + it.grad[1] + ')">' + esc(badge(it)) + '</span>';
  }
  function cell(field, html, cls) { return '<span class="' + (cls || "") + '" data-mk="' + field + '">' + html + '</span>'; }

  /* ---------- ticker tape ---------- */
  function ticker(el, ids) {
    if (!el) return;
    var list = ids.map(byId).filter(Boolean);
    return MarketData.quotes(list.map(function (it) { return it.id; })).then(function (q) {
      var items = list.map(function (it) {
        var d = q[it.id]; if (!d) return "";
        return '<li class="mk-tk-item" data-mk-id="' + it.id + '"><a href="' + link("instrument.html?symbol=" + it.id) + '">' + logo(it) +
          '<span class="mk-tk-sym">' + esc(dispSym(it)) + '</span>' +
          cell("last", fmt(d.last, it.dp), "mk-tk-last") +
          '<span class="mk-tk-chg ' + dir(d.change) + '" data-mk-dir>' + cell("change", signed(d.change, it.dp)) +
          ' (' + cell("changePct", signed(d.changePct, 2) + "%") + ')</span></a></li>';
      }).join("");
      /* the list runs twice so the loop is seamless; the copy is hidden from assistive tech */
      el.innerHTML = '<div class="mk-tk-track"><ul class="mk-tk-list">' + items + '</ul>' +
        '<ul class="mk-tk-list" aria-hidden="true">' + items.replace(/<a /g, '<a tabindex="-1" ') + '</ul></div>';
    });
  }

  /* ---------- market table ---------- */
  function table(el, ids) {
    if (!el) return;
    var list = ids.map(byId).filter(Boolean);
    return MarketData.quotes(list.map(function (it) { return it.id; })).then(function (q) {
      var rows = list.map(function (it) {
        var d = q[it.id]; if (!d) return "";
        var url = link("instrument.html?symbol=" + it.id), nm = dispName(it), sym = dispSym(it);
        return '<tr data-mk-id="' + it.id + '" data-href="' + url + '">' +
          '<th scope="row" class="mk-name"><a href="' + url + '">' + logo(it) +
            '<span class="mk-nm"><span class="mk-sym">' + esc(sym) + '</span>' + (nm && nm !== sym ? '<span class="mk-desc">' + esc(nm) + '</span>' : '') + '</span></a></th>' +
          '<td>' + cell("last", fmt(d.last, it.dp)) + '</td>' +
          '<td class="' + dir(d.change) + '" data-mk-dir>' + cell("change", signed(d.change, it.dp)) + '</td>' +
          '<td class="' + dir(d.change) + '" data-mk-dir>' + cell("changePct", signed(d.changePct, 2) + "%") + '</td>' +
          '<td>' + cell("open", fmt(d.open, it.dp)) + '</td>' +
          '<td>' + cell("high", fmt(d.high, it.dp)) + '</td>' +
          '<td>' + cell("low", fmt(d.low, it.dp)) + '</td>' +
          '<td>' + cell("prev", fmt(d.prev, it.dp)) + '</td></tr>';
      }).join("");
      el.innerHTML = '<div class="mk-table-scroll"><table class="mk-table">' +
        '<thead><tr><th scope="col" class="mk-name">' + T.name + '</th><th scope="col">' + T.last + '</th><th scope="col">' + T.change +
        '</th><th scope="col">' + T.changePct + '</th><th scope="col">' + T.open + '</th><th scope="col">' + T.high +
        '</th><th scope="col">' + T.low + '</th><th scope="col">' + T.prev + '</th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div>';
      el.querySelectorAll("tbody tr").forEach(function (tr) {
        tr.addEventListener("click", function (e) { if (!e.target.closest("a")) location.href = tr.dataset.href; });
      });
    });
  }

  /* ---------- live quote (instrument page) ---------- */
  function quote(el, id) {
    var it = byId(id);
    if (!el || !it) return;
    return MarketData.quotes([id]).then(function (q) {
      var d = q[id]; if (!d) return;
      var nm = dispName(it), sym = dispSym(it);
      el.innerHTML = '<div class="mk-q" data-mk-id="' + id + '">' + logo(it) +
        '<div class="mk-q-id"><span class="mk-q-sym">' + esc(sym) + '</span>' + (nm && nm !== sym ? '<span class="mk-q-name">' + esc(nm) + '</span>' : '') + '</div>' +
        '<div class="mk-q-px"><span class="mk-q-last">' + cell("last", fmt(d.last, it.dp)) + (d.currency ? ' <small>' + d.currency + '</small>' : '') + '</span>' +
          '<span class="mk-q-chg ' + dir(d.change) + '" data-mk-dir>' + cell("change", signed(d.change, it.dp)) + ' ' + cell("changePct", signed(d.changePct, 2) + "%") + '</span></div></div>';
    });
  }

  /* ---------- price chart (instrument page) ---------- */
  var SVGNS = "http://www.w3.org/2000/svg";
  function niceStep(span, target) {
    var raw = span / target, mag = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / mag;
    return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
  }
  function timeLabel(t, iv) {
    var d = new Date(t);
    if (iv.ms < 864e5) return d.toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" });
    if (iv.ms < 6048e5) return d.toLocaleDateString(LOCALE, { day: "numeric", month: "short" });
    return d.toLocaleDateString(LOCALE, { month: "short", year: "numeric" });
  }

  function chart(el, id) {
    var it = byId(id);
    if (!el || !it) return;
    var state = { interval: "1D", type: "candles", data: [] };

    el.innerHTML =
      '<div class="mk-ch-bar" role="toolbar" aria-label="' + T.chartLabel + '">' +
        '<div class="mk-ch-iv">' + INTERVALS.map(function (iv) {
          return '<button type="button" data-iv="' + iv.id + '" aria-pressed="' + (iv.id === state.interval) + '">' + iv.id + '</button>';
        }).join("") + '</div>' +
        '<div class="mk-ch-type">' +
          '<button type="button" data-type="candles" aria-pressed="true">' + T.candles + '</button>' +
          '<button type="button" data-type="line" aria-pressed="false">' + T.line + '</button></div>' +
      '</div>' +
      '<div class="mk-ch-legend" aria-live="off"></div>' +
      '<div class="mk-ch-plot"><svg class="mk-ch-svg" role="img" aria-label="' + esc(dispSym(it) + " · " + T.chartLabel) + '"></svg></div>';

    var svg = el.querySelector("svg"), legend = el.querySelector(".mk-ch-legend"), plot = el.querySelector(".mk-ch-plot");

    function setLegend(b) {
      if (!b) return;
      var chg = b.c - b.o;
      legend.innerHTML = '<b>' + esc(dispName(it)) + '</b> · ' + state.interval +
        ' <span>O <em>' + fmt(b.o, it.dp) + '</em></span><span>H <em>' + fmt(b.h, it.dp) + '</em></span>' +
        '<span>L <em>' + fmt(b.l, it.dp) + '</em></span><span>C <em>' + fmt(b.c, it.dp) + '</em></span>' +
        '<span class="' + dir(chg) + '">' + signed(chg, it.dp) + ' (' + signed(chg / b.o * 100, 2) + '%)</span>' +
        '<span class="mk-ch-vol">' + T.volume + ' <em>' + Number(b.v).toLocaleString(LOCALE) + '</em></span>';
    }

    function draw() {
      var data = state.data, W = plot.clientWidth || 600, H = plot.clientHeight || 380;
      if (!data.length) return;
      var axisW = 64, axisH = 24, padT = 10, volH = Math.round((H - axisH) * 0.18);
      var cw = W - axisW, ph = H - axisH - padT, pBot = padT + ph - volH - 6;
      var lo = Infinity, hi = -Infinity, vmax = 0;
      data.forEach(function (b) { lo = Math.min(lo, b.l); hi = Math.max(hi, b.h); vmax = Math.max(vmax, b.v); });
      var pad = (hi - lo) * 0.06; lo -= pad; hi += pad;
      var y = function (v) { return padT + (hi - v) / (hi - lo) * (pBot - padT); };
      var bw = cw / data.length, x = function (i) { return i * bw + bw / 2; };
      var out = [];

      var step = niceStep(hi - lo, 6), dpAxis = Math.max(0, Math.min(it.dp, -Math.floor(Math.log10(step))));
      for (var v = Math.ceil(lo / step) * step; v <= hi; v += step) {
        var yy = y(v).toFixed(1);
        out.push('<line class="mk-grid" x1="0" x2="' + cw + '" y1="' + yy + '" y2="' + yy + '"/>' +
          '<text class="mk-axis" x="' + (cw + 8) + '" y="' + yy + '" dy="4">' + fmt(v, dpAxis) + '</text>');
      }
      var iv = INTERVALS.filter(function (x) { return x.id === state.interval; })[0];
      var every = Math.max(1, Math.round(data.length / Math.max(2, Math.floor(cw / 110))));
      for (var i = every; i < data.length; i += every) {
        out.push('<line class="mk-grid" x1="' + x(i).toFixed(1) + '" x2="' + x(i).toFixed(1) + '" y1="' + padT + '" y2="' + (padT + ph) + '"/>' +
          '<text class="mk-axis" x="' + x(i).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(timeLabel(data[i].t, iv)) + '</text>');
      }
      data.forEach(function (b, i) {
        var vh = b.v / vmax * volH, cls = b.c >= b.o ? "up" : "down";
        out.push('<rect class="mk-vol ' + cls + '" x="' + (x(i) - bw * 0.35).toFixed(1) + '" y="' + (padT + ph - vh).toFixed(1) + '" width="' + Math.max(1, bw * 0.7).toFixed(1) + '" height="' + vh.toFixed(1) + '"/>');
      });
      if (state.type === "line") {
        out.push('<polyline class="mk-line" points="' + data.map(function (b, i) { return x(i).toFixed(1) + "," + y(b.c).toFixed(1); }).join(" ") + '"/>');
      } else {
        data.forEach(function (b, i) {
          var cls = b.c >= b.o ? "up" : "down", top = y(Math.max(b.o, b.c)), body = Math.max(1, Math.abs(y(b.o) - y(b.c)));
          out.push('<g class="mk-candle ' + cls + '"><line x1="' + x(i).toFixed(1) + '" x2="' + x(i).toFixed(1) + '" y1="' + y(b.h).toFixed(1) + '" y2="' + y(b.l).toFixed(1) + '"/>' +
            '<rect x="' + (x(i) - bw * 0.32).toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + Math.max(1, bw * 0.64).toFixed(1) + '" height="' + body.toFixed(1) + '"/></g>');
        });
      }
      var last = data[data.length - 1], ly = y(last.c).toFixed(1), lc = last.c >= last.o ? "up" : "down";
      out.push('<line class="mk-last ' + lc + '" x1="0" x2="' + cw + '" y1="' + ly + '" y2="' + ly + '"/>' +
        '<rect class="mk-last-tag ' + lc + '" x="' + (cw + 2) + '" y="' + (ly - 10) + '" width="' + (axisW - 4) + '" height="20" rx="4"/>' +
        '<text class="mk-last-tx" x="' + (cw + 8) + '" y="' + ly + '" dy="4">' + fmt(last.c, it.dp) + '</text>');
      out.push('<line class="mk-cross" x1="0" x2="0" y1="' + padT + '" y2="' + (padT + ph) + '" visibility="hidden"/>');

      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      svg.setAttribute("width", W); svg.setAttribute("height", H);
      svg.innerHTML = out.join("");
      setLegend(last);

      var cross = svg.querySelector(".mk-cross");
      svg.onmousemove = function (e) {
        var r = svg.getBoundingClientRect(), i = Math.floor((e.clientX - r.left) / bw);
        if (i < 0 || i >= data.length) return;
        cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i)); cross.setAttribute("visibility", "visible");
        setLegend(data[i]);
      };
      svg.onmouseleave = function () { cross.setAttribute("visibility", "hidden"); setLegend(last); };
    }

    function load() {
      return MarketData.candles(id, state.interval).then(function (d) { state.data = d; draw(); });
    }

    el.querySelectorAll("[data-iv]").forEach(function (b) {
      b.addEventListener("click", function () {
        state.interval = b.dataset.iv;
        el.querySelectorAll("[data-iv]").forEach(function (o) { o.setAttribute("aria-pressed", o === b); });
        load();
      });
    });
    el.querySelectorAll("[data-type]").forEach(function (b) {
      b.addEventListener("click", function () {
        state.type = b.dataset.type;
        el.querySelectorAll("[data-type]").forEach(function (o) { o.setAttribute("aria-pressed", o === b); });
        draw();
      });
    });
    var t;
    window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(draw, 120); });
    return load();
  }

  /* ---------- live update hook for the API ---------- */
  function update(id, d) {
    var it = byId(id);
    if (!it || !d) return;
    var dpOf = { last: it.dp, change: it.dp, open: it.dp, high: it.dp, low: it.dp, prev: it.dp };
    document.querySelectorAll('[data-mk-id="' + id + '"]').forEach(function (row) {
      row.querySelectorAll("[data-mk]").forEach(function (c) {
        var f = c.getAttribute("data-mk");
        if (d[f] == null) return;
        c.textContent = f === "changePct" ? signed(d[f], 2) + "%" : f === "change" ? signed(d[f], it.dp) : fmt(d[f], dpOf[f]);
      });
      if (d.change != null) row.querySelectorAll("[data-mk-dir]").forEach(function (c) {
        c.classList.remove("up", "down", "flat"); c.classList.add(dir(d.change));
      });
    });
  }

  window.MarketData = MarketData;
  window.MarketView = { ticker: ticker, table: table, quote: quote, chart: chart, update: update };
})();
