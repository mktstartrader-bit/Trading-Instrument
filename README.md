# STARTRADER — Trading Instruments

A modern, glassmorphic **financial instruments explorer** for STARTRADER, built in
plain HTML/CSS/JS (no framework, no build step).

## Features

- **Live prices from TradingView** (`js/tv.js`) — a ticker tape in the hero and a
  TradingView *Market Data* table with one tab per asset class (Most Traded, Forex,
  Commodities, Indices, Metals, Shares, ETFs) covering all 55 instruments. A row click
  opens our instrument page. Below it, a plain link list reaches every instrument page.
  **Spread / bid-ask is never shown.**
- **English / Polish language switch** in the navbar — see [Languages](#languages).
- **Detail page** for every instrument (`instrument.html?symbol=<id>`) with a live
  TradingView Advanced Chart and live quote, a blue-gradient key-info banner (Symbol ·
  Leverage · Margin · Trading Hours), available symbol variants and related markets.
- **Glassmorphic light UI** on a blue ambient background, a blue-gradient hero banner,
  real STARTRADER navbar + footer, and the official logo.
- Brand system: STARTRADER navy `#0D0D4B` / blue `#0047BB`, **Plus Jakarta Sans**.

## Data

`js/data.js` holds `CATALOGUE`: the 55 symbols of the approved page list, one per
category. Every symbol is offered on three account types / data feeds (`X.c`, `X+`,
`X`), listed on its detail page. `MOST_TRADED_TOP` is the curated cross-asset "Most
Traded" ranking. (`js/data.js` still generates placeholder prices, but nothing displays them.)

**Prices come from TradingView.** `js/tv.js` maps each catalogue id to the TradingView
symbol whose live price it shows (e.g. `xauusd → OANDA:XAUUSD`, `nikkei225 → INDEX:NKY`).
Each mapping was checked to render live data in the free widgets. These are
TradingView's market prices, not STARTRADER's own quotes, and US shares/ETFs may be
delayed. TradingView has no website price API, so widgets are the only option; they
load after the page and carry TradingView's attribution.

**`CATALOGUE` symbols must stay in sync with `js/content-pl.js`** — its keys are
`slug(symbol)`, so renaming or adding a symbol without a matching workbook sheet
leaves that page without Polish copy.

## Languages

The navbar carries an **EN / PL** switch. The choice is read from `?lang=pl` first,
then `localStorage`, defaulting to English; it is persisted and appended to internal
links so a shared URL keeps its language.

All Polish copy is **generated, never authored in code**. `js/content-pl.js` is built
from the approved workbook by:

```bash
python3 tools/build-pl-content.py ~/Downloads/"Trading Instrument-PL Content (1).xlsx"
```

The generator reads the **Final PL** column of every sheet verbatim (falling back to
that row's *PL draft* only where Final PL is blank), plus the `Page Index` sheet for
each page's PL `<title>` and meta description. Re-run it whenever the workbook changes.

Strings the workbook does not cover are **left in English on purpose** rather than
machine-translated: the navbar and footer, the risk warning, `Show N more` /
`Showing all N` / the empty-search state, and the detail-page labels *Trading Symbol,
Leverage, Margin, Trading Hours (GMT), Day Range, 52-Week Range, Change %* and the
related-table *Price* header. Add them to the workbook and re-run the generator to
localise them.

## Performance

- Scripts are injected by a small inline loader in each page's `<head>`: they download
  in parallel, don't block rendering, and still run in order.
- **English never downloads Polish copy.** In PL, `js/content-pl.js` loads, and an
  instrument page loads only its own long-form file `js/pl-additional/<id>.js`
  (`PL_PAGES` in `instrument.html` lists which exist; the generator keeps it in sync).
- Plus Jakarta Sans is self-hosted (`assets/fonts/`, latin + latin-ext for Polish),
  with the latin file and the logo preloaded.
- The navbar height, ticker, filter row and empty detail page reserve their space, so
  JS-rendered content causes no layout shift. On PL the English hero copy stays hidden
  until the Polish text is applied.

## Static Polish pages

`python3 tools/build-pl-static.py` writes `dist-pl/pl/trading-instruments/`: one
always-Polish HTML file per Page Index entry (home + 55 instruments), at the
workbook's production URLs, with PL title/description/canonical/hreflang in the HTML.
`window.PL_STATIC` on those pages tells `js/i18n.js` to map internal links to the
static URLs. The EN button goes to the same path without `/pl`.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000/index.html
```

## Structure

```
index.html                  # most-traded instrument explorer
instrument.html             # instrument detail page
css/styles.css              # design system
js/data.js                  # CATALOGUE (55 symbols) -> builds instruments + categories
js/content-pl.js            # GENERATED — Polish copy, verbatim from the workbook
js/pl-additional/<id>.js    # GENERATED — long-form PL section, one file per page
js/additional-content.js    # renders the long-form PL section
js/i18n.js                  # EN/PL selection, language button, metadata
js/tv.js                    # TradingView symbol map + lazy widget embedding
js/app.js                   # explorer: TradingView ticker + Market Data table, link list
js/detail.js                # detail page rendering
js/chrome.js                # shared navbar + footer
js/symbol_all.js            # full raw symbol universe (reference only, not loaded)
tools/build-pl-content.py   # workbook -> js/content-pl.js
tools/build-pl-additional.py # workbook -> js/pl-additional/*.js (+ PL_PAGES in instrument.html)
tools/build-pl-static.py    # static PL site: 56 pages under dist-pl/pl/trading-instruments/
assets/                     # logo, favicons, self-hosted fonts
```
