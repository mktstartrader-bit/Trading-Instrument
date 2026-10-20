/* ============================================================
   STARTRADER — live market data from TradingView widgets

   TradingView has no price API for websites; live prices come from its
   embeddable widgets (iframes), which carry TradingView's attribution.
   Widgets never show bid/ask prices.

   SYMBOLS maps each CATALOGUE id (js/data.js) to the TradingView symbol whose
   price it shows. Every entry was checked against TradingView symbol search
   and renders live data in the free widgets (Nikkei 225 uses INDEX:NKY because
   TVC:NI225 is not available in widgets). Change a feed here, nowhere else.

   Widgets are injected after the page has loaded, so they never hold up the
   first paint or LCP; each container reserves its height to avoid layout shift.
   ============================================================ */
(function () {
  "use strict";

  var SYMBOLS = {
    /* forex */
    eurusd: "FX:EURUSD", gbpjpy: "FX:GBPJPY", usdcad: "FX:USDCAD", gbpusd: "FX:GBPUSD", usdjpy: "FX:USDJPY",
    audcad: "FX:AUDCAD", usdchf: "FX:USDCHF", audusd: "FX:AUDUSD", eurjpy: "FX:EURJPY", nzdcad: "FX:NZDCAD",
    /* commodities */
    ukousd: "TVC:UKOIL", usousd: "TVC:USOIL", "cl-oil": "TVC:USOIL", xpdusd: "OANDA:XPDUSD", xptusd: "OANDA:XPTUSD",
    xalusd: "CAPITALCOM:ALUMINUM", "copper-c": "OANDA:XCUUSD", "ng-c": "OANDA:NATGASUSD",
    "coffee-c": "CAPITALCOM:COFFEE", "cocoa-c": "CAPITALCOM:COCOA",
    /* indices */
    nas100: "OANDA:NAS100USD", dj30: "OANDA:US30USD", ger40: "OANDA:DE30EUR", sp500: "OANDA:SPX500USD",
    jpn225ft: "OANDA:JP225USD", nikkei225: "INDEX:NKY", fra40: "OANDA:FR40EUR", hk50: "OANDA:HK33HKD",
    uk100: "OANDA:UK100GBP", us2000: "OANDA:US2000USD",
    /* metals */
    xauusd: "OANDA:XAUUSD", xagusd: "OANDA:XAGUSD", xauaud: "OANDA:XAUAUD", xaueur: "OANDA:XAUEUR", xagaud: "OANDA:XAGAUD",
    /* shares */
    mara: "NASDAQ:MARA", mstr: "NASDAQ:MSTR", nvidia: "NASDAQ:NVDA", spce: "NYSE:SPCE", tsla: "NASDAQ:TSLA",
    hdb: "NYSE:HDB", nio: "NYSE:NIO", intel: "NASDAQ:INTC", amazon: "NASDAQ:AMZN", aapl: "NASDAQ:AAPL",
    /* ETFs */
    bito: "AMEX:BITO", ewy: "AMEX:EWY", arkb: "CBOE:ARKB", tqqq: "NASDAQ:TQQQ", ung: "AMEX:UNG",
    bitb: "AMEX:BITB", btco: "CBOE:BTCO", dram: "CBOE:DRAM", dxyz: "NYSE:DXYZ", ewj: "AMEX:EWJ"
  };

  function lang() { return window.I18N && window.I18N.isPL ? "pl" : "en"; }

  /* reverse lookup for TradingView's ?tvwidgetsymbol= links (first id wins for shared feeds) */
  function idFor(tvSymbol) {
    tvSymbol = String(tvSymbol || "").toUpperCase();
    for (var id in SYMBOLS) if (SYMBOLS[id] === tvSymbol) return id;
    return null;
  }

  var queue = [], ready = document.readyState === "complete";

  function inject(el, widget, config) {
    config.locale = lang();
    /* TradingView restyles its own container (e.g. height:100%), so it gets an inner
       one and our element keeps the height it reserves */
    el.innerHTML = '<div class="tradingview-widget-container" style="width:100%;height:100%">' +
      '<div class="tradingview-widget-container__widget"></div></div>';
    el = el.firstChild;
    var s = document.createElement("script");
    s.src = "https://s3.tradingview.com/external-embedding/embed-widget-" + widget + ".js";
    s.async = true;
    s.text = JSON.stringify(config);
    el.appendChild(s);
  }

  /* queue a widget; it is injected once the page has finished loading */
  function embed(el, widget, config) {
    if (!el) return;
    if (ready) inject(el, widget, config);
    else queue.push([el, widget, config]);
  }

  if (!ready) {
    window.addEventListener("load", function () {
      ready = true;
      queue.splice(0).forEach(function (q) { inject(q[0], q[1], q[2]); });
    });
  }

  window.TV = { SYMBOLS: SYMBOLS, symbol: function (id) { return SYMBOLS[id] || null; }, idFor: idFor, embed: embed };
})();
