/* ============================================================
   STARTRADER — Instrument dataset builder
   The page list is fixed by the approved content workbook
   ("Trading Instrument-PL Content" → Page Index): 55 instruments,
   one page per symbol, each offered on 3 account types / feeds.
   Symbols here MUST stay in sync with js/content-pl.js — its keys
   are slug(symbol), and a mismatch leaves a page without copy.

   Names and asset-appropriate demo pricing are assigned below.
   Prices/changes are SIMULATED placeholders (seeded, stable per
   symbol) — swap the pricing block for your live market feed.
   ============================================================ */
(function () {
  "use strict";

  /* -------- the 55 pages, per category (order = ranking) --------
     Forex 10 · Commodities 10 · Indices 10 · Metals 5 · Shares 10 · ETFs 10.
     Each symbol surfaces its account/feed variants on the detail page. -------- */
  var CATALOGUE = {
    "Forex":       ["EURUSD", "GBPJPY", "USDCAD", "GBPUSD", "USDJPY", "AUDCAD", "USDCHF", "AUDUSD", "EURJPY", "NZDCAD"],
    "Commodities": ["UKOUSD", "USOUSD", "CL-OIL", "XPDUSD", "XPTUSD", "XALUSD", "COPPER-C", "NG-C", "Coffee-C", "Cocoa-C"],
    "Indices":     ["NAS100", "DJ30", "GER40", "SP500", "JPN225ft", "Nikkei225", "FRA40", "HK50", "UK100", "US2000"],
    "Metals":      ["XAUUSD", "XAGUSD", "XAUAUD", "XAUEUR", "XAGAUD"],
    "Share CFDs":  ["MARA", "MSTR", "NVIDIA", "SPCE", "TSLA", "HDB", "NIO", "INTEL", "AMAZON", "AAPL"],
    "ETF":         ["BITO", "EWY", "ARKB", "TQQQ", "UNG", "BITB", "BTCO", "DRAM", "DXYZ", "EWJ"]
  };
  /* account types / data feeds every symbol is offered on (workbook rows 30-32) */
  function variantsOf(sym) { return [sym + ".c", sym + "+", sym]; }
  /* curated cross-asset "Most Traded" list (ranking order) shown on the default tab */
  var MOST_TRADED_TOP = ["eurusd", "xauusd", "nas100", "tsla", "gbpusd", "nvidia", "usousd", "sp500", "usdjpy", "dj30"];

  /* -------- category mapping (source label -> app category) -------- */
  var CAT_MAP = {
    "Forex":       { id: "forex",       label: "Forex",       ico: "💱" },
    "Metals":      { id: "metals",      label: "Metals",      ico: "🪙" },
    "Commodities": { id: "commodities", label: "Commodities", ico: "🛢️" },
    "Indices":     { id: "indices",     label: "Indices",     ico: "📊" },
    "Share CFDs":  { id: "shares",      label: "Shares",      ico: "🏛️" },
    "ETF":         { id: "etf",         label: "ETFs",        ico: "📈" }
  };
  var CAT_ORDER = ["forex", "commodities", "indices", "metals", "shares", "etf"];

  /* -------- seeded PRNG (stable per symbol) -------- */
  function seeded(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () { h += 0x6d2b79f5; var t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function rnum(rng, lo, hi) { return lo + rng() * (hi - lo); }

  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

  /* -------- name dictionaries -------- */
  var CCY = { EUR: "Euro", USD: "US Dollar", GBP: "British Pound", JPY: "Japanese Yen", AUD: "Australian Dollar",
    CAD: "Canadian Dollar", CHF: "Swiss Franc", NZD: "New Zealand Dollar", CNH: "Chinese Yuan", NOK: "Norwegian Krone",
    SEK: "Swedish Krona", DKK: "Danish Krone", SGD: "Singapore Dollar", HKD: "Hong Kong Dollar", ZAR: "South African Rand",
    TRY: "Turkish Lira", MXN: "Mexican Peso", PLN: "Polish Zloty", CZK: "Czech Koruna", HUF: "Hungarian Forint",
    INR: "Indian Rupee", THB: "Thai Baht", TWD: "Taiwan Dollar", ILS: "Israeli Shekel", KRW: "South Korean Won",
    IDR: "Indonesian Rupiah", BRL: "Brazilian Real", AED: "UAE Dirham", CLP: "Chilean Peso", COP: "Colombian Peso",
    USC: "US Cent", XAU: "Gold", XAG: "Silver" };
  var METAL = { XAU: "Gold", XAG: "Silver", XPT: "Platinum", XPD: "Palladium", XAL: "Aluminium" };
  var CRYPTO = { BTC: "Bitcoin", ETH: "Ethereum", SOL: "Solana", BCH: "Bitcoin Cash", XRP: "Ripple", XLM: "Stellar",
    BNB: "BNB", ADA: "Cardano", DOG: "Dogecoin", DOT: "Polkadot", LTC: "Litecoin", TRX: "Tron", LNK: "Chainlink",
    UNI: "Uniswap", ETC: "Ethereum Classic", FIL: "Filecoin", ZEC: "Zcash", BAT: "Basic Attention", OKB: "OKB",
    SHB: "Shiba Inu", ONDO: "Ondo", XTZ: "Tezos", ATM: "Cosmos", BERA: "Berachain", WLD: "Worldcoin", SKY: "Sky",
    CRO: "Cronos", ALG: "Algorand", AVA: "Avalanche", AXS: "Axie Infinity", CRV: "Curve DAO", EOS: "EOS",
    FET: "Fetch.ai", GRT: "The Graph", HBAR: "Hedera", IOT: "IOTA", LRC: "Loopring", MKR: "Maker", NEO: "NEO",
    ONE: "Harmony", TRUMP: "Official Trump", WIF: "dogwifhat", WLFI: "World Liberty", HYPE: "Hyperliquid",
    SPCX: "SpaceX Token", SAN: "Santiment", NER: "Nervos", INC: "Incognito", AGI: "SingularityNET", MTC: "Metacade",
    NXPC: "NxPC", OCN: "Odyssey", SUS: "SUSD" };
  var INDEX = { NAS100: "US Tech 100", DJ30: "Wall Street 30", GER40: "Germany 40", SP500: "US 500", SPX500: "US 500",
    US30: "Wall Street 30", JPN225: "Japan 225", JPN225ft: "Japan 225 Futures", Nikkei225: "Nikkei 225", FRA40: "France 40", HK50: "Hong Kong 50",
    UK100: "UK 100", US2000: "US Small Cap 2000", USDX: "US Dollar Index", CHINA50: "China A50", TWINDEX: "Taiwan Index",
    EU50: "Europe 50", NETH25: "Netherlands 25", SGP20: "Singapore 20", SPI200: "Australia 200", ES35: "Spain 35",
    SWI20: "Switzerland 20", VIX: "Volatility Index", BVSPX: "Brazil Index", CHINAH: "China H-Shares",
    AUS200: "Australia 200", EUSTX50: "Euro Stoxx 50", HKG33: "Hong Kong 33", HKTECH: "Hang Seng Tech",
    IND50: "India 50", SA40: "South Africa 40" };
  var COMMOD = { UKOUSD: "Brent Crude Oil", USOUSD: "WTI Crude Oil", "CL-OIL": "Crude Oil (WTI)", XPDUSD: "Palladium",
    XPTUSD: "Platinum", XALUSD: "Aluminium", COPPER: "Copper", "COPPER-C": "Copper", NG: "Natural Gas", "NG-C": "Natural Gas",
    GAS: "Natural Gas", Coffee: "Coffee", "Coffee-C": "Coffee", Cocoa: "Cocoa", "Cocoa-C": "Cocoa",
    OJ: "Orange Juice", Sugar: "Sugar", GASOIL: "Gas Oil", Cotton: "Cotton", Soybean: "Soybean", Wheat: "Wheat" };
  var ETF = { EWY: "iShares South Korea", TQQQ: "ProShares UltraPro QQQ", ARKB: "ARK 21Shares Bitcoin", BITB: "Bitwise Bitcoin",
    BITO: "ProShares Bitcoin Strategy", BTCO: "Invesco Galaxy Bitcoin", EWJ: "iShares Japan", EWZ: "iShares Brazil",
    GBTC: "Grayscale Bitcoin Trust", IBIT: "iShares Bitcoin Trust", INDA: "iShares India", MCHI: "iShares China",
    TLT: "iShares 20+ Yr Treasury", UNG: "US Natural Gas Fund", DRAM: "Themes DRAM Semiconductor ETF", DXYZ: "Destiny Tech100" };
  var SHARE = { AAPL: "Apple", TSLA: "Tesla", NVIDIA: "NVIDIA", META: "Meta Platforms", MSFT: "Microsoft",
    AMAZON: "Amazon", GOOG: "Alphabet", NFLX: "Netflix", INTEL: "Intel", ORCL: "Oracle", AMD: "AMD", CRM: "Salesforce",
    ADBE: "Adobe", DISNEY: "Walt Disney", BOEING: "Boeing", KO: "Coca-Cola", PEP: "PepsiCo", MCD: "McDonald's",
    SBUX: "Starbucks", NKE: "Nike", VISA: "Visa", MA: "Mastercard", JPM: "JPMorgan", BAC: "Bank of America",
    CITI: "Citigroup", WFC: "Wells Fargo", GS: "Goldman Sachs", PYPL: "PayPal", COIN: "Coinbase", HOOD: "Robinhood",
    UBER: "Uber", SHOP: "Shopify", SPOT: "Spotify", ABNB: "Airbnb", PLTR: "Palantir", SNOW: "Snowflake", CRWD: "CrowdStrike",
    AVGO: "Broadcom", TSM: "TSMC", ASML: "ASML", ARM: "Arm Holdings", QCOM: "Qualcomm", IBM: "IBM", CISCO: "Cisco",
    EXXON: "ExxonMobil", CVX: "Chevron", PFIZER: "Pfizer", JNJ: "Johnson & Johnson", ABBVIE: "AbbVie", MRNA: "Moderna",
    UNH: "UnitedHealth", WMT: "Walmart", HD: "Home Depot", COST: "Costco", ALIBABA: "Alibaba", BAIDU: "Baidu",
    NIO: "NIO", XPEV: "XPeng", LI: "Li Auto", JD: "JD.com", PDD: "PDD Holdings", TOYOTA: "Toyota", HSBCn: "HSBC",
    BUD: "Anheuser-Busch", UL: "Unilever", NVS: "Novartis", NTES: "NetEase", TCOM: "Trip.com", "AT&T": "AT&T",
    "CMCSA": "Comcast", VZ: "Verizon", MMM: "3M", HON: "Honeywell", CAT: "Caterpillar", GE: "GE Aerospace",
    LULU: "Lululemon", MSTR: "MicroStrategy", MARA: "MARA Holdings", SPCE: "Virgin Galactic", HDB: "HDFC Bank",
    OPENAIUSD: "OpenAI (Pre-IPO)", ANTHUSD: "Anthropic (Pre-IPO)", SPCX: "SpaceX (Pre-IPO)" };

  /* -------- currency symbol + magnitude helpers -------- */
  var CURSYM = { USD: "$", EUR: "€", JPY: "¥", GBP: "£", AUD: "A$", CAD: "C$", CHF: "" };
  /* USD value of 1 unit of each currency -> gives realistic cross rates for every pair */
  var USDVAL = { USD: 1, EUR: 1.086, GBP: 1.271, JPY: 0.0064, AUD: 0.662, CAD: 0.731, CHF: 1.121, NZD: 0.611,
    CNH: 0.138, NOK: 0.093, SEK: 0.094, DKK: 0.145, SGD: 0.741, HKD: 0.128, ZAR: 0.054, TRY: 0.030, MXN: 0.055,
    PLN: 0.25, CZK: 0.043, HUF: 0.0027, INR: 0.012, THB: 0.0278, TWD: 0.031, ILS: 0.27, KRW: 0.00075,
    IDR: 0.0000625, BRL: 0.185, AED: 0.272, CLP: 0.00108, COP: 0.000256, USC: 0.01, XAU: 2338 };
  var INDEX_ANCHOR = { NAS100: 19850, DJ30: 39100, GER40: 18200, SP500: 5487, SPX500: 5487, US30: 39100, JPN225: 38600,
    JPN225ft: 38720, Nikkei225: 38600, FRA40: 7600, HK50: 17800, UK100: 8215, US2000: 2020, USDX: 104.2, CHINA50: 12100, TWINDEX: 22800,
    EU50: 4950, NETH25: 900, SGP20: 3400, SPI200: 7900, ES35: 11100, SWI20: 11900, VIX: 14.5, BVSPX: 127000,
    CHINAH: 6400, AUS200: 7900, EUSTX50: 4950, HKG33: 17800, HKTECH: 3700, IND50: 23500, SA40: 79000 };
  var COMMOD_ANCHOR = { UKOUSD: 85.6, USOUSD: 81.2, "CL-OIL": 81.2, XPDUSD: 968, XPTUSD: 1012, XALUSD: 2450,
    COPPER: 4.52, "COPPER-C": 4.52, NG: 2.78, "NG-C": 2.78, GAS: 2.78, Coffee: 228, "Coffee-C": 228,
    Cocoa: 7600, "Cocoa-C": 7600, OJ: 410, Sugar: 19.8, GASOIL: 760, Cotton: 72, Soybean: 1180, Wheat: 578 };
  var METAL_ANCHOR = { XAUUSD: 2338, XAGUSD: 29.8, XAUAUD: 3560, XAUEUR: 2150, XAGAUD: 45.4, XPTUSD: 1012, XPDUSD: 968 };
  var CRYPTO_ANCHOR = { BTC: 61284, ETH: 3392, SOL: 142, BCH: 395, XRP: 0.48, XLM: 0.11, BNB: 585, ADA: 0.45,
    DOG: 0.13, DOT: 6.2, LTC: 72, TRX: 0.12, LNK: 14.2, UNI: 9.8, ETC: 26, FIL: 4.6, ZEC: 24, BAT: 0.24,
    OKB: 42, SHB: 0.000023, ONDO: 1.1, XTZ: 0.9, ATM: 7.4, WLD: 2.3, CRO: 0.09, ALG: 0.16, AVA: 27,
    AXS: 6.4, CRV: 0.32, EOS: 0.62, FET: 1.3, GRT: 0.18, HBAR: 0.08, IOT: 0.18, LRC: 0.17, MKR: 2450,
    NEO: 11.6, ONE: 0.014, TRUMP: 8.2, WIF: 2.1, HYPE: 28, WLFI: 0.22 };
  var CRYPTO_QUOTES = ["USD", "EUR", "JPY", "BCH", "LTC", "ETH", "XAU", "GBP"];

  /* -------- gradient palettes (brand) -------- */
  var G = {
    generic: [["#0047bb", "#3b82f6"], ["#001489", "#0047bb"], ["#1d4ed8", "#60a5fa"], ["#0047bb", "#5b8def"], ["#0d0d4b", "#0047bb"], ["#001489", "#3b82f6"]],
    metals: [["#ac7c59", "#dfc5ae"], ["#a0a8ae", "#dae3ed"], ["#50555b", "#a0a8ae"], ["#dfc5ae", "#ac7c59"]],
    commodities: [["#50555b", "#ac7c59"], ["#dfc5ae", "#ac7c59"], ["#0047bb", "#001489"], ["#ac7c59", "#dfc5ae"]],
    crypto: [["#ac7c59", "#dfc5ae"], ["#0047bb", "#5b8def"], ["#1d4ed8", "#60a5fa"], ["#a0a8ae", "#dae3ed"], ["#001489", "#0047bb"]]
  };
  function pickGrad(catId, rng) {
    var pal = G[catId] || G.generic;
    return pal[Math.floor(rng() * pal.length)];
  }
  function dpFromPrice(p) { return p >= 1000 ? 1 : p >= 100 ? 2 : p >= 10 ? 3 : p >= 1 ? 4 : p >= 0.01 ? 4 : 6; }

  /* -------- per-category builder -------- */
  function build(base, catId, variants) {
    var rng = seeded(base + "|" + catId);
    var chg = +( rnum(rng, -3.1, 3.1) ).toFixed(2);
    var out = { id: slug(base) || slug(catId + variants[0]), cat: catId, chg: chg, trend: chg >= 0 ? 1 : -1,
      variants: variants, grad: pickGrad(catId, rng), hours: "24/5", leverage: "1:100", cur: "$", dp: 2, sym: base, name: base };

    if (catId === "forex") {
      var q = base.slice(-3), b = base.slice(0, -3);
      out.sym = (/^[A-Z0-9]{6}$/.test(base)) ? b + "/" + q : base;
      out.name = (CCY[b] || b) + " / " + (CCY[q] || q);
      var rate = (USDVAL[b] && USDVAL[q]) ? USDVAL[b] / USDVAL[q] : rnum(rng, 0.6, 1.7);
      out.price = rate * (0.997 + rng() * 0.006);
      out.dp = out.price >= 10000 ? 1 : q === "JPY" ? 3 : out.price >= 500 ? 2 : out.price >= 50 ? 3 : 5;
      var exotic = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "NZD"].indexOf(q) === -1;
      out.cur = ""; out.leverage = exotic ? "1:200" : "1:500"; out.hours = "24/5";
      out.spread = +( rnum(rng, 0.1, 1.4) ).toFixed(1);
    } else if (catId === "metals") {
      var mq = base.slice(-3), mb = base.slice(0, -3);
      out.sym = b6(base) ? mb + "/" + mq : base;
      out.name = (METAL[mb] || mb) + (mq === "USD" ? " Spot" : " / " + (CCY[mq] || mq));
      out.price = (METAL_ANCHOR[base] || (mb === "XAG" ? 30 : 2300)) * (0.98 + rng() * 0.04);
      out.dp = mb === "XAG" ? 3 : 2; out.cur = CURSYM[mq] || "$"; out.leverage = "1:200"; out.hours = "23/5";
      out.spread = +( rnum(rng, 0.02, 0.6) ).toFixed(2);
    } else if (catId === "commodities") {
      out.sym = base;
      out.name = COMMOD[base] || base;
      out.price = (COMMOD_ANCHOR[base] || rnum(rng, 5, 500)) * (0.97 + rng() * 0.06);
      out.dp = out.price < 10 ? 3 : 2;   // gas & copper quote in fractions of a dollar
      out.cur = "$"; out.leverage = "1:100"; out.hours = "23/5";
      out.spread = +( rnum(rng, 0.02, 0.8) ).toFixed(2);
    } else if (catId === "indices") {
      out.sym = base;
      out.name = INDEX[base] || base;
      out.price = (INDEX_ANCHOR[base] || rnum(rng, 1000, 25000)) * (0.99 + rng() * 0.02);
      out.dp = base === "VIX" ? 2 : base === "USDX" ? 3 : 1;
      out.cur = ""; out.leverage = "1:200"; out.hours = "24/5";
      out.spread = +( rnum(rng, 0.4, 6) ).toFixed(1);
    } else if (catId === "shares") {
      var xtks = /\.XTKS$/.test(base);
      out.sym = base;
      out.name = SHARE[base] || (xtks ? "Tokyo Stock " + base.replace(".XTKS", "") : titleize(base));
      out.price = xtks ? rnum(rng, 800, 9000) : (SHARE[base] ? anchoredShare(base, rng) : rnum(rng, 18, 460));
      out.dp = 2; out.cur = xtks ? "¥" : "$"; out.leverage = "1:20"; out.hours = "Exchange";
      out.spread = +( rnum(rng, 0.02, 0.6) ).toFixed(2);
    } else if (catId === "crypto") {
      var cq = "USD", i;
      for (i = 0; i < CRYPTO_QUOTES.length; i++) { if (base.slice(-CRYPTO_QUOTES[i].length) === CRYPTO_QUOTES[i]) { cq = CRYPTO_QUOTES[i]; break; } }
      var cb = base.slice(0, base.length - cq.length) || base;
      out.sym = cb + "/" + cq;
      out.name = (CRYPTO[cb] || cb) + (cq === "USD" ? "" : " / " + cq);
      var ap = CRYPTO_ANCHOR[cb];
      if (ap == null) {
        if (base.indexOf("BTC") === 0) ap = rnum(rng, 15, 60);
        else if (base.indexOf("ETH") === 0) ap = rnum(rng, 0.4, 4);
        else ap = rnum(rng, 0.1, 180);
      }
      out.price = ap * (0.96 + rng() * 0.08);
      out.dp = dpFromPrice(out.price);
      out.cur = CURSYM[cq] || "$"; out.leverage = "1:20"; out.hours = "24/7";
      out.spread = +( rnum(rng, 0.001, 8) ).toFixed(3);
    } else if (catId === "etf") {
      out.sym = base;
      out.name = ETF[base] || (base + " ETF");
      out.price = rnum(rng, 12, 220) * (0.98 + rng() * 0.04);
      out.dp = 2; out.cur = "$"; out.leverage = "1:20"; out.hours = "Exchange";
      out.spread = +( rnum(rng, 0.02, 0.4) ).toFixed(2);
    }
    out.price = +out.price.toFixed(out.dp);
    return out;
  }
  function b6(s) { return /^[A-Z]{6}$/.test(s); }
  function titleize(s) { return s; } // keep tickers as-is (recognizable)
  function anchoredShare(base, rng) {
    var a = { AAPL: 214, TSLA: 183, NVIDIA: 126, META: 504, MSFT: 449, AMAZON: 193, GOOG: 178, NFLX: 640, INTEL: 34,
      AMD: 158, TSM: 174, AVGO: 168, COIN: 232, MSTR: 1580, COST: 880, MA: 462, VISA: 275, JPM: 205, UNH: 495,
      WMT: 68, HD: 345, MCD: 255, KO: 63, BOEING: 178, MARA: 18, SPCE: 6, HDB: 66, NIO: 5,
      OPENAIUSD: 210, ANTHUSD: 185 }[base];
    return (a || rnum(rng, 40, 400)) * (0.97 + rng() * 0.06);
  }

  /* -------- build the whole universe -------- */
  var instruments = [];
  var catCounts = {};
  Object.keys(CATALOGUE).forEach(function (label) {
    var meta = CAT_MAP[label];
    if (!meta) return;
    (CATALOGUE[label] || []).forEach(function (sym) {
      instruments.push(build(sym, meta.id, variantsOf(sym)));
    });
    catCounts[meta.id] = CATALOGUE[label].length;
  });

  /* -------- categories list for the UI -------- */
  var categories = [{ id: "all", label: "Most Traded", ico: "◎" }];
  CAT_ORDER.forEach(function (id) {
    var src = Object.keys(CAT_MAP).find(function (k) { return CAT_MAP[k].id === id; });
    if (src && catCounts[id]) categories.push({ id: id, label: CAT_MAP[src].label, ico: CAT_MAP[src].ico });
  });

  /* curated "Most Traded" -> keep only ids that resolved to a real instrument, in order */
  var byId = {};
  instruments.forEach(function (it) { byId[it.id] = it; });
  var mostTraded = MOST_TRADED_TOP.filter(function (id) { return byId[id]; });

  window.INSTRUMENTS = instruments;
  window.CATEGORIES = categories;
  window.MOST_TRADED_TOP = mostTraded;
})();
